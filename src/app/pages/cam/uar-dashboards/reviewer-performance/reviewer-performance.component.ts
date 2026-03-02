import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';
import { CamService } from '../../cam.service';
import { UarDashboardDataService } from '../services/uar-dashboard-data.service';

@Component({
  standalone: false,
  selector: 'app-reviewer-performance-dashboard',
  templateUrl: './reviewer-performance.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class ReviewerPerformanceComponent implements OnInit {
  systemControl = new FormControl();
  sapSystems: any[] = [];
  loading = false;

  topReviewersChartOptions!: Partial<ChartOptions>;
  timeDistributionChartOptions!: Partial<ChartOptions>;

  statistics: any = {};

  performanceData: any[] = [];
  performanceColumns: TableColumn[] = [
    { field: 'reviewerName', header: 'Reviewer', sortable: true, filterable: true },
    { field: 'reviewsCompleted', header: 'Reviews Completed', width: '150px', align: 'center', sortable: true },
    { field: 'avgTime', header: 'Avg Time (hours)', width: '140px', align: 'center', sortable: true },
    { field: 'pendingReviews', header: 'Pending Reviews', width: '140px', align: 'center', sortable: true },
  ];

  pendingData: any[] = [];
  pendingColumns: TableColumn[] = [
    { field: 'reviewerName', header: 'Reviewer', sortable: true, filterable: true },
    { field: 'pendingReviews', header: 'Pending Reviews', width: '140px', align: 'center', sortable: true },
    { field: 'oldestTask', header: 'Oldest Task', width: '120px' },
    { field: 'daysPending', header: 'Days Pending', width: '120px', align: 'center', sortable: true },
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
    this.dashboardService.getReviewPerformanceDashboardData(this.systemControl.value).subscribe({
      next: (resp: any) => {
        const d = resp.data || {};
        this.dashboardData = d;

        this.statistics = {
          topReviewer: d.topReviewer || '-',
          completedReviews: d.completedReviews || 0,
          avgTimePerReview: d.avgTimePerReview || 0,
          pendingReviews: d.pendingReviews || 0,
        };

        this.performanceData = d.reviewPerformanceDetails || [];
        this.pendingData = d.pendingReviewsByReviewer || [];

        this.initCharts();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private initCharts(): void {
    // Top Reviewers — horizontal bar chart
    const topReviewers = this.dashboardData.topReviewers || {};
    const reviewerNames = Object.keys(topReviewers);
    const reviewerCounts = Object.values(topReviewers) as number[];

    this.topReviewersChartOptions = {
      series: [{ name: 'Reviews Completed', data: reviewerCounts }],
      title: { text: 'Top Reviewers' },
      icon: 'team',
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true, columnWidth: '50%', borderRadius: 2 } },
      dataLabels: { enabled: false },
      colors: ['#52c41a'],
      xaxis: { categories: reviewerNames },
      yaxis: { title: { text: 'Reviews Completed' } },
      tooltip: { y: { formatter: (val: number) => val + ' reviews' } },
    };

    // Review Time Distribution — vertical bar chart
    // Note: API response key has typo "riviewDistribution"
    const distribution = this.dashboardData.riviewDistribution || {};
    const timeRanges = Object.keys(distribution);
    const timeCounts = Object.values(distribution) as number[];

    this.timeDistributionChartOptions = {
      series: [{ name: 'Reviews', data: timeCounts }],
      title: { text: 'Review Time Distribution' },
      icon: 'clock-circle',
      chart: { type: 'bar' },
      plotOptions: { bar: { columnWidth: '50%', borderRadius: 2 } },
      dataLabels: { enabled: false },
      colors: ['#1890ff'],
      xaxis: { categories: timeRanges },
      yaxis: { title: { text: 'Number of Reviews' } },
      tooltip: { y: { formatter: (val: number) => val + ' reviews' } },
    };
  }
}
