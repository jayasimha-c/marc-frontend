import { Component, Inject, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { SetupService } from '../../setup.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction } from '../../../../../shared/components/advanced-table/advanced-table.models';
import { AddSapReviewerComponent } from './add-sap-reviewer/add-sap-reviewer.component';

@Component({
    selector: 'app-sap-reviewer',
    templateUrl: './sap-reviewer.component.html',
    standalone: false
})
export class SapReviewerComponent implements OnInit {

    @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
    @ViewChild('operationsTpl', { static: true }) operationsTpl!: TemplateRef<any>;

    userType = '';
    privId = '';
    data: any[] = [];
    allUsers: any[] = [];
    loading = false;

    columns: TableColumn[] = [];
    tableActions: TableAction[] = [];

    constructor(
        public modal: NzModalRef,
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        private nzModal: NzModalService,
        private setupService: SetupService,
        private notificationService: NotificationService,
        private confirmDialogService: ConfirmDialogService
    ) { }

    ngOnInit(): void {
        this.userType = this.dialogData?.formType || 'REVIEWER';
        this.privId = this.dialogData?.data?.id || '';
        this.initTable();
        this.loadData();
    }

    initTable(): void {
        this.columns = [
            { field: 'username', header: 'Username' },
            { field: 'active', header: 'Status', type: 'template', templateRef: this.statusTpl },
            { field: 'operations', header: 'Operations', type: 'template', templateRef: this.operationsTpl, width: '150px' }
        ];

        this.tableActions = [
            { label: `Add ${this.formatType()}`, icon: 'user-add', type: 'primary', command: () => this.openAddUser() }
        ];
    }

    loadData(): void {
        this.loading = true;
        this.setupService.getPrivilegeUsers({ userType: this.userType, privId: this.privId }).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.data = res.data.privUsers || [];
                    this.allUsers = res.data.users || [];
                }
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    openAddUser(): void {
        // Filter out already-assigned users
        const assignedUserIds = new Set(this.data.map(u => u.userId));
        const availableUsers = this.allUsers.filter(u => !assignedUserIds.has(u.id));

        this.nzModal.create({
            nzTitle: `Add ${this.formatType()}`,
            nzContent: AddSapReviewerComponent,
            nzWidth: '500px',
            nzFooter: null,
            nzData: { userType: this.userType, privId: this.privId, usersList: availableUsers }
        }).afterClose.subscribe(res => { if (res) this.loadData(); });
    }

    deleteUser(row: any): void {
        this.confirmDialogService.confirm({
            title: 'Confirm Delete',
            message: `Remove "${row.username}" as ${this.formatType()}?`
        }).subscribe(confirmed => {
            if (confirmed) {
                this.setupService.deletePrivilegeUser({
                    userType: this.userType,
                    privId: this.privId,
                    userId: row.userId
                }).subscribe({
                    next: (res) => {
                        this.notificationService.show(res);
                        if (res.success) this.loadData();
                    },
                    error: (err) => this.notificationService.handleHttpError(err)
                });
            }
        });
    }

    switchStatus(row: any): void {
        this.setupService.privilegeUserSwitchStatus({
            userType: this.userType,
            privId: this.privId,
            userId: row.userId
        }).subscribe({
            next: (res) => {
                this.notificationService.show(res);
                if (res.success) this.loadData();
            },
            error: (err) => this.notificationService.handleHttpError(err)
        });
    }

    formatType(): string {
        return this.userType.charAt(0) + this.userType.slice(1).toLowerCase();
    }
}
