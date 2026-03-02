import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { TableColumn, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { ChartOptions } from '../../../../shared/models/chart.model';
import {
  ReportService,
  RemDashboardFilterRequest,
  RemDashboardStatsVO,
} from '../report.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-rem-dashboard',
  templateUrl: './rem-dashboard.component.html',
  styleUrls: ['./rem-dashboard.component.scss'],
})
export class RemDashboardComponent implements OnInit {
  selectedSapSys = '';
  sapSysList: string[] = [];
  loading = false;

  datePresets = [
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
    { label: 'All', days: 365 },
  ];
  selectedPreset = '30d';
  dateRange: Date[] = [];

  stats: RemDashboardStatsVO = {
    totalExecutions: 0,
    uniqueRisks: 0,
    uniqueUsers: 0,
    sodCount: 0,
    otherCount: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    riskTypeDistribution: [],
    riskLevelDistribution: [],
    businessProcessDistribution: [],
    trendData: [],
    topUsers: [],
    topRisks: [],
    availableBusinessProcesses: [],
    availableUsers: [],
  };

  trendChartOptions: Partial<ChartOptions>;
  riskTypeChartOptions: Partial<ChartOptions>;
  riskLevelChartOptions: Partial<ChartOptions>;

  gridColumns: TableColumn[] = [
    { field: 'riskName', header: 'Risk', type: 'text', sortable: true },
    {
      field: 'riskLevel', header: 'Level', type: 'tag', sortable: true,
      tagColors: { Critical: 'red', High: 'orange', Medium: 'gold', Low: 'green' },
    },
    { field: 'userId', header: 'User', type: 'text', sortable: true },
    { field: 'tranCode', header: 'T-Code', type: 'text', sortable: true },
    { field: 'tranDateStr', header: 'Date', type: 'text', sortable: true },
  ];
  gridData: any[] = [];
  gridTotal = 0;
  gridLoading = false;
  private lastGridParams: TableQueryParams | null = null;

  constructor(
    private reportService: ReportService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.initCharts();
    this.setDatePreset('30d');
    this.loadSapSystems();
  }

  setDatePreset(preset: string): void {
    this.selectedPreset = preset;
    const days = this.datePresets.find(p => p.label === preset)?.days || 30;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    this.dateRange = [start, end];
  }

  onPresetChange(preset: string): void {
    this.setDatePreset(preset);
    this.loadDashboardData();
  }

  onDateRangeChange(): void {
    this.selectedPreset = null;
    this.loadDashboardData();
  }

  onSystemChange(): void {
    this.loadDashboardData();
  }

  private loadSapSystems(): void {
    this.reportService.getRemSysNames().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.sapSysList = resp.data;
          if (this.sapSysList.length > 0) {
            this.selectedSapSys = this.sapSysList[0];
            this.loadDashboardData();
          }
        }
      },
      error: (err) => this.notify.handleHttpError(err),
    });
  }

  private buildFilterRequest(): RemDashboardFilterRequest {
    const startDate = this.dateRange?.[0]
      ? formatDate(this.dateRange[0], 'dd/MM/yyyy', 'en-US')
      : null;
    const endDate = this.dateRange?.[1]
      ? formatDate(this.dateRange[1], 'dd/MM/yyyy', 'en-US')
      : null;

    return {
      sapDestinationName: this.selectedSapSys,
      startDate,
      endDate,
      page: 0,
      size: 10,
      sortDirection: 'DESC',
    };
  }

  loadDashboardData(): void {
    if (!this.selectedSapSys) return;

    this.loading = true;
    const request = this.buildFilterRequest();

    this.reportService.getRemDashboardStats(request).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.stats = resp.data;
          this.updateCharts();
        }
        this.loading = false;
        this.loadGridData();
      },
      error: (err) => {
        this.loading = false;
        this.notify.handleHttpError(err);
      },
    });
  }

  onGridQueryChange(params: TableQueryParams): void {
    this.lastGridParams = params;
    if (this.selectedSapSys) {
      this.loadGridData();
    }
  }

  loadGridData(): void {
    if (!this.selectedSapSys) return;

    this.gridLoading = true;
    const request = this.buildFilterRequest();

    if (this.lastGridParams) {
      request.page = this.lastGridParams.pageIndex - 1;
      request.size = this.lastGridParams.pageSize;
      if (this.lastGridParams.sort?.direction) {
        request.sortField = this.lastGridParams.sort.field;
        request.sortDirection =
          this.lastGridParams.sort.direction === 'ascend' ? 'ASC' : 'DESC';
      }
    }

    this.reportService.getRemDashboardExecutions(request).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.gridData = resp.data.rows || [];
          this.gridTotal = resp.data.records || 0;
        }
        this.gridLoading = false;
      },
      error: (err) => {
        this.gridLoading = false;
        this.notify.handleHttpError(err);
      },
    });
  }

  private initCharts(): void {
    this.trendChartOptions = {
      series: [{ name: 'Executions', data: [] }],
      chart: { type: 'line', height: 280 },
      stroke: { curve: 'smooth', width: 3 },
      colors: ['#1890ff'],
      xaxis: { categories: [] },
      grid: { row: { colors: ['#fafafa', 'transparent'], opacity: 0.5 } },
      title: { text: 'Execution Trend' },
      dataLabels: { enabled: false },
    };

    this.riskTypeChartOptions = {
      series: [],
      chart: { type: 'donut', height: 280 },
      labels: [],
      colors: ['#faad14', '#1890ff', '#52c41a', '#722ed1'],
      legend: { position: 'bottom', fontSize: '12px' },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: { show: true, total: { show: true, label: 'Total' } },
          },
        },
      },
      title: { text: 'Risk Type Distribution' },
      dataLabels: { enabled: false },
    };

    this.riskLevelChartOptions = {
      series: [{ name: 'Count', data: [] }],
      chart: { type: 'bar', height: 280 },
      plotOptions: {
        bar: { horizontal: true, barHeight: '60%', borderRadius: 4, distributed: true },
      },
      colors: ['#f5222d', '#fa8c16', '#fadb14', '#52c41a'],
      xaxis: { categories: [] },
      legend: { show: false },
      title: { text: 'Risk Level Breakdown' },
      dataLabels: { enabled: false },
    };
  }

  private updateCharts(): void {
    if (this.stats.trendData?.length > 0) {
      this.trendChartOptions = {
        ...this.trendChartOptions,
        series: [{ name: 'Executions', data: this.stats.trendData.map(t => t.count) }],
        xaxis: { categories: this.stats.trendData.map(t => t.date) },
      };
    }

    if (this.stats.riskTypeDistribution?.length > 0) {
      const typeColors: Record<string, string> = {
        SoD: '#faad14', SOD: '#faad14', Other: '#1890ff',
        Sensitive: '#722ed1', Critical: '#f5222d',
      };
      this.riskTypeChartOptions = {
        ...this.riskTypeChartOptions,
        series: this.stats.riskTypeDistribution.map(d => d.value),
        labels: this.stats.riskTypeDistribution.map(d => d.label),
        colors: this.stats.riskTypeDistribution.map(d => typeColors[d.label] || '#1890ff'),
      };
    }

    if (this.stats.riskLevelDistribution?.length > 0) {
      const levelColors: Record<string, string> = {
        Critical: '#f5222d', High: '#fa8c16', Medium: '#fadb14', Low: '#52c41a',
      };
      const order = ['Critical', 'High', 'Medium', 'Low'];
      const sorted = order
        .map(l => this.stats.riskLevelDistribution.find(d => d.label === l))
        .filter(d => !!d);

      this.riskLevelChartOptions = {
        ...this.riskLevelChartOptions,
        series: [{ name: 'Count', data: sorted.map(d => d.value) }],
        xaxis: { categories: sorted.map(d => d.label) },
        colors: sorted.map(d => levelColors[d.label] || '#1890ff'),
      };
    }
  }

  get sodPercentage(): string {
    if (!this.stats.totalExecutions) return 'Violations';
    return ((this.stats.sodCount / this.stats.totalExecutions) * 100).toFixed(0) + '% of total';
  }
}
