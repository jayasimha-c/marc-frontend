import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzSwitchModule, NzModalModule],
  selector: 'app-master-data-edit-dialog',
  template: `
    <form nz-form [formGroup]="form" nzLayout="vertical">
      <nz-form-item>
        <nz-form-label nzRequired>Name</nz-form-label>
        <nz-form-control nzErrorTip="Name is required">
          <input nz-input formControlName="name" placeholder="Enter name" />
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Description</nz-form-label>
        <nz-form-control>
          <textarea nz-input formControlName="description" placeholder="Enter description"
                    [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
        </nz-form-control>
      </nz-form-item>
      <nz-form-item *ngIf="data?.hasActiveField">
        <nz-form-label>Active</nz-form-label>
        <nz-form-control>
          <nz-switch formControlName="isActive"></nz-switch>
        </nz-form-control>
      </nz-form-item>
    </form>
    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Cancel</button>
      <button nz-button nzType="primary" [disabled]="form.invalid" (click)="onSave()">Save</button>
    </div>
  `,
})
export class MasterDataEditDialogComponent {
  form: FormGroup;

  constructor(
    @Optional() public modal: NzModalRef,
    @Optional() @Inject(NZ_MODAL_DATA) public data: any,
    private fb: FormBuilder,
  ) {
    const item = data?.item;
    this.form = this.fb.group({
      name: [item?.name || '', [Validators.required]],
      description: [item?.description || ''],
      isActive: [item?.isActive ?? item?.active ?? true],
    });
  }

  onSave(): void {
    if (this.form.valid) {
      this.modal.close({
        ...this.data?.item,
        ...this.form.value,
      });
    }
  }
}
