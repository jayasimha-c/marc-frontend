import { Component, Input, OnChanges, TemplateRef, ViewChild } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ChartOptions } from '../../../shared/models/chart.model';
import { TableColumn, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';
import { ReportService } from '../reports/report.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-user-based-analysis',
  templateUrl: './user-based-analysis.component.html',
})
export class UserBasedAnalysisComponent implements OnChanges {
  @Input() systemId: number = 0;
  @Input() startDate = '';
  @Input() endDate = '';
  @ViewChild('detailModalTpl', { static: true }) detailModalTpl!: TemplateRef<any>;

  loading = false;
  totalUsers = 0;
  criticalRiskUsers = 0;
  usersWithConflicts = 0;
  selectedRisks = 0;

  userRiskDistChart: Partial<ChartOptions> = {};
  userRiskTrendsChart: Partial<ChartOptions> = {};
  deptRiskChart: Partial<ChartOptions> = {};

  gridColumns: TableColumn[] = [
    { field: 'userId', header: 'User ID', type: 'text', sortable: true },
    { field: 'department', header: 'Department', type: 'text', sortable: true },
    { field: 'roles', header: 'Roles', type: 'text', sortable: true },
    { field: 'sapDestinationName', header: 'System Access', type: 'tag', sortable: true },
    { field: 'sodConflicts', header: 'SoD Conflicts', type: 'text', sortable: true },
    { field: 'riskLevel', header: 'Risk Level', type: 'tag', sortable: true,
      tagColors: { Critical: 'red', High: 'orange', Medium: 'gold', Low: 'green' } },
    { field: 'reviewStatus', header: 'Review Status', type: 'tag', sortable: true,
      tagColors: { Pending: 'orange', 'In Progress': 'blue', Approved: 'green', Rejected: 'red' } },
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
    this.reportService.getDashboardUserBasedSod(this.systemId, this.startDate, this.endDate).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          const d = resp.data;
          this.totalUsers = d.totalUsers || 0;
          this.criticalRiskUsers = d.criticalRiskUsers || 0;
          this.usersWithConflicts = d.usersWithConflicts || 0;
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
    this.reportService.getDashboardUserDetails({
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
      nzTitle: `User: ${row.userId}`,
      nzContent: this.detailModalTpl,
      nzWidth: '70%',
      nzFooter: null,
    });
    this.reportService.getDashboardViolationDetails({
      jobId: row.jobId,
      bname: row.userId,
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
      nzContent: `This will create a User Access Review Job for user ${row.userId}.`,
      nzOnOk: () => {
        this.reportService.addDashboardUserReviewJob({
          userId: row.userId,
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
    const dist = data.riskLevelDistribution || [];
    this.userRiskDistChart = {
      series: dist.map((d: any) => d.value),
      chart: { type: 'donut', height: 300, toolbar: { show: false } },
      labels: dist.map((d: any) => d.label),
      colors: ['#f5222d', '#fa8c16', '#722ed1', '#52c41a'],
      title: { text: 'User Risk Distribution' },
      plotOptions: { pie: { donut: { size: '60%' } } },
      legend: { position: 'bottom' },
      noData: { text: 'No data available' },
    };

    const trends = data.userRiskTrends || [];
    this.userRiskTrendsChart = {
      series: [
        { name: 'Users with Conflicts', data: trends.map((t: any) => t.usersWithConflicts || 0) },
        { name: 'Critical Risk Users', data: trends.map((t: any) => t.criticalRiskUsers || 0) },
      ],
      chart: { type: 'line', height: 280, toolbar: { show: false } },
      xaxis: { categories: trends.map((t: any) => t.date) },
      colors: ['#fa8c16', '#f5222d'],
      title: { text: 'User Risk Trends' },
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 5 },
      dataLabels: { enabled: false },
      noData: { text: 'No data available' },
    };

    const depts = data.riskAnalysisByDept || [];
    this.deptRiskChart = {
      series: [
        { name: 'Critical Risk', data: depts.map((d: any) => d.criticalRisk || 0) },
        { name: 'High Risk', data: depts.map((d: any) => d.highRisk || 0) },
      ],
      chart: { type: 'bar', height: 280, toolbar: { show: false } },
      xaxis: { categories: depts.map((d: any) => d.department) },
      colors: ['#f5222d', '#fa8c16'],
      title: { text: 'Risk Analysis by Department' },
      dataLabels: { enabled: false },
      noData: { text: 'No data available' },
    };
  }
}
