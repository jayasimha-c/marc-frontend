import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ControlSchedulerService } from './control-scheduler.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-add-book-to-scheduler-dialog',
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzCheckboxModule, NzButtonModule, NzIconModule,
    NzSpinModule, NzEmptyModule, NzTagModule, NzModalModule,
  ],
  template: `
    <p style="color: rgba(0,0,0,0.45); margin-bottom: 16px;">
      Select control books to add to this scheduler. Books already assigned are not shown.
    </p>

    <nz-spin [nzSpinning]="loading">
      <nz-table #bookTable
        [nzData]="books"
        [nzShowPagination]="books.length > 10"
        [nzPageSize]="10"
        nzSize="small"
        [nzScroll]="{ y: '350px' }">
        <thead>
          <tr>
            <th nzWidth="50px"
              [(nzChecked)]="allChecked"
              [nzIndeterminate]="indeterminate"
              (nzCheckedChange)="onAllChecked($event)"></th>
            <th>Book Name</th>
            <th nzWidth="100px">Controls</th>
            <th nzWidth="80px">Active</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let book of bookTable.data">
            <td [nzChecked]="selectedIds.has(book.id)" (nzCheckedChange)="onItemChecked(book.id, $event)"></td>
            <td>{{ book.name }}</td>
            <td style="text-align: right;">{{ book.controlCount || 0 }}</td>
            <td>
              <nz-tag [nzColor]="book.isActive ? 'green' : 'default'">
                {{ book.isActive ? 'Yes' : 'No' }}
              </nz-tag>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-spin>

    <div *ngIf="selectedIds.size > 0" style="margin-top: 8px; font-size: 13px; color: rgba(0,0,0,0.65);">
      <span nz-icon nzType="check-circle" nzTheme="outline" style="color: #1890ff; margin-right: 4px;"></span>
      {{ selectedIds.size }} book(s) selected
    </div>

    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()" [disabled]="saving">Cancel</button>
      <button nz-button nzType="primary" (click)="addSelected()" [nzLoading]="saving"
        [disabled]="saving || selectedIds.size === 0">
        Add Selected ({{ selectedIds.size }})
      </button>
    </div>
  `,
})
export class AddBookToSchedulerDialogComponent implements OnInit {
  loading = true;
  saving = false;
  schedulerId!: number;
  existingBookIds: number[] = [];
  books: any[] = [];

  selectedIds = new Set<number>();
  allChecked = false;
  indeterminate = false;

  constructor(
    public modal: NzModalRef,
    private http: HttpClient,
    private schedulerService: ControlSchedulerService,
    private notificationService: NotificationService,
    @Inject(NZ_MODAL_DATA) public data: any,
  ) {
    this.schedulerId = data.schedulerId;
    this.existingBookIds = data.existingBookIds || [];
  }

  ngOnInit(): void {
    this.loadBooks();
  }

  private loadBooks(): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/icm/controlbook/active`).subscribe({
      next: resp => {
        this.books = (resp.data || []).filter((b: any) => !this.existingBookIds.includes(b.id));
        this.loading = false;
      },
      error: () => {
        this.books = [];
        this.loading = false;
        this.notificationService.error('Failed to load control books');
      },
    });
  }

  onAllChecked(checked: boolean): void {
    this.books.forEach(b => checked ? this.selectedIds.add(b.id) : this.selectedIds.delete(b.id));
    this.refreshCheckStatus();
  }

  onItemChecked(id: number, checked: boolean): void {
    checked ? this.selectedIds.add(id) : this.selectedIds.delete(id);
    this.refreshCheckStatus();
  }

  private refreshCheckStatus(): void {
    this.allChecked = this.books.length > 0 && this.books.every(b => this.selectedIds.has(b.id));
    this.indeterminate = this.books.some(b => this.selectedIds.has(b.id)) && !this.allChecked;
  }

  addSelected(): void {
    if (this.selectedIds.size === 0) return;
    this.saving = true;
    const ids = Array.from(this.selectedIds);
    let completed = 0;
    let errors = 0;

    ids.forEach(bookId => {
      this.schedulerService.addControlBook(this.schedulerId, bookId).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length) this.finish(ids.length, errors);
        },
        error: () => {
          completed++;
          errors++;
          if (completed === ids.length) this.finish(ids.length, errors);
        },
      });
    });
  }

  private finish(total: number, errors: number): void {
    this.saving = false;
    if (errors === 0) {
      this.notificationService.success(`Added ${total} book(s) to scheduler`);
    } else if (errors === total) {
      this.notificationService.error('Failed to add books');
      return;
    } else {
      this.notificationService.warn(`Added ${total - errors} book(s), ${errors} failed`);
    }
    this.modal.close(true);
  }
}
