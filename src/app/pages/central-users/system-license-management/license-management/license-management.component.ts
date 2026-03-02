import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CentralUsersService } from '../../central-users.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ViewLicenseManagementComponent } from './view-license-management/view-license-management.component';
import { TableColumn, TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    standalone: false,
    selector: 'app-license-management',
    templateUrl: './license-management.component.html'
})
export class LicenseManagementComponent implements OnInit {
    // Summary table (top)
    summaryData: any[] = [];
    selectedSummary: any = null;
    summaryLoading = false;

    // Results table (bottom)
    resultColumns: TableColumn[] = [
        { field: 'system', header: 'System' },
        { field: 'userName', header: 'User ID' },
        { field: 'bname', header: 'Name' },
        { field: 'group', header: 'Group' },
        { field: 'assignedTypeDesc', header: 'Assigned' },
        { field: 'sapLicenseCa', header: 'SAP-LIC-CA' },
        { field: 'marcLicenseCa', header: 'As Per MARC' },
        { field: 'unassigned', header: 'Unassigned', type: 'boolean' },
        { field: 'lastLogin', header: 'IsActive', type: 'boolean' },
        { field: 'expired', header: 'Expired', type: 'boolean' },
        { field: 'excludeUserType', header: 'User Type', type: 'boolean' },
        { field: 'noRoles', header: 'No Roles', type: 'boolean' },
    ];
    resultData: any[] = [];
    resultTotal = 0;
    resultLoading = false;
    selectedResult: any = null;
    resultActions: TableAction[] = [
        { label: 'Change License Type', icon: 'swap', command: () => this.openModal('Change License Type') },
        { label: 'Transactions', icon: 'unordered-list', command: () => this.openModal('Transactions') },
    ];

    constructor(
        private nzModal: NzModalService,
        private centralUsersService: CentralUsersService,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.loadSummary();
    }

    loadSummary(): void {
        this.summaryLoading = true;
        this.centralUsersService.getLicMgmtData().subscribe({
            next: (resp: any) => {
                this.summaryData = resp.data?.rows || [];
                this.summaryLoading = false;
            },
            error: () => { this.summaryLoading = false; }
        });
    }

    onSummaryRowClick(row: any): void {
        this.selectedSummary = row;
        this.loadResults({ page: 1, size: 20, sortField: '', sortDirection: 'ASC', filters: [], globalFilter: '' });
    }

    loadResults(request: any): void {
        if (!this.selectedSummary) {
            this.resultData = [];
            this.resultTotal = 0;
            return;
        }
        this.resultLoading = true;
        this.centralUsersService.getLicTypeData(request, this.selectedSummary.id).subscribe({
            next: (resp: any) => {
                this.resultData = resp.data?.rows || [];
                this.resultTotal = resp.data?.records || 0;
                this.resultLoading = false;
            },
            error: () => { this.resultLoading = false; }
        });
    }

    onResultQueryChange(params: TableQueryParams): void {
        this.loadResults({
            page: params.pageIndex,
            size: params.pageSize,
            sortField: params.sort?.field || '',
            sortDirection: params.sort?.direction === 'descend' ? 'DESC' : 'ASC',
            filters: [],
            globalFilter: params.globalSearch || ''
        });
    }

    onResultRowClick(row: any): void {
        this.selectedResult = row;
    }

    openModal(formType: string): void {
        if (!this.selectedResult) {
            this.notificationService.error('Please select a row');
            return;
        }
        this.nzModal.create({
            nzTitle: formType,
            nzContent: ViewLicenseManagementComponent,
            nzWidth: formType === 'Change License Type' ? '35vw' : '90vw',
            nzData: { formType, data: this.selectedResult },
            nzFooter: null,
            nzClassName: 'updated-modal',
        }).afterClose.subscribe(result => {
            if (result) {
                this.loadResults({ page: 1, size: 20, sortField: '', sortDirection: 'ASC', filters: [], globalFilter: '' });
            }
        });
    }
}
