import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { ApiResponse } from '../../../../../core/models/api-response';
import { CamService } from '../../../cam.service';
import { forkJoin } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-add-user-restrictions',
  templateUrl: './add-user-restrictions.component.html',
})
export class AddUserRestrictionsComponent {
  sapSysList: any[] = [];
  form: FormGroup;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private fb: FormBuilder,
    private modalRef: NzModalRef,
    private camService: CamService
  ) {
    this.sapSysList = this.dialogData || [];
    this.form = this.fb.group({
      userIds: ['', [Validators.required]],
      sapSystem: ['', [Validators.required]],
    });
  }

  save(): void {
    Object.values(this.form.controls).forEach((control) => {
      control.markAsDirty();
      control.updateValueAndValidity();
    });

    if (this.form.valid) {
      const userIdsInput: string = this.form.get('userIds')!.value;
      const sapId = this.form.get('sapSystem')!.value;

      const userIds = userIdsInput
        .split(/[,;\s\n\r\t]+/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      if (userIds.length === 0) {
        return;
      }

      const saveRequests = userIds.map((userId) =>
        this.camService.saveUserException({ userId, sapId })
      );

      forkJoin(saveRequests).subscribe((responses: ApiResponse[]) => {
        const successCount = responses.filter((r) => r.success).length;
        this.modalRef.close(`${successCount} user(s) added successfully`);
      });
    }
  }

  close(): void {
    this.modalRef.close();
  }
}
