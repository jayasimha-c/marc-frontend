import { Component, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-regenerate-secret-dialog',
  templateUrl: './regenerate-secret-dialog.component.html',
})
export class RegenerateSecretDialogComponent {
  constructor(
    public modal: NzModalRef,
    @Inject(NZ_MODAL_DATA) public data: { secret: string; clientName: string },
    private notificationService: NotificationService,
  ) {}

  copySecret(): void {
    if (this.data.secret) {
      navigator.clipboard.writeText(this.data.secret);
      this.notificationService.success('Secret copied to clipboard');
    }
  }
}
