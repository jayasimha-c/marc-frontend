import { Component, OnInit } from '@angular/core';
import { PAMReportsService } from '../reports.service';
import { TableColumn, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    standalone: false,
    selector: 'app-master-data',
    templateUrl: './master-data.component.html',
    styleUrls: ['./master-data.component.css']
})
export class MasterDataComponent implements OnInit {

    public tableData: any[] = [];
    public tableColumns: TableColumn[] = [];
    public loading: boolean = true;
    public totalRecord: number = 0;

    constructor(private reportsService: PAMReportsService) { }

    ngOnInit(): void {
        this.loadMasterData();
    }

    loadMasterData(): void {
        this.loading = true;
        this.reportsService.pivotPrivilegeData().subscribe({
            next: (resp: any) => {
                if (resp.success && resp.data && resp.data.length > 0) {
                    this.buildDynamicColumns(resp.data);
                    this.tableData = resp.data;
                    this.totalRecord = resp.data.length;
                } else {
                    this.tableData = [];
                    this.tableColumns = [];
                    this.totalRecord = 0;
                }
                this.loading = false;
            },
            error: () => {
                this.tableData = [];
                this.tableColumns = [];
                this.totalRecord = 0;
                this.loading = false;
            },
        });
    }

    private buildDynamicColumns(data: any[]): void {
        if (!data || data.length === 0) {
            this.tableColumns = [];
            return;
        }

        const firstRecord = data[0];
        const keys = Object.keys(firstRecord);

        this.tableColumns = keys.map(key => {
            let columnType: 'text' | 'date' | 'status' | 'tag' | 'link' | 'html' | 'boolean' = 'text';

            if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
                columnType = 'date';
            } else if (key.toLowerCase() === 'status') {
                columnType = 'status';
            }

            return {
                header: this.camelCaseToTitleCase(key),
                field: key,
                type: columnType
            };
        });
    }

    private camelCaseToTitleCase(str: string): string {
        let value = str.replace(/([a-z])([A-Z])/g, '$1 $2');
        value = value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        value = value.replace(/_/g, ' ');
        return value;
    }

    onTableChange(event: TableQueryParams) {
    }

    refreshData(): void {
        this.loadMasterData();
    }
}
