import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SetupService } from '../setup.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { AddPrivilegeComponent } from './add-privilege/add-privilege.component';
import { PrivilegeSettingComponent } from './setting/setting.component';
import { SapMappingComponent } from './sap-mapping/sap-mapping.component';
import { SapReviewerComponent } from './sap-reviewer/sap-reviewer.component';

@Component({
    selector: 'app-privileges',
    templateUrl: './privileges.component.html',
    styleUrls: ['./privileges.component.scss'],
    standalone: false
})
export class PrivilegesComponent implements OnInit {

    @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
    @ViewChild('operationsTpl', { static: true }) operationsTpl!: TemplateRef<any>;
    @ViewChild('historyPanel') historyPanel!: SidePanelComponent;

    // Statistics
    stats: any = {};
    statsLoading = false;
    statCards: { title: string; value: number; icon: string; color: string; desc: string }[] = [];

    // Table
    data: any[] = [];
    loading = false;
    totalRecords = 0;
    pageSize = 20;
    pageIndex = 1;
    columns: TableColumn[] = [];
    tableActions: TableAction[] = [];

    // History
    historyData: any[] = [];
    historyLoading = false;
    selectedHistoryRow: any = null;
    historyDetails: any[] = [];
    historyDetailsLoading = false;
    historyPrivilegeId = '';

    constructor(
        private router: Router,
        private nzModal: NzModalService,
        private setupService: SetupService,
        private notificationService: NotificationService,
        private confirmDialogService: ConfirmDialogService
    ) { }

    ngOnInit(): void {
        this.initTable();
        this.loadData();
        this.loadStatistics();
    }

    initTable(): void {
        this.columns = [
            { field: 'id', header: 'Privilege ID', sortable: true, width: '120px' },
            { field: 'description', header: 'Description', ellipsis: true, width: '200px' },
            { field: 'active', header: 'Status', type: 'template', templateRef: this.statusTpl, width: '100px' },
            { field: 'operations', header: 'Operations', type: 'template', templateRef: this.operationsTpl, width: '160px', fixed: 'right' }
        ];

        this.tableActions = [
            { label: 'Create Wizard', icon: 'plus-circle', type: 'primary', command: () => this.router.navigate(['/pam/setup/privileges/wizard/new']) },
            { label: 'Quick Add', icon: 'file-add', command: () => this.openAddDialog() }
        ];
    }

    loadStatistics(): void {
        this.statsLoading = true;
        this.setupService.getPrivilegeStatistics().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.stats = res.data;
                    this.statCards = [
                        { title: 'Total Privileges', value: this.stats.totalPrivileges || 0, icon: 'key', color: '#1890ff', desc: '' },
                        { title: 'Active', value: this.stats.activePrivileges || 0, icon: 'check-circle', color: '#52c41a', desc: (this.stats.activePercentage || 0) + '%' },
                        { title: 'Mapped Systems', value: this.stats.mappedSystems || 0, icon: 'api', color: '#722ed1', desc: '' },
                        { title: 'Reviewers', value: this.stats.reviewersCount || 0, icon: 'audit', color: '#13c2c2', desc: '' },
                        { title: 'Approvers', value: this.stats.approversCount || 0, icon: 'user-switch', color: '#fa8c16', desc: '' },
                        { title: 'Log Review', value: this.stats.logReviewEnabled || 0, icon: 'history', color: '#eb2f96', desc: (this.stats.logReviewPercentage || 0) + '%' }
                    ];
                }
                this.statsLoading = false;
            },
            error: () => { this.statsLoading = false; }
        });
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

        this.setupService.getPrivilegeList(payload).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.data = res.data.content || res.data.rows || [];
                    this.totalRecords = res.data.totalElements || res.data.records || 0;
                }
                this.loading = false;
            },
            error: () => { this.loading = false; }
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

    // ─── Actions ────────────────────────────────────────────────────
    openAddDialog(): void {
        this.nzModal.create({
            nzTitle: 'Add Privilege',
            nzContent: AddPrivilegeComponent,
            nzWidth: '500px',
            nzFooter: null,
            nzData: {}
        }).afterClose.subscribe(res => {
            if (res) { this.loadData(); this.loadStatistics(); }
        });
    }

    editDescription(row: any): void {
        this.nzModal.create({
            nzTitle: 'Edit Privilege',
            nzContent: AddPrivilegeComponent,
            nzWidth: '500px',
            nzFooter: null,
            nzData: { formType: 'Edit', data: row }
        }).afterClose.subscribe(res => {
            if (res) this.loadData();
        });
    }

    editWizard(row: any): void {
        this.router.navigate(['/pam/setup/privileges/wizard/edit', row.id]);
    }

    openSettings(row: any): void {
        this.nzModal.create({
            nzTitle: `Settings — ${row.id}`,
            nzContent: PrivilegeSettingComponent,
            nzWidth: '550px',
            nzFooter: null,
            nzData: { data: row }
        }).afterClose.subscribe(res => {
            if (res) this.loadStatistics();
        });
    }

    openSapMapping(row: any): void {
        this.nzModal.create({
            nzTitle: `SAP Mapping — ${row.id}`,
            nzContent: SapMappingComponent,
            nzWidth: '800px',
            nzFooter: null,
            nzData: { data: row }
        }).afterClose.subscribe(() => this.loadStatistics());
    }

    openUserManagement(row: any, userType: string): void {
        this.nzModal.create({
            nzTitle: `${userType.charAt(0) + userType.slice(1).toLowerCase()}s — ${row.id}`,
            nzContent: SapReviewerComponent,
            nzWidth: '700px',
            nzFooter: null,
            nzData: { formType: userType, data: row }
        }).afterClose.subscribe(() => this.loadStatistics());
    }

    deletePrivilege(row: any): void {
        this.confirmDialogService.confirm({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete privilege "${row.id}"?`
        }).subscribe(confirmed => {
            if (confirmed) {
                this.setupService.deletePrivilege(row.id).subscribe({
                    next: (res) => {
                        this.notificationService.show(res);
                        if (res.success) { this.loadData(); this.loadStatistics(); }
                    },
                    error: (err) => this.notificationService.handleHttpError(err)
                });
            }
        });
    }

    switchStatus(row: any): void {
        this.setupService.privilegeSwitchStatus(row.id).subscribe({
            next: (res) => {
                this.notificationService.show(res);
                if (res.success) { this.loadData(); this.loadStatistics(); }
            },
            error: (err) => this.notificationService.handleHttpError(err)
        });
    }

    // ─── History Panel ──────────────────────────────────────────────
    viewHistory(row: any): void {
        this.historyPrivilegeId = row.id;
        this.historyData = [];
        this.historyDetails = [];
        this.selectedHistoryRow = null;
        this.historyPanel.open();

        this.historyLoading = true;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        this.setupService.getPrivilegeHistory(row.id, tz).subscribe({
            next: (res) => {
                if (res.success) {
                    this.historyData = res.data || [];
                }
                this.historyLoading = false;
            },
            error: () => { this.historyLoading = false; }
        });
    }

    onHistoryRowClick(row: any): void {
        this.selectedHistoryRow = row;
        this.historyDetails = [];
        this.historyDetailsLoading = true;

        this.setupService.getPrivilegeLogDetails(row.id).subscribe({
            next: (res) => {
                if (res.success) {
                    this.historyDetails = res.data || [];
                }
                this.historyDetailsLoading = false;
            },
            error: () => { this.historyDetailsLoading = false; }
        });
    }

    backToHistoryList(): void {
        this.selectedHistoryRow = null;
        this.historyDetails = [];
    }

    formatDate(value: any): string {
        if (!value) return '-';
        const d = typeof value === 'number' ? new Date(value) : new Date(value);
        if (isNaN(d.getTime())) return value;
        const day = d.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${months[d.getMonth()]} ${hh}:${mm}`;
    }

    copyToClipboard(text: string): void {
        navigator.clipboard.writeText(text).then(() => {
            this.notificationService.success('Copied to clipboard');
        });
    }

    copyHistoryToClipboard(): void {
        const text = this.historyData.map(h =>
            `${h.action} | ${h.updatedBy} | ${this.formatDate(h.updateTime)}`
        ).join('\n');
        this.copyToClipboard(text);
    }

    copyDetailsToClipboard(): void {
        const text = this.historyDetails.map(d =>
            `${d.property}: ${d.oldValue || '-'} → ${d.newValue || '-'}`
        ).join('\n');
        this.copyToClipboard(text);
    }
}
