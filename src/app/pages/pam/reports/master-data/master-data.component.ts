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

    public showStaticData: boolean = true;

    constructor(private reportsService: PAMReportsService) { }

    ngOnInit(): void {
        const lsVar = localStorage.getItem("USE_STATIC_DATA");
        this.showStaticData = lsVar !== null ? lsVar === "true" : true;

        this.loadMasterData();
    }

    loadMasterData(): void {
        this.loading = true;

        // Utilize local mock structure identical to the generic pivotPrivilegeData structure
        if (this.showStaticData) {
            setTimeout(() => {
                const mockData = [
                    { "System": "SAP PRD", "Role": "Administrator", "Privilege": "User Management", "Status": "Active", "Assigned Users": 45 },
                    { "System": "Oracle HR", "Role": "HR Generalist", "Privilege": "Edit Employee Data", "Status": "Active", "Assigned Users": 12 },
                    { "System": "Active Directory", "Role": "Helpdesk L1", "Privilege": "Password Reset", "Status": "Active", "Assigned Users": 89 },
                    { "System": "Salesforce", "Role": "Sales Manager", "Privilege": "View Pipeline", "Status": "Inactive", "Assigned Users": 23 },
                    { "System": "AWS", "Role": "DevOps Engineer", "Privilege": "EC2 Full Access", "Status": "Active", "Assigned Users": 8 },
                    { "System": "Azure", "Role": "Cloud Admin", "Privilege": "Resource Group Admin", "Status": "Active", "Assigned Users": 5 },
                    { "System": "SAP PRD", "Role": "Finance Manager", "Privilege": "Run Payroll", "Status": "Active", "Assigned Users": 4 },
                    { "System": "ServiceNow", "Role": "ITIL User", "Privilege": "Create Incident", "Status": "Active", "Assigned Users": 150 }
                ];

                this.buildDynamicColumns(mockData);
                this.tableData = mockData;
                this.totalRecord = mockData.length;
                this.loading = false;
            }, 500);
            return;
        }

        // Call actual backend endpoint
        this.reportsService.pivotPrivilegeData().subscribe((resp: any) => {
            if (resp.success && resp.data && resp.data.length > 0) {
                this.buildDynamicColumns(resp.data);
                this.tableData = resp.data;
                this.totalRecord = resp.data.length;
            } else {
                this.tableData = [];
                this.totalRecord = 0;
            }
            this.loading = false;
        });
    }

    private buildDynamicColumns(data: any[]): void {
        if (!data || data.length === 0) {
            this.tableColumns = [];
            return;
        }

        // Extract raw keys from the first record
        const firstRecord = data[0];
        const keys = Object.keys(firstRecord);

        // Map dynamic object keys into standard TableColumn definitions 
        this.tableColumns = keys.map(key => {
            let columnType: 'text' | 'date' | 'status' | 'tag' | 'link' | 'html' | 'boolean' = 'text';

            // Apply basic visual heuristics targeting typical DB column patterns
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
        // Remove underscores if they exist
        value = value.replace(/_/g, ' ');
        return value;
    }

    onTableChange(event: TableQueryParams) {
        // No serverside pagination was present in the pivot configuration.
        // Advanced table handles client side parsing for us automatically when simple data arrays drop in.
    }

    refreshData(): void {
        this.loadMasterData();
    }
}
