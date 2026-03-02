import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { formatDate } from '@angular/common';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';
import { CamService } from '../../cam.service';
import { UarDashboardDataService } from '../services/uar-dashboard-data.service';

@Component({
  standalone: false,
  selector: 'app-review-progress-dashboard',
  templateUrl: './review-progress.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class ReviewProgressComponent implements OnInit {
  systemControl = new FormControl();
  sapSystems: any[] = [];
  loading = false;

  completionChartOptions!: Partial<ChartOptions>;
  statusChartOptions!: Partial<ChartOptions>;
  trendChartOptions!: Partial<ChartOptions>;

  statistics: any = {};

  departmentData: any[] = [];
  departmentColumns: TableColumn[] = [
    { field: 'groupName', header: 'Department', sortable: true, filterable: true },
    { field: 'total', header: 'Total', width: '80px', align: 'center' },
    { field: 'completed', header: 'Completed', width: '100px', align: 'center' },
    { field: 'pending', header: 'Pending', width: '90px', align: 'center' },
    { field: 'rejected', header: 'Rejected', width: '90px', align: 'center' },
    { field: 'completionRate', header: 'Completion %', width: '120px', align: 'center' },
  ];

  recentData: any[] = [];
  recentColumns: TableColumn[] = [
    { field: 'username', header: 'User', sortable: true, filterable: true },
    { field: 'reviewerName', header: 'Reviewer', sortable: true },
    { field: 'reviewedDate', header: 'Date', width: '120px' },
    { field: 'status', header: 'Status', type: 'tag', width: '110px',
      tagColors: { 'Approved': 'green', 'Pending': 'orange', 'Rejected': 'red', default: 'default' } },
    { field: 'comments', header: 'Comments', ellipsis: true },
  ];

  private statusBreakdown: any[] = [];
  private completionTrend: any[] = [];

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
    this.dashboardService.getReviewProcessDashboardData(this.systemControl.value).subscribe({
      next: (resp: any) => {
        const d = resp.data || {};

        this.statistics = {
          totalUsers: d.totalUsers || 0,
          reviewedUsers: d.reviewedUsers || 0,
          pendingReviews: d.pendingReviews || 0,
          rejectedUsers: d.rejectedUsers || 0,
          completionPercentage: d.reviewCompletionRate || 0,
        };

        // Status breakdown
        this.statusBreakdown = [];
        const breakdown = d.reviewStatusBreakdown || {};
        Object.keys(breakdown).forEach(key => {
          this.statusBreakdown.push({ status: key, count: breakdown[key] });
        });

        // Completion trend
        this.completionTrend = [];
        const trend = d.reviewCompletionTrend || {};
        Object.keys(trend).forEach(key => {
          const dt = new Date(key);
          const label = isNaN(dt.getTime()) ? key : formatDate(dt, 'dd/MM', 'en-US');
          this.completionTrend.push({ date: label, percentage: trend[key] });
        });

        // Department table
        const groups = d.reviewsByGroup || [];
        groups.forEach((item: any) => {
          item.completionRate = item.total > 0
            ? ((item.completed / item.total) * 100).toFixed(1) + '%'
            : '0%';
        });
        this.departmentData = groups;

        // Recent reviews table
        this.recentData = d.recentReviews || [];

        this.initCharts();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private initCharts(): void {
    // Radial bar — Review Completion %
    this.completionChartOptions = {
      series: [this.statistics.completionPercentage || 0],
      title: { text: 'Review Completion' },
      icon: 'dashboard',
      chart: { type: 'radialBar' },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: { size: '65%' },
          track: { strokeWidth: '80%', background: '#f5f5f5' },
          dataLabels: {
            name: { show: true, offsetY: -10, fontSize: '13px', color: 'rgba(0,0,0,0.45)' },
            value: {
              fontSize: '24px', fontWeight: 600, color: 'rgba(0,0,0,0.85)',
              formatter: (val: number) => val + '%',
            },
          },
        },
      },
      colors: ['#1890ff'],
      stroke: { lineCap: 'butt' },
      labels: ['Completion'],
    };

    // Bar chart — Status Breakdown
    this.statusChartOptions = {
      series: [{ name: 'Users', data: this.statusBreakdown.map(i => i.count) }],
      title: { text: 'Status Breakdown' },
      icon: 'bar-chart',
      chart: { type: 'bar' },
      plotOptions: { bar: { columnWidth: '45%', borderRadius: 2 } },
      dataLabels: { enabled: false },
      colors: ['#1890ff'],
      xaxis: { categories: this.statusBreakdown.map(i => i.status) },
      yaxis: { title: { text: 'Users' } },
      tooltip: { y: { formatter: (val: number) => val + ' users' } },
    };

    // Line chart — Completion Trend
    this.trendChartOptions = {
      series: [{ name: 'Completion %', data: this.completionTrend.map(i => i.percentage) }],
      title: { text: 'Completion Trend' },
      icon: 'line-chart',
      chart: { type: 'line', zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'straight', width: 2 },
      colors: ['#1890ff'],
      xaxis: { categories: this.completionTrend.map(i => i.date) },
      yaxis: {
        title: { text: 'Completion %' },
        min: 0,
        labels: { formatter: (val: number) => val.toFixed(0) + '%' },
      },
      tooltip: { y: { formatter: (val: number) => val + '%' } },
    };
  }
}
