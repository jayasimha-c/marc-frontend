import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TitlePanelFilter, TitlePanelDateRange } from '../../../../shared/components/title-panel/title-panel.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IcmDashboardService,
  DashboardSummary,
  DeficiencyStats,
  ExecutionStats,
  TrendData,
  DashboardFilter,
} from '../icm-dashboard.service';
import { IcmControlService } from '../../icm-control.service';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { CommonApxChartComponent } from '../../../../shared/components/common-apx-chart/common-apx-chart.component';

@Component({
  standalone: false,
  selector: 'app-executive-dashboard',
  templateUrl: './executive-dashboard.component.html',
  styleUrls: ['./executive-dashboard.component.scss'],
})
export class IcmExecutiveDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('trendChart') trendChart!: CommonApxChartComponent;
  @ViewChild('statusChart') statusChart!: CommonApxChartComponent;
  @ViewChild('deficiencyAgingChart') deficiencyAgingChart!: CommonApxChartComponent;

  private destroy$ = new Subject<void>();

  loading = true;
  loadingTrend = true;
  loadingDeficiency = true;
  loadingExecution = true;

  summary: DashboardSummary = {
    totalControls: 0,
    activeControls: 0,
    testedControls: 0,
    notTestedControls: 0,
    effectiveControls: 0,
    partiallyEffectiveControls: 0,
    ineffectiveControls: 0,
    effectivenessRate: 0,
    totalDeficiencies: 0,
    openDeficiencies: 0,
    criticalDeficiencies: 0,
    overdueDeficiencies: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    todayExecutions: 0,
    connectedSystems: 0,
  };

  deficiencyStats!: DeficiencyStats;
  executionStats!: ExecutionStats;
  trendData!: TrendData;

  systems: any[] = [];
  filterConfig: TitlePanelFilter[] = [];
  filterValues: Record<string, any> = {};
  dateRange = { startDate: '', endDate: '' };

  dateRangePresets = [
    { label: '7d', days: 7 },
    { label: '1m', days: 30 },
    { label: '3m', days: 90 },
    { label: '1y', days: 365 },
  ];

  trendChartOptions: Partial<ChartOptions>;
  statusChartOptions: Partial<ChartOptions>;
  deficiencyAgingChartOptions: Partial<ChartOptions>;
  executionStatusChartOptions: Partial<ChartOptions>;

  constructor(
    private router: Router,
    private dashboardService: IcmDashboardService,
    private icmControlService: IcmControlService,
  ) {
    this.initCharts();
  }

  ngOnInit(): void {
    this.buildFilterConfig();
    this.loadSystems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initCharts(): void {
    this.trendChartOptions = {
      series: [
        { name: 'Opened', data: [] },
        { name: 'Closed', data: [] },
      ],
      chart: { type: 'area', height: 280, toolbar: { show: false }, zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
      xaxis: { categories: [] },
      yaxis: { labels: { formatter: (val: number) => Math.floor(val).toString() } },
      colors: ['#EF4444', '#10B981'],
      title: { text: 'Deficiency Trend', align: 'left' },
      icon: 'rise',
      legend: { position: 'top' },
    };

    this.statusChartOptions = {
      series: [],
      chart: { type: 'donut', height: 300 },
      labels: ['Effective', 'Ineffective', 'Not Tested'],
      colors: ['#10B981', '#EF4444', '#9CA3AF'],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
              },
            },
          },
        },
      },
      title: { text: 'Control Effectiveness', align: 'left' },
      icon: 'pie-chart',
      legend: { position: 'bottom' },
    };

    this.deficiencyAgingChartOptions = {
      series: [{ name: 'Deficiencies', data: [] }],
      chart: { type: 'bar', height: 280, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, barHeight: '60%', distributed: true } },
      colors: ['#10B981', '#F59E0B', '#F97316', '#EF4444'],
      dataLabels: { enabled: true },
      xaxis: { categories: ['0-30 days', '31-60 days', '61-90 days', '90+ days'] },
      title: { text: 'Deficiency Aging', align: 'left' },
      icon: 'clock-circle',
      legend: { show: false },
    };

    this.executionStatusChartOptions = {
      series: [],
      chart: { type: 'donut', height: 280 },
      labels: ['Success', 'Failed', 'Running', 'Error'],
      colors: ['#10B981', '#EF4444', '#3B82F6', '#F59E0B'],
      plotOptions: { pie: { donut: { size: '70%' } } },
      title: { text: "Today's Executions", align: 'left' },
      icon: 'play-circle',
      legend: { position: 'bottom', fontSize: '11px' },
    };
  }

  private loadSystems(): void {
    this.icmControlService.getSAPSystemList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.systems = response.data.rows || response.data || [];
            this.buildFilterConfig();
          }
        },
      });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.loadSummary();
    this.loadTrendData();
    this.loadDeficiencyStats();
    this.loadExecutionStats();
  }

  private loadSummary(): void {
    const filter = this.buildFilter();
    this.dashboardService.getSummary(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.summary = response.data;
            this.updateStatusChart();
          }
          this.loading = false;
        },
        error: () => { this.loading = false; },
      });
  }

  private loadTrendData(): void {
    this.loadingTrend = true;
    this.dashboardService.getTrend(this.getPeriodFromDateRange(), this.filterValues['system'] || null)
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

  private loadDeficiencyStats(): void {
    this.loadingDeficiency = true;
    const filter = this.buildFilter();
    this.dashboardService.getDeficiencyStats(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.deficiencyStats = response.data;
            this.updateDeficiencyAgingChart();
          }
          this.loadingDeficiency = false;
        },
        error: () => { this.loadingDeficiency = false; },
      });
  }

  private loadExecutionStats(): void {
    this.loadingExecution = true;
    const filter = this.buildFilter();
    this.dashboardService.getExecutionStats(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.executionStats = response.data;
            this.updateExecutionStatusChart();
          }
          this.loadingExecution = false;
        },
        error: () => { this.loadingExecution = false; },
      });
  }

  private updateStatusChart(): void {
    this.statusChartOptions.series = [
      this.summary.effectiveControls || 0,
      this.summary.ineffectiveControls || 0,
      this.summary.notTestedControls || 0,
    ];
    if (this.statusChart) this.statusChart.updateChart();
  }

  private updateTrendChart(): void {
    if (!this.trendData) return;
    const openedData = this.trendData.deficiencyOpenedTrend || [];
    const closedData = this.trendData.deficiencyClosedTrend || [];
    this.trendChartOptions.xaxis = { categories: openedData.map(p => p.date) };
    this.trendChartOptions.series = [
      { name: 'Opened', data: openedData.map(p => p.value) },
      { name: 'Closed', data: closedData.map(p => p.value) },
    ];
    if (this.trendChart) this.trendChart.updateChart();
  }

  private updateDeficiencyAgingChart(): void {
    if (!this.deficiencyStats) return;
    this.deficiencyAgingChartOptions.series = [{
      name: 'Deficiencies',
      data: [
        this.deficiencyStats.age0to30 || 0,
        this.deficiencyStats.age31to60 || 0,
        this.deficiencyStats.age61to90 || 0,
        this.deficiencyStats.age90plus || 0,
      ],
    }];
    if (this.deficiencyAgingChart) this.deficiencyAgingChart.updateChart();
  }

  private updateExecutionStatusChart(): void {
    if (!this.executionStats) return;
    this.executionStatusChartOptions.series = [
      this.executionStats.todaySuccessCount || 0,
      this.executionStats.todayFailedCount || 0,
      this.executionStats.todayRunningCount || 0,
      this.executionStats.todayErrorCount || 0,
    ];
  }

  private buildFilter(): DashboardFilter {
    const filter: DashboardFilter = {};
    if (this.dateRange.startDate) filter.startDate = new Date(this.dateRange.startDate).getTime();
    if (this.dateRange.endDate) filter.endDate = new Date(this.dateRange.endDate).getTime();
    if (this.filterValues['system']) filter.systemId = this.filterValues['system'];
    return filter;
  }

  buildFilterConfig(): void {
    this.filterConfig = [
      {
        key: 'system',
        label: 'System',
        placeholder: 'All Systems',
        options: this.systems.map(s => ({ value: s.id, label: s.name || s.sid })),
      },
    ];
  }

  onDateChanged(range: TitlePanelDateRange): void {
    this.dateRange = { startDate: range.startDate, endDate: range.endDate };
    this.loadDashboardData();
  }

  onFiltersApplied(values: Record<string, any>): void {
    this.filterValues = values;
    this.loadDashboardData();
  }

  private getPeriodFromDateRange(): string {
    if (!this.dateRange.startDate || !this.dateRange.endDate) return '30d';
    const diff = Math.ceil(
      (new Date(this.dateRange.endDate).getTime() - new Date(this.dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff <= 7) return '7d';
    if (diff <= 30) return '30d';
    if (diff <= 90) return '90d';
    return '12m';
  }

  navigateToControls(): void {
    this.router.navigate(['/icm/controls']);
  }

  navigateToDeficiencies(): void {
    this.router.navigate(['/icm/control-deficiency']);
  }

  navigateToMonitoring(): void {
    this.router.navigate(['/icm/dashboard/monitoring']);
  }

  navigateToDashboard(type: string): void {
    this.router.navigate(['/icm/dashboard', type]);
  }

  getEffectivenessColor(): string {
    const rate = this.summary.effectivenessRate || 0;
    if (rate >= 90) return '#52c41a';
    if (rate >= 70) return '#faad14';
    return '#ff4d4f';
  }

  getTrendIndicator(value: number | undefined): { icon: string; color: string } {
    if (!value) return { icon: 'minus', color: '#d9d9d9' };
    if (value > 0) return { icon: 'rise', color: '#52c41a' };
    if (value < 0) return { icon: 'fall', color: '#ff4d4f' };
    return { icon: 'minus', color: '#d9d9d9' };
  }

  refresh(): void {
    this.loadDashboardData();
  }
}
