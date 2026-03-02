import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DashboardDataService } from '../services/dashboard-data.service';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { CommonApxChartComponent } from '../../../../shared/components/common-apx-chart/common-apx-chart.component';
import { DashboardChartFormatterService } from '../../../../core/services/dashboard-chart-formatter.service';

@Component({
  standalone: false,
  selector: 'app-overview-dashboard',
  templateUrl: './overview-dashboard.component.html',
  styleUrls: ['./overview-dashboard.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class OverviewDashboardComponent implements OnInit {
  @ViewChild('requestsChart') requestsChart!: CommonApxChartComponent;
  @ViewChild('sodRisksChart') sodRisksChart!: CommonApxChartComponent;
  @ViewChild('topUsersChart') topUsersChart!: CommonApxChartComponent;
  @ViewChild('topRolesChart') topRolesChart!: CommonApxChartComponent;

  requestsChartOptions!: Partial<ChartOptions>;
  sodRisksChartOptions!: Partial<ChartOptions>;
  topUsersChartOptions!: Partial<ChartOptions>;
  topRolesChartOptions!: Partial<ChartOptions>;

  totalRequests: number = 0;
  activePrivilegedIds: number = 0;
  pendingApprovals: number = 0;
  sodRisks: any = { critical: 0 };
  loading: boolean = true;

  constructor(
    private dashboardDataService: DashboardDataService,
    private formatterService: DashboardChartFormatterService,
  ) {
    this.initCharts();
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.dashboardDataService.getOverviewDashboardData().subscribe({
      next: (resp: any) => {
        const d = resp.data || {};
        this.totalRequests = d.totalRequests || 0;
        this.activePrivilegedIds = d.activePrivIds || 0;
        this.pendingApprovals = d.pendingRequests || 0;
        this.sodRisks = { critical: d.sodRisksCritical || 0 };

        this.updateChart(this.requestsChart, this.requestsChartOptions, d.monthlyRequests, true);
        this.updateSodRisksChart(d.sodRisksCritical || 0, d.sodRisksNonCritical || 0);
        this.updateChart(this.topUsersChart, this.topUsersChartOptions, d.top5Requestors, false);
        this.updateChart(this.topRolesChart, this.topRolesChartOptions, d.mostUsedPrivRoles, false);

        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private initCharts(): void {
    this.requestsChartOptions = {
      series: [{ name: 'Requests', data: [] }],
      title: { text: 'Privileged Access Requests' },
      icon: 'line-chart',
      chart: { type: 'line', zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'straight', width: 2 },
      colors: ['#1890ff'],
      xaxis: { categories: [] },
    };

    this.sodRisksChartOptions = {
      series: [],
      title: { text: 'SoD Risks Detected' },
      icon: 'pie-chart',
      chart: { type: 'donut' },
      labels: [],
      dataLabels: { enabled: true },
      plotOptions: { pie: { donut: { size: '65%' } } },
      legend: { position: 'bottom' },
      colors: ['#ff4d4f', '#faad14'],
    };

    this.topUsersChartOptions = {
      series: [{ name: 'Access Count', data: [] }],
      title: { text: 'Top Users by Access Usage' },
      icon: 'user',
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true, borderRadius: 2 } },
      dataLabels: { enabled: false },
      colors: ['#1890ff'],
      xaxis: { categories: [] },
    };

    this.topRolesChartOptions = {
      series: [{ name: 'Usage Count', data: [] }],
      title: { text: 'Most Used Privileged Roles' },
      icon: 'team',
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true, borderRadius: 2 } },
      dataLabels: { enabled: false },
      colors: ['#52c41a'],
      xaxis: { categories: [] },
    };
  }

  private updateChart(chart: CommonApxChartComponent, options: Partial<ChartOptions>, data: any[], parseDate: boolean): void {
    if (!data || data.length === 0) return;
    this.formatterService.updateLineBarChartWithRawData(chart, options, data, parseDate);
  }

  private updateSodRisksChart(critical: number, nonCritical: number): void {
    if (critical === 0 && nonCritical === 0) return;
    this.sodRisksChartOptions.series = [critical, nonCritical];
    this.sodRisksChartOptions.labels = ['Critical', 'Non-Critical'];
    if (this.sodRisksChart) this.sodRisksChart.updateChart();
  }
}
