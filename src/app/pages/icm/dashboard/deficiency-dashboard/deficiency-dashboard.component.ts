import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IcmDashboardService,
  DeficiencyStats,
  TrendData,
  DashboardFilter,
} from '../icm-dashboard.service';
import { IcmControlService } from '../../icm-control.service';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { CommonApxChartComponent } from '../../../../shared/components/common-apx-chart/common-apx-chart.component';

@Component({
  standalone: false,
  selector: 'app-deficiency-dashboard',
  templateUrl: './deficiency-dashboard.component.html',
  styleUrls: ['./deficiency-dashboard.component.scss'],
})
export class IcmDeficiencyDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('agingChart') agingChart!: CommonApxChartComponent;
  @ViewChild('severityChart') severityChart!: CommonApxChartComponent;
  @ViewChild('trendChart') trendChart!: CommonApxChartComponent;
  @ViewChild('statusChart') statusChart!: CommonApxChartComponent;

  private destroy$ = new Subject<void>();

  loading = true;
  loadingTrend = true;

  stats!: DeficiencyStats;
  trendData!: TrendData;

  startDate: Date = this.getDefaultStartDate();
  endDate: Date = new Date();
  selectedPeriod = '30d';
  selectedSystemId: number | null = null;
  systems: any[] = [];

  dateRangePresets = [
    { label: '7D', days: 7, period: '7d' },
    { label: '30D', days: 30, period: '30d' },
    { label: '90D', days: 90, period: '90d' },
    { label: '1Y', days: 365, period: '12m' },
  ];

  agingChartOptions: Partial<ChartOptions>;
  severityChartOptions: Partial<ChartOptions>;
  trendChartOptions: Partial<ChartOptions>;
  statusChartOptions: Partial<ChartOptions>;

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
    this.agingChartOptions = {
      series: [{ name: 'Deficiencies', data: [] }],
      chart: { type: 'bar', height: 180, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, barHeight: '70%', distributed: true } },
      colors: ['#10B981', '#F59E0B', '#F97316', '#EF4444'],
      dataLabels: { enabled: true, style: { fontSize: '11px' } },
      xaxis: { categories: ['0-30 days', '31-60 days', '61-90 days', '90+ days'] },
      yaxis: { labels: { style: { fontSize: '11px' } } },
      title: { text: 'Aging Analysis', align: 'left', style: { fontSize: '13px' } },
      legend: { show: false },
    };

    this.severityChartOptions = {
      series: [],
      chart: { type: 'donut', height: 200 },
      labels: ['Low', 'Medium', 'High', 'Critical'],
      colors: ['#6B7280', '#3B82F6', '#F59E0B', '#EF4444'],
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              total: { show: true, label: 'Total', fontSize: '12px',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) },
            },
          },
        },
      },
      title: { text: 'By Severity', align: 'left', style: { fontSize: '13px' } },
      legend: { position: 'bottom', fontSize: '11px' },
    };

    this.trendChartOptions = {
      series: [
        { name: 'Opened', data: [] },
        { name: 'Closed', data: [] },
      ],
      chart: { type: 'area', height: 220, toolbar: { show: false }, zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
      xaxis: { categories: [] },
      yaxis: { labels: { formatter: (val: number) => Math.floor(val).toString() } },
      colors: ['#EF4444', '#10B981'],
      title: { text: 'Opened vs Closed', align: 'left', style: { fontSize: '13px' } },
      legend: { position: 'top', fontSize: '11px' },
    };

    this.statusChartOptions = {
      series: [],
      chart: { type: 'donut', height: 200 },
      labels: ['Open', 'In Progress', 'Closed', 'N/A'],
      colors: ['#EF4444', '#F59E0B', '#10B981', '#9CA3AF'],
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              total: { show: true, label: 'Total', fontSize: '12px',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) },
            },
          },
        },
      },
      title: { text: 'By Status', align: 'left', style: { fontSize: '13px' } },
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
          }
        },
      });
  }

  loadData(): void {
    this.loading = true;
    this.loadDeficiencyStats();
    this.loadTrendData();
  }

  private loadDeficiencyStats(): void {
    const filter = this.buildFilter();
    this.dashboardService.getDeficiencyStats(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.stats = response.data;
            this.updateCharts();
          }
          this.loading = false;
        },
        error: () => { this.loading = false; },
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

  private updateCharts(): void {
    if (!this.stats) return;

    this.agingChartOptions.series = [{
      name: 'Deficiencies',
      data: [this.stats.age0to30 || 0, this.stats.age31to60 || 0, this.stats.age61to90 || 0, this.stats.age90plus || 0],
    }];
    if (this.agingChart) this.agingChart.updateChart();

    this.severityChartOptions.series = [
      this.stats.lowCount || 0, this.stats.mediumCount || 0, this.stats.highCount || 0, this.stats.criticalCount || 0,
    ];
    if (this.severityChart) this.severityChart.updateChart();

    this.statusChartOptions.series = [
      this.stats.openDeficiencies || 0, this.stats.inProgressDeficiencies || 0,
      this.stats.closedDeficiencies || 0, this.stats.notApplicableDeficiencies || 0,
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

  private buildFilter(): DashboardFilter {
    const filter: DashboardFilter = {};
    if (this.startDate) filter.startDate = this.startDate.getTime();
    if (this.endDate) filter.endDate = this.endDate.getTime();
    if (this.selectedSystemId) filter.systemId = this.selectedSystemId;
    return filter;
  }

  private getDefaultStartDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }

  setDateRangePreset(preset: { days: number; period: string }): void {
    this.selectedPeriod = preset.period;
    this.endDate = new Date();
    this.startDate = new Date();
    this.startDate.setDate(this.endDate.getDate() - preset.days);
    this.loadData();
  }

  onSystemChange(): void { this.loadData(); }
  refresh(): void { this.loadData(); }

  viewDeficiencies(filter?: string): void {
    const queryParams: any = {};
    if (filter === 'open') queryParams.status = 1;
    else if (filter === 'critical') queryParams.severity = 4;
    else if (filter === 'overdue') queryParams.overdue = true;
    this.router.navigate(['/icm/control-deficiency'], { queryParams });
  }

  goBack(): void {
    this.router.navigate(['/icm/dashboard']);
  }

  getOverdueColor(): string {
    const pct = this.stats?.overduePercentage || 0;
    if (pct >= 30) return '#ff4d4f';
    if (pct >= 15) return '#faad14';
    return '#52c41a';
  }

  getNetChangeIndicator(): { icon: string; color: string; label: string } {
    const net = this.stats?.netChange || 0;
    if (net > 0) return { icon: 'rise', color: '#ff4d4f', label: `+${net}` };
    if (net < 0) return { icon: 'fall', color: '#52c41a', label: `${net}` };
    return { icon: 'minus', color: '#d9d9d9', label: '0' };
  }
}
