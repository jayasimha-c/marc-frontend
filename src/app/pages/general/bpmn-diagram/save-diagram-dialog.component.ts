import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzModalModule],
  selector: 'app-save-diagram-dialog',
  template: `
    <form nz-form [formGroup]="form" nzLayout="vertical">
      <nz-form-item>
        <nz-form-label nzRequired>Name</nz-form-label>
        <nz-form-control nzErrorTip="Name is required">
          <input nz-input formControlName="name" placeholder="Diagram name" />
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Description</nz-form-label>
        <nz-form-control>
          <textarea nz-input formControlName="description" placeholder="Optional description" [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
        </nz-form-control>
      </nz-form-item>
    </form>
    <div class="dialog-footer">
      <button nz-button nzType="default" (click)="modal.close()">Cancel</button>
      <button nz-button nzType="primary" [disabled]="form.invalid" (click)="onSave()">Save</button>
    </div>
  `,
  styles: [`
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }
  `],
})
export class SaveDiagramDialogComponent {
  form: FormGroup;

  constructor(
    @Optional() public modal: NzModalRef,
    @Optional() @Inject(NZ_MODAL_DATA) public data: any,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      name: [data?.name || '', [Validators.required]],
      description: [data?.description || ''],
    });
  }

  onSave(): void {
    if (this.form.valid) {
      this.modal.close(this.form.value);
    }
  }
}
