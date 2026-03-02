import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CentralUsersService } from '../../../central-users.service';
import { TableColumn, TableQueryParams } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    standalone: false,
    selector: 'app-jobs-details',
    templateUrl: './jobs-details.component.html'
})
export class JobsDetailsComponent implements OnInit {
    columns: TableColumn[] = [
        { field: 'system', header: 'System' },
        { field: 'bname', header: 'User ID' },
        { field: 'userName', header: 'Name' },
        { field: 'group', header: 'Group' },
        { field: 'type', header: 'Type' },
        { field: 'assignedTypeDesc', header: 'Assigned' },
        { field: 'sapLicenseCa', header: 'SAP-LIC-CA' },
        { field: 'marcLicenseCa', header: 'As Per MARC' },
        { field: 'unassigned', header: 'Unassigned', type: 'boolean' },
        { field: 'lastLogin', header: 'Inactive', type: 'boolean' },
        { field: 'expired', header: 'Expired', type: 'boolean' },
        { field: 'excludeUserType', header: 'User Type', type: 'boolean' },
        { field: 'noRoles', header: 'No Roles', type: 'boolean' },
        { field: 'authValidation', header: 'Auth Validation', type: 'boolean' },
    ];
    data: any[] = [];
    total = 0;
    loading = false;

    constructor(
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        public modal: NzModalRef,
        private centralUsersService: CentralUsersService
    ) {}

    ngOnInit(): void {
        this.loadData({ page: 1, size: 20, sortField: '', sortDirection: 'ASC', filters: [], globalFilter: '' });
    }

    loadData(request: any): void {
        this.loading = true;
        this.centralUsersService.getJobResults(request, this.dialogData.data.id).subscribe({
            next: (resp: any) => {
                this.data = resp.data?.rows || [];
                this.total = resp.data?.records || 0;
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    onQueryParamsChange(params: TableQueryParams): void {
        this.loadData({
            page: params.pageIndex,
            size: params.pageSize,
            sortField: params.sort?.field || '',
            sortDirection: params.sort?.direction === 'descend' ? 'DESC' : 'ASC',
            filters: [],
            globalFilter: params.globalSearch || ''
        });
    }
}
