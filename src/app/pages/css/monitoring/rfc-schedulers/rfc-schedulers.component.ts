import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { RfcScheduler, RfcSchedulerService } from './rfc-scheduler.service';
import { AddRfcSchedulerModalComponent } from './add-rfc-scheduler-modal.component';
import { RfcSchedulerJobsModalComponent } from './rfc-scheduler-jobs-modal.component';
import { TableColumn, TableAction, RowAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-rfc-schedulers',
  templateUrl: './rfc-schedulers.component.html',
})
export class RfcSchedulersComponent implements OnInit {
  schedulers: any[] = [];
  totalRecords = 0;
  loading = false;

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', sortable: true },
    { field: 'sapSystemName', header: 'SAP System' },
    { field: 'description', header: 'Description' },
    { field: 'repeatsText', header: 'Repeats', width: '80px' },
    { field: 'intervalText', header: 'Interval', width: '100px' },
    { field: 'lastRunText', header: 'Last Run', width: '160px' },
    { field: 'nextRunText', header: 'Next Run', width: '160px' },
    { field: 'statusText', header: 'Status', type: 'tag', width: '100px',
      tagColors: { Enabled: 'green', Disabled: 'default' } },
    { field: 'actions', header: 'Actions', type: 'actions', width: '200px',
      actions: this.getRowActions() },
  ];

  tableActions: TableAction[] = [
    { label: 'Add Scheduler', icon: 'plus', type: 'primary', command: () => this.openSchedulerModal(null) },
  ];

  constructor(
    private rfcSchedulerService: RfcSchedulerService,
    private notificationService: NotificationService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private getRowActions(): RowAction[] {
    return [
      { icon: 'edit', tooltip: 'Edit', command: (row) => this.openSchedulerModal(row) },
      { icon: 'caret-right', tooltip: 'Run Now', command: (row) => this.runScheduler(row) },
      { icon: 'poweroff', tooltip: 'Toggle', command: (row) => this.toggleScheduler(row) },
      { icon: 'history', tooltip: 'Job History', command: (row) => this.openJobsModal(row) },
      { icon: 'delete', tooltip: 'Delete', command: (row) => this.deleteScheduler(row), danger: true },
    ];
  }

  loadData(): void {
    this.loading = true;
    this.rfcSchedulerService.getAllSchedulers().subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success) {
          this.schedulers = (resp.data || []).map((s: RfcScheduler) => ({
            ...s,
            repeatsText: s.repeatPeriodically ? 'Yes' : 'No',
            intervalText: s.repeatAfterDays ? `${s.repeatAfterDays} day(s)` : '--',
            lastRunText: s.lastExecutionTime ? new Date(s.lastExecutionTime).toLocaleString() : '--',
            nextRunText: s.nextExecutionTime ? new Date(s.nextExecutionTime).toLocaleString() : '--',
            statusText: s.isEnabled ? 'Enabled' : 'Disabled',
          }));
          this.totalRecords = this.schedulers.length;
        }
      },
      error: () => { this.loading = false; },
    });
  }

  openSchedulerModal(scheduler: RfcScheduler | null): void {
    const modalRef = this.modal.create({
      nzTitle: scheduler ? 'Edit RFC Scheduler' : 'Add RFC Scheduler',
      nzContent: AddRfcSchedulerModalComponent,
      nzWidth: 560,
      nzFooter: null,
      nzData: { scheduler },
    });

    modalRef.afterClose.subscribe((result) => {
      if (result) this.loadData();
    });
  }

  openJobsModal(scheduler: RfcScheduler): void {
    this.modal.create({
      nzTitle: `Job History: ${scheduler.name}`,
      nzContent: RfcSchedulerJobsModalComponent,
      nzWidth: 800,
      nzFooter: null,
      nzData: { scheduler },
    });
  }

  runScheduler(scheduler: RfcScheduler): void {
    this.modal.confirm({
      nzTitle: 'Run Scheduler',
      nzContent: `Run "${scheduler.name}" now?`,
      nzOkText: 'Run Now',
      nzOnOk: () => {
        this.notificationService.success('Starting scan...');
        this.rfcSchedulerService.runNow(scheduler.id!).subscribe({
          next: (resp) => {
            this.notificationService.show(resp);
            this.loadData();
          },
          error: (err) => { this.notificationService.show(err.error); },
        });
      },
    });
  }

  toggleScheduler(scheduler: RfcScheduler): void {
    const action = scheduler.isEnabled ? 'disable' : 'enable';
    this.modal.confirm({
      nzTitle: `${action.charAt(0).toUpperCase() + action.slice(1)} Scheduler`,
      nzContent: `Are you sure you want to ${action} "${scheduler.name}"?`,
      nzOnOk: () => {
        this.rfcSchedulerService.toggleScheduler(scheduler.id!).subscribe({
          next: (resp) => {
            this.notificationService.show(resp);
            this.loadData();
          },
          error: (err) => { this.notificationService.show(err.error); },
        });
      },
    });
  }

  deleteScheduler(scheduler: RfcScheduler): void {
    this.modal.confirm({
      nzTitle: 'Delete Scheduler',
      nzContent: `Delete "${scheduler.name}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.rfcSchedulerService.deleteScheduler(scheduler.id!).subscribe({
          next: (resp) => {
            this.notificationService.show(resp);
            this.loadData();
          },
          error: (err) => { this.notificationService.show(err.error); },
        });
      },
    });
  }
}
