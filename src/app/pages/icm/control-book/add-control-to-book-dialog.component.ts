import { Component, Inject, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { FormsModule } from '@angular/forms';
import { ControlBookService } from './control-book.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzModalModule, NzButtonModule, NzTableModule, NzCheckboxModule, NzSpinModule, NzIconModule, NzEmptyModule,
  ],
  selector: 'app-add-control-to-book-dialog',
  template: `
    <p style="color: rgba(0,0,0,0.45); margin-bottom: 12px;">
      Select controls to add to this book. Controls already in the book are not shown.
    </p>

    <nz-spin [nzSpinning]="loading">
      <nz-table #controlTable
                [nzData]="availableControls"
                [nzFrontPagination]="true"
                [nzPageSize]="10"
                nzSize="small"
                [nzShowTotal]="totalTpl"
                nzShowSizeChanger>
        <thead>
          <tr>
            <th nzWidth="40px"
                [(nzChecked)]="allChecked"
                [nzIndeterminate]="indeterminate"
                (nzCheckedChange)="onAllChecked($event)"></th>
            <th>Control Name</th>
            <th>Type</th>
            <th>Business Process</th>
            <th nzWidth="80px">Active</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of controlTable.data">
            <td [nzChecked]="selectedIds.has(row.id)" (nzCheckedChange)="onItemChecked(row.id, $event)"></td>
            <td>{{ row.name }}</td>
            <td>{{ row.controlTypeName }}</td>
            <td>{{ row.bpName }}</td>
            <td>
              <span nz-icon [nzType]="row.active ? 'check-circle' : 'close-circle'" nzTheme="fill"
                    [style.color]="row.active ? '#52c41a' : '#ff4d4f'"></span>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-spin>
    <ng-template #totalTpl let-total>Total {{ total }} items</ng-template>

    <div *ngIf="selectedIds.size > 0" style="margin-top: 8px; font-size: 13px; color: rgba(0,0,0,0.45);">
      <span nz-icon nzType="check-circle" nzTheme="outline" style="color: #1890ff; margin-right: 4px;"></span>
      {{ selectedIds.size }} control(s) selected
    </div>

    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()" [disabled]="saving">Cancel</button>
      <button nz-button nzType="primary"
              [disabled]="selectedIds.size === 0 || saving"
              [nzLoading]="saving"
              (click)="addSelected()">
        Add Selected ({{ selectedIds.size }})
      </button>
    </div>
  `,
})
export class AddControlToBookDialogComponent implements OnInit {
  bookId: number;
  existingControlIds: number[] = [];
  availableControls: any[] = [];
  loading = true;
  saving = false;

  selectedIds = new Set<number>();
  allChecked = false;
  indeterminate = false;

  constructor(
    @Optional() public modal: NzModalRef,
    @Optional() @Inject(NZ_MODAL_DATA) public data: any,
    private bookService: ControlBookService,
    private notificationService: NotificationService,
  ) {
    this.bookId = data?.bookId;
    this.existingControlIds = data?.existingControlIds || [];
  }

  ngOnInit(): void {
    this.loading = true;
    this.bookService.getAllControls().subscribe({
      next: (resp) => {
        const all = resp.data?.rows || resp.data || [];
        this.availableControls = all.filter((c: any) => !this.existingControlIds.includes(c.id));
        this.loading = false;
      },
      error: () => {
        this.availableControls = [];
        this.loading = false;
        this.notificationService.error('Failed to load controls');
      },
    });
  }

  onItemChecked(id: number, checked: boolean): void {
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
    this.refreshCheckState();
  }

  onAllChecked(checked: boolean): void {
    this.availableControls.forEach(c => {
      if (checked) this.selectedIds.add(c.id);
      else this.selectedIds.delete(c.id);
    });
    this.refreshCheckState();
  }

  private refreshCheckState(): void {
    const all = this.availableControls.length > 0 && this.availableControls.every(c => this.selectedIds.has(c.id));
    const some = this.availableControls.some(c => this.selectedIds.has(c.id));
    this.allChecked = all;
    this.indeterminate = some && !all;
  }

  addSelected(): void {
    if (this.selectedIds.size === 0) return;
    this.saving = true;
    let completed = 0, failed = 0;
    const total = this.selectedIds.size;

    this.selectedIds.forEach(controlId => {
      this.bookService.addControl(this.bookId, controlId).subscribe({
        next: () => { completed++; this.checkDone(completed, failed, total); },
        error: () => { failed++; this.checkDone(completed, failed, total); },
      });
    });
  }

  private checkDone(completed: number, failed: number, total: number): void {
    if (completed + failed < total) return;
    this.saving = false;
    if (failed === 0) {
      this.notificationService.success(`${completed} control(s) added to book`);
      this.modal.close(true);
    } else if (completed > 0) {
      this.notificationService.warn(`${completed} added, ${failed} failed`);
      this.modal.close(true);
    } else {
      this.notificationService.error('Failed to add controls to book');
    }
  }
}
