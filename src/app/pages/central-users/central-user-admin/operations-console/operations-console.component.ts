import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, interval, forkJoin } from "rxjs";
import { takeUntil, takeWhile, switchMap, map, debounceTime, distinctUntilChanged } from "rxjs/operators";
import { NzModalService } from "ng-zorro-antd/modal";
import { CentralUserAdminService, BulkOperationRequest, AggregatedUser, BatchStatus, UserDetail, UserSystem, PasswordOperationRequest, RoleAdditionRequest } from "../central-user-admin.service";
import { NzMessageService } from "ng-zorro-antd/message";
import { NzTableQueryParams } from "ng-zorro-antd/table";
import { PasswordGeneratorDialogComponent } from "../password-generator-dialog/password-generator-dialog.component";


import { TableColumn, TableAction } from "../../../../shared/components/advanced-table/advanced-table.models";
export interface SystemWithStatus {
    id: string;
    displayName: string;
    status: string;
}

export interface OperationLogEntry {
    systemName: string;
    userId?: string;
    status: string;
    message?: string;
}

@Component({
    standalone: false,
    selector: "app-operations-console",
    templateUrl: "./operations-console.component.html"
})
export class OperationsConsoleComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();
    private searchSubject$ = new Subject<string>();

    // User search
    userSearchTerm: string = '';
    searchedUsers: AggregatedUser[] = [];
    selectedUsers: AggregatedUser[] = [];
    totalUserRecords = 0;
    userSearchLoading = false;
    userSearchInitiated: boolean = false;
    pageIndex = 1;
    pageSize = 10;

    // Checkbox State - Users
    allUsersChecked = false;
    usersIndeterminate = false;
    setOfCheckedUserId = new Set<string>();

    // Systems
    systemsWithStatus: SystemWithStatus[] = [];
    selectedSystemIds: string[] = [];
    selectedSystems: SystemWithStatus[] = [];
    systemsLoading = false;

    // Checkbox State - Systems
    allSystemsChecked = false;
    systemsIndeterminate = false;
    setOfCheckedSystemId = new Set<string>();

    // Operation
    operationLoading = false;
    currentBatchId: number | null = null;
    currentBatchStatus: BatchStatus | null = null;

    // Logs
    operationLogs: OperationLogEntry[] = [];

    // Table Configurations
    userTableColumns: TableColumn<AggregatedUser>[] = [
        { field: 'sapBname', header: 'User' },
        { field: 'systemCount', header: 'Sys', width: '60px' }
    ];

    systemTableColumns: TableColumn<SystemWithStatus>[] = [
        { field: 'displayName', header: 'System' },
        { field: 'status', header: 'Status', width: '120px', type: 'tag', tagColors: { 'Locked': 'red', 'Unlocked': 'green', 'Archived': 'default', 'Active': 'green', 'Inactive': 'red' } }
    ];

    systemTableActions: TableAction[] = [];

    logTableColumns: TableColumn<OperationLogEntry>[] = [
        { field: 'userId', header: 'User', width: '120px' },
        { field: 'systemName', header: 'System', width: '140px' },
        { field: 'status', header: 'Status', width: '160px', type: 'status' },
        { field: 'message', header: 'Message' }
    ];

    logTableActions: TableAction[] = [];

    constructor(
        private router: Router,
        private adminService: CentralUserAdminService,
        private nzModal: NzModalService,
        private message: NzMessageService
    ) { }

    ngOnInit(): void {
        // Set up debounced search
        this.searchSubject$.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(term => {
            this.pageIndex = 1; // Reset to page 1 for new search
            this.loadUsersFromServer(term, this.pageIndex, this.pageSize);
        });
        this.updateActionsState();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ==================== User Search & Pagination Methods ====================
    onUserSearchInput(): void {
        if (this.userSearchTerm && this.userSearchTerm.length >= 2) {
            this.userSearchInitiated = true;
            this.searchSubject$.next(this.userSearchTerm);
        } else if (!this.userSearchTerm) {
            this.userSearchInitiated = false;
            this.searchedUsers = [];
            this.totalUserRecords = 0;
            this.clearUserSelectionState();
        }
    }

    onUserQueryParamsChange(params: NzTableQueryParams): void {
        this.pageIndex = params.pageIndex;
        this.pageSize = params.pageSize;
        // The table can trigger this instantly so verify we are initiated.
        if (this.userSearchInitiated && this.userSearchTerm && this.userSearchTerm.length >= 2) {
            this.loadUsersFromServer(this.userSearchTerm, this.pageIndex, this.pageSize);
        }
    }

    private loadUsersFromServer(searchTerm: string, pageIndex: number, pageSize: number): void {
        this.userSearchLoading = true;

        const request = {
            page: pageIndex,
            size: pageSize,
            sortField: '',
            sortDirection: 'ASC',
            filters: [],
            globalFilter: searchTerm
        };

        this.adminService.searchUsers(request)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.searchedUsers = response.data.rows || [];
                        this.totalUserRecords = response.data.records || 0;
                    }
                    this.userSearchLoading = false;
                    this.updateActionsState();
                },
                error: () => {
                    this.userSearchLoading = false;
                    this.message.error('Failed to load users');
                    this.updateActionsState();
                }
            });
    }

    onUserSelectionChange(selectedItems: AggregatedUser[]): void {
        this.setOfCheckedUserId.clear();
        selectedItems.forEach(item => this.setOfCheckedUserId.add(item.sapBname));
        this.updateSelectedUsersArray();
    }



    updateSelectedUsersArray(): void {
        // Build selected models out of the currently viewed rows that correlate to the set
        // Note: For pagination caching, ideally one maintains a Master array if keeping them selected across pages.
        // For simplicity, we just rebuild from current searchedUsers that match.
        this.selectedUsers = this.searchedUsers.filter(u => this.setOfCheckedUserId.has(u.sapBname));

        if (this.selectedUsers.length === 0) {
            this.systemsWithStatus = [];
            this.clearSystemSelectionState();
            return;
        }

        this.loadSystemsForSelectedUsers();
    }

    clearUserSelectionState(): void {
        this.setOfCheckedUserId.clear();
        this.selectedUsers = [];

        this.updateActionsState();

        this.systemsWithStatus = [];
        this.clearSystemSelectionState();
    }

    // ==================== Systems Methods ====================

    private loadSystemsForSelectedUsers(): void {
        this.systemsLoading = true;

        const userDetailRequests = this.selectedUsers.map(user =>
            this.adminService.getUserDetail(user.identityId).pipe(
                map(response => {
                    if (response.success && response.data) {
                        return (response.data as UserDetail).systems || [];
                    }
                    return [];
                })
            )
        );

        forkJoin(userDetailRequests).pipe(takeUntil(this.destroy$)).subscribe({
            next: (systemArrays: UserSystem[][]) => {
                const systemMap = new Map<string, SystemWithStatus>();

                for (const systems of systemArrays) {
                    for (const sys of systems) {
                        const id = sys.sid;
                        if (!systemMap.has(id)) {
                            systemMap.set(id, {
                                id: id,
                                displayName: sys.sid,
                                status: sys.locked ? 'Locked' : 'Active'
                            });
                        }
                    }
                }

                this.systemsWithStatus = Array.from(systemMap.values());
                // Auto-select all systems when loaded for convenience, or retain previous checks
                this.systemsWithStatus.forEach(sys => this.setOfCheckedSystemId.add(sys.id));
                this.updateSelectedSystemsArray();

                this.systemsLoading = false;
                this.updateActionsState();
            },
            error: () => {
                this.systemsLoading = false;
                this.message.error('Failed to load associated systems');
                this.updateActionsState();
            }
        });
    }

    onSystemSelectionChange(selectedItems: SystemWithStatus[]): void {
        this.setOfCheckedSystemId.clear();
        selectedItems.forEach(item => this.setOfCheckedSystemId.add(item.id));
        this.updateSelectedSystemsArray();
        this.updateActionsState();
    }



    updateSelectedSystemsArray(): void {
        this.selectedSystems = this.systemsWithStatus.filter(s => this.setOfCheckedSystemId.has(s.id));
        this.selectedSystemIds = this.selectedSystems.map(s => s.id);
    }

    clearSystemSelectionState(): void {
        this.setOfCheckedSystemId.clear();
        this.selectedSystemIds = [];
        this.selectedSystems = [];
        this.updateActionsState();
    }

    // ==================== Operations Methods ====================
    updateActionsState(): void {
        const disabled = this.setOfCheckedUserId.size === 0 || this.setOfCheckedSystemId.size === 0 || this.operationLoading;
        this.systemTableActions = [
            { label: 'Lock Users', icon: 'lock', command: () => this.executeOperation('lock'), disabled, type: 'primary' },
            { label: 'Unlock Users', icon: 'unlock', command: () => this.executeOperation('unlock'), disabled, type: 'default' },
            { label: 'Expire Users', icon: 'clock-circle', command: () => this.executeExpireOperation(), disabled, type: 'default' },
            { label: 'Reset Password', icon: 'key', command: () => this.executePasswordOperation('reset'), disabled, type: 'default' },
            { label: 'Deactivate Password', icon: 'stop', danger: true, command: () => this.executePasswordOperation('deactivate'), disabled, type: 'default' }
        ];
    }

    executeOperation(operationType: 'lock' | 'unlock'): void {
        if (this.selectedUsers.length === 0 || this.selectedSystemIds.length === 0) return;

        const operationLabel = operationType === 'lock' ? 'Lock' : 'Unlock';

        this.nzModal.confirm({
            nzTitle: `${operationLabel} Users`,
            nzContent: `Are you sure you want to ${operationType} ${this.selectedUsers.length} user(s) across ${this.selectedSystemIds.length} system(s)?`,
            nzOkText: operationLabel,
            nzOkType: operationType === 'lock' ? 'primary' : 'default',
            nzOkDanger: operationType === 'lock',
            nzOnOk: () => this.performOperation(operationType),
            nzCancelText: 'Cancel'
        });
    }

    private performOperation(operationType: 'lock' | 'unlock'): void {
        this.operationLoading = true;
        this.updateActionsState();
        this.initLogs();

        const request: BulkOperationRequest = {
            userIds: this.selectedUsers.map(u => u.sapBname),
            systems: this.selectedSystemIds,
            reason: `Bulk ${operationType} operation from Operations Console`
        };

        const operation$ = operationType === 'lock'
            ? this.adminService.bulkLockUsers(request)
            : this.adminService.bulkUnlockUsers(request);

        operation$.pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    const batchStatus = response.data as BatchStatus;
                    this.currentBatchId = batchStatus.batchId;
                    this.currentBatchStatus = batchStatus;
                    this.pollBatchStatus(batchStatus.batchId, operationType);
                } else {
                    this.operationLoading = false;
                    this.markAllLogsFailed('Failed to start operation');
                    this.updateActionsState();
                }
            },
            error: (err) => {
                this.operationLoading = false;
                this.markAllLogsFailed('Error: ' + (err.message || 'Unknown error'));
                this.updateActionsState();
            }
        });
    }

    executeExpireOperation(): void {
        if (this.selectedUsers.length === 0 || this.selectedSystemIds.length === 0) return;

        this.nzModal.confirm({
            nzTitle: 'Expire Users',
            nzContent: `Are you sure you want to expire ${this.selectedUsers.length} user(s) across ${this.selectedSystemIds.length} system(s)? This will set the user validity end date to today.`,
            nzOkText: 'Expire',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzOnOk: () => this.performExpireOperation(),
            nzCancelText: 'Cancel'
        });
    }

    private performExpireOperation(): void {
        this.operationLoading = true;
        this.initLogs();

        const request: BulkOperationRequest = {
            userIds: this.selectedUsers.map(u => u.sapBname),
            systems: this.selectedSystemIds,
            reason: 'Bulk expire operation from Operations Console'
        };

        this.adminService.bulkExpireUsers(request)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        const batchStatus = response.data as BatchStatus;
                        this.currentBatchId = batchStatus.batchId;
                        this.currentBatchStatus = batchStatus;
                        this.pollBatchStatus(batchStatus.batchId, 'expire');
                    } else {
                        this.operationLoading = false;
                        this.markAllLogsFailed('Failed to start expire operation');
                        this.updateActionsState();
                    }
                },
                error: (err) => {
                    this.operationLoading = false;
                    this.markAllLogsFailed('Error: ' + (err.message || 'Unknown error'));
                    this.updateActionsState();
                }
            });
    }

    executePasswordOperation(operationType: 'reset' | 'deactivate'): void {
        if (this.selectedUsers.length === 0 || this.selectedSystemIds.length === 0) return;

        const modal = this.nzModal.create({
            nzContent: PasswordGeneratorDialogComponent,
            nzData: {
                userCount: this.selectedUsers.length,
                systemCount: this.selectedSystemIds.length,
                operationType: operationType
            },
            nzFooter: null,
            nzWidth: 500,
            nzCentered: true
        });

        modal.afterClose.subscribe(result => {
            if (result && result.confirmed && result.password) {
                this.performPasswordOperation(operationType, result.password);
            }
        });
    }

    private performPasswordOperation(operationType: 'reset' | 'deactivate', password?: string): void {
        this.operationLoading = true;
        this.initLogs();

        const request: PasswordOperationRequest = {
            userIds: this.selectedUsers.map(u => u.sapBname),
            systems: this.selectedSystemIds,
            password: password,
            reason: `Bulk password ${operationType} operation from Operations Console`
        };

        const operation$ = operationType === 'reset'
            ? this.adminService.bulkResetPassword(request)
            : this.adminService.bulkDeactivatePassword(request);

        operation$.pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    const batchStatus = response.data as BatchStatus;
                    this.currentBatchId = batchStatus.batchId;
                    this.currentBatchStatus = batchStatus;
                    this.pollBatchStatus(batchStatus.batchId, operationType);
                } else {
                    this.operationLoading = false;
                    this.markAllLogsFailed(`Failed to start password ${operationType} operation`);
                    this.updateActionsState();
                }
            },
            error: (err) => {
                this.operationLoading = false;
                this.markAllLogsFailed('Error: ' + (err.message || 'Unknown error'));
                this.updateActionsState();
            }
        });
    }

    private initLogs(): void {
        this.operationLogs = [];
        for (const user of this.selectedUsers) {
            for (const systemId of this.selectedSystemIds) {
                this.operationLogs.push({
                    systemName: systemId,
                    userId: user.sapBname,
                    status: 'Pending'
                });
            }
        }
    }

    private pollBatchStatus(batchId: number, operationType: string): void {
        interval(1000)
            .pipe(
                takeUntil(this.destroy$),
                switchMap(() => this.adminService.getBatchStatus(batchId)),
                takeWhile((response) => {
                    if (response.success && response.data) {
                        const status = response.data as BatchStatus;
                        this.updateLogsFromBatchStatus(status, operationType);
                        return !this.isBatchComplete(status.status);
                    }
                    return false;
                }, true)
            )
            .subscribe({
                complete: () => {
                    this.operationLoading = false;
                    this.currentBatchId = null;
                    this.updateActionsState();
                }
            });
    }

    private isBatchComplete(status: string): boolean {
        return status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED';
    }

    private updateLogsFromBatchStatus(status: BatchStatus, operationType: string): void {
        this.currentBatchStatus = status;
        const progressPercent = status.progressPercent || 0;
        const batchComplete = this.isBatchComplete(status.status);

        if (status.tasks && status.tasks.length > 0) {
            for (const task of status.tasks) {
                const matchingLog = this.operationLogs.find(
                    log => log.userId === task.userId && log.systemName === task.system
                );
                if (matchingLog) {
                    matchingLog.status = this.mapTaskStatus(task.status, operationType);
                    matchingLog.message = task.message;
                }
            }
        }

        for (const log of this.operationLogs) {
            if (log.status === 'Pending' || log.status === 'In-progress') {
                if (batchComplete) {
                    if (status.status === 'COMPLETED') {
                        log.status = this.mapTaskStatus('SUCCESS', operationType);
                    } else if (status.status === 'FAILED') {
                        log.status = 'Failed';
                    } else {
                        log.status = 'Cancelled';
                    }
                } else if (progressPercent > 0 && log.status === 'Pending') {
                    log.status = 'In-progress';
                }
            }
        }

        this.operationLogs = [...this.operationLogs];
    }

    private mapTaskStatus(taskStatus: string, operationType: string): string {
        switch (taskStatus) {
            case 'SUCCESS':
                if (operationType === 'lock') return 'Locked';
                if (operationType === 'unlock') return 'Unlocked';
                if (operationType === 'reset') return 'Password Reset';
                if (operationType === 'deactivate') return 'Deactivated';
                if (operationType === 'add-roles') return 'Roles Assigned';
                if (operationType === 'expire') return 'Expired';
                return 'Completed';
            case 'FAILED': return 'Failed';
            case 'PENDING': return 'Pending';
            default: return 'In-progress';
        }
    }

    private markAllLogsFailed(message: string): void {
        for (const log of this.operationLogs) {
            log.status = 'Failed';
            log.message = message;
        }
    }

    // ==================== UI Helper Methods ====================

    refreshLogs(): void {
        this.operationLogs = [...this.operationLogs];
    }

    clearLogs(): void {
        this.operationLogs = [];
    }

    goBack(): void {
        this.router.navigate(['/central-users/users']);
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'Pending': return 'default';
            case 'In-progress': return 'processing';
            case 'Locked': case 'Failed': case 'Deactivated': case 'Expired': return 'error';
            case 'Unlocked': case 'Completed': case 'Roles Assigned': return 'success';
            case 'Password Reset': return 'blue';
            case 'Cancelled': return 'warning';
            default: return 'default';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'Locked': return 'lock';
            case 'Unlocked': return 'unlock';
            case 'Password Reset': case 'Deactivated': return 'key';
            case 'Roles Assigned': return 'user-add';
            case 'Failed': return 'close-circle';
            case 'Expired': return 'clock-circle';
            default: return '';
        }
    }
}
