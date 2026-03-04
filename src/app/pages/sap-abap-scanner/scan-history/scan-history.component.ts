import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AbapService } from '../abap.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-scan-history',
  templateUrl: './scan-history.component.html',
  styleUrls: ['./scan-history.component.scss'],
})
export class ScanHistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;
  scanStats: any = {};

  private lastQueryParams: TableQueryParams | null = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', sortable: false },
    { field: 'status', header: 'Status', width: '120px', sortable: false, type: 'tag',
      tagColors: {
        COMPLETED: 'green', FAILED: 'red', RUNNING: 'processing',
        SCHEDULED: 'default', CANCELLED: 'orange', IN_REVIEW: 'gold',
      } },
    { field: 'sapSystemName', header: 'System', width: '120px', sortable: false },
    { field: 'totalPrograms', header: 'Programs', width: '90px', sortable: false },
    { field: 'criticalCount', header: 'Critical', width: '80px', sortable: false },
    { field: 'highCount', header: 'High', width: '80px', sortable: false },
    { field: 'mediumCount', header: 'Medium', width: '80px', sortable: false },
    { field: 'lowCount', header: 'Low', width: '80px', sortable: false },
    { field: 'totalFindings', header: 'Findings', width: '90px', sortable: false },
    { field: 'createdAt', header: 'Created', type: 'date', width: '160px', sortable: false },
    { field: 'duration', header: 'Duration', width: '100px', sortable: false },
  ];

  actions: TableAction[] = [
    { label: 'New Scan', icon: 'plus', type: 'primary', command: () => this.onAction('new-scan') },
    { label: 'View Results', icon: 'eye', command: () => this.onAction('view') },
  ];

  constructor(
    private abapService: AbapService,
    private router: Router,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onQueryParamsChange(params: TableQueryParams): void {
    this.lastQueryParams = params;
    this.loadData(params);
  }

  loadData(params?: TableQueryParams): void {
    const query = params || this.lastQueryParams;
    if (!query) return;

    this.loading = true;
    this.abapService.getScanHistoryList(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.data = res.data?.rows || [];
            this.totalRecords = res.data?.records || 0;
          }
          this.loading = false;
        },
        error: () => {
          this.data = [];
          this.totalRecords = 0;
          this.loading = false;
        },
      });
  }

  loadStats(): void {
    this.abapService.getScanHistoryCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.scanStats = res.data || {};
          }
        },
      });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onAction(action: string): void {
    switch (action) {
      case 'new-scan':
        this.router.navigate(['/sap-abap-scanner/code-scan/add']);
        break;

      case 'view':
        if (!this.selectedRow) {
          this.notification.warn('Please select a scan first');
          return;
        }
        const executionId = this.selectedRow.id || this.selectedRow.executionId;
        const systemId = this.selectedRow.sapSystemId;
        if (executionId && systemId) {
          this.router.navigate(['/sap-abap-scanner/scan-results/detail'], {
            queryParams: { executionId, systemId },
          });
        } else {
          this.notification.warn('Missing execution or system information');
        }
        break;
    }
  }
}
