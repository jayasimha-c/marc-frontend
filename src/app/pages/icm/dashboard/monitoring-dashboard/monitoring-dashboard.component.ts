import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IcmDashboardService,
  ExecutionStats,
  TrendData,
  DashboardFilter,
} from '../icm-dashboard.service';
import { IcmControlService } from '../../icm-control.service';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { CommonApxChartComponent } from '../../../../shared/components/common-apx-chart/common-apx-chart.component';

@Component({
  standalone: false,
  selector: 'app-monitoring-dashboard',
  templateUrl: './monitoring-dashboard.component.html',
  styleUrls: ['./monitoring-dashboard.component.scss'],
})
export class IcmMonitoringDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('statusChart') statusChart!: CommonApxChartComponent;
  @ViewChild('trendChart') trendChart!: CommonApxChartComponent;

  private destroy$ = new Subject<void>();

  loading = true;
  loadingTrend = true;

  stats!: ExecutionStats;
  trendData!: TrendData;

  systems: any[] = [];
  selectedSystemId: number | null = null;

  autoRefreshEnabled = true;
  autoRefreshInterval = 5;
  lastRefreshTime: Date = new Date();
  refreshOptions = [
    { label: 'Off', value: 0 },
    { label: '1 min', value: 1 },
    { label: '5 min', value: 5 },
    { label: '15 min', value: 15 },
  ];

  selectedPeriod = '30d';
  periodOptions = [
    { label: '7 Days', period: '7d' },
    { label: '30 Days', period: '30d' },
    { label: '90 Days', period: '90d' },
  ];

  statusChartOptions: Partial<ChartOptions>;
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
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initCharts(): void {
    this.statusChartOptions = {
      series: [],
      chart: { type: 'donut', height: 220 },
      labels: ['Success', 'Failed', 'Running', 'Error'],
      colors: ['#10B981', '#EF4444', '#3B82F6', '#F59E0B'],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: { show: true, label: 'Today', fontSize: '12px',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) },
            },
          },
        },
      },
      title: { text: "Today's Executions", align: 'left', style: { fontSize: '13px' } },
      legend: { position: 'bottom', fontSize: '11px' },
    };

    this.trendChartOptions = {
      series: [{ name: 'Executions', data: [] }],
      chart: { type: 'line', height: 220, toolbar: { show: false }, zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: { categories: [] },
      yaxis: { labels: { formatter: (val: number) => Math.floor(val).toString() } },
      colors: ['#3B82F6'],
      title: { text: 'Execution Trend', align: 'left', style: { fontSize: '13px' } },
      markers: { size: 3 },
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

  private setupAutoRefresh(): void {
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.autoRefreshEnabled && this.autoRefreshInterval > 0) {
          const now = new Date();
          const diff = (now.getTime() - this.lastRefreshTime.getTime()) / 60000;
          if (diff >= this.autoRefreshInterval) {
            this.loadData();
          }
        }
      });
  }

  loadData(): void {
    this.loading = true;
    this.lastRefreshTime = new Date();
    this.loadExecutionStats();
    this.loadTrendData();
  }

  private loadExecutionStats(): void {
    const filter = this.buildFilter();
    this.dashboardService.getExecutionStats(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.stats = response.data;
            this.updateStatusChart();
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

  private updateStatusChart(): void {
    if (!this.stats) return;
    this.statusChartOptions.series = [
      this.stats.todaySuccessCount || 0,
      this.stats.todayFailedCount || 0,
      this.stats.todayRunningCount || 0,
      this.stats.todayErrorCount || 0,
    ];
    if (this.statusChart) this.statusChart.updateChart();
  }

  private updateTrendChart(): void {
    if (!this.trendData) return;
    const execTrend = this.trendData.executionTrend || [];
    this.trendChartOptions.xaxis = { categories: execTrend.map(p => p.date) };
    this.trendChartOptions.series = [{ name: 'Executions', data: execTrend.map(p => p.value) }];
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
  onRefreshIntervalChange(): void { this.autoRefreshEnabled = this.autoRefreshInterval > 0; }
  refresh(): void { this.loadData(); }

  viewControlResults(): void { this.router.navigate(['/icm/control-results']); }
  viewSchedulers(): void { this.router.navigate(['/icm/schedulers']); }
  goBack(): void { this.router.navigate(['/icm/dashboard']); }

  getSuccessRateColor(): string {
    const rate = this.stats?.periodSuccessRate || 0;
    if (rate >= 95) return '#52c41a';
    if (rate >= 80) return '#faad14';
    return '#ff4d4f';
  }

  getSystemHealthColor(status: string): string {
    switch (status) {
      case 'HEALTHY': return '#52c41a';
      case 'WARNING': return '#faad14';
      case 'CRITICAL': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  }

  getSystemHealthIcon(status: string): string {
    switch (status) {
      case 'HEALTHY': return 'check-circle';
      case 'WARNING': return 'warning';
      case 'CRITICAL': return 'exclamation-circle';
      default: return 'question-circle';
    }
  }

  getTimeAgo(): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - this.lastRefreshTime.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }
}
