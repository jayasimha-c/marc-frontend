import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DashboardDataService } from '../services/dashboard-data.service';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { CommonApxChartComponent } from '../../../../shared/components/common-apx-chart/common-apx-chart.component';
import { DashboardChartFormatterService } from '../../../../core/services/dashboard-chart-formatter.service';
import { TableColumn, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-usage-dashboard',
  templateUrl: './usage-dashboard.component.html',
  styleUrls: ['./usage-dashboard.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class UsageDashboardComponent implements OnInit {
  @ViewChild('transactionsByUserChart') transactionsByUserChart!: CommonApxChartComponent;
  @ViewChild('transactionsByRoleChart') transactionsByRoleChart!: CommonApxChartComponent;
  @ViewChild('topTransactionsChart') topTransactionsChart!: CommonApxChartComponent;

  transactionsByUserChartOptions!: Partial<ChartOptions>;
  transactionsByRoleChartOptions!: Partial<ChartOptions>;
  topTransactionsChartOptions!: Partial<ChartOptions>;

  tableData: any[] = [];
  totalRecord: number = 0;
  loading: boolean = true;

  tableColumns: TableColumn[] = [
    { header: 'ID', field: 'changeNumber' },
    { header: 'User', field: 'requester', sortable: true, filterable: true },
    { header: 'Object', field: 'object', sortable: true },
    { header: 'Timestamp', field: 'txnDate', type: 'date', dateFormat: 'yyyy-MM-dd HH:mm:ss', width: '180px' },
    { header: 'Details', field: 'details', ellipsis: true },
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
    this.dashboardDataService.getUsageDashboardData().subscribe({
      next: (resp: any) => {
        const d = resp.data || {};

        this.updateChart(this.transactionsByUserChart, this.transactionsByUserChartOptions, d.txnsByUser);
        this.updateChart(this.transactionsByRoleChart, this.transactionsByRoleChartOptions, d.txnsByRole);
        this.updateChart(this.topTransactionsChart, this.topTransactionsChartOptions, d.mostUsedTxns);

        this.loading = false;
        this.loadTableData({ pageIndex: 1, pageSize: 10 } as any);
      },
      error: () => { this.loading = false; },
    });
  }

  private initCharts(): void {
    this.transactionsByUserChartOptions = {
      series: [{ name: 'Transactions', data: [] }],
      title: { text: 'Transactions by User' },
      icon: 'user',
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true, borderRadius: 2 } },
      dataLabels: { enabled: false },
      colors: ['#1890ff'],
      xaxis: { categories: [] },
    };

    this.transactionsByRoleChartOptions = {
      series: [{ name: 'Transactions', data: [] }],
      title: { text: 'Transactions by Role' },
      icon: 'team',
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true, borderRadius: 2 } },
      dataLabels: { enabled: false },
      colors: ['#52c41a'],
      xaxis: { categories: [] },
    };

    this.topTransactionsChartOptions = {
      series: [{ name: 'Usage Count', data: [] }],
      title: { text: 'Most Used Transactions' },
      icon: 'bar-chart',
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true, borderRadius: 2 } },
      dataLabels: { enabled: false },
      colors: ['#722ed1'],
      xaxis: { categories: [] },
    };
  }

  private updateChart(chart: CommonApxChartComponent, options: Partial<ChartOptions>, data: any[]): void {
    if (!data || data.length === 0) return;
    this.formatterService.updateLineBarChartWithRawData(chart, options, data, false);
  }

  loadTableData(event: TableQueryParams | any): void {
    if (!event) return;

    const pageOffset = ((event.pageIndex || 1) - 1) * (event.pageSize || 10);
    const limit = event.pageSize || 10;

    const query = {
      first: pageOffset,
      rows: limit,
      sortOrder: event?.sort?.direction === 'descend' ? -1 : 1,
      sortField: event?.sort?.field || 'txnDate',
      filters: event?.filters || {},
    };

    this.dashboardDataService.getUsageTableData(query).subscribe({
      next: (resp: any) => {
        this.tableData = resp.data?.rows || [];
        this.totalRecord = resp.data?.total || 0;
      },
    });
  }
}
