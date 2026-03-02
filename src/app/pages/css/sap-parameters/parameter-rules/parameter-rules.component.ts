import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { map, Observable } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';
import { ApiResponse } from '../../../../core/models/api-response';
import { SapParameterService } from '../sap-parameters.service';
import { getParameterType, SapParameterType } from '../sap-parameter.model';
import { BtpService } from '../../btp/btp.service';
import { SapAuditLogService } from '../../sap-audit-log/sap-audit-log.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';

const DEFAULT_PAGINATION = {
  first: 0,
  rows: 10,
  sortOrder: -1,
  sortField: 'modifiedDate',
  filters: {},
  page: 1,
  globalFilter: null,
};

@Component({
  standalone: false,
  selector: 'app-parameter-rules',
  templateUrl: './parameter-rules.component.html',
  styleUrls: ['./parameter-rules.component.scss'],
})
export class ParameterRulesComponent implements OnInit {
  @ViewChild('ruleDetailsPanel') ruleDetailsPanel: SidePanelComponent;

  loading = false;
  metricsLoading = false;
  currentTableEvent: any = null;

  // Side panel
  drawerRule: any = null;
  drawerLoading = false;

  // Object filter
  objectFilterValue = '';
  objectTypeFilter = '';
  isObjectFilterActive = false;

  // Metrics
  ruleMetrics = {
    totalRules: 0,
    severity: { critical: 0, high: 0, medium: 0, low: 0 },
    parameterType: { sap: 0, btp: 0, audit: 0 },
    rulesWithControl: 0,
    controlsMapped: 0,
  };

  severityChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  categoryChartData: { label: string; value: number; percentage: number; color: string }[] = [];

  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'code', header: 'ID', type: 'text', width: '80px' },
    { field: 'ruleName', header: 'Name', type: 'text' },
    { field: '_parameterType', header: 'Parameter Type', type: 'text', width: '130px' },
    { field: 'tag', header: 'Category', type: 'text', width: '120px' },
    {
      field: 'severity',
      header: 'Severity',
      type: 'tag',
      width: '100px',
      tagColors: { Critical: 'red', High: 'orange', Medium: 'blue', Low: 'green' },
    },
    { field: '_controlCount', header: 'Controls', type: 'text', width: '90px' },
    { field: 'modifiedDate', header: 'Last Modified', type: 'date', width: '140px' },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onAction('add') },
    { label: 'Edit', icon: 'edit', command: () => this.onAction('edit') },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onAction('delete') },
    { label: 'Export', icon: 'download', command: () => this.onAction('all-export') },
    { label: 'Clone', icon: 'copy', command: () => this.onAction('clone') },
  ];

  constructor(
    private sapParameterService: SapParameterService,
    private notificationService: NotificationService,
    private nzModal: NzModalService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private fileSaverService: FileSaverService,
    private btpService: BtpService,
    private sapAuditLogService: SapAuditLogService
  ) {}

  ngOnInit(): void {
    this.loadDashboardMetrics();
  }

  onQueryParamsChanged(params: TableQueryParams): void {
    this.currentTableEvent = {
      first: (params.pageIndex - 1) * params.pageSize,
      rows: params.pageSize,
      sortOrder: params.sort?.direction === 'ascend' ? 1 : -1,
      sortField: params.sort?.field || 'modifiedDate',
      filters: params.filters || {},
      page: params.pageIndex,
      globalFilter: params.globalSearch || null,
    };
    this.loadAllRules(this.currentTableEvent);
  }

  private loadAllRules(event: any): void {
    this.loading = true;
    this.sapParameterService.getAllRules(event).subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success) {
          this.data = (resp.data.rows || []).map((row: any) => ({
            ...row,
            _parameterType: getParameterType(row.parameterType)?.toUpperCase() || row.parameterType,
            _controlCount: row.controlCount ?? 0,
          }));
          this.totalRecords = resp.data.records || 0;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private loadDashboardMetrics(): void {
    this.metricsLoading = true;
    this.sapParameterService.getDashboardMetrics().subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success && resp.data) {
          const d = resp.data;
          this.ruleMetrics.totalRules = d.totalRules || 0;
          this.ruleMetrics.rulesWithControl = d.rulesWithControl || 0;
          this.ruleMetrics.controlsMapped = d.controlsMapped || 0;

          if (d.severityCounts) {
            this.ruleMetrics.severity.critical = d.severityCounts['CRITICAL'] || 0;
            this.ruleMetrics.severity.high = d.severityCounts['HIGH'] || 0;
            this.ruleMetrics.severity.medium = d.severityCounts['MEDIUM'] || 0;
            this.ruleMetrics.severity.low = d.severityCounts['LOW'] || 0;
          }

          if (d.parameterTypeCounts) {
            this.ruleMetrics.parameterType.btp = d.parameterTypeCounts['BTP'] || 0;
            this.ruleMetrics.parameterType.audit = d.parameterTypeCounts['AUDIT_LOG'] || 0;
            let sapTotal = 0;
            for (const [key, value] of Object.entries(d.parameterTypeCounts)) {
              if (key !== 'BTP' && key !== 'AUDIT_LOG') {
                sapTotal += (value as number) || 0;
              }
            }
            this.ruleMetrics.parameterType.sap = sapTotal;
          }

          this.generateSeverityChart();
          this.generateCategoryChart(d.tagCounts || {});
        }
        this.metricsLoading = false;
      },
      error: () => {
        this.metricsLoading = false;
      },
    });
  }

  private generateSeverityChart(): void {
    const total = this.ruleMetrics.totalRules;
    if (total === 0) {
      this.severityChartData = [];
      return;
    }
    this.severityChartData = [
      { label: 'Critical', value: this.ruleMetrics.severity.critical, percentage: Math.round((this.ruleMetrics.severity.critical / total) * 100), color: '#dc2626' },
      { label: 'High', value: this.ruleMetrics.severity.high, percentage: Math.round((this.ruleMetrics.severity.high / total) * 100), color: '#ea580c' },
      { label: 'Medium', value: this.ruleMetrics.severity.medium, percentage: Math.round((this.ruleMetrics.severity.medium / total) * 100), color: '#3b82f6' },
      { label: 'Low', value: this.ruleMetrics.severity.low, percentage: Math.round((this.ruleMetrics.severity.low / total) * 100), color: '#16a34a' },
    ].filter((item) => item.value > 0);
  }

  private generateCategoryChart(tagCounts: Record<string, number>): void {
    const total = this.ruleMetrics.totalRules;
    if (total === 0 || Object.keys(tagCounts).length === 0) {
      this.categoryChartData = [];
      return;
    }
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    this.categoryChartData = Object.entries(tagCounts)
      .map(([name, count], i) => ({
        label: name,
        value: count,
        percentage: Math.round((count / total) * 100),
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }

  onAction(action: string): void {
    switch (action) {
      case 'add':
        this.router.navigate(['add-parameter-rule'], {
          relativeTo: this.activeRoute.parent,
          state: { rule: null, formType: 'add' },
        });
        break;

      case 'edit':
        if (!this.checkRowSelected()) break;
        this.loadAndNavigate(this.selectedRow, 'edit');
        break;

      case 'delete':
        if (!this.checkRowSelected()) break;
        this.nzModal.confirm({
          nzTitle: 'Confirm Delete',
          nzContent: 'Are you sure you want to delete this rule?',
          nzOkDanger: true,
          nzOnOk: () => {
            this.sapParameterService
              .deleteParameterRule(this.selectedRow.id, this.selectedRow.parameterType)
              .subscribe((resp: ApiResponse) => {
                this.notificationService.show(resp);
                this.loadAllRules(this.currentTableEvent || DEFAULT_PAGINATION);
              });
          },
        });
        break;

      case 'all-export':
        this.sapParameterService.exportAllRules().subscribe((res) => {
          this.fileSaverService.saveExcel('all-rule-export', res);
          this.notificationService.success('Successfully downloaded All Rules');
        });
        break;

      case 'clone':
        if (!this.checkRowSelected()) break;
        const payload = { id: this.selectedRow.id, ruleType: this.selectedRow.parameterType };
        this.sapParameterService.cloneRule(payload).subscribe((res: ApiResponse) => {
          if (res.success) {
            this.notificationService.show(res);
            this.loadAllRules(this.currentTableEvent || DEFAULT_PAGINATION);
          }
        });
        break;
    }
  }

  onRowClicked(rowData: any): void {
    this.selectedRow = rowData;
    if (!rowData) return;
    this.drawerLoading = true;
    this.drawerRule = rowData;
    this.ruleDetailsPanel?.open();
    this.getRuleDataById(rowData.id, rowData.parameterType).subscribe({
      next: (data) => {
        this.drawerRule = data;
        this.drawerLoading = false;
      },
      error: () => {
        this.drawerLoading = false;
        this.notificationService.error('Failed to load rule details');
      },
    });
  }

  onEditFromDrawer(): void {
    if (!this.drawerRule) return;
    this.ruleDetailsPanel?.close();
    this.router.navigate(['add-parameter-rule'], {
      relativeTo: this.activeRoute.parent,
      state: { rule: this.drawerRule, formType: 'edit' },
    });
  }

  applyObjectFilter(): void {
    if (!this.objectFilterValue && !this.objectTypeFilter) return;
    this.isObjectFilterActive = true;
    this.loading = true;
    const paginationEvent = this.currentTableEvent || DEFAULT_PAGINATION;
    this.sapParameterService
      .searchRulesByObjects(
        this.objectFilterValue ? [this.objectFilterValue] : [],
        this.objectTypeFilter ? [this.objectTypeFilter] : [],
        paginationEvent
      )
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.data = (resp.data.rows || []).map((row: any) => ({
              ...row,
              _parameterType: getParameterType(row.parameterType)?.toUpperCase() || row.parameterType,
              _controlCount: row.controlCount ?? 0,
            }));
            this.totalRecords = resp.data.records || 0;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  clearObjectFilter(): void {
    this.objectFilterValue = '';
    this.objectTypeFilter = '';
    this.isObjectFilterActive = false;
    this.loadAllRules(this.currentTableEvent || DEFAULT_PAGINATION);
  }

  getParameterTypeLabel(type: string): string {
    return getParameterType(type) || type;
  }

  get hasMatchMode(): boolean {
    return this.drawerRule?.conditions?.some((c: any) => c.matchMode && c.matchMode !== 'NORMAL') || false;
  }

  getSeverityColor(severity: string): string {
    if (!severity) return 'default';
    switch (severity.toLowerCase()) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  }

  private loadAndNavigate(row: any, formType: string): void {
    this.getRuleDataById(row.id, row.parameterType).subscribe((data) => {
      this.router.navigate(['add-parameter-rule'], {
        relativeTo: this.activeRoute.parent,
        state: { rule: data, formType },
      });
    });
  }

  private getRuleDataById(id: number, ruleType: string): Observable<any> {
    if (ruleType === SapParameterType.BTP) {
      return this.btpService
        .getRule(id)
        .pipe(map((resp: ApiResponse) => ({ ...resp.data, parameterType: SapParameterType.BTP })));
    }
    if (ruleType === SapParameterType.AUDIT_LOG) {
      return this.sapAuditLogService
        .getById(id)
        .pipe(map((resp: ApiResponse) => ({ ...resp.data, parameterType: SapParameterType.AUDIT_LOG })));
    }
    return this.sapParameterService.getById(id).pipe(map((resp: ApiResponse) => resp.data));
  }

  private checkRowSelected(): boolean {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row first');
      return false;
    }
    return true;
  }
}
