import { Component, Input } from '@angular/core';

export type StatusType = 'success' | 'pending' | 'error' | 'warning' | 'info' | 'default';

@Component({
  standalone: false,
  selector: 'app-status-badge',
  template: `
    <span class="status-badge" [ngClass]="'status-badge--' + normalizedStatus">
      <span *ngIf="showIcon" nz-icon [nzType]="statusIcon" nzTheme="outline" class="status-badge__icon"></span>
      <span>{{ displayText }}</span>
    </span>
  `,
  styles: [`
    :host { display: inline-block; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-badge__icon { font-size: 14px; }
    .status-badge--success { color: #52c41a; }
    .status-badge--pending { color: #faad14; }
    .status-badge--warning { color: #faad14; }
    .status-badge--error { color: #ff4d4f; }
    .status-badge--info { color: #1890ff; }
    .status-badge--default { color: rgba(0, 0, 0, 0.45); }
  `]
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() showIcon = true;
  @Input() customText = '';

  private statusMappings: Record<string, StatusType> = {
    success: 'success', completed: 'success', approved: 'success',
    active: 'success', passed: 'success', done: 'success', closed: 'success',
    pending: 'pending', inprogress: 'pending', in_progress: 'pending',
    created: 'pending', waiting: 'pending', processing: 'pending', running: 'pending',
    warning: 'warning', partial: 'warning',
    error: 'error', rejected: 'error', failed: 'error',
    cancelled: 'error', expired: 'error',
    info: 'info', new: 'info', draft: 'info'
  };

  private iconMappings: Record<StatusType, string> = {
    success: 'check-circle', pending: 'clock-circle', warning: 'warning',
    error: 'close-circle', info: 'info-circle', default: 'minus-circle'
  };

  get normalizedStatus(): StatusType {
    const key = this.status?.toLowerCase().replace(/[\s-]/g, '_') || '';
    return this.statusMappings[key] || 'default';
  }

  get statusIcon(): string {
    return this.iconMappings[this.normalizedStatus];
  }

  get displayText(): string {
    if (this.customText) return this.customText;
    return this.status
      ? this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase()
      : '-';
  }
}
