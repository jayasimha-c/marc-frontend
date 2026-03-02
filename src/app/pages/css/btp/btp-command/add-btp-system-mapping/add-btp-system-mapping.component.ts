import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ApiResponse } from '../../../../../core/models/api-response';
import { BtpService } from '../../btp.service';

@Component({
  standalone: false,
  selector: 'app-add-btp-system-mapping',
  templateUrl: './add-btp-system-mapping.component.html',
})
export class AddBtpSystemMappingComponent {
  btpSystems: any[] = [];
  commandId: number;
  form: FormGroup;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private fb: FormBuilder,
    public modal: NzModalRef,
    private btpService: BtpService,
    private notificationService: NotificationService
  ) {
    this.btpSystems = this.dialogData?.btpSystems || [];
    this.commandId = this.dialogData?.commandId;
    this.form = this.fb.group({
      btpSystem: [null, [Validators.required]],
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    const payload = [{ btpSystemId: this.form.get('btpSystem')!.value }];
    this.btpService.saveCommandsMapping(this.commandId, payload).subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success) {
          this.notificationService.show(resp);
          this.modal.close();
        }
      },
      error: ({ error }) => this.notificationService.error(error?.message || 'Save failed'),
    });
  }
}
