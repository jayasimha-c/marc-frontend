import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { IcmControlService } from '../../icm-control.service';
import { formatControlJournalStatus } from '../../utils/status-utils';

@Component({
  standalone: false,
  selector: 'app-monitoring-journal-view',
  templateUrl: './monitoring-journal-view.component.html',
})
export class MonitoringJournalViewComponent implements OnInit {
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  journalId: number;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modalRef: NzModalRef,
    private icmService: IcmControlService,
  ) {
    this.journalId = this.dialogData?.data?.id;
  }

  ngOnInit(): void {
    this.loadJournalLog();
  }

  loadJournalLog(): void {
    if (!this.journalId) return;
    this.loading = true;
    this.icmService.getControlMonitoringJournalLog(this.journalId).subscribe({
      next: (res) => {
        this.data = (res.data?.rows || []).map((row: any) => ({
          ...row,
          statusLabel: formatControlJournalStatus(row.status),
        }));
        this.totalRecords = res.data?.records || this.data.length;
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.totalRecords = 0;
        this.loading = false;
      },
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'error';
      default: return 'default';
    }
  }
}
