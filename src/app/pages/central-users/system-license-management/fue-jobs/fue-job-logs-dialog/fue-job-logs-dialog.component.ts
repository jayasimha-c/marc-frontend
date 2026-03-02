import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CentralUsersService } from '../../../central-users.service';

export interface FueJobLog {
    id: number;
    stage: string;
    systemName: string;
    message: string;
    batchNumber: number;
    totalBatches: number;
    processedCount: number;
    totalCount: number;
    createdOn: string;
}

@Component({
    standalone: false,
    selector: 'app-fue-job-logs-dialog',
    templateUrl: './fue-job-logs-dialog.component.html'
})
export class FueJobLogsDialogComponent implements OnInit {
    logs: FueJobLog[] = [];
    loading = true;
    error: string | null = null;

    constructor(
        @Inject(NZ_MODAL_DATA) public data: { job: any },
        public modal: NzModalRef,
        private centralUsersService: CentralUsersService
    ) {}

    ngOnInit(): void {
        this.loadLogs();
    }

    loadLogs(): void {
        this.loading = true;
        this.error = null;
        this.centralUsersService.getFueJobLogs(this.data.job.id).subscribe({
            next: (resp: any) => {
                this.logs = resp.data || [];
                this.loading = false;
            },
            error: () => {
                this.error = 'Failed to load job logs';
                this.loading = false;
            }
        });
    }

    getStageColor(stage: string): string {
        switch (stage) {
            case 'ERROR': return 'red';
            case 'COMPLETED': return 'green';
            case 'PREPARATION': return 'purple';
            case 'ACM_SAP':
            case 'ACM_MARC': return 'blue';
            case 'CLASSIFY': return 'orange';
            case 'CONSOLIDATION': return 'cyan';
            default: return 'default';
        }
    }

    getProgressPercent(log: FueJobLog): number {
        if (!log.totalCount || log.totalCount === 0) return 0;
        return Math.round((log.processedCount / log.totalCount) * 100);
    }
}
