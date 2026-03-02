import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { SetupService } from '../../../setup.service';
import { TableColumn } from '../../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    selector: 'app-view-transaction-logs',
    templateUrl: './view-transaction-logs.component.html',
    standalone: false
})
export class ViewTransactionLogsComponent implements OnInit {

    data: any[] = [];
    columns: TableColumn[] = [];
    loading = false;
    totalRecords = 0;
    pageSize = 10;
    pageIndex = 1;

    constructor(
        private setupService: SetupService,
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        public modal: NzModalRef
    ) { }

    ngOnInit(): void {
        this.initTable();
        this.loadData();
    }

    initTable(): void {
        this.columns = [
            { field: 'startDate', header: 'Start Date', type: 'date' },
            { field: 'endDate', header: 'End Date', type: 'date' },
            { field: 'entryId', header: 'Transaction' },
            { field: 'txnType', header: 'Type' },
            { field: 'description', header: 'Description' }
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

        const sapId = this.dialogData?.sapId;
        const jobId = this.dialogData?.id;

        this.setupService.getScheduleLogs(payload, sapId, jobId).subscribe({
            next: (res: any) => {
                if (res && res.data) {
                    this.data = res.data.content || [];
                    this.totalRecords = res.data.totalElements || 0;
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
        this.pageIndex = 1;
        this.loadData();
    }
}
