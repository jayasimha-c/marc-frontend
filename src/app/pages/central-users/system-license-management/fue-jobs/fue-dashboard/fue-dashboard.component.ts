import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CentralUsersService } from '../../../central-users.service';
import { RunFueMeasurementComponent } from '../run-fue-measurement/run-fue-measurement.component';

@Component({
    standalone: false,
    selector: 'app-fue-dashboard',
    templateUrl: './fue-dashboard.component.html'
})
export class FueDashboardComponent implements OnInit {
    loading = true;
    dashboard: any = {};

    trendChartOptions: any = {};
    tierChartOptions: any = {};
    savingsChartOptions: any = {};

    systemBreakdown: any[] = [];
    maxSystemFues = 0;

    constructor(
        private centralUsersService: CentralUsersService,
        private router: Router,
        private nzModal: NzModalService
    ) {
        this.initCharts();
    }

    ngOnInit(): void {
        this.loadDashboard();
    }

    private initCharts(): void {
        this.trendChartOptions = {
            title: { text: 'FUE Utilization Trend', align: 'left' },
            icon: 'line-chart',
            series: [{ name: 'SAP FUEs', data: [] }, { name: 'MARC FUEs', data: [] }],
            chart: { type: 'area', width: '100%', height: 280, toolbar: { show: false } },
            xaxis: { categories: [] },
            colors: ['#f5222d', '#52c41a'],
            stroke: { curve: 'smooth', width: 2 },
            dataLabels: { enabled: false },
            legend: { position: 'top' },
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05 } }
        };

        this.tierChartOptions = {
            title: { text: 'SAP vs MARC by Tier', align: 'left' },
            icon: 'bar-chart',
            series: [{ name: 'SAP Users', data: [] }, { name: 'MARC Users', data: [] }],
            chart: { type: 'bar', width: '100%', height: 280, toolbar: { show: false } },
            xaxis: { categories: [] },
            colors: ['#f5222d', '#52c41a'],
            plotOptions: { bar: { columnWidth: '50%' } },
            dataLabels: { enabled: false },
            legend: { position: 'top' }
        };

        this.savingsChartOptions = {
            title: { text: 'FUE Savings Trend', align: 'left' },
            icon: 'bar-chart',
            series: [{ name: 'Savings', data: [] }],
            chart: { type: 'bar', width: '100%', height: 280, toolbar: { show: false } },
            xaxis: { categories: [] },
            colors: ['#1890ff'],
            plotOptions: { bar: { columnWidth: '40%', borderRadius: 4 } },
            dataLabels: { enabled: false }
        };
    }

    loadDashboard(): void {
        this.loading = true;
        this.centralUsersService.getFueDashboard().subscribe({
            next: (resp: any) => {
                if (resp.success) {
                    this.dashboard = resp.data || {};
                    this.setChartData();
                    this.buildSystemBreakdown();
                }
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    private setChartData(): void {
        const trends = [...(this.dashboard.trends || [])].reverse();
        const trendDates = trends.map((t: any) => this.formatDate(t.date));

        this.trendChartOptions = {
            ...this.trendChartOptions,
            xaxis: { categories: trendDates },
            series: [
                { name: 'SAP FUEs', data: trends.map((t: any) => this.num(t.fuesSap)) },
                { name: 'MARC FUEs', data: trends.map((t: any) => this.num(t.fuesMarc)) }
            ]
        };

        const tiers = this.dashboard.tierBreakdown || [];
        this.tierChartOptions = {
            ...this.tierChartOptions,
            xaxis: { categories: tiers.map((t: any) => t.tierName) },
            series: [
                { name: 'SAP Users', data: tiers.map((t: any) => t.usersSap || 0) },
                { name: 'MARC Users', data: tiers.map((t: any) => t.usersMarc || 0) }
            ]
        };

        this.savingsChartOptions = {
            ...this.savingsChartOptions,
            xaxis: { categories: trendDates },
            series: [
                { name: 'Savings', data: trends.map((t: any) => this.num(t.savings)) }
            ]
        };
    }

    private buildSystemBreakdown(): void {
        const summaries: any[] = this.dashboard.systemBreakdown || [];
        const systemMap: Record<string, number> = {};
        for (const s of summaries) {
            systemMap[s.system] = (systemMap[s.system] || 0) + this.num(s.fuesConsumedSap);
        }
        this.systemBreakdown = Object.keys(systemMap)
            .map(sys => ({ system: sys, fues: systemMap[sys] }))
            .sort((a, b) => b.fues - a.fues);
        this.maxSystemFues = this.systemBreakdown.length > 0
            ? Math.max(...this.systemBreakdown.map(s => s.fues))
            : 0;
    }

    getSystemPercentage(system: any): number {
        if (!this.maxSystemFues) return 0;
        return Math.round((system.fues / this.maxSystemFues) * 100);
    }

    private formatDate(dateValue: any): string {
        if (!dateValue) return '';
        const parsed = typeof dateValue === 'string' && /^\d+$/.test(dateValue)
            ? new Date(Number(dateValue))
            : new Date(dateValue);
        if (isNaN(parsed.getTime())) return '';
        return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    private num(val: any): number {
        return val != null ? Number(val) : 0;
    }

    runMeasurement(): void {
        this.nzModal.create({
            nzTitle: 'Run FUE Measurement',
            nzContent: RunFueMeasurementComponent,
            nzWidth: '500px',
            nzFooter: null,
            nzClassName: 'updated-modal',
        }).afterClose.subscribe(result => {
            if (result) this.loadDashboard();
        });
    }

    navigateTo(path: string): void {
        this.router.navigate(['/central-users/system-license-management/' + path]);
    }
}
