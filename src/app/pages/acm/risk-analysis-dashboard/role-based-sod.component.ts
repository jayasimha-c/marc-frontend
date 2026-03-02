import { Component, Input, OnChanges, TemplateRef, ViewChild } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ChartOptions } from '../../../shared/models/chart.model';
import { TableColumn, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';
import { ReportService } from '../reports/report.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-role-based-sod',
  templateUrl: './role-based-sod.component.html',
})
export class RoleBasedSodComponent implements OnChanges {
  @Input() systemId: number = 0;
  @Input() startDate = '';
  @Input() endDate = '';
  @ViewChild('detailModalTpl', { static: true }) detailModalTpl!: TemplateRef<any>;

  loading = false;
  totalRoles = 0;
  criticalConflicts = 0;
  highRiskRoles = 0;
  selectedRisks = 0;

  riskTrendsChart: Partial<ChartOptions> = {};
  conflictAnalysisChart: Partial<ChartOptions> = {};

  gridColumns: TableColumn[] = [
    { field: 'roleId', header: 'Role ID', type: 'text', sortable: true },
    { field: 'sapDestinationName', header: 'System', type: 'tag', sortable: true },
    { field: 'sodConflicts', header: 'SoD Conflicts', type: 'text', sortable: true },
    { field: 'riskLevel', header: 'Risk Level', type: 'tag', sortable: true,
      tagColors: { Critical: 'red', High: 'orange', Medium: 'gold', Low: 'green' } },
    { field: 'lastReviewed', header: 'Last Reviewed', type: 'date', sortable: true },
    { field: 'actions', header: 'Actions', type: 'actions',
      actions: [
        { icon: 'eye', tooltip: 'View Details', command: (row: any) => this.viewDetails(row) },
        { icon: 'file-search', tooltip: 'Review Access', command: (row: any) => this.reviewAccess(row) },
      ] },
  ];
  gridData: any[] = [];
  gridTotal = 0;
  gridLoading = false;
  private lastGridParams: TableQueryParams | null = null;

  detailColumns: TableColumn[] = [
    { field: 'riskName', header: 'Risk', type: 'text' },
    { field: 'riskDescription', header: 'Description', type: 'text' },
    { field: 'riskLevel', header: 'Risk Level', type: 'tag',
      tagColors: { Critical: 'red', High: 'orange', Medium: 'gold', Low: 'green' } },
    { field: 'ruleName', header: 'Rule', type: 'text' },
  ];
  detailData: any[] = [];
  detailLoading = false;

  constructor(
    private reportService: ReportService,
    private notify: NotificationService,
    private modal: NzModalService,
  ) {}

  ngOnChanges(): void {
    if (this.systemId && this.startDate && this.endDate) {
      this.loadSummary();
    }
  }

  private loadSummary(): void {
    this.loading = true;
    this.reportService.getDashboardRoleBasedSod(this.systemId, this.startDate, this.endDate).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          const d = resp.data;
          this.totalRoles = d.totalRoles || 0;
          this.criticalConflicts = d.criticalSODConflicts || 0;
          this.highRiskRoles = d.highRiskRoles || 0;
          this.selectedRisks = d.selectedTotalRisks || 0;
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
    this.reportService.getDashboardRoleDetails({
      first: p ? (p.pageIndex - 1) * p.pageSize : 0,
      rows: p?.pageSize || 20,
      sortOrder,
      sortField: p?.sort?.field || '',
      sapSystemId: this.systemId,
      startDate: this.startDate,
      endDate: this.endDate,
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

  viewDetails(row: any): void {
    this.detailData = [];
    this.detailLoading = true;
    this.modal.create({
      nzTitle: `Role: ${row.roleId}`,
      nzContent: this.detailModalTpl,
      nzWidth: '70%',
      nzFooter: null,
    });
    this.reportService.getDashboardViolationDetails({
      jobId: row.jobId,
      roleName: row.roleId,
      riskLevel: row.riskLevel,
    }).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.detailData = Array.isArray(resp.data) ? resp.data : resp.data.rows || [];
        }
        this.detailLoading = false;
      },
      error: (err) => {
        this.detailLoading = false;
        this.notify.handleHttpError(err);
      },
    });
  }

  reviewAccess(row: any): void {
    this.modal.confirm({
      nzTitle: 'Create Access Review Job?',
      nzContent: `This will create a User Access Review Job for role ${row.roleId}.`,
      nzOnOk: () => {
        this.reportService.addDashboardUserReviewJob({
          userId: row.roleId,
          sapId: this.systemId,
          riskLevel: row.riskLevel,
        }).subscribe({
          next: (resp) => {
            if (resp.success) this.notify.success('Review job created successfully');
          },
          error: (err) => this.notify.handleHttpError(err),
        });
      },
    });
  }

  private buildCharts(data: any): void {
    const trends = data.riskLevelFrequencyTrends || {};
    const dates = Object.keys(trends);
    const series: any[] = [];
    if (dates.length > 0) {
      const levels = Object.keys(trends[dates[0]] || {});
      levels.forEach(level => {
        series.push({ name: level, data: dates.map(d => trends[d]?.[level] || 0) });
      });
    }
    this.riskTrendsChart = {
      series,
      chart: { type: 'line', height: 280, toolbar: { show: false } },
      xaxis: { categories: dates },
      colors: ['#f5222d', '#fa8c16', '#1890ff'],
      title: { text: 'Risk Level Trends' },
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 6 },
      dataLabels: { enabled: false },
      noData: { text: 'No data available' },
    };

    const conflicts = data.sodConflictAnalysis || [];
    this.conflictAnalysisChart = {
      series: [{ name: 'Conflicts', data: conflicts.map((c: any) => c.count || 0) }],
      chart: { type: 'bar', height: 280, toolbar: { show: false } },
      xaxis: { categories: conflicts.map((c: any) => c.name) },
      colors: ['#f5222d'],
      title: { text: 'SoD Conflict Analysis' },
      plotOptions: { bar: { horizontal: true } },
      dataLabels: { enabled: false },
      noData: { text: 'No data available' },
    };
  }
}
