import { Component, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ApiResponse } from '../../../../../core/models/api-response';
import { BtpService } from '../../btp.service';

@Component({
  standalone: false,
  selector: 'app-system-mapping-setting',
  templateUrl: './system-mapping-setting.component.html',
})
export class SystemMappingSettingComponent {
  data: any;
  cronExpression: string;
  cronDescription = '';

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modal: NzModalRef,
    private btpService: BtpService,
    private notificationService: NotificationService
  ) {
    this.data = this.dialogData?.data;
    this.cronExpression = this.data?.frequency || '*/30 * * * *';
    this.cronDescription = this.decodeCron(this.cronExpression);
  }

  onCronChange(): void {
    this.cronDescription = this.decodeCron(this.cronExpression);
  }

  save(): void {
    if (!this.cronExpression?.trim()) {
      this.notificationService.error('Cron expression is required');
      return;
    }
    const payload = { frequency: this.cronExpression, id: this.data?.id };
    this.btpService.saveFrequency(payload).subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success) {
          this.notificationService.show(resp);
          this.modal.close();
        }
      },
      error: ({ error }) => this.notificationService.error(error?.message || 'Save failed'),
    });
  }

  private decodeCron(cron: string): string {
    if (!cron || typeof cron !== 'string') return '';
    const parts = cron.trim().split(' ');
    if (parts.length < 5) return 'Invalid cron expression';

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    let desc = '';
    if (minute.startsWith('*/')) desc = `Every ${minute.replace('*/', '')} minutes`;
    else if (hour === '*' && minute !== '*') desc = `At minute ${minute} every hour`;
    else desc = `At ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

    if (dayOfWeek !== '*' && dayOfMonth === '*') {
      const idx = parseInt(dayOfWeek, 10);
      desc += `, every week on ${idx >= 0 && idx <= 6 ? daysOfWeek[idx] : dayOfWeek}`;
    } else if (dayOfMonth !== '*' && month !== '*') {
      const mi = parseInt(month, 10) - 1;
      desc += `, on day ${dayOfMonth} in ${mi >= 0 && mi < 12 ? months[mi] : month}`;
    } else if (dayOfMonth !== '*') {
      desc += `, on day ${dayOfMonth} every month`;
    } else if (month !== '*') {
      const mi = parseInt(month, 10) - 1;
      desc += `, in ${mi >= 0 && mi < 12 ? months[mi] : month}`;
    }
    return desc;
  }
}
