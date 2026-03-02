import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { SecurityReportsService, DashboardStats, SapSystemOption } from "../security-reports.service";

@Component({
    standalone: false,
    selector: "app-security-reports-dashboard",
    templateUrl: "./dashboard.component.html",
    styleUrls: ["./dashboard.component.css"]
})
export class SecurityReportsDashboardComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();

    loading = true;
    loadingSystems = true;

    systems: SapSystemOption[] = [];
    selectedSystemId: number | null = null;
    stats: DashboardStats | null = null;
    excessiveThreshold = 50;

    constructor(
        private router: Router,
        private securityReportsService: SecurityReportsService
    ) { }

    ngOnInit(): void {
        this.loadSystems();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadSystems(): void {
        this.loadingSystems = true;
        this.securityReportsService.getSapSystems()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.systems = (response.data as any[])
                            .map(s => ({
                                id: s.id,
                                sid: s.sid,
                                destinationName: s.destinationName,
                                description: s.description
                            }));

                        if (this.systems.length > 0) {
                            this.selectedSystemId = this.systems[0].id;
                            this.loadDashboardStats();
                        }
                    }
                    this.loadingSystems = false;
                },
                error: () => {
                    this.loadingSystems = false;
                }
            });
    }

    loadDashboardStats(): void {
        if (!this.selectedSystemId) {
            return;
        }

        this.loading = true;
        this.securityReportsService.getDashboardStats(this.selectedSystemId, this.excessiveThreshold)
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

    onSystemChange(): void {
        this.stats = null;
        this.loadDashboardStats();
    }

    refreshDashboard(): void {
        this.loadDashboardStats();
    }

    navigateToRoleAnalysis(filter?: string): void {
        const queryParams: any = { systemId: this.selectedSystemId };
        if (filter) {
            queryParams.filter = filter;
        }
        this.router.navigate(['/security-reports', 'role-analysis'], { queryParams });
    }

    get noDescPercentage(): string {
        if (!this.stats || this.stats.totalRoles === 0) return '0';
        return ((this.stats.rolesWithoutDescription / this.stats.totalRoles) * 100).toFixed(1);
    }

    get compositePercentage(): string {
        if (!this.stats || this.stats.totalRoles === 0) return '0';
        return ((this.stats.compositeRoles / this.stats.totalRoles) * 100).toFixed(1);
    }

    get emptyPercentage(): string {
        if (!this.stats || this.stats.totalRoles === 0) return '0';
        return ((this.stats.emptyRoles / this.stats.totalRoles) * 100).toFixed(1);
    }

    get selectedSystemName(): string {
        if (!this.selectedSystemId) return '';
        const system = this.systems.find(s => s.id === this.selectedSystemId);
        return system ? system.sid : '';
    }
}
