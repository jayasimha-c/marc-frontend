import { Component, Inject, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { IcmControlService } from '../icm-control.service';

@Component({
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    NzFormModule, NzSelectModule, NzDatePickerModule, NzCheckboxModule, NzButtonModule, NzModalModule,
  ],
  selector: 'app-add-notification-dialog',
  template: `
    <form nz-form [formGroup]="form" nzLayout="vertical">
      <div nz-row [nzGutter]="16">
        <div nz-col nzSpan="12">
          <nz-form-item>
            <nz-form-label nzRequired>User</nz-form-label>
            <nz-form-control nzErrorTip="User is required">
              <nz-select formControlName="icmUser" nzPlaceHolder="Select user" nzShowSearch>
                <nz-option *ngFor="let u of userList" [nzValue]="u" [nzLabel]="u.username"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>
        <div nz-col nzSpan="12">
          <nz-form-item>
            <nz-form-label nzRequired>Role</nz-form-label>
            <nz-form-control nzErrorTip="Role is required">
              <nz-select formControlName="controlRoleId" nzPlaceHolder="Select role" nzShowSearch>
                <nz-option *ngFor="let r of roleList" [nzValue]="r" [nzLabel]="r.name"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>
      <div nz-row [nzGutter]="16">
        <div nz-col nzSpan="12">
          <nz-form-item>
            <nz-form-label nzRequired>Date From</nz-form-label>
            <nz-form-control nzErrorTip="Date From is required">
              <nz-date-picker formControlName="dateFrom" style="width: 100%;"></nz-date-picker>
            </nz-form-control>
          </nz-form-item>
        </div>
        <div nz-col nzSpan="12">
          <nz-form-item>
            <nz-form-label nzRequired>Date To</nz-form-label>
            <nz-form-control nzErrorTip="Date To is required">
              <nz-date-picker formControlName="dateTo" style="width: 100%;"></nz-date-picker>
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>
      <nz-form-item>
        <nz-form-control>
          <label nz-checkbox formControlName="isActive">Active</label>
        </nz-form-control>
      </nz-form-item>
    </form>
    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Cancel</button>
      <button nz-button nzType="primary" [disabled]="form.invalid" (click)="onSave()">Save</button>
    </div>
  `,
})
export class AddNotificationDialogComponent implements OnInit {
  form: FormGroup;
  userList: any[] = [];
  roleList = [
    { id: 1, name: 'OWNER' },
    { id: 2, name: 'EXECUTOR' },
  ];

  constructor(
    @Optional() public modal: NzModalRef,
    @Optional() @Inject(NZ_MODAL_DATA) public data: any,
    private fb: FormBuilder,
    private controlService: IcmControlService,
  ) {
    this.form = this.fb.group({
      icmUser: [null, [Validators.required]],
      controlRoleId: [null, [Validators.required]],
      dateFrom: [null, [Validators.required]],
      dateTo: [null, [Validators.required]],
      isActive: [false],
    });
  }

  ngOnInit(): void {
    this.controlService.getControlUserList().subscribe({
      next: (res) => this.userList = res.data?.rows || [],
      error: () => this.userList = [],
    });
  }

  onSave(): void {
    if (this.form.valid) {
      this.modal.close(this.form.value);
    }
  }
}
