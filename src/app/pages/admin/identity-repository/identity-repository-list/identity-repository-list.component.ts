import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiResponse } from '../../../../core/models/api-response';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import {
  IdentityRepositoryService,
  MarcIdentityVO,
  IdentityStats,
  OrphanedAccount
} from '../identity-repository.service';
import { IdentityExceptionService, IdentityException, ExceptionStatistics } from '../identity-exceptions/identity-exception.service';

type ViewMode = 'all' | 'fullyLinked' | 'partiallyLinked' | 'unlinked' | 'orphaned' | 'exceptions';

@Component({
  standalone: false,
  selector: 'app-identity-repository-list',
  templateUrl: './identity-repository-list.component.html',
  styleUrls: ['./identity-repository-list.component.scss']
})
export class IdentityRepositoryListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentView: ViewMode = 'all';

  badgeStyle = { backgroundColor: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.65)', boxShadow: 'none' };
  warningBadgeStyle = { backgroundColor: 'rgba(250,173,20,0.15)', color: '#d48806', boxShadow: 'none' };

  stats: IdentityStats = {
    totalIdentities: 0,
    fullyLinked: 0,
    partiallyLinked: 0,
    unlinked: 0,
    orphanedAccounts: 0
  };

  exceptionStats: ExceptionStatistics = {
    pendingCount: 0,
    inReviewCount: 0,
    totalUnresolved: 0,
    bySourceSystem: {}
  };

  identityData: MarcIdentityVO[] = [];
  identityTotal = 0;
  identityColumns: TableColumn[] = [
    { field: 'employeeId', header: 'Employee ID', sortable: true, filterable: true, width: '120px' },
    { field: 'displayName', header: 'Name', sortable: true, filterable: true, width: '200px' },
    { field: 'primaryEmail', header: 'Email', sortable: true, filterable: true, width: '240px' },
    { field: 'department', header: 'Department', sortable: true, filterable: true, width: '150px' },
    { field: 'jobTitle', header: 'Job Title', sortable: true, filterable: true, width: '150px' },
    { field: 'sapBname', header: 'SAP BNAME', sortable: true, filterable: true, width: '120px' },
    { field: 'linkedAccountsDisplay', header: 'Linked Accounts', width: '130px' },
    { field: 'statusDisplay', header: 'Status', width: '140px' },
    { field: 'lastSyncedDisplay', header: 'Last Synced', width: '150px' },
  ];
  identityActions: TableAction[] = [
    { label: 'View Details', icon: 'eye', command: () => this.viewDetails() },
  ];

  orphanedData: OrphanedAccount[] = [];
  orphanedTotal = 0;
  orphanedColumns: TableColumn[] = [
    { field: 'applicationLabel', header: 'Application', sortable: true, filterable: true, width: '150px' },
    { field: 'systemName', header: 'System', sortable: true, filterable: true, width: '150px' },
    { field: 'accountUsername', header: 'Username', sortable: true, filterable: true, width: '150px' },
    { field: 'accountEmail', header: 'Email', sortable: true, filterable: true, width: '200px' },
    { field: 'accountDisplayName', header: 'Display Name', sortable: true, filterable: true, width: '180px' },
    { field: 'lastSyncedDisplay', header: 'Last Synced', width: '150px' },
  ];

  exceptionData: IdentityException[] = [];
  exceptionTotal = 0;
  exceptionColumns: TableColumn[] = [
    { field: 'sourceSystemDisplay', header: 'Source System', sortable: true, filterable: true, width: '130px' },
    { field: 'sourceUserId', header: 'User ID', sortable: true, filterable: true, width: '120px' },
    { field: 'sourceUsername', header: 'Username', sortable: true, filterable: true, width: '150px' },
    { field: 'sourceEmail', header: 'Email', sortable: true, filterable: true, width: '200px' },
    { field: 'exceptionTypeDisplay', header: 'Type', sortable: true, width: '140px' },
    { field: 'reason', header: 'Reason', width: '200px' },
    { field: 'statusDisplay', header: 'Status', sortable: true, width: '120px' },
    { field: 'createdAtStr', header: 'Created', sortable: true, width: '150px' },
  ];
  exceptionActions: TableAction[] = [
    { label: 'View Details', icon: 'eye', command: () => this.viewExceptionDetails() },
  ];

  loading = false;
  selectedRow: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private identityRepositoryService: IdentityRepositoryService,
    private identityExceptionService: IdentityExceptionService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadExceptionStats();
    this.loadIdentities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats(): void {
    this.identityRepositoryService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.stats = resp.data;
          }
        }
      });
  }

  loadExceptionStats(): void {
    this.identityExceptionService.getStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.exceptionStats = resp.data;
          }
        }
      });
  }

  loadIdentities(params?: any): void {
    this.loading = true;
    this.identityRepositoryService.getIdentities(params, this.currentView)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            const identities = resp.data.rows || resp.data.content || [];
            this.identityData = Array.isArray(identities) ? identities.map(i => this.enrichIdentityForDisplay(i)) : [];
            this.identityTotal = resp.data.records || resp.data.totalElements || 0;
          }
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load identities');
          this.loading = false;
        }
      });
  }

  loadOrphanedAccounts(params?: any): void {
    this.loading = true;
    this.identityRepositoryService.getOrphanedAccounts(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            const orphans = resp.data.rows || resp.data.content || [];
            this.orphanedData = Array.isArray(orphans) ? orphans.map(o => this.enrichOrphanForDisplay(o)) : [];
            this.orphanedTotal = resp.data.records || resp.data.totalElements || 0;
          }
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load orphaned accounts');
          this.loading = false;
        }
      });
  }

  loadExceptions(params?: any): void {
    this.loading = true;
    this.identityExceptionService.getFiltered(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            const exceptions = resp.data.rows || resp.data.content || [];
            this.exceptionData = Array.isArray(exceptions) ? exceptions : [];
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

  onIdentityQueryChange(params: any): void {
    this.loadIdentities(params);
  }

  onOrphanedQueryChange(params: any): void {
    this.loadOrphanedAccounts(params);
  }

  onExceptionQueryChange(params: any): void {
    this.loadExceptions(params);
  }

  private enrichIdentityForDisplay(identity: MarcIdentityVO): MarcIdentityVO {
    const sourceTypeMap: Record<string, string> = {
      'AZURE_AD': 'Azure AD',
      'ON_PREM_AD': 'On-Prem AD',
      'MANUAL_CSV': 'CSV'
    };
    identity.sourceTypeDisplay = sourceTypeMap[identity.sourceType] || identity.sourceType;
    identity.lastSyncedDisplay = identity.lastSyncedAt ? new Date(identity.lastSyncedAt).toLocaleString() : 'Never';

    const linkedCount = identity.linkedAccountsCount || 0;
    identity.linkedAccountsDisplay = linkedCount === 0 ? 'No links' : `${linkedCount} account${linkedCount > 1 ? 's' : ''}`;

    if (linkedCount === 0) {
      identity.statusDisplay = 'Unlinked';
    } else if (linkedCount >= 3) {
      identity.statusDisplay = 'Fully Linked';
    } else {
      identity.statusDisplay = 'Partially Linked';
    }
    return identity;
  }

  private enrichOrphanForDisplay(orphan: OrphanedAccount): OrphanedAccount {
    orphan.lastSyncedDisplay = orphan.lastSyncedAt ? new Date(orphan.lastSyncedAt).toLocaleString() : 'Unknown';
    return orphan;
  }

  setViewMode(mode: ViewMode): void {
    this.currentView = mode;
    this.selectedRow = null;
    if (mode === 'orphaned') {
      this.loadOrphanedAccounts();
    } else if (mode === 'exceptions') {
      this.loadExceptions();
    } else {
      this.loadIdentities();
    }
  }

  viewDetails(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select an identity first');
      return;
    }
    this.router.navigate(['detail', this.selectedRow.id], { relativeTo: this.route });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onRowDoubleClick(identity: MarcIdentityVO): void {
    this.router.navigate(['detail', identity.id], { relativeTo: this.route });
  }

  viewExceptionDetails(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select an exception first');
      return;
    }
    this.notificationService.success('Exception details view coming soon');
  }

  refreshData(): void {
    this.loadStats();
    this.loadExceptionStats();
    if (this.currentView === 'orphaned') {
      this.loadOrphanedAccounts();
    } else if (this.currentView === 'exceptions') {
      this.loadExceptions();
    } else {
      this.loadIdentities();
    }
  }

  getPageTitle(): string {
    const titles: Record<string, string> = {
      fullyLinked: 'Fully Linked Identities',
      partiallyLinked: 'Partially Linked Identities',
      unlinked: 'Unlinked Identities',
      orphaned: 'Orphaned Accounts',
      exceptions: 'Identity Exceptions'
    };
    return titles[this.currentView] || 'Identity Repository';
  }

  getPageDescription(): string {
    const descriptions: Record<string, string> = {
      fullyLinked: 'Identities with all accounts linked across systems',
      partiallyLinked: 'Identities with some accounts linked',
      unlinked: 'Identities with no linked accounts',
      orphaned: 'System accounts without a linked identity',
      exceptions: 'Review and resolve identity matching exceptions'
    };
    return descriptions[this.currentView] || 'Manage and monitor identity correlations across systems';
  }
}
