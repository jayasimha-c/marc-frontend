import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AbapService } from '../../abap.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-scan-result-enhanced',
  templateUrl: './scan-result-enhanced.component.html',
  styleUrls: ['./scan-result-enhanced.component.scss'],
})
export class ScanResultEnhancedComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  executionId!: number;
  systemId!: number;
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;
  selectedStatusFilter = '';

  private lastQueryParams: TableQueryParams | null = null;

  dashboardMetrics = {
    totalPrograms: 0,
    programsWithViolations: 0,
    passedPrograms: 0,
    totalViolations: 0,
    uniqueRulesViolated: 0,
    systemName: '',
  };

  columns: TableColumn[] = [
    { field: 'programName', header: 'Program Name', sortable: false },
    { field: 'programType', header: 'Type', width: '100px', sortable: false, type: 'tag' },
    { field: 'sapSystemName', header: 'System', width: '120px', sortable: false },
    { field: 'violatedRulesCount', header: 'Rules Violated', width: '120px', sortable: false },
    { field: 'totalViolations', header: 'Total Violations', width: '130px', sortable: false },
    { field: 'lastViolatedDate', header: 'Last Scanned', type: 'date', width: '160px', sortable: false },
    { field: 'status', header: 'Status', width: '120px', sortable: false, type: 'tag',
      tagColors: { VIOLATION_FOUND: 'red', PASSED: 'green' } },
  ];

  actions: TableAction[] = [
    { label: 'View Details', icon: 'eye', type: 'primary', command: () => this.onAction('view') },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private abapService: AbapService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const newExecutionId = +params['executionId'];
        const newSystemId = +params['systemId'];

        if (newExecutionId && newSystemId) {
          const changed = this.executionId !== newExecutionId || this.systemId !== newSystemId;
          this.executionId = newExecutionId;
          this.systemId = newSystemId;

          if (changed || !this.data.length) {
            this.loadCount();
            this.loadData();
          }
        }
      });
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
    if (!query || !this.executionId || !this.systemId) return;

    this.loading = true;
    this.abapService.getProgramViolationSummary(
      this.executionId,
      this.systemId,
      query,
      this.selectedStatusFilter || undefined
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.data = res.data?.rows || [];
            this.totalRecords = res.data?.records || 0;
          } else {
            this.notification.error('Failed to load program violation data');
            this.data = [];
            this.totalRecords = 0;
          }
        },
        error: () => {
          this.loading = false;
          this.data = [];
          this.totalRecords = 0;
        },
      });
  }

  loadCount(): void {
    if (!this.executionId || !this.systemId) return;

    this.abapService.getProgramViolationSummaryCount(this.executionId, this.systemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const d = res.data;
            this.dashboardMetrics.totalPrograms = d.totalPrograms || 0;
            this.dashboardMetrics.programsWithViolations = d.programsViolated || 0;
            this.dashboardMetrics.passedPrograms = d.programsPassed || 0;
            this.dashboardMetrics.uniqueRulesViolated = d.totalRulesViolated || 0;
            this.dashboardMetrics.totalViolations = d.totalFindings || 0;
            this.dashboardMetrics.systemName = d.systemName || '';
          }
        },
      });
  }

  onStatusFilterChange(): void {
    this.loadData();
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onAction(action: string): void {
    if (action === 'view') {
      if (!this.selectedRow) {
        this.notification.warn('Please select a program first');
        return;
      }
      const programId = this.selectedRow.programId || this.selectedRow.id;
      this.router.navigate(['/sap-abap-scanner/program-violations', this.executionId, this.systemId, programId]);
    }
  }

  navigateBack(): void {
    this.router.navigate(['/sap-abap-scanner/scan-results']);
  }
}
