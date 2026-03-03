import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ControlSchedulerService } from './control-scheduler.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ControlSchedulerDialogComponent } from './control-scheduler-dialog.component';
import { AddBookToSchedulerDialogComponent } from './add-book-to-scheduler-dialog.component';
import { AddControlToSchedulerDialogComponent } from './add-control-to-scheduler-dialog.component';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-control-scheduler-detail',
  templateUrl: './control-scheduler-detail.component.html',
  styleUrls: ['./control-scheduler-detail.component.scss'],
})
export class ControlSchedulerDetailComponent implements OnInit {
  schedulerId!: number;
  scheduler: any = null;
  loading = true;

  bookColumns: TableColumn[] = [
    { field: 'name', header: 'Book Name', sortable: true, ellipsis: true },
    { field: 'controlCount', header: 'Controls', width: '90px', align: 'right' },
    { field: 'isActive', header: 'Active', type: 'boolean', width: '80px' },
    {
      field: '_actions', header: '', type: 'actions', width: '80px', fixed: 'right',
      actions: [
        { icon: 'eye', tooltip: 'View Book', command: (row: any) => this.viewBook(row) },
        { icon: 'delete', tooltip: 'Remove', danger: true, command: (row: any) => this.removeBook(row) },
      ],
    },
  ];

  bookActions: TableAction[] = [
    { label: 'Add Book', icon: 'plus', type: 'primary', command: () => this.addBook() },
  ];

  controlColumns: TableColumn[] = [
    { field: 'name', header: 'Control Name', sortable: true, ellipsis: true },
    { field: 'controlTypeName', header: 'Type', width: '120px', type: 'tag',
      tagColors: { Automated: 'green', Manual: 'gold', Standard: 'blue' } },
    { field: 'isActive', header: 'Active', type: 'boolean', width: '80px' },
    {
      field: '_actions', header: '', type: 'actions', width: '80px', fixed: 'right',
      actions: [
        { icon: 'eye', tooltip: 'View Control', command: (row: any) => this.viewControl(row) },
        { icon: 'delete', tooltip: 'Remove', danger: true, command: (row: any) => this.removeControl(row) },
      ],
    },
  ];

  controlActions: TableAction[] = [
    { label: 'Add Control', icon: 'plus', type: 'primary', command: () => this.addControl() },
  ];

  books: any[] = [];
  controls: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nzModal: NzModalService,
    private schedulerService: ControlSchedulerService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.schedulerId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadScheduler();
  }

  loadScheduler(): void {
    this.loading = true;
    this.schedulerService.getById(this.schedulerId).subscribe({
      next: resp => {
        this.scheduler = resp.data;
        this.books = this.scheduler?.controlBooks || [];
        this.controls = this.scheduler?.controls || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Failed to load scheduler');
      },
    });
  }

  navigateBack(): void {
    this.router.navigate(['/icm/schedulers']);
  }

  editScheduler(): void {
    this.nzModal.create({
      nzTitle: 'Edit Scheduler',
      nzContent: ControlSchedulerDialogComponent,
      nzWidth: '600px',
      nzClassName: 'updated-modal',
      nzData: { action: 'edit', scheduler: this.scheduler },
      nzFooter: null,
    }).afterClose.subscribe(result => {
      if (result) this.loadScheduler();
    });
  }

  deleteScheduler(): void {
    if (this.scheduler?.isRunning) {
      this.notificationService.error('Cannot delete a running scheduler');
      return;
    }
    this.confirmDialog.confirm({ title: 'Delete Scheduler', message: `Delete "${this.scheduler?.name}"?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.schedulerService.delete(this.schedulerId).subscribe({
          next: resp => { this.notificationService.show(resp); this.navigateBack(); },
          error: err => this.notificationService.handleHttpError(err),
        });
      });
  }

  toggleEnabled(): void {
    const obs = this.scheduler.enabled
      ? this.schedulerService.disable(this.schedulerId)
      : this.schedulerService.enable(this.schedulerId);
    obs.subscribe({
      next: resp => { this.notificationService.show(resp); this.loadScheduler(); },
      error: err => this.notificationService.handleHttpError(err),
    });
  }

  executeNow(): void {
    if (this.scheduler?.isRunning) {
      this.notificationService.warn('Scheduler is already running');
      return;
    }
    this.confirmDialog.confirm({
      title: 'Execute Scheduler',
      message: `Execute now? This will run all ${this.scheduler?.totalControlCount || 0} control(s).`,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.schedulerService.execute(this.schedulerId).subscribe({
        next: resp => { this.notificationService.show(resp); this.loadScheduler(); },
        error: err => this.notificationService.handleHttpError(err),
      });
    });
  }

  // --- Books ---
  addBook(): void {
    this.nzModal.create({
      nzTitle: 'Add Control Books',
      nzContent: AddBookToSchedulerDialogComponent,
      nzWidth: '700px',
      nzClassName: 'updated-modal',
      nzData: { schedulerId: this.schedulerId, existingBookIds: this.books.map(b => b.id) },
      nzFooter: null,
    }).afterClose.subscribe(result => {
      if (result) this.loadScheduler();
    });
  }

  viewBook(row: any): void {
    this.router.navigate([`/icm/control-books/${row.id}`]);
  }

  removeBook(row: any): void {
    this.confirmDialog.confirm({ title: 'Remove Book', message: `Remove "${row.name}" from this scheduler?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.schedulerService.removeControlBook(this.schedulerId, row.id).subscribe({
          next: resp => { this.notificationService.show(resp); this.loadScheduler(); },
          error: err => this.notificationService.handleHttpError(err),
        });
      });
  }

  // --- Controls ---
  addControl(): void {
    this.nzModal.create({
      nzTitle: 'Add Controls',
      nzContent: AddControlToSchedulerDialogComponent,
      nzWidth: '700px',
      nzClassName: 'updated-modal',
      nzData: { schedulerId: this.schedulerId, existingControlIds: this.controls.map(c => c.id) },
      nzFooter: null,
    }).afterClose.subscribe(result => {
      if (result) this.loadScheduler();
    });
  }

  viewControl(row: any): void {
    this.router.navigate([`/icm/controls/${row.id}`]);
  }

  removeControl(row: any): void {
    this.confirmDialog.confirm({ title: 'Remove Control', message: `Remove "${row.name}" from this scheduler?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.schedulerService.removeControl(this.schedulerId, row.id).subscribe({
          next: resp => { this.notificationService.show(resp); this.loadScheduler(); },
          error: err => this.notificationService.handleHttpError(err),
        });
      });
  }

  // --- Helpers ---
  getScheduleKindName(kind: number): string {
    return kind === 0 ? 'One-Time' : 'Recurring';
  }

  formatEpoch(ts: number): string {
    return ts ? new Date(ts).toLocaleString() : '-';
  }
}
