import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IcmDashboardService,
  DashboardSummary,
  GroupedStats,
  GroupStats,
  TrendData,
  DashboardFilter,
} from '../icm-dashboard.service';
import { IcmControlService } from '../../icm-control.service';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { CommonApxChartComponent } from '../../../../shared/components/common-apx-chart/common-apx-chart.component';

@Component({
  standalone: false,
  selector: 'app-assessment-dashboard',
  templateUrl: './assessment-dashboard.component.html',
  styleUrls: ['./assessment-dashboard.component.scss'],
})
export class IcmAssessmentDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('progressChart') progressChart!: CommonApxChartComponent;
  @ViewChild('byBpChart') byBpChart!: CommonApxChartComponent;
  @ViewChild('byCritChart') byCritChart!: CommonApxChartComponent;
  @ViewChild('trendChart') trendChart!: CommonApxChartComponent;

  private destroy$ = new Subject<void>();

  loading = true;
  loadingByBp = true;
  loadingByCrit = true;
  loadingTrend = true;

  summary!: DashboardSummary;
  byBusinessProcess!: GroupedStats;
  byCriticality!: GroupedStats;
  trendData!: TrendData;

  systems: any[] = [];
  selectedSystemId: number | null = null;

  selectedPeriod = '30d';
  periodOptions = [
    { label: '7 Days', period: '7d' },
    { label: '30 Days', period: '30d' },
    { label: '90 Days', period: '90d' },
  ];

  progressChartOptions: Partial<ChartOptions>;
  byBpChartOptions: Partial<ChartOptions>;
  byCritChartOptions: Partial<ChartOptions>;
  trendChartOptions: Partial<ChartOptions>;

  constructor(
    private router: Router,
    private dashboardService: IcmDashboardService,
    private icmControlService: IcmControlService,
  ) {
    this.initCharts();
  }

  ngOnInit(): void {
    this.loadSystems();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initCharts(): void {
    this.progressChartOptions = {
      series: [0],
      chart: { type: 'radialBar', height: 280 },
      plotOptions: {
        radialBar: {
          hollow: { size: '60%' },
          dataLabels: {
            name: { fontSize: '14px', offsetY: -10 },
            value: { fontSize: '28px', fontWeight: 600, formatter: (val: number) => `${Math.round(val)}%` },
          },
        },
      },
      labels: ['Tested'],
      colors: ['#3B82F6'],
      title: { text: 'Assessment Progress', align: 'left' },
    };

    this.byBpChartOptions = {
      series: [
        { name: 'Tested', data: [] },
        { name: 'Not Tested', data: [] },
      ],
      chart: { type: 'bar', height: 300, stacked: true, stackType: '100%', toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, barHeight: '60%' } },
      colors: ['#10B981', '#E5E7EB'],
      dataLabels: { enabled: true, formatter: (val: number) => (val > 5 ? `${Math.round(val)}%` : '') },
      xaxis: { categories: [] },
      yaxis: { labels: { style: { fontSize: '11px' } } },
      legend: { position: 'top' },
      title: { text: 'Assessment by Business Process', align: 'left' },
    };

    this.byCritChartOptions = {
      series: [],
      chart: { type: 'donut', height: 280 },
      labels: [],
      colors: ['#EF4444', '#F97316', '#F59E0B', '#10B981'],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true, label: 'Total',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
              },
            },
          },
        },
      },
      title: { text: 'Controls by Criticality', align: 'left' },
      legend: { position: 'bottom' },
    };

    this.trendChartOptions = {
      series: [{ name: 'Effectiveness %', data: [] }],
      chart: { type: 'area', height: 250, toolbar: { show: false }, zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
      xaxis: { categories: [] },
      yaxis: { min: 0, max: 100, labels: { formatter: (val: number) => `${Math.floor(val)}%` } },
      colors: ['#10B981'],
      title: { text: 'Effectiveness Trend', align: 'left' },
    };
  }

  private loadSystems(): void {
    this.icmControlService.getSAPSystemList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.systems = response.data.rows || response.data || [];
          }
        },
      });
  }

  loadData(): void {
    this.loading = true;
    this.loadSummary();
    this.loadByBusinessProcess();
    this.loadByCriticality();
    this.loadTrendData();
  }

  private loadSummary(): void {
    const filter = this.buildFilter();
    this.dashboardService.getSummary(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.summary = response.data;
            this.updateProgressChart();
          }
          this.loading = false;
        },
        error: () => { this.loading = false; },
      });
  }

  private loadByBusinessProcess(): void {
    this.loadingByBp = true;
    this.dashboardService.getStatsByBusinessProcess(this.selectedSystemId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.byBusinessProcess = response.data;
            this.updateByBpChart();
          }
          this.loadingByBp = false;
        },
        error: () => { this.loadingByBp = false; },
      });
  }

  private loadByCriticality(): void {
    this.loadingByCrit = true;
    this.dashboardService.getStatsByCriticality(this.selectedSystemId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.byCriticality = response.data;
            this.updateByCritChart();
          }
          this.loadingByCrit = false;
        },
        error: () => { this.loadingByCrit = false; },
      });
  }

  private loadTrendData(): void {
    this.loadingTrend = true;
    this.dashboardService.getTrend(this.selectedPeriod, this.selectedSystemId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.trendData = response.data;
            this.updateTrendChart();
          }
          this.loadingTrend = false;
        },
        error: () => { this.loadingTrend = false; },
      });
  }

  private updateProgressChart(): void {
    if (!this.summary) return;
    const total = this.summary.totalControls || 1;
    const tested = this.summary.testedControls || 0;
    this.progressChartOptions.series = [Math.round((tested / total) * 100)];
    if (this.progressChart) this.progressChart.updateChart();
  }

  private updateByBpChart(): void {
    if (!this.byBusinessProcess?.groups?.length) return;
    const groups = this.byBusinessProcess.groups.slice(0, 8);
    this.byBpChartOptions.xaxis = { categories: groups.map(g => g.groupName || 'Unknown') };
    this.byBpChartOptions.series = [
      { name: 'Tested', data: groups.map(g => g.testedControls || 0) },
      { name: 'Not Tested', data: groups.map(g => (g.totalControls || 0) - (g.testedControls || 0)) },
    ];
    if (this.byBpChart) this.byBpChart.updateChart();
  }

  private updateByCritChart(): void {
    if (!this.byCriticality?.groups?.length) return;
    const groups = this.byCriticality.groups;
    this.byCritChartOptions.labels = groups.map(g => g.groupName || 'Unknown');
    this.byCritChartOptions.series = groups.map(g => g.totalControls || 0);
    if (this.byCritChart) this.byCritChart.updateChart();
  }

  private updateTrendChart(): void {
    if (!this.trendData?.effectivenessTrend?.length) return;
    const trend = this.trendData.effectivenessTrend;
    this.trendChartOptions.xaxis = { categories: trend.map(p => p.date) };
    this.trendChartOptions.series = [
      { name: 'Effectiveness %', data: trend.map(p => p.value || p.percentage || 0) },
    ];
    if (this.trendChart) this.trendChart.updateChart();
  }

  private buildFilter(): DashboardFilter {
    const filter: DashboardFilter = {};
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    filter.startDate = startDate.getTime();
    filter.endDate = endDate.getTime();
    if (this.selectedSystemId) filter.systemId = this.selectedSystemId;
    return filter;
  }

  onSystemChange(): void { this.loadData(); }
  onPeriodChange(): void { this.loadTrendData(); }
  refresh(): void { this.loadData(); }

  goBack(): void {
    this.router.navigate(['/icm/dashboard']);
  }

  viewControls(filter?: string): void {
    this.router.navigate(['/icm/controls']);
  }

  getEffectivenessColor(rate: number): string {
    if (rate >= 90) return '#52c41a';
    if (rate >= 70) return '#faad14';
    return '#ff4d4f';
  }

  getProgressPercent(rate: number): number {
    return Math.min(100, Math.max(0, rate));
  }

  getProgressColor(rate: number): string {
    if (rate >= 90) return '#52c41a';
    if (rate >= 70) return '#faad14';
    return '#ff4d4f';
  }

  getTestedPercentage(group: GroupStats): number {
    if (!group.totalControls) return 0;
    return Math.round((group.testedControls / group.totalControls) * 100);
  }
}
