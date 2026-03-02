import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CssMonitoringService } from '../../css-monitoring.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-run-now-dialog',
  templateUrl: './run-now-dialog.component.html',
})
export class RunNowDialogComponent implements OnInit {
  systems: any[] = [];
  selectedSystemId: number | null = null;
  loading = false;
  submitting = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public data: { ruleBook: any },
    public modal: NzModalRef,
    private cssMonitoringService: CssMonitoringService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadSystems();
  }

  loadSystems(): void {
    this.loading = true;
    this.cssMonitoringService.getSystemList(this.data.ruleBook.ruleType).subscribe({
      next: (resp) => {
        this.systems = resp.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Failed to load systems');
      },
    });
  }

  onRun(): void {
    if (!this.selectedSystemId) {
      this.notificationService.error('Please select a system');
      return;
    }
    this.submitting = true;
    this.cssMonitoringService.runRuleBookNow(this.data.ruleBook.id, this.selectedSystemId).subscribe({
      next: (resp) => {
        this.submitting = false;
        if (resp.success) {
          this.notificationService.success(resp.message || 'Scan started successfully');
          this.modal.close(true);
        } else {
          this.notificationService.error(resp.message || 'Failed to start scan');
        }
      },
      error: () => {
        this.submitting = false;
        this.notificationService.error('Failed to start scan');
      },
    });
  }
}
