import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ControlBookService } from './control-book.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    NzFormModule, NzInputModule, NzSelectModule, NzSwitchModule, NzButtonModule, NzModalModule,
  ],
  selector: 'app-control-book-dialog',
  template: `
    <form nz-form [formGroup]="form" nzLayout="vertical">
      <nz-form-item>
        <nz-form-label nzRequired>Book Name</nz-form-label>
        <nz-form-control nzErrorTip="Book name is required">
          <input nz-input formControlName="name" placeholder="Enter book name" maxlength="255" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label>Description</nz-form-label>
        <nz-form-control>
          <textarea nz-input formControlName="description" placeholder="Enter description"
                    [nzAutosize]="{ minRows: 3, maxRows: 5 }" maxlength="500"></textarea>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label>Control Type Filter</nz-form-label>
        <nz-form-control nzExtra="Optionally restrict book to a specific control type">
          <nz-select formControlName="controlType" nzPlaceHolder="Mixed (Any Type)">
            <nz-option [nzValue]="null" nzLabel="Mixed (Any Type)"></nz-option>
            <nz-option [nzValue]="1" nzLabel="Automated"></nz-option>
            <nz-option [nzValue]="2" nzLabel="Manual"></nz-option>
            <nz-option [nzValue]="3" nzLabel="Standard"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-control>
          <label nz-checkbox formControlName="isActive">Active</label>
        </nz-form-control>
      </nz-form-item>
    </form>
    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Cancel</button>
      <button nz-button nzType="primary" (click)="save()" [nzLoading]="saving">{{ isEdit ? 'Update' : 'Create' }}</button>
    </div>
  `,
})
export class ControlBookDialogComponent {
  form: FormGroup;
  isEdit = false;
  bookId: number | null = null;
  saving = false;

  constructor(
    @Optional() public modal: NzModalRef,
    @Optional() @Inject(NZ_MODAL_DATA) public data: any,
    private fb: FormBuilder,
    private bookService: ControlBookService,
    private notificationService: NotificationService,
  ) {
    this.isEdit = data?.action === 'edit';
    this.form = this.fb.group({
      name: [data?.book?.name || '', [Validators.required, Validators.maxLength(255)]],
      description: [data?.book?.description || '', Validators.maxLength(500)],
      controlType: [data?.book?.controlType ?? null],
      isActive: [data?.book?.isActive ?? true],
    });
    if (this.isEdit) {
      this.bookId = data.book.id;
    }
  }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    const payload = this.form.value;
    this.saving = true;

    const obs = this.isEdit
      ? this.bookService.update(this.bookId!, payload)
      : this.bookService.create(payload);

    obs.subscribe({
      next: (resp) => {
        this.saving = false;
        this.notificationService.show(resp);
        this.modal.close(this.isEdit ? true : resp.data || true);
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.handleHttpError(err);
      },
    });
  }
}
