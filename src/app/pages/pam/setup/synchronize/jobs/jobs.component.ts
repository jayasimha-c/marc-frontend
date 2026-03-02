import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SetupService } from '../../setup.service';
import { TableColumn, TableAction } from '../../../../../shared/components/advanced-table/advanced-table.models';
import { StartJobComponent } from './start-job/start-job.component';
import { ViewTransactionLogsComponent } from './view-transaction-logs/view-transaction-logs.component';

@Component({
    selector: 'app-pam-jobs',
    templateUrl: './jobs.component.html',
    standalone: false
})
export class PamJobsComponent implements OnInit {

    @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
    @ViewChild('operationsTpl', { static: true }) operationsTpl!: TemplateRef<any>;

    sapSysList: any[] = [];
    data: any[] = [];
    loading = false;
    totalRecords = 0;
    pageSize = 10;
    pageIndex = 1;

    columns: TableColumn[] = [];
    tableActions: TableAction[] = [];

    constructor(
        private setupService: SetupService,
        private nzModal: NzModalService
    ) { }

    ngOnInit(): void {
        this.initTable();
        this.loadData();
    }

    initTable(): void {
        this.columns = [
            { field: 'sapName', header: 'System' },
            { field: 'plannedDate', header: 'Planned Date', type: 'date' },
            { field: 'startDate', header: 'Start Date', type: 'date' },
            { field: 'endDate', header: 'End Date', type: 'date' },
            { field: 'status', header: 'Status', type: 'template', templateRef: this.statusTpl },
            { field: 'count', header: 'Transaction Amount' },
            { field: 'operations', header: 'Operations', type: 'template', templateRef: this.operationsTpl }
        ];

        this.tableActions = [
            { label: 'Start Job', icon: 'caret-right', type: 'primary', command: () => this.startJobModal() }
        ];
    }

    loadData(): void {
        this.loading = true;
        const payload = {
            first: (this.pageIndex - 1) * this.pageSize,
            rows: this.pageSize,
            sortField: '',
            sortOrder: 1,
            filters: {}
        };

        this.setupService.getScheduleJobs(payload).subscribe({
            next: (res: any) => {
                if (res && res.data) {
                    this.sapSysList = res.data.saps || [];
                    this.data = res.data.jobs?.content || [];
                    this.totalRecords = res.data.jobs?.totalElements || 0;
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    onPageIndexChange(index: number): void {
        this.pageIndex = index;
        this.loadData();
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.pageIndex = 1; // Reset to first page
        this.loadData();
    }

    startJobModal(): void {
        this.nzModal.create({
            nzTitle: 'Start Job',
            nzContent: StartJobComponent,
            nzWidth: '500px',
            nzFooter: null,
            nzData: { sapSys: this.sapSysList }
        }).afterClose.subscribe(() => {
            this.loadData();
        });
    }

    openDetail(row: any): void {
        this.nzModal.create({
            nzTitle: 'Transaction Log',
            nzContent: ViewTransactionLogsComponent,
            nzWidth: '900px',
            nzFooter: null,
            nzData: row
        });
    }
}
