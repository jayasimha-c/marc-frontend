import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CamService } from '../../../cam.service';
import { ApiResponse } from '../../../../../core/models/api-response';

@Component({
  standalone: false,
  selector: 'app-view-job-config',
  templateUrl: './view-job-config.component.html',
})
export class ViewJobConfigComponent {
  form!: FormGroup;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modal: NzModalRef,
    private fb: FormBuilder,
    private camService: CamService,
  ) {
    this.form = this.fb.group({
      includeExpiredAccounts: ['', [Validators.required]],
      lockedAccounts: ['', [Validators.required]],
      ignoreUsersWithoutRoles: ['', [Validators.required]],
      userType: ['', [Validators.required]],
      transactionHistory: ['', [Validators.required]],
    });
    this.camService.getJobConfig(dialogData.id).subscribe((resp: ApiResponse) => {
      this.form.patchValue({
        includeExpiredAccounts: resp.data?.includeExpiredAccounts,
        lockedAccounts: resp.data?.lockedAccounts,
        ignoreUsersWithoutRoles: resp.data?.ignoreUsersWithoutRoles,
        userType: resp.data?.userType?.includes(',') ? resp.data.userType.split(',') : resp.data?.userType,
        transactionHistory: resp.data?.transactionHistory,
      });
      this.form.disable();
    });
  }
}
