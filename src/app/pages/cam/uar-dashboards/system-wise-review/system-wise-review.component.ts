import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';
import { UarDashboardDataService } from '../services/uar-dashboard-data.service';

@Component({
  standalone: false,
  selector: 'app-system-wise-review-dashboard',
  templateUrl: './system-wise-review.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class SystemWiseReviewComponent implements OnInit {
  loading = false;

  distributionChartOptions!: Partial<ChartOptions>;
  completionChartOptions!: Partial<ChartOptions>;

  statistics: any = {};
  overallCompletionRate = 0;

  systemData: any[] = [];
  systemColumns: TableColumn[] = [
    { field: 'system', header: 'System', sortable: true, filterable: true },
    { field: 'totalUsers', header: 'Total Users', width: '120px', align: 'center', sortable: true },
    { field: 'reviewsCompleted', header: 'Completed', width: '120px', align: 'center', sortable: true },
    { field: 'reviewsPending', header: 'Pending', width: '120px', align: 'center', sortable: true },
    { field: 'completionRate', header: 'Completion %', width: '130px', align: 'center', sortable: true },
  ];

  criticalData: any[] = [];
  criticalColumns: TableColumn[] = [
    { field: 'system', header: 'System', sortable: true, filterable: true },
    { field: 'criticalityLevel', header: 'Criticality', width: '120px', type: 'tag',
      tagColors: { 'High': 'red', 'Medium': 'orange', 'Low': 'blue', default: 'default' } },
    { field: 'completionRate', header: 'Completion %', width: '130px', align: 'center', sortable: true },
    { field: 'lastReviewDate', header: 'Last Review', width: '130px' },
    { field: 'nextReviewDate', header: 'Next Review', width: '130px' },
  ];

  constructor(private dashboardService: UarDashboardDataService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.dashboardService.getSystemWiseReviewDashboardData().subscribe({
      next: (resp: any) => {
        const d = resp.data || {};
        const stats = d.systemStats || [];

        const totalUsers = stats.reduce((sum: number, s: any) => sum + (s.totalUsers || 0), 0);
        const completedReviews = stats.reduce((sum: number, s: any) => sum + (s.reviewsCompleted || 0), 0);
        const pendingReviews = stats.reduce((sum: number, s: any) => sum + (s.reviewsPending || 0), 0);
        this.overallCompletionRate = totalUsers > 0 ? +((completedReviews / totalUsers) * 100).toFixed(1) : 0;

        this.statistics = {
          totalSystems: stats.length,
          totalUsers,
          completedReviews,
          pendingReviews,
        };

        // System stats table — add computed completion rate
        this.systemData = stats.map((s: any) => ({
          ...s,
          completionRate: s.totalUsers > 0
            ? ((s.reviewsCompleted / s.totalUsers) * 100).toFixed(1) + '%'
            : '0%',
        }));

        // Critical systems table — append % to completion rate
        this.criticalData = (d.criticalSystems || []).map((s: any) => ({
          ...s,
          completionRate: s.completionRate != null ? s.completionRate + '%' : '-',
        }));

        this.initCharts(stats);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  getCompletionColor(): string {
    if (this.overallCompletionRate > 75) return '#1890ff';
    if (this.overallCompletionRate > 50) return '#faad14';
    return '#ff4d4f';
  }

  private initCharts(stats: any[]): void {
    // Pie chart — User distribution by system
    const systems = stats.map((s: any) => s.system);
    const userCounts = stats.map((s: any) => s.totalUsers);

    this.distributionChartOptions = {
      series: userCounts,
      title: { text: 'User Distribution by System' },
      icon: 'pie-chart',
      chart: { type: 'pie' },
      labels: systems,
      colors: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#ff4d4f', '#13c2c2', '#eb2f96', '#fa8c16'],
      legend: { position: 'bottom', horizontalAlign: 'center' },
      dataLabels: { enabled: true },
      tooltip: { y: { formatter: (val: number) => val + ' users' } },
    };

    // Bar chart — Completion rate by system
    const completionRates = stats.map((s: any) =>
      s.totalUsers > 0 ? +((s.reviewsCompleted / s.totalUsers) * 100).toFixed(1) : 0
    );

    this.completionChartOptions = {
      series: [{ name: 'Completion Rate', data: completionRates }],
      title: { text: 'Completion Rate by System' },
      icon: 'bar-chart',
      chart: { type: 'bar' },
      plotOptions: { bar: { columnWidth: '50%', borderRadius: 2 } },
      dataLabels: { enabled: false },
      colors: ['#1890ff'],
      xaxis: { categories: systems },
      yaxis: {
        title: { text: 'Completion Rate (%)' },
        min: 0, max: 100,
        labels: { formatter: (val: number) => val.toFixed(0) + '%' },
      },
      tooltip: { y: { formatter: (val: number) => val + '%' } },
    };
  }
}
