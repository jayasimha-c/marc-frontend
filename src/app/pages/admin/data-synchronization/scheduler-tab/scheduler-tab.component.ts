import { Component, OnInit, OnDestroy } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { DataSyncService, SyncScheduler } from '../data-sync.service';
import { AddSchedulerDialogComponent } from '../add-scheduler-dialog/add-scheduler-dialog.component';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { ApiResponse } from '../../../../core/models/api-response';

@Component({
  standalone: false,
  selector: 'app-scheduler-tab',
  templateUrl: './scheduler-tab.component.html',
  styleUrls: ['./scheduler-tab.component.scss'],
})
export class SchedulerTabComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  columns: TableColumn[] = [
    { field: 'name', header: 'Task Name', sortable: true, filterable: true },
    { field: 'syncTypeDisplay', header: 'Sync Type', sortable: true, filterable: true },
    { field: 'sapSystem', header: 'SAP System', sortable: true },
    { field: 'syncMode', header: 'Sync Mode', sortable: true },
    { field: 'repeatPeriodically', header: 'Repeat', type: 'boolean' },
    { field: 'startDateStr', header: 'Start Date', sortable: true },
    { field: 'endDateStr', header: 'End Date', sortable: true },
    { field: 'repeatAfterDays', header: 'Repeat (Days)' },
    { field: 'lastExecutionTimeStr', header: 'Last Executed' },
    { field: 'nextExecutionTimeStr', header: 'Next Execution' },
    { field: 'runBy', header: 'Created By', sortable: true },
  ];

  data: any[] = [];
  loading = false;
  selectedRow: any = null;

  tableActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onAction('add') },
    { label: 'Edit', icon: 'edit', command: () => this.onAction('edit') },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onAction('delete') },
    { label: 'Run Now', icon: 'play-circle', command: () => this.onAction('run') },
  ];

  constructor(
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
    private dataSyncService: DataSyncService,
  ) {}

  ngOnInit(): void {
    this.loadSchedulers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSchedulers(): void {
    this.loading = true;
    this.data = [];

    this.dataSyncService.getSchedulers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.data = resp.data.rows || [];
          }
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load schedulers');
          this.loading = false;
        },
      });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onAction(action: string): void {
    switch (action) {
      case 'add':
        this.openDialog('Add');
        break;
      case 'edit':
        if (this.isRowSelected()) {
          this.openDialog('Edit', this.selectedRow);
        }
        break;
      case 'delete':
        if (this.isRowSelected()) {
          this.confirmDialogService.confirm({ title: 'Delete', message: 'Are you sure you want to delete the selected item(s)?' })
            .subscribe(confirmed => {
              if (confirmed) this.deleteScheduler(this.selectedRow.id);
            });
        }
        break;
      case 'run':
        if (this.isRowSelected()) {
          this.runScheduler(this.selectedRow.id);
        }
        break;
    }
  }

  private openDialog(formType: string, row?: SyncScheduler): void {
    this.nzModal.create({
      nzTitle: `${formType} Sync Scheduler`,
      nzContent: AddSchedulerDialogComponent,
      nzWidth: '40vw',
      nzClassName: 'updated-modal',
      nzData: { formType, row },
      nzFooter: null,
    }).afterClose.subscribe(result => {
      if (result) this.loadSchedulers();
    });
  }

  private deleteScheduler(id: number): void {
    this.dataSyncService.deleteScheduler(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.notificationService.success(resp.message || 'Scheduler deleted successfully');
            this.loadSchedulers();
          } else {
            this.notificationService.error(resp.message || 'Failed to delete scheduler');
          }
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Failed to delete scheduler');
        },
      });
  }

  private runScheduler(id: number): void {
    this.dataSyncService.runScheduler(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.notificationService.success(resp.message || 'Sync job started');
          } else {
            this.notificationService.error(resp.message || 'Failed to start sync job');
          }
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Failed to start sync job');
        },
      });
  }

  private isRowSelected(): boolean {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row first');
      return false;
    }
    return true;
  }
}
