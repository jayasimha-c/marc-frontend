import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { CommonApxChartComponent } from '../../../../shared/components/common-apx-chart/common-apx-chart.component';
import { IssueAnalyticsService, IssueAnalyticsFilterRequest, IssueAnalyticsStat } from './issue-analytics.service';
import { CssMonitoringService } from '../css-monitoring.service';

@Component({
  standalone: false,
  selector: 'app-issue-analytics',
  templateUrl: './issue-analytics.component.html',
  styleUrls: ['./issue-analytics.component.scss'],
  providers: [DatePipe],
})
export class IssueAnalyticsComponent implements OnInit {
  @ViewChild('statusChart') statusChart!: CommonApxChartComponent;
  @ViewChild('categoryChart') categoryChart!: CommonApxChartComponent;
  @ViewChild('trendChart') trendChart!: CommonApxChartComponent;
  @ViewChild('systemChart') systemChart!: CommonApxChartComponent;
  @ViewChild('assigneeChart') assigneeChart!: CommonApxChartComponent;

  // Chart Options
  statusChartOptions!: Partial<ChartOptions>;
  categoryChartOptions!: Partial<ChartOptions>;
  trendChartOptions!: Partial<ChartOptions>;
  systemChartOptions!: Partial<ChartOptions>;
  assigneeChartOptions!: Partial<ChartOptions>;

  // Filters
  systems: any[] = [];
  categories: string[] = ['SAP_PARAMETER', 'AUDIT_LOG', 'BTP', 'HANA_DATABASE', 'SAP_ABAP', 'SAP_UME'];
  assignees: string[] = [];

  selectedSystem: number | null = null;
  selectedCategory: string | null = null;
  selectedAssignee: string | null = null;
  dateRange: Date[] = [];

  // Stats
  stats: IssueAnalyticsStat = {
    totalIssues: 0,
    openIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    closedIssues: 0,
  };

  statsCards: { title: string; value: number; icon: string; color: string }[] = [];

  // Aging
  agingStats: any = { over90Days: 0, over30Days: 0, over7Days: 0, within7Days: 0 };

  loading = false;
  initialLoadComplete = false;
  hasNoIssuesAtAll = false;
  hasNoFilteredResults = false;

  // Date presets
  activePreset: number | null = 30;

  constructor(
    private issueAnalyticsService: IssueAnalyticsService,
    private cssMonitoringService: CssMonitoringService,
    private router: Router,
    private datePipe: DatePipe,
  ) {
    this.initializeChartOptions();
    this.buildStatsCards();
  }

  ngOnInit(): void {
    this.loadSystems();
    this.loadAssignees();
    this.setPreset(30);
  }

  // -- Filters --

  private buildFilter(): IssueAnalyticsFilterRequest {
    let fromDate: string | null = null;
    let toDate: string | null = null;
    if (this.dateRange?.length === 2 && this.dateRange[0] && this.dateRange[1]) {
      fromDate = this.datePipe.transform(this.dateRange[0], 'MM/dd/yyyy') || null;
      toDate = this.datePipe.transform(this.dateRange[1], 'MM/dd/yyyy') || null;
    }
    return {
      sapSystemId: this.selectedSystem,
      fromDate,
      toDate,
      category: this.selectedCategory,
      assignee: this.selectedAssignee,
    };
  }

  get isFiltersApplied(): boolean {
    return this.selectedSystem != null || this.selectedCategory != null || this.selectedAssignee != null;
  }

  setPreset(days: number): void {
    this.activePreset = days;
    if (days === 0) {
      this.dateRange = [];
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      this.dateRange = [start, end];
    }
    this.loadDashboardData();
  }

  onDateRangeChange(): void {
    this.activePreset = null;
    this.loadDashboardData();
  }

  onFilterChange(): void {
    this.loadDashboardData();
  }

  clearFilters(): void {
    this.selectedSystem = null;
    this.selectedCategory = null;
    this.selectedAssignee = null;
    this.loadDashboardData();
  }

  // -- Data Loading --

  loadSystems(): void {
    this.cssMonitoringService.getSystemList(null as any).subscribe((resp) => {
      if (resp.success) {
        this.systems = resp.data || [];
      }
    });
  }

  loadAssignees(): void {
    this.issueAnalyticsService.getAssignees().subscribe((resp) => {
      if (resp.success) {
        this.assignees = resp.data || [];
      }
    });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.hasNoFilteredResults = false;
    const filter = this.buildFilter();

    forkJoin({
      stats: this.issueAnalyticsService.getStats(filter),
      statusBreakdown: this.issueAnalyticsService.getStatusBreakdown(filter),
      categoryBreakdown: this.issueAnalyticsService.getCategoryBreakdown(filter),
      trend: this.issueAnalyticsService.getTrend(filter),
      bySystem: this.issueAnalyticsService.getBySystem(filter),
      byAssignee: this.issueAnalyticsService.getByAssignee(filter),
      aging: this.issueAnalyticsService.getAgingStats(filter),
    })
      .pipe(finalize(() => {
        this.loading = false;
        this.initialLoadComplete = true;
      }))
      .subscribe((results) => this.updateDashboard(results));
  }

  // -- Dashboard Update --

  private updateDashboard(results: any): void {
    // Stats
    if (results.stats?.success && results.stats?.data) {
      this.stats = results.stats.data;
    }
    this.buildStatsCards();

    // Empty state
    const total = this.stats.totalIssues || 0;
    if (total === 0) {
      if (this.isFiltersApplied) {
        this.hasNoFilteredResults = true;
        this.hasNoIssuesAtAll = false;
      } else {
        this.hasNoIssuesAtAll = true;
        this.hasNoFilteredResults = false;
      }
    } else {
      this.hasNoIssuesAtAll = false;
      this.hasNoFilteredResults = false;
    }

    // Aging
    if (results.aging?.success && results.aging?.data) {
      this.agingStats = results.aging.data;
    }

    // Status donut
    if (results.statusBreakdown?.success && results.statusBreakdown?.data) {
      const d = results.statusBreakdown.data;
      this.statusChartOptions.series = d.map((i: any) => i.count);
      this.statusChartOptions.labels = d.map((i: any) => i.status);
      this.statusChart?.updateChart();
    }

    // Category donut
    if (results.categoryBreakdown?.success && results.categoryBreakdown?.data) {
      const d = results.categoryBreakdown.data;
      this.categoryChartOptions.series = d.map((i: any) => i.count);
      this.categoryChartOptions.labels = d.map((i: any) => i.category);
      this.categoryChart?.updateChart();
    }

    // Trend line
    if (results.trend?.success && results.trend?.data) {
      const d = results.trend.data;
      this.trendChartOptions.series = d.series || [];
      this.trendChartOptions.xaxis = { categories: d.categories || [] };
      this.trendChart?.updateChart();
    }

    // System bar
    if (results.bySystem?.success && results.bySystem?.data) {
      const d = results.bySystem.data;
      this.systemChartOptions.series = [{ name: 'Issues', data: d.map((i: any) => i.count) }];
      this.systemChartOptions.xaxis = { categories: d.map((i: any) => i.system) };
      this.systemChart?.updateChart();
    }

    // Assignee donut
    if (results.byAssignee?.success && results.byAssignee?.data) {
      const d = results.byAssignee.data;
      this.assigneeChartOptions.series = d.map((i: any) => i.count);
      this.assigneeChartOptions.labels = d.map((i: any) => i.assignee);
      this.assigneeChart?.updateChart();
    }
  }

  private buildStatsCards(): void {
    this.statsCards = [
      { title: 'Total Issues', value: this.stats.totalIssues || 0, icon: 'file-text', color: '#595959' },
      { title: 'Open', value: this.stats.openIssues || 0, icon: 'exclamation-circle', color: '#faad14' },
      { title: 'In Progress', value: this.stats.inProgressIssues || 0, icon: 'sync', color: '#1890ff' },
      { title: 'Resolved', value: this.stats.resolvedIssues || 0, icon: 'check-circle', color: '#52c41a' },
      { title: 'Closed', value: this.stats.closedIssues || 0, icon: 'close-circle', color: '#8c8c8c' },
    ];
  }

  // -- Chart Init --

  private initializeChartOptions(): void {
    this.initStatusChart();
    this.initCategoryChart();
    this.initTrendChart();
    this.initSystemChart();
    this.initAssigneeChart();
  }

  private initStatusChart(): void {
    this.statusChartOptions = {
      series: [],
      chart: { type: 'donut', height: 300 },
      title: { text: 'Issues by Status' },
      labels: [],
      colors: ['#faad14', '#1890ff', '#52c41a', '#8c8c8c'],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString(),
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (_val: any, opts: any) => opts.w.config.series[opts.seriesIndex],
      },
      legend: { position: 'bottom' },
      icon: 'pie-chart',
    };
  }

  private initCategoryChart(): void {
    this.categoryChartOptions = {
      series: [],
      chart: { type: 'donut', height: 300 },
      title: { text: 'Issues by Category' },
      labels: [],
      colors: ['#722ed1', '#eb2f96', '#faad14', '#13c2c2', '#1890ff', '#2f54eb'],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString(),
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (_val: any, opts: any) => Math.round(opts.w.config.series[opts.seriesIndex]).toString(),
      },
      legend: { position: 'bottom' },
      icon: 'pie-chart',
    };
  }

  private initTrendChart(): void {
    this.trendChartOptions = {
      series: [],
      chart: { type: 'line', height: 280 },
      title: { text: 'Issues Trend (Created vs Resolved)' },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: { categories: [] },
      yaxis: {
        title: { text: 'Issue Count' },
        min: 0,
        forceNiceScale: true,
        labels: { formatter: (val: any) => Math.round(Number(val)).toString() },
      },
      colors: ['#f5222d', '#52c41a'],
      legend: { position: 'top' },
      markers: { size: 4 },
      tooltip: {
        shared: true,
        intersect: false,
        y: { formatter: (val: any) => Math.round(Number(val)).toString() },
      },
      dataLabels: { enabled: false },
      icon: 'line-chart',
    };
  }

  private initSystemChart(): void {
    this.systemChartOptions = {
      series: [],
      chart: { type: 'bar', height: 280 },
      title: { text: 'Issues by System' },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => Math.round(Number(val)).toString(),
      },
      xaxis: { categories: [] },
      yaxis: { labels: { formatter: (val: any) => Math.round(Number(val)).toString() } },
      tooltip: { y: { formatter: (val: any) => Math.round(Number(val)).toString() } },
      colors: ['#1890ff'],
      icon: 'bar-chart',
    };
  }

  private initAssigneeChart(): void {
    this.assigneeChartOptions = {
      series: [],
      chart: { type: 'donut', height: 300 },
      title: { text: 'Issues by Assignee (Top 10)' },
      labels: [],
      colors: ['#13c2c2', '#faad14', '#722ed1', '#f5222d', '#1890ff', '#52c41a', '#eb2f96', '#2f54eb', '#a0d911', '#fa8c16'],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString(),
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (_val: any, opts: any) => Math.round(opts.w.config.series[opts.seriesIndex]).toString(),
      },
      legend: { position: 'bottom' },
      icon: 'pie-chart',
    };
  }

  // -- Helpers --

  getAgingTotal(): number {
    return (this.agingStats.over90Days || 0) +
      (this.agingStats.over30Days || 0) +
      (this.agingStats.over7Days || 0) +
      (this.agingStats.within7Days || 0);
  }

  getAgingPct(key: string): number {
    const total = this.getAgingTotal();
    return total > 0 ? ((this.agingStats[key] || 0) / total) * 100 : 0;
  }

  navigateToViolations(): void {
    this.router.navigate(['/css/monitoring/parameter-violations']);
  }

  drillDownToViolations(filterType: string, filterValue: string): void {
    this.router.navigate(['/css/monitoring/parameter-violations'], {
      queryParams: { [filterType]: filterValue },
    });
  }
}
