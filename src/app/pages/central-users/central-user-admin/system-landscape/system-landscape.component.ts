import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CentralUserAdminService, SapSystemVO } from '../central-user-admin.service';

interface SystemGridRow {
    id: number;
    sid: string;
    clientNumber: string;
    description: string;
    systemTypeName: string;
    environment: string;
    userCount: number;
    lockedCount: number;
    activePercentage: number;
}

@Component({
    standalone: false,
    selector: 'app-system-landscape',
    templateUrl: './system-landscape.component.html'
})
export class SystemLandscapeComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();
    private searchSubject$ = new Subject<string>();

    systems: SapSystemVO[] = [];
    filteredRows: SystemGridRow[] = [];
    loading = true;

    searchTerm = '';

    totalUsers = 0;
    totalLockedUsers = 0;

    constructor(
        private router: Router,
        private adminService: CentralUserAdminService
    ) {}

    ngOnInit(): void {
        this.searchSubject$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(term => {
            this.searchTerm = term;
            this.updateFilteredSystems();
        });

        this.loadSystems();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadSystems(): void {
        this.loading = true;
        this.adminService.getSystemLandscape()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.systems = response.data;
                        this.calculateTotals();
                        this.updateFilteredSystems();
                    }
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    private calculateTotals(): void {
        this.totalUsers = this.systems.reduce((sum, s) => sum + (s.userCount || 0), 0);
        this.totalLockedUsers = this.systems.reduce((sum, s) => sum + (s.lockedCount || 0), 0);
    }

    get lockedPercentage(): string {
        if (this.totalUsers === 0) return '0';
        return ((this.totalLockedUsers / this.totalUsers) * 100).toFixed(1);
    }

    get onlinePercentage(): string {
        if (this.systems.length === 0) return '100';
        return '100';
    }

    onSearchChange(term: string): void {
        this.searchSubject$.next(term);
    }

    private updateFilteredSystems(): void {
        let result = this.systems;

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(s =>
                s.sid?.toLowerCase().includes(term) ||
                s.destinationName?.toLowerCase().includes(term) ||
                s.description?.toLowerCase().includes(term) ||
                s.clientNumber?.toLowerCase().includes(term)
            );
        }

        this.filteredRows = result.map(s => this.toGridRow(s));
    }

    private toGridRow(system: SapSystemVO): SystemGridRow {
        const userCount = system.userCount || 0;
        const lockedCount = system.lockedCount || 0;
        const activePercentage = system.activePercentage ??
            (userCount === 0 ? 100 : Math.round(((userCount - lockedCount) / userCount) * 100));

        return {
            id: system.id,
            sid: system.sid,
            clientNumber: system.clientNumber,
            description: system.description || system.destinationName,
            systemTypeName: system.systemTypeName || this.getSystemTypeName(system.systemType),
            environment: this.getEnvironmentLabel(system),
            userCount,
            lockedCount,
            activePercentage
        };
    }

    private getEnvironmentLabel(system: SapSystemVO): string {
        const sid = system.sid?.toUpperCase() || '';
        if (sid.includes('PRD') || sid.includes('PROD') || sid.endsWith('P')) return 'Production';
        if (sid.includes('QAS') || sid.includes('QA') || sid.endsWith('Q')) return 'Quality';
        if (sid.includes('DEV') || sid.endsWith('D')) return 'Development';
        return 'Other';
    }

    private getSystemTypeName(type: number): string {
        const types: { [key: number]: string } = {
            0: 'SAP ECC', 1: 'SAP BTP', 2: 'HANA Database', 3: 'Business Objects',
            4: 'SuccessFactors', 5: 'Splunk', 6: 'SAP Java', 7: 'Microsoft 365',
            8: 'Jira', 9: 'ServiceNow', 10: 'Security Note'
        };
        return types[type] || 'Other';
    }

    getEnvironmentColor(env: string): string {
        switch (env) {
            case 'Production': return 'red';
            case 'Quality': return 'orange';
            case 'Development': return 'blue';
            default: return 'default';
        }
    }

    viewSystemUsers(row: SystemGridRow): void {
        const system = this.systems.find(s => s.id === row.id);
        if (system) {
            this.router.navigate(['/central-users/user-admin/users'], {
                queryParams: { systemId: system.id, systemName: system.destinationName }
            });
        }
    }

    goBack(): void {
        this.router.navigate(['/central-users/user-admin/dashboard']);
    }
}
