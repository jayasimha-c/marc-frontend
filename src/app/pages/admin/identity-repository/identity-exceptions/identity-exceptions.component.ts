import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiResponse } from '../../../../core/models/api-response';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { IdentityException, ExceptionStatistics, IdentityExceptionService } from './identity-exception.service';

@Component({
  standalone: false,
  selector: 'app-identity-exceptions',
  templateUrl: './identity-exceptions.component.html',
  styleUrls: ['./identity-exceptions.component.scss']
})
export class IdentityExceptionsComponent implements OnInit, OnDestroy {
  @ViewChild('detailsPanel') detailsPanel!: SidePanelComponent;
  private destroy$ = new Subject<void>();

  statistics: ExceptionStatistics | null = null;
  selectedExcep: IdentityException | null = null;
  currentFilter: 'PENDING' | 'IN_REVIEW' | 'ALL' = 'PENDING';
  loading = false;

  exceptionData: IdentityException[] = [];
  exceptionTotal = 0;
  exceptionColumns: TableColumn[] = [
    { field: 'sourceSystemDisplay', header: 'Source', sortable: true, filterable: true, width: '120px' },
    { field: 'sourceUsername', header: 'Username', sortable: true, filterable: true, width: '150px' },
    { field: 'sourceEmail', header: 'Email', sortable: true, filterable: true, width: '200px' },
    { field: 'exceptionTypeDisplay', header: 'Exception Type', sortable: true, filterable: true, width: '140px' },
    { field: 'correlationPhase', header: 'Phase', width: '80px' },
    { field: 'statusDisplay', header: 'Status', sortable: true, filterable: true, width: '120px' },
    { field: 'createdAtStr', header: 'Created', width: '160px' },
    { field: 'reason', header: 'Reason', filterable: true, width: '250px' },
  ];
  exceptionActions: TableAction[] = [
    { label: 'View Details', icon: 'eye', command: () => this.viewDetails() },
  ];

  constructor(
    private exceptionService: IdentityExceptionService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
    this.loadExceptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistics(): void {
    this.exceptionService.getStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.statistics = resp.data;
          }
        }
      });
  }

  loadExceptions(params?: any): void {
    this.loading = true;
    const fetchObservable = this.currentFilter === 'PENDING'
      ? this.exceptionService.getPending(params)
      : this.exceptionService.getFiltered(params);

    fetchObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success && resp.data) {
          this.exceptionData = resp.data.rows || resp.data.content || [];
          this.exceptionTotal = resp.data.records || resp.data.totalElements || 0;
        }
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load exceptions');
        this.loading = false;
      }
    });
  }

  onQueryChange(params: any): void {
    this.loadExceptions(params);
  }

  filterByStatus(status: 'PENDING' | 'IN_REVIEW' | 'ALL'): void {
    this.currentFilter = status;
    this.selectedExcep = null;
    this.loadExceptions();
  }

  onRowClick(exception: IdentityException): void {
    this.selectedExcep = exception;
  }

  viewDetails(): void {
    if (!this.selectedExcep) {
      this.notificationService.error('Please select an exception first');
      return;
    }
    this.detailsPanel.open();
  }

  onRowDoubleClick(exception: IdentityException): void {
    this.selectedExcep = exception;
    this.detailsPanel.open();
  }

  closeDetailsPanel(): void {
    this.detailsPanel.close();
    this.selectedExcep = null;
  }

  openLinkDialog(): void {
    if (!this.selectedExcep) return;
    const identityId = prompt('Enter the Identity ID to link to:');
    if (identityId && !isNaN(Number(identityId))) {
      const notes = prompt('Add resolution notes (optional):');
      this.resolveByLinking(Number(identityId), notes || undefined);
    }
  }

  private resolveByLinking(identityId: number, notes?: string): void {
    if (!this.selectedExcep) return;
    this.exceptionService.resolveByLink(this.selectedExcep.exceptionId, identityId, notes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.notificationService.success('Exception resolved by linking');
            this.loadExceptions();
            this.loadStatistics();
            this.closeDetailsPanel();
          } else {
            this.notificationService.error(resp.message || 'Failed to resolve');
          }
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Failed to resolve');
        }
      });
  }

  resolveByCreatingNew(): void {
    if (!this.selectedExcep) return;
    const confirmed = confirm(`This will create a new identity for ${this.selectedExcep.sourceUsername || this.selectedExcep.sourceUserId} and link this account to it. Continue?`);
    if (confirmed) {
      const notes = prompt('Add resolution notes (optional):');
      this.exceptionService.resolveByNew(this.selectedExcep.exceptionId, notes || undefined)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resp: ApiResponse) => {
            if (resp.success) {
              this.notificationService.success('New identity created and linked');
              this.loadExceptions();
              this.loadStatistics();
              this.closeDetailsPanel();
            } else {
              this.notificationService.error(resp.message || 'Failed to create identity');
            }
          },
          error: (err) => {
            this.notificationService.error(err.error?.message || 'Failed to create identity');
          }
        });
    }
  }

  getExceptionTypeColor(type: string): string {
    if (!type) return 'default';
    const t = type.toLowerCase();
    if (t === 'multiple_matches') return 'error';
    if (t === 'no_match') return 'default';
    if (t === 'conflict' || t === 'data_quality') return 'warning';
    if (t === 'probable_match') return 'processing';
    if (t === 'orphan') return 'purple';
    return 'default';
  }

  resolveByIgnoring(): void {
    if (!this.selectedExcep) return;
    const confirmed = confirm('This will mark the exception as ignored. The account will not be linked to any identity. Continue?');
    if (confirmed) {
      const notes = prompt('Add resolution notes (optional):');
      this.exceptionService.resolveByIgnore(this.selectedExcep.exceptionId, notes || undefined)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resp: ApiResponse) => {
            if (resp.success) {
              this.notificationService.success('Exception ignored');
              this.loadExceptions();
              this.loadStatistics();
              this.closeDetailsPanel();
            } else {
              this.notificationService.error(resp.message || 'Failed to ignore');
            }
          },
          error: (err) => {
            this.notificationService.error(err.error?.message || 'Failed to ignore');
          }
        });
    }
  }
}
