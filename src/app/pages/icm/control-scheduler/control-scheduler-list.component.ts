import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ControlSchedulerService } from './control-scheduler.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ControlSchedulerDialogComponent } from './control-scheduler-dialog.component';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-control-scheduler-list',
  templateUrl: './control-scheduler-list.component.html',
})
export class ControlSchedulerListComponent implements OnInit {
  loading = false;
  data: any[] = [];

  columns: TableColumn[] = [
    { field: 'name', header: 'Scheduler Name', sortable: true, ellipsis: true },
    { field: 'sapSystemName', header: 'System', sortable: true, width: '130px' },
    { field: 'totalControlCount', header: 'Controls', width: '90px', align: 'right' },
    { field: 'enabled', header: 'Enabled', type: 'boolean', width: '90px' },
    { field: 'runningLabel', header: 'Status', type: 'tag', width: '100px',
      tagColors: { Running: 'processing', Idle: 'default' } },
    { field: 'lastExecutionLabel', header: 'Last Execution', width: '170px', ellipsis: true },
    { field: 'nextExecutionLabel', header: 'Next Execution', width: '170px', ellipsis: true },
    {
      field: '_actions', header: '', type: 'actions', width: '130px', fixed: 'right',
      actions: [
        { icon: 'eye', tooltip: 'View', command: (row: any) => this.onView(row) },
        { icon: 'caret-right', tooltip: 'Execute Now', command: (row: any) => this.onExecute(row) },
        { icon: 'delete', tooltip: 'Delete', danger: true, command: (row: any) => this.onDelete(row) },
      ],
    },
  ];

  tableActions: TableAction[] = [
    { label: 'Add Scheduler', icon: 'plus', type: 'primary', command: () => this.onAdd() },
  ];

  constructor(
    private router: Router,
    private nzModal: NzModalService,
    private schedulerService: ControlSchedulerService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.schedulerService.getAll().subscribe({
      next: resp => {
        this.data = (resp.data || []).map((s: any) => ({
          ...s,
          runningLabel: s.isRunning ? 'Running' : 'Idle',
          lastExecutionLabel: s.lastExecutionTime ? new Date(s.lastExecutionTime).toLocaleString() : '-',
          nextExecutionLabel: s.nextExecutionTime ? new Date(s.nextExecutionTime).toLocaleString() : '-',
        }));
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.loading = false;
        this.notificationService.error('Failed to load schedulers');
      },
    });
  }

  onAdd(): void {
    this.nzModal.create({
      nzTitle: 'Create Scheduler',
      nzContent: ControlSchedulerDialogComponent,
      nzWidth: '600px',
      nzClassName: 'updated-modal',
      nzData: { action: 'create' },
      nzFooter: null,
    }).afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  onView(row: any): void {
    this.router.navigate([`/icm/schedulers/${row.id}`]);
  }

  onExecute(row: any): void {
    if (row.isRunning) {
      this.notificationService.warn('Scheduler is already running');
      return;
    }
    this.confirmDialog.confirm({
      title: 'Execute Scheduler',
      message: `Execute "${row.name}" now? This will run all ${row.totalControlCount || 0} control(s).`,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.schedulerService.execute(row.id).subscribe({
        next: resp => { this.notificationService.show(resp); this.loadData(); },
        error: err => this.notificationService.handleHttpError(err),
      });
    });
  }

  onDelete(row: any): void {
    if (row.isRunning) {
      this.notificationService.error('Cannot delete a running scheduler');
      return;
    }
    this.confirmDialog.confirm({
      title: 'Delete Scheduler',
      message: `Delete "${row.name}"?`,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.schedulerService.delete(row.id).subscribe({
        next: resp => { this.notificationService.show(resp); this.loadData(); },
        error: err => this.notificationService.handleHttpError(err),
      });
    });
  }

  onRowDblClick(row: any): void {
    this.onView(row);
  }
}
