import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import {
    CentralUserAdminService, UserDetail, UserSystem, OperationRequest,
    UserRoleAggregated, UserTransaction, UserRiskViolation, UserRequest, UserRule, UserSODControl
} from '../central-user-admin.service';
import { StdControlResultsComponent } from '../std-control-results/std-control-results.component';

@Component({
    standalone: false,
    selector: 'app-user-detail',
    templateUrl: './user-detail.component.html',
    styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();

    identityId!: number;
    user: UserDetail | null = null;
    loading = true;
    operationLoading = false;

    selectedSystems: string[] = [];
    expandedSystemId: number | null = null;
    selectedTabIndex = 0;

    // Tab loading states
    rolesLoading = false;
    transactionsLoading = false;
    risksLoading = false;
    requestsLoading = false;
    rulesLoading = false;
    sodControlsLoading = false;

    // Tab data loaded flags
    private rolesLoaded = false;
    private transactionsLoaded = false;
    private risksLoaded = false;
    private requestsLoaded = false;
    private rulesLoaded = false;
    private sodControlsLoaded = false;

    // Tab data
    allRoles: UserRoleAggregated[] = [];
    allTransactions: UserTransaction[] = [];
    allRisks: UserRiskViolation[] = [];
    allRequests: UserRequest[] = [];
    allRules: UserRule[] = [];
    allSODControls: UserSODControl[] = [];

    selectedRuleSystemId: number | null = null;
    selectedSODSystemId: number | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private adminService: CentralUserAdminService,
        private nzModal: NzModalService,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.identityId = +params['identityId'];
            this.loadUserDetail();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadUserDetail(): void {
        this.loading = true;
        this.adminService.getUserDetail(this.identityId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.user = response.data;
                    }
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    getInitials(name: string): string {
        if (!name) return 'U';
        const parts = name.split(' ').filter(p => p.length > 0);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    // System selection
    toggleSystemExpand(system: UserSystem): void {
        this.expandedSystemId = this.expandedSystemId === system.centralUserId ? null : system.centralUserId;
    }

    toggleSystemSelection(system: UserSystem): void {
        const systemKey = `${system.sid}:${system.client}`;
        const index = this.selectedSystems.indexOf(systemKey);
        if (index > -1) {
            this.selectedSystems.splice(index, 1);
        } else {
            this.selectedSystems.push(systemKey);
        }
    }

    isSystemSelected(system: UserSystem): boolean {
        return this.selectedSystems.includes(`${system.sid}:${system.client}`);
    }

    clearSelection(): void {
        this.selectedSystems = [];
    }

    // Operations
    lockSelectedSystems(): void {
        if (!this.user || this.selectedSystems.length === 0) return;

        this.nzModal.confirm({
            nzTitle: 'Lock User',
            nzContent: `Lock user ${this.user.sapBname} in ${this.selectedSystems.length} system(s)?`,
            nzOkText: 'Lock',
            nzOkDanger: true,
            nzOnOk: () => this.executeOperation('lock'),
            nzCancelText: 'Cancel'
        });
    }

    unlockSelectedSystems(): void {
        if (!this.user || this.selectedSystems.length === 0) return;

        this.nzModal.confirm({
            nzTitle: 'Unlock User',
            nzContent: `Unlock user ${this.user.sapBname} in ${this.selectedSystems.length} system(s)?`,
            nzOkText: 'Unlock',
            nzOnOk: () => this.executeOperation('unlock'),
            nzCancelText: 'Cancel'
        });
    }

    syncSelectedSystems(): void {
        if (!this.user || this.selectedSystems.length === 0) return;
        this.executeOperation('sync');
    }

    private executeOperation(type: 'lock' | 'unlock' | 'sync'): void {
        if (!this.user) return;

        this.operationLoading = true;
        const request: OperationRequest = {
            userId: this.user.sapBname,
            systems: this.selectedSystems
        };

        let operation$;
        if (type === 'lock') {
            operation$ = this.adminService.lockUser(request);
        } else if (type === 'unlock') {
            operation$ = this.adminService.unlockUser(request);
        } else {
            operation$ = this.adminService.syncUser(request);
        }

        operation$.pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                if (response.success) {
                    this.notificationService.success(`${type} operation completed successfully`);
                    this.loadUserDetail();
                    this.selectedSystems = [];
                }
                this.operationLoading = false;
            },
            error: () => {
                this.operationLoading = false;
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/central-users/user-admin/users']);
    }

    getEnvironmentColor(envType: string): string {
        switch (envType?.toLowerCase()) {
            case 'production': return 'red';
            case 'quality': return 'orange';
            case 'development': return 'blue';
            default: return 'default';
        }
    }

    getUserTypeColor(userType: string): string {
        switch (userType?.toLowerCase()) {
            case 'dialog': return 'geekblue';
            case 'service': return 'purple';
            case 'communication': return 'cyan';
            case 'system': return 'volcano';
            default: return 'default';
        }
    }

    // Tab change handler — lazy load data
    onTabChange(event: { index: number }): void {
        switch (event.index) {
            case 1:
                if (!this.rolesLoaded) this.loadRolesData();
                break;
            case 2:
                if (!this.transactionsLoaded) this.loadTransactionsData();
                break;
            case 3:
                if (!this.risksLoaded) this.loadRisksData();
                break;
            case 4:
                if (!this.rulesLoaded) this.loadRulesData();
                break;
            case 5:
                if (!this.sodControlsLoaded) this.loadSODControlsData();
                break;
            case 6:
                if (!this.requestsLoaded) this.loadRequestsData();
                break;
        }
    }

    // ==================== All Roles ====================
    private loadRolesData(): void {
        this.rolesLoading = true;
        this.adminService.getUserRoles(this.identityId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.allRoles = response.data;
                    }
                    this.rolesLoading = false;
                    this.rolesLoaded = true;
                },
                error: () => {
                    this.rolesLoading = false;
                    this.rolesLoaded = true;
                }
            });
    }

    // ==================== Transactions ====================
    private loadTransactionsData(): void {
        this.transactionsLoading = true;
        this.adminService.getUserTransactions(this.identityId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.allTransactions = response.data;
                    }
                    this.transactionsLoading = false;
                    this.transactionsLoaded = true;
                },
                error: () => {
                    this.transactionsLoading = false;
                    this.transactionsLoaded = true;
                }
            });
    }

    // ==================== Risks ====================
    private loadRisksData(): void {
        this.risksLoading = true;
        this.adminService.getUserRisks(this.identityId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.allRisks = response.data;
                    }
                    this.risksLoading = false;
                    this.risksLoaded = true;
                },
                error: () => {
                    this.risksLoading = false;
                    this.risksLoaded = true;
                }
            });
    }

    getRiskCountByType(type: string): number {
        return this.allRisks.filter(r => r.riskType?.toLowerCase() === type.toLowerCase()).length;
    }

    // ==================== Rules ====================
    private loadRulesData(): void {
        this.rulesLoaded = true;
        if (this.user?.systems?.length && !this.selectedRuleSystemId) {
            this.onRuleSystemSelect(this.user.systems[0].centralUserId);
        }
    }

    onRuleSystemSelect(centralUserId: number): void {
        this.selectedRuleSystemId = centralUserId;
        this.rulesLoading = true;
        this.allRules = [];

        this.adminService.getUserRules(centralUserId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        const ruleColumns = ['ruleName', 'ruleDesc', 'tranCode', 'tranName', 'createdDate'];
                        const transformedData = response.data.rows?.map((row: any[]) => {
                            const obj: any = {};
                            ruleColumns.forEach((col, index) => {
                                obj[col] = row[index];
                            });
                            return obj;
                        }) || [];
                        this.allRules = transformedData;
                    }
                    this.rulesLoading = false;
                },
                error: () => {
                    this.rulesLoading = false;
                }
            });
    }

    getSystemDisplayName(system: UserSystem): string {
        return `${system.sid} (${system.client})`;
    }

    // ==================== SOD Controls ====================
    private loadSODControlsData(): void {
        this.sodControlsLoaded = true;
        if (this.user?.systems?.length && !this.selectedSODSystemId) {
            this.onSODSystemSelect(this.user.systems[0].centralUserId);
        }
    }

    onSODSystemSelect(centralUserId: number): void {
        this.selectedSODSystemId = centralUserId;
        this.sodControlsLoading = true;
        this.allSODControls = [];

        this.adminService.getUserSODControls(centralUserId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.allSODControls = response.data.rows || [];
                    }
                    this.sodControlsLoading = false;
                },
                error: () => {
                    this.sodControlsLoading = false;
                }
            });
    }

    viewSODControlDetails(control: UserSODControl): void {
        if (!this.selectedSODSystemId) return;

        this.adminService.getSODControlMetadata(control.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (metaResponse) => {
                    if (metaResponse.success && metaResponse.data) {
                        const columns = metaResponse.data.map((item: any, index: number) => ({
                            field: item.name,
                            header: item.desc,
                            index: index
                        }));

                        this.nzModal.create({
                            nzTitle: 'Control Results',
                            nzContent: StdControlResultsComponent,
                            nzWidth: '90vw',
                            nzData: {
                                id: control.id,
                                userId: this.selectedSODSystemId,
                                columns: columns
                            },
                            nzFooter: null,
                            nzClassName: 'updated-modal'
                        });
                    }
                }
            });
    }

    // ==================== Requests ====================
    private loadRequestsData(): void {
        this.requestsLoading = true;
        this.adminService.getUserRequests(this.identityId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.allRequests = response.data;
                    }
                    this.requestsLoading = false;
                    this.requestsLoaded = true;
                },
                error: () => {
                    this.requestsLoading = false;
                    this.requestsLoaded = true;
                }
            });
    }

    getRequestStatusColor(status: string): string {
        switch (status?.toLowerCase()) {
            case 'approved': case 'completed': return 'success';
            case 'rejected': case 'failed': return 'error';
            case 'pending': return 'warning';
            case 'in_progress': return 'processing';
            default: return 'default';
        }
    }
}
