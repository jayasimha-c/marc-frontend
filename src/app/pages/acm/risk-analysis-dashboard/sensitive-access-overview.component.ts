import { Component, Input, OnChanges } from '@angular/core';
import { ChartOptions } from '../../../shared/models/chart.model';
import { TableColumn, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';
import { ReportService } from '../reports/report.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-sensitive-access-overview',
  templateUrl: './sensitive-access-overview.component.html',
})
export class SensitiveAccessOverviewComponent implements OnChanges {
  @Input() systemId: number = 0;
  @Input() startDate = '';
  @Input() endDate = '';

  loading = false;
  totalSensitive = 0;
  criticalAccess = 0;
  pendingReviews = 0;
  reviewCompliance = 0;

  accessDistributionChart: Partial<ChartOptions> = {};
  accessTrendsChart: Partial<ChartOptions> = {};

  gridColumns: TableColumn[] = [
    { field: 'userId', header: 'User Id', type: 'text', sortable: true },
    { field: 'sapDestinationName', header: 'System', type: 'tag', sortable: true },
    { field: 'tranCode', header: 'Transaction Code', type: 'text', sortable: true },
    { field: 'accessLevel', header: 'Access Level', type: 'text', sortable: true },
    { field: 'reviewStatus', header: 'Review Status', type: 'tag', sortable: true },
    { field: 'riskLevel', header: 'Risk Level', type: 'tag', sortable: true,
      tagColors: { Critical: 'red', High: 'orange', Medium: 'gold', Low: 'green' } },
    { field: 'lastAccessed', header: 'Last Accessed', type: 'date', sortable: true },
    { field: 'frequency', header: 'Frequency', type: 'text', sortable: true },
  ];
  gridData: any[] = [];
  gridTotal = 0;
  gridLoading = false;
  private lastGridParams: TableQueryParams | null = null;

  constructor(private reportService: ReportService, private notify: NotificationService) {}

  ngOnChanges(): void {
    if (this.systemId && this.startDate && this.endDate) {
      this.loadSummary();
    }
  }

  private loadSummary(): void {
    this.loading = true;
    this.reportService.getDashboardSensitiveAccess(this.systemId, this.startDate, this.endDate).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          const d = resp.data;
          this.totalSensitive = d.totalSensitiveViolations || 0;
          this.criticalAccess = d.criticalAccessViolations || 0;
          this.pendingReviews = d.pendingReviews || 0;
          this.reviewCompliance = d.reviewCompliance || 0;
          this.buildCharts(d);
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.handleHttpError(err);
      },
    });
  }

  onGridQueryChange(params: TableQueryParams): void {
    this.lastGridParams = params;
    this.loadGridData();
  }

  private loadGridData(): void {
    const p = this.lastGridParams;
    const sortOrder = p?.sort?.direction === 'ascend' ? 1 : p?.sort?.direction === 'descend' ? -1 : 0;
    this.gridLoading = true;
    this.reportService.getDashboardRisksTable({
      first: p ? (p.pageIndex - 1) * p.pageSize : 0,
      rows: p?.pageSize || 20,
      sortOrder,
      sortField: p?.sort?.field || '',
      filters: [],
    }).subscribe({
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

  private buildCharts(data: any): void {
    const dist = data.riskLevelDistribution || [];
    this.accessDistributionChart = {
      series: dist.map((d: any) => d.value),
      chart: { type: 'donut', height: 300, toolbar: { show: false } },
      labels: dist.map((d: any) => d.label),
      colors: ['#f5222d', '#fa8c16', '#faad14', '#52c41a'],
      title: { text: 'Access Distribution by Risk Level' },
      plotOptions: { pie: { donut: { size: '60%' } } },
      legend: { position: 'bottom' },
      noData: { text: 'No data available' },
    };

    const trends = data.accessFrequencyTrends || {};
    const dates = Object.keys(trends);
    const series: any[] = [];
    if (dates.length > 0) {
      const levels = Object.keys(trends[dates[0]] || {});
      levels.forEach(level => {
        series.push({
          name: level,
          data: dates.map(d => trends[d]?.[level] || 0),
        });
      });
    }
    this.accessTrendsChart = {
      series,
      chart: { type: 'line', height: 280, toolbar: { show: false } },
      xaxis: { categories: dates },
      colors: ['#f5222d', '#fa8c16', '#1890ff'],
      title: { text: 'Access Frequency Trend' },
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 4 },
      dataLabels: { enabled: false },
      noData: { text: 'No data available' },
    };
  }
}
