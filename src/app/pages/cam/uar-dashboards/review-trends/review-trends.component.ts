import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { formatDate } from '@angular/common';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';
import { CamService } from '../../cam.service';
import { UarDashboardDataService } from '../services/uar-dashboard-data.service';

@Component({
  standalone: false,
  selector: 'app-review-trends-dashboard',
  templateUrl: './review-trends.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class ReviewTrendsComponent implements OnInit {
  systemControl = new FormControl();
  sapSystems: any[] = [];
  loading = false;

  complianceTrendChartOptions!: Partial<ChartOptions>;
  reviewVolumeChartOptions!: Partial<ChartOptions>;

  statistics: any = {};

  complianceData: any[] = [];
  complianceColumns: TableColumn[] = [
    { field: 'groupName', header: 'Department', sortable: true, filterable: true },
    { field: 'totalReviews', header: 'Total Reviews', width: '120px', align: 'center' },
    { field: 'onTimeReviews', header: 'On-Time', width: '100px', align: 'center' },
    { field: 'overdueReviews', header: 'Overdue', width: '100px', align: 'center' },
    { field: 'complianceRate', header: 'Compliance %', width: '120px', align: 'center' },
  ];

  overdueData: any[] = [];
  overdueColumns: TableColumn[] = [
    { field: 'reviewerName', header: 'User', sortable: true, filterable: true },
    { field: 'groupName', header: 'Department', sortable: true },
    { field: 'dueDate', header: 'Due Date', width: '120px' },
    { field: 'daysOverdue', header: 'Days Overdue', width: '120px', align: 'center', sortable: true },
    { field: 'assignedTo', header: 'Assigned To', ellipsis: true },
  ];

  private dashboardData: any = {};

  constructor(
    private camService: CamService,
    private dashboardService: UarDashboardDataService,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.camService.getSapSystems().subscribe({
      next: (response: any) => {
        this.sapSystems = response.data || response || [];
        if (this.sapSystems.length > 0) {
          this.systemControl.setValue(this.sapSystems[0]?.id);
        }
        this.loadDashboardData();
      },
      error: () => { this.loading = false; },
    });
  }

  sapSystemChange(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    if (!this.systemControl.value) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.dashboardService.getReviewTrendsDashboardData(this.systemControl.value).subscribe({
      next: (resp: any) => {
        const d = resp.data || {};
        this.dashboardData = d;

        // KPI statistics
        const stats = d.complianceStats || {};
        this.statistics = {
          onTimeRate: stats.onTimeCompletionRate || 0,
          overdueReviews: stats.overdueReviews || 0,
          avgDays: stats.avgDaysToComplete || 0,
          complianceStatus: d.complianceStatus || 0,
        };

        // Compliance by department table
        const groups = d.complianceByGroupDetails || [];
        groups.forEach((item: any) => {
          item.complianceRate = item.totalReviews > 0
            ? ((item.onTimeReviews / item.totalReviews) * 100).toFixed(1) + '%'
            : '0%';
        });
        this.complianceData = groups;

        // Overdue reviews table
        const overdue = d.overdueReviewDetails || [];
        overdue.forEach((item: any) => {
          if (typeof item.assignedTo === 'string') {
            item.assignedTo = item.assignedTo || '';
          }
        });
        this.overdueData = overdue;

        this.initCharts();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private initCharts(): void {
    // Compliance Trend Line Chart
    const trends = this.dashboardData.reviewComplianceTrends || [];
    const trendDates = trends.map((item: any) => {
      const dt = new Date(item.reviewDate);
      return isNaN(dt.getTime()) ? item.reviewDate : formatDate(dt, 'dd/MM', 'en-US');
    });
    const complianceRates = trends.map((item: any) => item.complianceRate);
    const targetRates = trends.map((item: any) => item.targetRate);

    this.complianceTrendChartOptions = {
      series: [
        { name: 'Compliance Rate', data: complianceRates },
        { name: 'Target Rate', data: targetRates },
      ],
      title: { text: 'Compliance Trend' },
      icon: 'line-chart',
      chart: { type: 'line', zoom: { enabled: false } },
      stroke: { width: [2, 2], dashArray: [0, 4], curve: 'straight' },
      dataLabels: { enabled: false },
      colors: ['#1890ff', '#faad14'],
      xaxis: { categories: trendDates },
      yaxis: {
        title: { text: 'Compliance Rate (%)' },
        min: 0, max: 100,
        labels: { formatter: (val: number) => val.toFixed(0) + '%' },
      },
      tooltip: { y: { formatter: (val: number) => val + '%' } },
      legend: { position: 'top', horizontalAlign: 'right' },
    };

    // Review Volume Stacked Bar Chart
    const volume = this.dashboardData.reviewVolumeTrend || [];
    const volDates = volume.map((item: any) => {
      const parts = (item.reviewMonth || '').split('-');
      if (parts.length === 2) {
        const dt = new Date(+parts[0], +parts[1] - 1);
        return formatDate(dt, 'MMM yyyy', 'en-US');
      }
      return item.reviewMonth;
    });
    const completed = volume.map((item: any) => item.completedReviews);
    const pending = volume.map((item: any) => item.pendingReviews);

    this.reviewVolumeChartOptions = {
      series: [
        { name: 'Completed', data: completed },
        { name: 'Pending', data: pending },
      ],
      title: { text: 'Review Volume Trend' },
      icon: 'bar-chart',
      chart: { type: 'bar', stacked: true },
      plotOptions: { bar: { columnWidth: '50%', borderRadius: 2 } },
      dataLabels: { enabled: false },
      colors: ['#52c41a', '#ff4d4f'],
      xaxis: { categories: volDates },
      yaxis: { title: { text: 'Number of Reviews' } },
      tooltip: { y: { formatter: (val: number) => val + ' reviews' } },
      legend: { position: 'top', horizontalAlign: 'right' },
    };
  }
}
