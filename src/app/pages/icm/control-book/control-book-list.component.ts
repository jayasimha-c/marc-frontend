import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ControlBookService } from './control-book.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ControlBookDialogComponent } from './control-book-dialog.component';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-control-book-list',
  templateUrl: './control-book-list.component.html',
})
export class ControlBookListComponent implements OnInit {
  books: any[] = [];
  loading = false;

  columns: TableColumn[] = [
    { field: 'name', header: 'Book Name', sortable: true, ellipsis: true },
    { field: 'description', header: 'Description', sortable: true, ellipsis: true },
    { field: 'controlTypeName', header: 'Control Type', sortable: true, width: '130px',
      type: 'tag', tagColors: { Automated: 'green', Manual: 'gold', Standard: 'blue' } },
    { field: 'controlCount', header: 'Controls', sortable: true, width: '100px', align: 'center' },
    { field: 'schedulerCount', header: 'Schedulers', sortable: true, width: '110px', align: 'center' },
    { field: 'isActive', header: 'Active', type: 'boolean', width: '80px' },
    { field: 'created', header: 'Created', type: 'date', sortable: true, width: '130px' },
    {
      field: '_actions', header: '', type: 'actions', width: '80px', fixed: 'right',
      actions: [
        { icon: 'edit', tooltip: 'Manage', command: (row: any) => this.onView(row) },
        { icon: 'delete', tooltip: 'Delete', danger: true, command: (row: any) => this.onDelete(row) },
      ],
    },
  ];

  tableActions: TableAction[] = [
    { label: 'Add Book', icon: 'plus', type: 'primary', command: () => this.onAdd() },
  ];

  constructor(
    private router: Router,
    private nzModal: NzModalService,
    private bookService: ControlBookService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.bookService.getAll().subscribe({
      next: (resp) => {
        this.books = resp.data || [];
        this.loading = false;
      },
      error: () => {
        this.books = [];
        this.loading = false;
        this.notificationService.error('Failed to load control books');
      },
    });
  }

  onAdd(): void {
    this.nzModal.create({
      nzTitle: 'Create Control Book',
      nzContent: ControlBookDialogComponent,
      nzWidth: '500px',
      nzClassName: 'updated-modal',
      nzData: { action: 'create' },
      nzFooter: null,
    }).afterClose.subscribe((result) => {
      if (result?.id) {
        this.router.navigate([`/icm/control-books/${result.id}`]);
      } else if (result) {
        this.loadData();
      }
    });
  }

  onView(data: any): void {
    this.router.navigate([`/icm/control-books/${data.id}`]);
  }

  onDelete(data: any): void {
    this.confirmDialog.confirm({ title: 'Delete Book', message: `Delete "${data.name}"?` }).subscribe(confirmed => {
      if (!confirmed) return;
      this.bookService.delete(data.id).subscribe({
        next: (resp) => {
          this.notificationService.show(resp);
          this.loadData();
        },
        error: (err) => this.notificationService.handleHttpError(err),
      });
    });
  }
}
