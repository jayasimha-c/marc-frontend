import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CssMonitoringService } from '../../css-monitoring.service';

export interface JobLog {
  id: number;
  level: string;
  origin: string;
  message: string;
  createdAt: string;
}

@Component({
  standalone: false,
  selector: 'app-job-logs-dialog',
  templateUrl: './job-logs-dialog.component.html',
  styleUrls: ['./job-logs-dialog.component.scss'],
})
export class JobLogsDialogComponent implements OnInit {
  logs: JobLog[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    @Inject(NZ_MODAL_DATA) public data: { job: any },
    public modal: NzModalRef,
    private cssMonitoringService: CssMonitoringService,
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.error = null;
    this.cssMonitoringService.getJobLogs(this.data.job.id).subscribe({
      next: (resp) => {
        this.logs = resp.data || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load job logs';
        this.loading = false;
      },
    });
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'ERROR': return 'red';
      case 'WARNING': return 'orange';
      case 'DEBUG': return 'default';
      default: return 'blue';
    }
  }

  getLevelClass(level: string): string {
    switch (level) {
      case 'ERROR': return 'log-error';
      case 'WARNING': return 'log-warning';
      case 'DEBUG': return 'log-debug';
      default: return 'log-info';
    }
  }
}
