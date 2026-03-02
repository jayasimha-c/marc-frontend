import { Component, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-whitelist-values-modal',
  templateUrl: './whitelist-values-modal.component.html',
})
export class WhitelistValuesModalComponent {
  constructor(
    @Inject(NZ_MODAL_DATA) public data: { values: string },
    private notificationService: NotificationService,
    public modal: NzModalRef
  ) {}

  getValuesCount(): number {
    if (!this.data?.values || this.data.values === 'No values available') return 0;
    return this.data.values.split('\n').filter((v) => v.trim().length > 0).length;
  }

  async copyToClipboard(): Promise<void> {
    if (this.data?.values) {
      try {
        await navigator.clipboard.writeText(this.data.values);
        this.notificationService.success('Values copied to clipboard');
      } catch {
        const textArea = document.createElement('textarea');
        textArea.value = this.data.values;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.notificationService.success('Values copied to clipboard');
      }
    }
  }
}
