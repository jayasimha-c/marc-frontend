import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DashboardDataService } from '../services/dashboard-data.service';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { CommonApxChartComponent } from '../../../../shared/components/common-apx-chart/common-apx-chart.component';
import { DashboardChartFormatterService } from '../../../../core/services/dashboard-chart-formatter.service';
import { TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-workflow-dashboard',
  templateUrl: './workflow-dashboard.component.html',
  styleUrls: ['./workflow-dashboard.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class WorkflowDashboardComponent implements OnInit {
  @ViewChild('approvalTimeChart') approvalTimeChart!: CommonApxChartComponent;
  @ViewChild('approvalStatusChart') approvalStatusChart!: CommonApxChartComponent;
  @ViewChild('approvalsByApproverChart') approvalsByApproverChart!: CommonApxChartComponent;
  @ViewChild('workflowStatusChart') workflowStatusChart!: CommonApxChartComponent;

  approvalTimeChartOptions!: Partial<ChartOptions>;
  approvalStatusChartOptions!: Partial<ChartOptions>;
  approvalsByApproverChartOptions!: Partial<ChartOptions>;
  workflowStatusChartOptions!: Partial<ChartOptions>;

  workflowStats: any = {};
  tableData: any[] = [];
  totalRecord: number = 0;
  loading: boolean = true;

  tableColumns: TableColumn[] = [
    { header: 'ID', field: 'id' },
    { header: 'Requestor', field: 'requesterName', sortable: true, filterable: true },
    { header: 'Role', field: 'role', sortable: true },
    { header: 'System', field: 'system', sortable: true },
    { header: 'Request Date', field: 'requestDate', type: 'date', dateFormat: 'yyyy-MM-dd', width: '130px' },
    { header: 'Status', field: 'status', type: 'tag', width: '110px',
      tagColors: { 'Pending': 'orange', 'Approved': 'green', 'Rejected': 'red', default: 'default' } },
    { header: 'Approver', field: 'approverName', sortable: true },
  ];

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
    this.dashboardDataService.getWorkflowDashboardData().subscribe({
      next: (resp: any) => {
        const d = resp.data || {};
        this.workflowStats = d.tileData || {};

        this.updateChart(this.approvalTimeChart, this.approvalTimeChartOptions, d.approvalTimeBySys);
        this.updatePieChart(this.approvalStatusChart, this.approvalStatusChartOptions, d.appByStatus);
        this.updateChart(this.approvalsByApproverChart, this.approvalsByApproverChartOptions, d.appByApprover);
        this.updateChart(this.workflowStatusChart, this.workflowStatusChartOptions, d.workflowStatus);

        this.loading = false;
        this.loadTableData();
      },
      error: () => { this.loading = false; },
    });
  }

  private initCharts(): void {
    this.approvalTimeChartOptions = {
      series: [{ name: 'Approval Time (Days)', data: [] }],
      title: { text: 'Avg. Approval Time Trend' },
      icon: 'line-chart',
      chart: { type: 'area' },
      dataLabels: { enabled: false },
      stroke: { curve: 'straight', width: 2 },
      colors: ['#1890ff'],
      xaxis: { categories: [] },
    };

    this.approvalStatusChartOptions = {
      series: [],
      title: { text: 'Approval Request Status' },
      icon: 'pie-chart',
      chart: { type: 'donut' },
      labels: [],
      dataLabels: { enabled: true },
      plotOptions: { pie: { donut: { size: '65%' } } },
      legend: { position: 'bottom' },
      colors: ['#faad14', '#52c41a', '#ff4d4f'],
    };

    this.approvalsByApproverChartOptions = {
      series: [{ name: 'Approved', data: [] }, { name: 'Rejected', data: [] }],
      title: { text: 'Approvals by Approver' },
      icon: 'team',
      chart: { type: 'bar', stacked: true },
      plotOptions: { bar: { borderRadius: 2 } },
      xaxis: { categories: [] },
      legend: { position: 'top', horizontalAlign: 'left' },
      colors: ['#52c41a', '#ff4d4f'],
    };

    this.workflowStatusChartOptions = {
      series: [{ name: 'Workflows', data: [] }],
      title: { text: 'Overall Workflow Status' },
      icon: 'branches',
      chart: { type: 'bar' },
      plotOptions: { bar: { distributed: true, horizontal: true, borderRadius: 2 } },
      dataLabels: { enabled: false },
      colors: ['#1890ff', '#faad14', '#52c41a', '#ff4d4f', '#722ed1'],
      xaxis: { categories: [] },
      legend: { show: false },
    };
  }

  private updateChart(chart: CommonApxChartComponent, options: Partial<ChartOptions>, data: any[]): void {
    if (!data || data.length === 0) return;
    this.formatterService.updateLineBarChartWithRawData(chart, options, data, false);
  }

  private updatePieChart(chart: CommonApxChartComponent, options: Partial<ChartOptions>, data: any[]): void {
    if (!data || data.length === 0) return;
    this.formatterService.updatePieChartWithRawData(chart, options, data);
  }

  loadTableData(): void {
    this.dashboardDataService.getWorkflowTableData().subscribe({
      next: (resp: any) => {
        this.tableData = resp.data?.rows || resp.data || [];
        this.totalRecord = resp.data?.total || this.tableData.length;
      },
    });
  }
}
