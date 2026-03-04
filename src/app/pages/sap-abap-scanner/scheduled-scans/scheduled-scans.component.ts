import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { AbapService } from '../abap.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-scheduled-scans',
  templateUrl: './scheduled-scans.component.html',
  styleUrls: ['./scheduled-scans.component.scss'],
})
export class ScheduledScansComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;
  scheduledCount: any = {};

  private lastQueryParams: TableQueryParams | null = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', sortable: false },
    { field: 'systemNames', header: 'SAP Systems', width: '160px', sortable: false },
    { field: 'totalRules', header: 'Rules', width: '80px', sortable: false },
    { field: 'active', header: 'Active', width: '90px', sortable: false, type: 'tag',
      tagColors: { true: 'green', false: 'default' } },
    { field: 'repeatIntervalDisplay', header: 'Frequency', width: '120px', sortable: false },
    { field: 'lastRunTimeStr', header: 'Last Run', width: '160px', sortable: false },
    { field: 'nextRunTimeStr', header: 'Next Run', width: '160px', sortable: false },
    { field: 'lastJobStatus', header: 'Last Status', width: '120px', sortable: false, type: 'tag',
      tagColors: { COMPLETED: 'green', FAILED: 'red', RUNNING: 'processing', PENDING: 'default', CANCELLED: 'orange' } },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus', type: 'primary', command: () => this.onAction('add') },
    { label: 'Edit', icon: 'edit', command: () => this.onAction('edit') },
    { label: 'Run Now', icon: 'caret-right', command: () => this.onAction('run-now') },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onAction('delete') },
    { label: 'Job History', icon: 'history', command: () => this.onAction('job-history') },
  ];

  constructor(
    private abapService: AbapService,
    private router: Router,
    private notification: NotificationService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadScheduledCount();
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
    this.abapService.getScheduledScanList(query)
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

  loadScheduledCount(): void {
    this.abapService.getScheduledScanCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.scheduledCount = res.data || {};
          }
        },
      });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onAction(action: string): void {
    switch (action) {
      case 'add':
        this.router.navigate(['/sap-abap-scanner/scheduled-scans/add'], {
          state: { scheduledScan: null, formType: 'add' },
        });
        break;

      case 'edit':
        if (!this.selectedRow) {
          this.notification.warn('Please select a row first');
          return;
        }
        this.router.navigate(['/sap-abap-scanner/scheduled-scans/add'], {
          state: { scheduledScan: this.selectedRow, formType: 'edit' },
        });
        break;

      case 'delete':
        if (!this.selectedRow) {
          this.notification.warn('Please select a row first');
          return;
        }
        this.modal.confirm({
          nzTitle: 'Confirm Delete',
          nzContent: 'Are you sure you want to delete this scheduled scan? This action cannot be undone.',
          nzOkText: 'Delete',
          nzOkDanger: true,
          nzOnOk: () => {
            this.abapService.deleteScheduledScan(this.selectedRow.id).subscribe({
              next: (res) => {
                if (res.success) {
                  this.notification.success('Deleted successfully');
                } else {
                  this.notification.error(res.message || 'Delete failed');
                }
                this.selectedRow = null;
                this.loadData();
                this.loadScheduledCount();
              },
              error: (err) => this.notification.error(err.error?.message || 'Delete failed'),
            });
          },
        });
        break;

      case 'run-now':
        if (!this.selectedRow) {
          this.notification.warn('Please select a scheduler to run');
          return;
        }
        this.modal.confirm({
          nzTitle: 'Run Scheduler Now',
          nzContent: `Are you sure you want to run "${this.selectedRow.name}" now?`,
          nzOkText: 'Run Now',
          nzOnOk: () => {
            this.abapService.runSchedulerNow(this.selectedRow.id).subscribe({
              next: (res) => {
                if (res.success) {
                  this.notification.success(res.message || 'Scheduler triggered successfully');
                } else {
                  this.notification.error(res.message || 'Failed to trigger scheduler');
                }
                this.loadData();
              },
              error: (err) => this.notification.error(err.error?.message || 'Failed to trigger scheduler'),
            });
          },
        });
        break;

      case 'job-history':
        this.router.navigate(['/sap-abap-scanner/job-history']);
        break;
    }
  }
}
