import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ControlBookService } from './control-book.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ControlBookDialogComponent } from './control-book-dialog.component';
import { AddControlToBookDialogComponent } from './add-control-to-book-dialog.component';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-control-book-detail',
  templateUrl: './control-book-detail.component.html',
  styleUrls: ['./control-book-detail.component.scss'],
})
export class ControlBookDetailComponent implements OnInit {
  bookId: number;
  book: any = null;
  loading = true;
  controls: any[] = [];

  controlColumns: TableColumn[] = [
    { field: 'name', header: 'Control Name', sortable: true, ellipsis: true },
    { field: 'description', header: 'Description', sortable: true, ellipsis: true },
    { field: 'controlTypeName', header: 'Type', sortable: true, width: '120px',
      type: 'tag', tagColors: { Automated: 'green', Manual: 'gold', Standard: 'blue' } },
    { field: 'isActive', header: 'Active', type: 'boolean', width: '80px' },
    {
      field: '_actions', header: '', type: 'actions', width: '80px', fixed: 'right',
      actions: [
        { icon: 'eye', tooltip: 'View Control', command: (row: any) => this.viewControl(row) },
        { icon: 'delete', tooltip: 'Remove from Book', danger: true, command: (row: any) => this.removeControl(row) },
      ],
    },
  ];

  controlActions: TableAction[] = [
    { label: 'Add Control', icon: 'plus', type: 'primary', command: () => this.addControl() },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nzModal: NzModalService,
    private bookService: ControlBookService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.bookId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadBook();
  }

  loadBook(): void {
    this.loading = true;
    this.bookService.getById(this.bookId).subscribe({
      next: (resp) => {
        this.book = resp.data;
        this.loading = false;
        this.loadControls();
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Failed to load control book');
      },
    });
  }

  loadControls(): void {
    this.bookService.getControls(this.bookId).subscribe({
      next: (resp) => {
        this.controls = resp.data || [];
      },
      error: () => {
        this.controls = [];
      },
    });
  }

  navigateBack(): void {
    this.router.navigate(['/icm/control-books']);
  }

  editBook(): void {
    this.nzModal.create({
      nzTitle: 'Edit Control Book',
      nzContent: ControlBookDialogComponent,
      nzWidth: '500px',
      nzClassName: 'updated-modal',
      nzData: { action: 'edit', book: this.book },
      nzFooter: null,
    }).afterClose.subscribe((result) => {
      if (result) this.loadBook();
    });
  }

  deleteBook(): void {
    this.confirmDialog.confirm({ title: 'Delete Book', message: `Delete "${this.book?.name}"?` }).subscribe(confirmed => {
      if (!confirmed) return;
      this.bookService.delete(this.bookId).subscribe({
        next: (resp) => {
          this.notificationService.show(resp);
          this.navigateBack();
        },
        error: (err) => this.notificationService.handleHttpError(err),
      });
    });
  }

  toggleActive(): void {
    const obs = this.book.isActive
      ? this.bookService.deactivate(this.bookId)
      : this.bookService.activate(this.bookId);

    obs.subscribe({
      next: (resp) => {
        this.notificationService.show(resp);
        this.loadBook();
      },
      error: (err) => this.notificationService.handleHttpError(err),
    });
  }

  addControl(): void {
    this.nzModal.create({
      nzTitle: 'Add Controls to Book',
      nzContent: AddControlToBookDialogComponent,
      nzWidth: '700px',
      nzClassName: 'updated-modal',
      nzData: { bookId: this.bookId, existingControlIds: this.controls.map(c => c.id) },
      nzFooter: null,
    }).afterClose.subscribe((result) => {
      if (result) {
        this.loadControls();
        this.loadBook();
      }
    });
  }

  viewControl(data: any): void {
    this.router.navigate([`/icm/controls/${data.id}`]);
  }

  removeControl(data: any): void {
    this.confirmDialog.confirm({
      title: 'Remove Control',
      message: `Remove "${data.name}" from this book?`,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.bookService.removeControl(this.bookId, data.id).subscribe({
        next: (resp) => {
          this.notificationService.show(resp);
          this.loadControls();
          this.loadBook();
        },
        error: (err) => this.notificationService.handleHttpError(err),
      });
    });
  }

  getControlTypeName(type: number): string {
    switch (type) {
      case 1: return 'Automated';
      case 2: return 'Manual';
      case 3: return 'Standard';
      default: return 'Mixed';
    }
  }
}
