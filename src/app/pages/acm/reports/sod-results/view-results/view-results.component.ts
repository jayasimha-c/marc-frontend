import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ReportService } from '../../report.service';
import { ApiResponse } from '../../../../../core/models/api-response';
import { NotificationService } from '../../../../../core/services/notification.service';
import { FileSaverService } from '../../../../../core/services/file-saver.service';
import { RiskAnalysisOnlineService } from '../../../risk-analysis/risk-analysis-online.service';

interface ColumnDef {
  field: string;
  header: string;
  width?: string;
}

const DEFAULT_PAGE_SIZE = 10;

@Component({
  standalone: false,
  selector: 'app-view-results',
  templateUrl: './view-results.component.html',
})
export class ViewResultsComponent implements OnInit {
  dialogData: any;
  analysisFor = '';
  enableRiskViolations = false;
  isRoleAnalysis = false;
  isSimulation = false;
  loading = false;
  activeTabIndex = 0;
  riskLevelFilter = '';
  showAnalysisDetails = false;

  dashboardMetrics = {
    totalUsers: 0,
    riskViolations: 0,
    uniqueRisks: 0,
    complianceRate: 0,
  };

  // Violations tab (Tab 1)
  violationsCols: ColumnDef[] = [];
  violationsData: any[] = [];
  violationsTotal = 0;
  violationsPage = 1;
  violationsSearch = '';
  violationsFilters: Record<string, string> = {};

  // Summary tab (Tab 2)
  summaryCols: ColumnDef[] = [];
  summaryData: any[] = [];
  summaryTotal = 0;
  summaryPage = 1;
  summarySearch = '';
  summaryFilters: Record<string, string> = {};
  summarySelectedRow: any = null;

  // Detailed tab (Tab 3)
  detailedCols: ColumnDef[] = [];
  detailedData: any[] = [];
  detailedTotal = 0;
  detailedPage = 1;
  detailedSearch = '';
  detailedFilters: Record<string, string> = {};

  pageSize = DEFAULT_PAGE_SIZE;

  constructor(
    private reportService: ReportService,
    private riskAnalysisOnlineService: RiskAnalysisOnlineService,
    private notificationService: NotificationService,
    private fileSaverService: FileSaverService,
    private nzModal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.dialogData = history.state?.data ? history.state : null;
    if (!this.dialogData) {
      this.back();
      return;
    }

    const job = this.dialogData.data;
    this.analysisFor = this.dialogData.type || job.type || '';
    this.isRoleAnalysis = job.targetType === 'ROLE';
    this.isSimulation = (job.profileType || job.type || '').toUpperCase() === 'SIMULATION';

    if (job.analysisType === 'RISK') {
      this.enableRiskViolations = true;
    }

    this.configureViolationColumns();
    this.configureSummaryColumns();
    this.configureDetailedColumns();

    this.loadViolations(this.buildDefaultEvent());
    this.calculateDashboardMetrics();
  }

  // ── Column configuration ─────────────────────────────────

  private configureViolationColumns(): void {
    this.violationsCols = [
      { field: 'bname', header: this.isRoleAnalysis ? 'Role ID' : 'User/Role ID' },
      { field: 'vcount', header: 'Violations' },
    ];
  }

  private configureSummaryColumns(): void {
    if (this.analysisFor === 'NON-ABAP') {
      this.configureSummaryColumnsForNonAbap();
      return;
    }

    const idCol: ColumnDef = { field: 'bname', header: this.isRoleAnalysis ? 'Role ID' : 'User ID', width: '120px' };
    const nameCol: ColumnDef = { field: 'userName', header: this.isRoleAnalysis ? 'Role Description' : 'User Name', width: '150px' };

    if (this.enableRiskViolations) {
      this.summaryCols = [
        idCol,
        nameCol,
        ...(this.isRoleAnalysis ? [] : [
          { field: 'userType', header: 'Type', width: '80px' },
          { field: 'userClass', header: 'User Group', width: '120px' },
        ]),
        { field: 'businessProcess', header: 'Business Process', width: '140px' },
        { field: 'businessSubProcess', header: 'Sub Process', width: '130px' },
        { field: 'riskName', header: 'Risk', width: '120px' },
        { field: 'riskDesc', header: 'Risk Description', width: '180px' },
        { field: 'riskLevel', header: 'Risk Level', width: '100px' },
        { field: 'ruleName', header: 'Rule', width: '120px' },
        { field: 'isExecuted', header: 'Risk Executed', width: '110px' },
        { field: 'ruleExecuted', header: 'Rule Executed', width: '110px' },
        { field: 'mitigationName', header: 'Mitigation ID', width: '120px' },
      ];
    } else {
      this.summaryCols = [
        idCol,
        nameCol,
        ...(this.isRoleAnalysis ? [] : [
          { field: 'userType', header: 'Type', width: '80px' },
          { field: 'userClass', header: 'User Group', width: '120px' },
        ]),
        { field: 'businessProcess', header: 'Business Process', width: '140px' },
        { field: 'businessSubProcess', header: 'Sub Process', width: '130px' },
        { field: 'ruleName', header: 'Rule', width: '120px' },
        { field: 'ruleDesc', header: 'Rule Description', width: '180px' },
      ];
    }
  }

  private configureSummaryColumnsForNonAbap(): void {
    if (this.enableRiskViolations) {
      this.summaryCols = [
        { field: 'userName', header: 'User Name', width: '150px' },
        { field: 'bname', header: 'User ID', width: '120px' },
        { field: 'riskName', header: 'Risk', width: '120px' },
        { field: 'riskDesc', header: 'Description', width: '180px' },
        { field: 'riskLevel', header: 'Risk Level', width: '100px' },
        { field: 'riskType', header: 'Type', width: '100px' },
        { field: 'businessProcess', header: 'Business Process', width: '140px' },
        { field: 'businessSubProcess', header: 'Sub Process', width: '130px' },
        { field: 'ruleName', header: 'Rule', width: '120px' },
        { field: 'groupID', header: 'Group ID', width: '100px' },
        { field: 'groupName', header: 'Group Name', width: '120px' },
      ];
    } else {
      this.summaryCols = [
        { field: 'userName', header: 'User Name', width: '150px' },
        { field: 'bname', header: 'User ID', width: '120px' },
        { field: 'ruleName', header: 'Rule', width: '120px' },
        { field: 'ruleDesc', header: 'Rule Description', width: '180px' },
        { field: 'ruleType', header: 'Type', width: '100px' },
        { field: 'businessProcess', header: 'Business Process', width: '140px' },
        { field: 'businessSubProcess', header: 'Sub Process', width: '130px' },
        { field: 'groupID', header: 'Group ID', width: '100px' },
        { field: 'groupName', header: 'Group Name', width: '120px' },
      ];
    }
  }

  private configureDetailedColumns(): void {
    if (this.enableRiskViolations) {
      this.detailedCols = [
        { field: 'userName', header: this.isRoleAnalysis ? 'Role Description' : 'User', width: '150px' },
        { field: 'bname', header: this.isRoleAnalysis ? 'Role ID' : 'User ID', width: '120px' },
        { field: 'riskName', header: 'Risk', width: '120px' },
        { field: 'riskLevel', header: 'Risk Level', width: '100px' },
        { field: 'ruleName', header: 'Rule', width: '120px' },
        { field: 'roleName', header: 'Role', width: '120px' },
        { field: 'roleDesc', header: 'Role Description', width: '150px' },
        { field: 'auth', header: 'Auth', width: '100px' },
        { field: 'object', header: 'Object', width: '100px' },
        { field: 'fld', header: 'Field', width: '100px' },
        { field: 'val', header: 'Value', width: '100px' },
        { field: 'bis', header: 'BIS', width: '80px' },
      ];
    } else {
      this.detailedCols = [
        { field: 'bname', header: this.isRoleAnalysis ? 'Role ID' : 'User ID', width: '120px' },
        { field: 'userName', header: this.isRoleAnalysis ? 'Role Description' : 'User', width: '150px' },
        { field: 'ruleName', header: 'Rule', width: '120px' },
        { field: 'roleName', header: 'Role', width: '120px' },
        { field: 'roleDesc', header: 'Role Description', width: '150px' },
        { field: 'auth', header: 'Auth', width: '100px' },
        { field: 'object', header: 'Object', width: '100px' },
        { field: 'fld', header: 'Field', width: '100px' },
        { field: 'val', header: 'Value', width: '100px' },
        { field: 'bis', header: 'BIS', width: '80px' },
      ];
    }
  }

  // ── Data loading ─────────────────────────────────────────

  private loadViolations(event: any): void {
    this.loading = true;
    this.reportService
      .getViolationResults({ ...event, jobId: this.dialogData.data.id, analysisType: this.analysisFor })
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.violationsData = resp.data.rows || [];
            this.violationsTotal = resp.data.records || 0;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  getViolationsData(event: any): void {
    this.reportService
      .getViolationResults({ ...event, jobId: this.dialogData.data.id, analysisType: this.analysisFor })
      .subscribe((resp: ApiResponse) => {
        if (resp.success) {
          this.violationsData = resp.data.rows || [];
          this.violationsTotal = resp.data.records || 0;
        }
      });
  }

  getSummaryData(event: any): void {
    const payload: any = {
      ...event,
      jobId: this.dialogData.data.id,
      analysisType: this.analysisFor,
    };
    if (this.riskLevelFilter) {
      if (!payload.filters) {
        payload.filters = {};
      }
      payload.filters['riskLevel'] = [{ value: this.riskLevelFilter, matchMode: 'equals' }];
    }
    this.reportService.resultSummary(payload).subscribe((resp: ApiResponse) => {
      if (resp.success) {
        this.summaryData = resp.data?.rows || [];
        this.summaryTotal = resp.data?.records || 0;
      }
    });
  }

  getRiskDetailedData(event: any): void {
    this.reportService
      .riskViolationGrid({ ...event, jobId: this.dialogData.data.id })
      .subscribe((resp: ApiResponse) => {
        if (resp.success) {
          this.detailedData = resp.data.rows || [];
          this.detailedTotal = resp.data.records || 0;
        }
      });
  }

  getRuleDetailedData(event: any): void {
    this.reportService
      .ruleViolationGrid({ ...event, jobId: this.dialogData.data.id })
      .subscribe((resp: ApiResponse) => {
        if (resp.success) {
          this.detailedData = resp.data.rows || [];
          this.detailedTotal = resp.data.records || 0;
        }
      });
  }

  // ── Dashboard metrics ────────────────────────────────────

  private calculateDashboardMetrics(): void {
    this.reportService.getSodJobMetrics(this.dialogData.data.id).subscribe((resp: ApiResponse) => {
      if (!resp.success) {
        return;
      }
      const totalUsers = resp.data.numberOfUsers || 0;
      const usersWithViolations = resp.data.usersWithRisks || 0;
      const complianceRate = totalUsers > 0
        ? Math.round(((totalUsers - usersWithViolations) / totalUsers) * 100)
        : 100;

      this.dashboardMetrics = {
        totalUsers,
        riskViolations: resp.data.numberofViolations || 0,
        uniqueRisks: resp.data.uniqueRiskViolations || 0,
        complianceRate,
      };
    });
  }

  // ── Exports ──────────────────────────────────────────────

  exportViolations(): void {
    if (!this.dialogData.data.id) {
      this.notificationService.error('Please run the job first');
      return;
    }
    this.notificationService.success('We are preparing your report, please wait...');
    this.riskAnalysisOnlineService.getExportViolations(this.dialogData.data.id).subscribe((resp) => {
      this.fileSaverService.saveAnyFile(resp);
    });
  }

  exportResults(generateExcel: boolean, isRisk: boolean, isDetailed: boolean): void {
    const jobId = this.dialogData.data.id;
    if (!jobId) {
      this.notificationService.error('Please run the job first');
      return;
    }

    const excelMsg = 'Export report generation started successfully:';
    const exportRedirect = 'general/export-results';

    if (isRisk) {
      this.exportRiskResults(generateExcel, isDetailed, jobId, excelMsg, exportRedirect);
    } else {
      this.exportRuleResults(generateExcel, isDetailed, jobId, excelMsg, exportRedirect);
    }
  }

  private exportRiskResults(
    generateExcel: boolean, isDetailed: boolean, jobId: any, excelMsg: string, exportRedirect: string,
  ): void {
    if (generateExcel) {
      const batchCall = isDetailed
        ? this.riskAnalysisOnlineService.generateBatchRiskDetail(jobId)
        : this.riskAnalysisOnlineService.generateBatchRiskSummary(jobId);
      batchCall.subscribe(() => {
        this.riskAnalysisOnlineService.openRunBackgroundAlert(excelMsg, exportRedirect);
      });
    } else {
      this.reportService.validateRiskReportCount(jobId).subscribe((resp: ApiResponse) => {
        if (resp.success) {
          this.riskAnalysisOnlineService.getExportRiskSummaryResults(jobId).subscribe((exportResp) => {
            this.fileSaverService.saveAnyFile(exportResp);
          });
        } else {
          this.notificationService.error(resp.data?.message || 'Export validation failed');
        }
      });
    }
  }

  private exportRuleResults(
    generateExcel: boolean, isDetailed: boolean, jobId: any, excelMsg: string, exportRedirect: string,
  ): void {
    if (generateExcel) {
      const batchCall = isDetailed
        ? this.riskAnalysisOnlineService.generateBatchRuleDetail(jobId)
        : this.riskAnalysisOnlineService.generateBatchRuleSummary(jobId);
      batchCall.subscribe(() => {
        this.riskAnalysisOnlineService.openRunBackgroundAlert(excelMsg, exportRedirect);
      });
    } else {
      this.reportService.validateRecordCount(jobId).subscribe((resp: ApiResponse) => {
        if (resp.success) {
          this.riskAnalysisOnlineService.getExportRuleSummaryResults(jobId).subscribe((exportResp) => {
            this.fileSaverService.saveAnyFile(exportResp);
          });
        } else {
          this.notificationService.error(resp.data?.message || 'Export validation failed');
        }
      });
    }
  }

  // ── Summary actions ──────────────────────────────────────

  onSummaryAction(action: string): void {
    const isDetailedTab = this.activeTabIndex === 2;
    const isRisk = this.enableRiskViolations;

    switch (action) {
      case 'showChart':
        this.showChart();
        break;
      case 'exportResults':
        this.notificationService.success('We are preparing your report, please wait...');
        this.exportResults(false, isRisk, isDetailedTab);
        break;
      case 'generateExcelReport':
        this.exportResults(true, isRisk, true);
        break;
      case 'assignMitigation':
        this.assignMitigation();
        break;
    }
  }

  onDetailedAction(action: string): void {
    const isRisk = this.enableRiskViolations;

    switch (action) {
      case 'exportResults':
        this.notificationService.success('We are preparing your report, please wait...');
        this.exportResults(false, isRisk, true);
        break;
      case 'generateExcelReport':
        this.exportResults(true, isRisk, true);
        break;
    }
  }

  showChart(): void {
    if (!this.validateSelection()) {
      return;
    }
    import('../show-chart-modal.component').then((m) => {
      this.nzModal.create({
        nzTitle: 'Risk Chart',
        nzContent: m.ShowChartModalComponent,
        nzWidth: '90vw',
        nzFooter: null,
        nzData: {
          data: {
            id: this.dialogData.data.id,
            userName: this.summarySelectedRow.bname,
            simulation: false,
          },
        },
      });
    });
  }

  assignMitigation(): void {
    if (!this.validateSelection()) {
      return;
    }
    this.riskAnalysisOnlineService
      .getSapSystemNameForAssignMitigation(this.dialogData.data.id)
      .subscribe((resp: ApiResponse) => {
        if (!resp.success) {
          return;
        }
        const sapSystemName = resp.data?.sapSystem;
        const rowData = { ...this.summarySelectedRow };

        if (this.isSimulation && rowData.bname) {
          rowData.bname = rowData.bname.replace(/_[AB]$/, '');
        }

        import('../assign-mitigation-modal.component').then((m) => {
          this.nzModal.create({
            nzTitle: 'Assign Mitigation',
            nzContent: m.AssignMitigationModalComponent,
            nzWidth: '90vw',
            nzFooter: null,
            nzData: { data: { ...rowData, sapSystemName } },
          });
        });
      });
  }

  private validateSelection(): boolean {
    if (!this.dialogData.data.id) {
      this.notificationService.error('Please select a job first');
      return false;
    }
    if (!this.summarySelectedRow) {
      this.notificationService.error('Please select a row in Summary Report');
      return false;
    }
    return true;
  }

  // ── Risk level filter ────────────────────────────────────

  onRiskLevelFilterChange(): void {
    this.summaryPage = 1;
    this.getSummaryData(this.buildDefaultEvent());
  }

  // ── Pagination helpers ───────────────────────────────────

  selectSummaryRow(row: any): void {
    this.summarySelectedRow = row;
  }

  onViolationsPageNav(page: number): void {
    this.violationsPage = page;
    this.getViolationsData(this.buildEvent(page, this.violationsFilters, this.violationsSearch));
  }

  onViolationsFilterChange(): void {
    this.violationsPage = 1;
    this.getViolationsData(this.buildEvent(1, this.violationsFilters, this.violationsSearch));
  }

  onSummaryPageNav(page: number): void {
    this.summaryPage = page;
    this.getSummaryData(this.buildEvent(page, this.summaryFilters, this.summarySearch));
  }

  onSummaryFilterChange(): void {
    this.summaryPage = 1;
    this.getSummaryData(this.buildEvent(1, this.summaryFilters, this.summarySearch));
  }

  onDetailedPageNav(page: number): void {
    this.detailedPage = page;
    const event = this.buildEvent(page, this.detailedFilters, this.detailedSearch);
    if (this.enableRiskViolations) {
      this.getRiskDetailedData(event);
    } else {
      this.getRuleDetailedData(event);
    }
  }

  onDetailedFilterChange(): void {
    this.detailedPage = 1;
    const event = this.buildEvent(1, this.detailedFilters, this.detailedSearch);
    if (this.enableRiskViolations) {
      this.getRiskDetailedData(event);
    } else {
      this.getRuleDetailedData(event);
    }
  }

  toggleAnalysisDetails(): void {
    this.showAnalysisDetails = !this.showAnalysisDetails;
  }

  getRiskLevelColor(level: string): string {
    if (!level) {
      return 'default';
    }
    switch (level.toLowerCase()) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'gold';
      case 'low': return 'green';
      default: return 'default';
    }
  }

  back(): void {
    history.back();
  }

  // ── Private helpers ──────────────────────────────────────

  private buildEvent(page: number, columnFilters: Record<string, string>, globalSearch: string): any {
    const filters: any = {};
    for (const field of Object.keys(columnFilters)) {
      const value = columnFilters[field];
      if (value && value.trim()) {
        filters[field] = [{ value: value.trim(), matchMode: 'cn' }];
      }
    }
    return {
      first: (page - 1) * this.pageSize,
      rows: this.pageSize,
      page,
      sortOrder: 1,
      sortField: '',
      filters,
      globalFilter: globalSearch ? { value: globalSearch } : null,
    };
  }

  private buildDefaultEvent(): any {
    return {
      first: 0,
      rows: this.pageSize,
      page: 1,
      sortOrder: 1,
      sortField: '',
      filters: {},
      globalFilter: null,
    };
  }
}
