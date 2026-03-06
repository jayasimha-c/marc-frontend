import { Component, OnInit, inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RfcScheduler, RfcSchedulerJob, RfcSchedulerService } from './rfc-scheduler.service';

@Component({
  standalone: false,
  selector: 'app-rfc-scheduler-jobs-modal',
  template: `
    <nz-spin [nzSpinning]="loading">
      <nz-list *ngIf="jobs.length > 0" nzSize="small">
        <nz-list-item *ngFor="let job of jobs">
          <nz-list-item-meta>
            <nz-list-item-meta-title>
              {{ job.profileName }}
              <nz-tag [nzColor]="getStatusColor(job.status)" style="margin-left: 8px">{{ job.status }}</nz-tag>
            </nz-list-item-meta-title>
            <nz-list-item-meta-description>
              System: {{ job.sapSystemName }} &middot; Started: {{ formatDate(job.startedOn) }}
              <span *ngIf="job.durationMs"> &middot; Duration: {{ formatDuration(job.durationMs) }}</span>
            </nz-list-item-meta-description>
          </nz-list-item-meta>
          <ul nz-list-item-actions>
            <nz-list-item-action *ngIf="job.status === 'COMPLETED'">
              <span style="font-size: 12px; color: #8c8c8c">
                Found: {{ job.connectionsFound }} |
                New: {{ job.newConnections }} |
                Updated: {{ job.updatedConnections }} |
                Deactivated: {{ job.deactivatedConnections }} |
                Findings: {{ job.findingsCreated }}
              </span>
            </nz-list-item-action>
          </ul>
          <div *ngIf="job.status === 'FAILED' && job.completionMessage"
            style="color: #ff4d4f; font-size: 12px; margin-top: 4px; background: #fff2f0; padding: 4px 8px; border-radius: 4px">
            {{ job.completionMessage }}
          </div>
          <div style="font-size: 11px; color: #bfbfbf; margin-top: 2px">Run by: {{ job.runBy }}</div>
        </nz-list-item>
      </nz-list>
      <nz-empty *ngIf="!loading && jobs.length === 0" nzNotFoundContent="No jobs found"></nz-empty>
    </nz-spin>
    <div style="text-align: right; margin-top: 16px">
      <button nz-button (click)="close()">Close</button>
    </div>
  `,
})
export class RfcSchedulerJobsModalComponent implements OnInit {
  readonly modalData: { scheduler: RfcScheduler | null } = inject(NZ_MODAL_DATA);

  jobs: RfcSchedulerJob[] = [];
  loading = true;

  constructor(
    private modalRef: NzModalRef,
    private rfcSchedulerService: RfcSchedulerService,
  ) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading = true;
    const obs = this.modalData.scheduler
      ? this.rfcSchedulerService.getJobsByScheduler(this.modalData.scheduler.id!)
      : this.rfcSchedulerService.getRecentJobs();

    obs.subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success) this.jobs = resp.data || [];
      },
      error: () => { this.loading = false; },
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'FAILED': return 'red';
      case 'IN_PROGRESS': return 'blue';
      case 'SKIPPED': return 'orange';
      default: return 'default';
    }
  }

  formatDate(timestamp: number): string {
    if (!timestamp) return '--';
    return new Date(timestamp).toLocaleString();
  }

  formatDuration(ms: number): string {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const rem = seconds % 60;
    if (minutes < 60) return `${minutes}m ${rem}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  close(): void {
    this.modalRef.close();
  }
}
