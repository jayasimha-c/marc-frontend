import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CentralUserAdminService, DashboardStats, OperationLog, SapSystemVO } from './central-user-admin.service';

export interface AttentionMetrics {
    dormantUsers: number;
    orphanAccounts: number;
    neverLoggedIn: number;
    crossEnvAccess: number;
    lockedEverywhere: number;
}

export interface OperationStats {
    running: number;
    scheduled: number;
    failed: number;
    completedToday: number;
}

@Component({
    standalone: false,
    selector: 'app-central-user-admin',
    templateUrl: './central-user-admin.component.html',
    styleUrls: ['./central-user-admin.component.scss']
})
export class CentralUserAdminComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();

    loading = true;
    loadingSystems = true;
    loadingOperations = true;

    stats: DashboardStats = {
        totalSystems: 0,
        systemClients: 0,
        uniqueUsers: 0,
        totalAccounts: 0,
        roleAssignments: 0,
        lockedAccounts: 0
    };

    systems: SapSystemVO[] = [];
    topSystemsByUsers: SapSystemVO[] = [];
    maxUserCount = 0;

    attentionMetrics: AttentionMetrics = {
        dormantUsers: 0,
        orphanAccounts: 0,
        neverLoggedIn: 0,
        crossEnvAccess: 0,
        lockedEverywhere: 0
    };

    operationStats: OperationStats = {
        running: 0,
        scheduled: 0,
        failed: 0,
        completedToday: 0
    };

    recentOperations: OperationLog[] = [];

    constructor(
        private router: Router,
        private adminService: CentralUserAdminService
    ) {}

    ngOnInit(): void {
        this.loadDashboardData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadDashboardData(): void {
        this.loading = true;
        this.loadDashboardStats();
        this.loadSystemLandscape();
        this.loadAttentionMetrics();
        this.loadOperationStats();
        this.loadRecentOperations();
    }

    private loadDashboardStats(): void {
        this.adminService.getDashboardStats()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.stats = response.data;
                    }
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    private loadSystemLandscape(): void {
        this.loadingSystems = true;
        this.adminService.getSystemLandscape()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.systems = response.data;
                        this.topSystemsByUsers = [...this.systems]
                            .sort((a, b) => (b.userCount || 0) - (a.userCount || 0))
                            .slice(0, 6);
                        this.maxUserCount = this.topSystemsByUsers.length > 0
                            ? (this.topSystemsByUsers[0].userCount || 1)
                            : 1;
                    }
                    this.loadingSystems = false;
                },
                error: () => {
                    this.loadingSystems = false;
                }
            });
    }

    private loadAttentionMetrics(): void {
        const scenarios = [
            { key: 'dormantUsers', scenario: 'DORMANT_90_DAYS' },
            { key: 'orphanAccounts', scenario: 'ORPHAN_SAP_USERS' },
            { key: 'neverLoggedIn', scenario: 'NEVER_LOGGED_IN' },
            { key: 'crossEnvAccess', scenario: 'CROSS_ENV_ACCESS' },
            { key: 'lockedEverywhere', scenario: 'LOCKED_EVERYWHERE' }
        ];

        scenarios.forEach(({ key, scenario }) => {
            this.adminService.getUsersByScenario(scenario, 1)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (response) => {
                        if (response.success && response.data) {
                            (this.attentionMetrics as any)[key] = response.data.totalRecords ||
                                (Array.isArray(response.data) ? response.data.length : 0);
                        }
                    }
                });
        });
    }

    private loadOperationStats(): void {
        this.adminService.getRecentOperations(0, 100)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        const ops = Array.isArray(response.data) ? response.data : (response.data.rows || []);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const todayMs = today.getTime();

                        this.operationStats = {
                            running: ops.filter((o: OperationLog) =>
                                o.status === 'RUNNING' || o.status === 'IN_PROGRESS').length,
                            scheduled: ops.filter((o: OperationLog) => o.status === 'SCHEDULED').length,
                            failed: ops.filter((o: OperationLog) =>
                                o.status === 'FAILED' || o.status === 'ERROR').length,
                            completedToday: ops.filter((o: OperationLog) =>
                                (o.status === 'SUCCESS' || o.status === 'COMPLETED') &&
                                o.executedAt >= todayMs).length
                        };
                    }
                }
            });
    }

    private loadRecentOperations(): void {
        this.loadingOperations = true;
        this.adminService.getRecentOperations(0, 8)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.recentOperations = Array.isArray(response.data)
                            ? response.data
                            : (response.data.rows || []);
                    }
                    this.loadingOperations = false;
                },
                error: () => {
                    this.loadingOperations = false;
                }
            });
    }

    getSystemUserPercentage(system: SapSystemVO): number {
        if (!this.maxUserCount || !system.userCount) return 0;
        return Math.round((system.userCount / this.maxUserCount) * 100);
    }

    get totalAttentionItems(): number {
        return this.stats.lockedAccounts +
            this.attentionMetrics.dormantUsers +
            this.attentionMetrics.orphanAccounts +
            this.attentionMetrics.neverLoggedIn +
            this.attentionMetrics.crossEnvAccess +
            this.attentionMetrics.lockedEverywhere;
    }

    get lockedPercentage(): string {
        if (this.stats.totalAccounts === 0) return '0';
        return ((this.stats.lockedAccounts / this.stats.totalAccounts) * 100).toFixed(1);
    }

    navigateTo(path: string): void {
        this.router.navigate(['/central-users/user-admin', path]);
    }

    navigateToScenario(scenario: string): void {
        this.router.navigate(['/central-users/user-admin/users'], {
            queryParams: { scenario }
        });
    }

    navigateToSystem(system: SapSystemVO): void {
        this.router.navigate(['/central-users/user-admin/users'], {
            queryParams: { systemId: system.id, systemName: system.destinationName }
        });
    }

    getOperationIcon(operationType: string): string {
        const type = operationType?.toLowerCase() || '';
        if (type.includes('lock') && !type.includes('unlock')) return 'lock';
        if (type.includes('unlock')) return 'unlock';
        if (type.includes('sync')) return 'sync';
        if (type.includes('password')) return 'key';
        if (type.includes('delete') || type.includes('remove')) return 'delete';
        if (type.includes('create') || type.includes('add')) return 'plus';
        return 'setting';
    }

    formatOperationTime(timestamp: number): string {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    getStatusColor(status: string): string {
        const s = status?.toLowerCase() || '';
        if (s === 'success' || s === 'completed') return 'success';
        if (s === 'failed' || s === 'error') return 'error';
        if (s === 'running' || s === 'in_progress') return 'processing';
        if (s === 'scheduled' || s === 'pending') return 'warning';
        return 'default';
    }
}
