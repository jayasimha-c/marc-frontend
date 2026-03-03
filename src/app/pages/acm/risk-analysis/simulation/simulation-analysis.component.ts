import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RiskAnalysisOnlineService } from '../risk-analysis-online.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';
import { SimulationPreSelectionComponent } from './simulation-preselection-modal.component';
import { OrgChecksModalContent } from '../online/online-analysis.component';
import { GridRequestBuilder } from '../../../../core/utils/grid-request.builder';

const DEFAULT_PAGINATION = GridRequestBuilder.defaultLegacy();

@Component({
  standalone: false,
  selector: 'app-simulation-analysis',
  templateUrl: './simulation-analysis.component.html',
})
export class SimulationAnalysisComponent implements OnInit {
  currentStep = 0;
  preSelection: any = { selectedTargetType: 'USER', selectedAnalysisType: 'RISK' };
  jobId: any;
  analysisComplete = false;

  get resultsStepIndex(): number {
    return this.preSelection?.options?.rolesStep ? 5 : 3;
  }

  // User Roles table (step 3 when rolesStep)
  userRolesData: any[] = [];
  userRolesTotalRecords = 0;
  userRolesSelected: any[] = [];
  userRolesCols = [
    { field: 'roleName', header: 'Role Name' },
    { field: 'bname', header: 'User' },
    { field: 'roleDesc', header: 'Role Description' },
  ];

  // Excluded Roles table (step 4 when rolesStep)
  excludedRolesData: any[] = [];
  excludedRolesTotalRecords = 0;
  excludedRolesSelected: any[] = [];
  excludedRolesCols = [
    { field: 'roleName', header: 'Role Name' },
    { field: 'bname', header: 'User' },
    { field: 'roleDesc', header: 'Role Description' },
  ];

  // Violations table
  violationsData: any[] = [];
  violationsTotal = 0;
  violationsCols = [
    { field: 'bname', header: 'User/Role ID' },
    { field: 'vcount', header: 'Number Of Violations' },
  ];

  // Summary report table
  summaryData: any[] = [];
  summaryTotal = 0;
  summaryCols = [
    { field: 'bname', header: 'User ID' },
    { field: 'userName', header: 'User Name' },
    { field: 'userType', header: 'Type' },
    { field: 'orgName', header: 'User Group' },
    { field: 'riskType', header: 'Risk Type' },
    { field: 'riskName', header: 'Risk' },
    { field: 'riskDesc', header: 'Risk Description' },
    { field: 'riskLevel', header: 'Risk Level' },
    { field: 'ruleName', header: 'Rule' },
    { field: 'ruleDesc', header: 'Description' },
    { field: 'businessProcess', header: 'Business Process' },
    { field: 'businessSubProcess', header: 'Sub Process' },
    { field: 'mitigationName', header: 'Mitigation ID' },
  ];

  // Detailed report table
  detailedData: any[] = [];
  detailedTotal = 0;
  detailedCols = [
    { field: 'userName', header: 'User' },
    { field: 'bname', header: 'User ID' },
    { field: 'riskName', header: 'Risk' },
    { field: 'riskLevel', header: 'Risk Level' },
    { field: 'ruleName', header: 'Rule' },
    { field: 'roleName', header: 'Role' },
    { field: 'roleDesc', header: 'Role Description' },
    { field: 'auth', header: 'Auth' },
    { field: 'object', header: 'Object' },
    { field: 'fld', header: 'Field' },
    { field: 'val', header: 'Value' },
    { field: 'bis', header: 'BIS' },
  ];

  summarySelectedRow: any = null;

  analysisMenuList: any[] = [
    { label: 'Run', icon: 'caret-right', command: () => this.menuAction('run') },
    { label: 'Run In Background', icon: 'caret-right', command: () => this.menuAction('runInBackground') },
    { label: 'Export Summary Results', icon: 'file-excel', command: () => this.exportSummaryResults() },
    { label: 'Run Org Level Checks', icon: 'caret-right', command: () => this.runOrgLevelChecks() },
    { label: 'Export Detail Results', icon: 'file-excel', command: () => this.exportDetailResults() },
    { label: 'Export To PDF', icon: 'file-text', command: () => this.exportPdf() },
    { label: 'Show Chart', icon: 'pie-chart', command: () => this.showCharts() },
  ];

  private dialogOpen = false;

  constructor(
    private apiService: RiskAnalysisOnlineService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private fileSaverService: FileSaverService,
  ) {}

  ngOnInit(): void {
    this.openPreSelectionDialog();
  }

  private openPreSelectionDialog(): void {
    if (this.dialogOpen) return;
    this.dialogOpen = true;
    this.nzModal.create({
      nzTitle: 'Simulation PreSelection',
      nzContent: SimulationPreSelectionComponent,
      nzWidth: '40vw',
      nzClassName: 'updated-modal',
      nzMaskClosable: false,
      nzClosable: false,
      nzFooter: null,
    }).afterClose.subscribe((result) => {
      this.dialogOpen = false;
      if (result) {
        this.preSelection = result.preSelection;
        this.preSelection.formType = 'simulation';
        setTimeout(() => this.apiService.preSelectedData.next(result.preSelection), 100);
      }
    });
  }

  // -- Step navigation --

  onStepChange(targetStep: number): void {
    // Populate user roles table when entering step 3 or 4
    if ((targetStep === 3 || targetStep === 4) && this.preSelection?.options?.rolesStep) {
      if (this.preSelection?.selectedusers?.length > 0 && this.userRolesData.length < 1) {
        this.setUserRolesData(
          (this.preSelection?.sapUserRoles || []).map((i: any) => ({ ...i, id: i.bname + i.roleName }))
        );
      } else {
        this.validateUserRoles();
      }
    }
    // Build excludedRoles map when entering results step
    if (targetStep === this.resultsStepIndex && this.preSelection?.options?.rolesStep && this.excludedRolesData.length > 0) {
      this.preSelection.excludedRoles = {};
      for (const item of this.excludedRolesData) {
        if (this.preSelection.excludedRoles[item.bname]) {
          this.preSelection.excludedRoles[item.bname].push(item.roleName);
        } else {
          this.preSelection.excludedRoles[item.bname] = [item.roleName];
        }
      }
    }
    this.currentStep = targetStep;
  }

  // -- User Roles / Excluded Roles management --

  excludeUserRoles(): void {
    if (!this.userRolesSelected.length) return;
    const remaining = this.userRolesData.filter(
      (i) => !this.userRolesSelected.find((j) => j.id === i.id)
    );
    this.setExcludedRolesData([...this.excludedRolesData, ...this.userRolesSelected]);
    this.setUserRolesData(remaining);
    this.userRolesSelected = [];
  }

  removeExcludedRoles(): void {
    if (!this.excludedRolesSelected.length) return;
    const remaining = this.excludedRolesData.filter(
      (i) => !this.excludedRolesSelected.find((j) => j.id === i.id)
    );
    this.setUserRolesData([...this.userRolesData, ...this.excludedRolesSelected]);
    this.setExcludedRolesData(remaining);
    this.excludedRolesSelected = [];
  }

  removeAllExcludedRoles(): void {
    this.setUserRolesData([...this.userRolesData, ...this.excludedRolesData]);
    this.setExcludedRolesData([]);
    this.excludedRolesSelected = [];
  }

  private setUserRolesData(data: any[]): void {
    this.userRolesData = data || [];
    this.userRolesTotalRecords = this.userRolesData.length;
  }

  private setExcludedRolesData(data: any[]): void {
    this.excludedRolesData = data || [];
    this.excludedRolesTotalRecords = this.excludedRolesData.length;
  }

  private validateUserRoles(): void {
    const totalLength = this.userRolesData.length + this.excludedRolesData.length;
    if ((this.preSelection?.sapUserRoles?.length || 0) !== totalLength) {
      this.setUserRolesData(
        (this.preSelection?.sapUserRoles || []).map((i: any) => ({ ...i, id: i.bname + i.roleName }))
      );
      this.setExcludedRolesData([]);
    }
  }

  // -- Checkbox helpers for user roles / excluded roles --

  onUserRoleChecked(item: any, checked: boolean): void {
    this.userRolesSelected = checked
      ? [...this.userRolesSelected, item]
      : this.userRolesSelected.filter((i) => i.id !== item.id);
  }

  isUserRoleChecked(item: any): boolean {
    return this.userRolesSelected.some((i) => i.id === item.id);
  }

  onAllUserRolesChecked(checked: boolean): void {
    this.userRolesSelected = checked ? [...this.userRolesData] : [];
  }

  get allUserRolesChecked(): boolean {
    return this.userRolesData.length > 0 && this.userRolesSelected.length === this.userRolesData.length;
  }

  onExcludedRoleChecked(item: any, checked: boolean): void {
    this.excludedRolesSelected = checked
      ? [...this.excludedRolesSelected, item]
      : this.excludedRolesSelected.filter((i) => i.id !== item.id);
  }

  isExcludedRoleChecked(item: any): boolean {
    return this.excludedRolesSelected.some((i) => i.id === item.id);
  }

  onAllExcludedRolesChecked(checked: boolean): void {
    this.excludedRolesSelected = checked ? [...this.excludedRolesData] : [];
  }

  get allExcludedRolesChecked(): boolean {
    return this.excludedRolesData.length > 0 && this.excludedRolesSelected.length === this.excludedRolesData.length;
  }

  // -- Pagination callbacks (passed to analysis-result) --

  onViolationsPageChange = (event: any): void => {
    this.getViolationsData(this.jobId, event);
  };

  onSummaryPageChange = (event: any): void => {
    this.getSummaryData(this.jobId, event);
  };

  onDetailedPageChange = (event: any): void => {
    this.getDetailedData(this.jobId, event);
  };

  onSummaryRowSelect = (row: any): void => {
    this.summarySelectedRow = row;
  };

  // -- Data loading --

  private getViolationsData(jobId: string, event: any): void {
    if (!jobId) return;
    this.apiService.getViolationResults(jobId, event).subscribe((resp) => {
      if (resp.success) {
        this.violationsData = resp.data?.rows || [];
        this.violationsTotal = resp.data?.records || 0;
      }
    });
  }

  private getSummaryData(jobId: string, event: any): void {
    if (!jobId) return;
    this.apiService.getSimulationResultSummary(jobId, event).subscribe((resp) => {
      if (resp.success && resp.data?.rows) {
        this.summaryData = resp.data.rows;
        this.summaryTotal = resp.data.records || resp.data.total || 0;
      }
    });
  }

  private getDetailedData(jobId: string, event: any): void {
    if (!jobId) return;
    this.apiService.getSimulationDetailedResult(jobId, event).subscribe((resp) => {
      if (resp.success && resp.data?.rows) {
        this.detailedData = resp.data.rows;
        this.detailedTotal = resp.data.records || resp.data.total || 0;
      }
    });
  }

  // -- Menu actions --

  menuAction(action: string): void {
    if (action === 'run' || action === 'runInBackground') {
      if (!this.checkValidations()) return;

      if (action === 'run') {
        this.notificationService.info('Please wait while the Analysis is running...');
      }

      this.apiService.startSimulationAnalysis({
        selectedusers: this.preSelection.selectedusers,
        selectedRisks: this.preSelection.selectedRisks,
        sapId: this.preSelection.selectedSAP,
        options: {
          excludeInactive: this.preSelection.options?.excludeInactive,
          excludeUnassigned: this.preSelection.options?.excludeUnassigned,
          includeMitigations: this.preSelection.options?.includeMitigations,
          orgFieldCheck: this.preSelection.options?.orgFieldCheck,
          referenceUser: this.preSelection.options?.referenceUser,
          rolesStep: this.preSelection.options?.rolesStep,
        },
        excludedRoles: this.preSelection?.excludedRoles || [],
        selectedRoles: this.preSelection.selectedRoles,
        background: action === 'runInBackground',
      }, 'online').subscribe((resp) => {
        if (action === 'runInBackground') {
          this.analysisComplete = false;
          this.apiService.openRunBackgroundAlert();
        } else if (resp.success) {
          this.analysisComplete = true;
          this.jobId = resp.data.id;
          this.getViolationsData(this.jobId, DEFAULT_PAGINATION);
          this.getSummaryData(this.jobId, DEFAULT_PAGINATION);
          this.getDetailedData(this.jobId, DEFAULT_PAGINATION);
          this.notificationService.success('Completed the Analysis, results are available now.');
        }
      });
    }
  }

  private checkValidations(): boolean {
    if (!this.preSelection.selectedusers || this.preSelection.selectedusers.length === 0) {
      this.notificationService.error('Please select Users before proceeding.');
      return false;
    }
    if (!this.preSelection.selectedRisks || this.preSelection.selectedRisks.length === 0) {
      this.notificationService.error('Please select Risk before proceeding.');
      return false;
    }
    if (!this.preSelection.selectedRoles || this.preSelection.selectedRoles.length === 0) {
      this.notificationService.error('Please select Roles before proceeding.');
      return false;
    }
    return true;
  }

  private exportSummaryResults(): void {
    if (!this.jobId) { this.notificationService.error('Please run the job first'); return; }
    this.apiService.getExportSimulationSummaryResults(this.jobId).subscribe((resp) => this.fileSaverService.saveAnyFile(resp));
  }

  private exportDetailResults(): void {
    if (!this.jobId) { this.notificationService.error('Please run the job first'); return; }
    this.apiService.getExportDetailResults(this.jobId).subscribe((resp) => this.fileSaverService.saveAnyFile(resp));
  }

  private exportPdf(): void {
    if (!this.jobId) { this.notificationService.error('Please run the job first'); return; }
    this.apiService.exportSimulationPdf(this.jobId).subscribe((resp) => this.fileSaverService.saveAnyFile(resp));
  }

  private runOrgLevelChecks(): void {
    if (!this.jobId) { this.notificationService.error('Please run the job first'); return; }
    this.apiService.loadOrgSelection(this.jobId).subscribe((resp) => {
      if (resp.success) {
        this.nzModal.create({
          nzTitle: 'Start Org Checks - Select Organizations',
          nzWidth: '50vw',
          nzFooter: null,
          nzContent: OrgChecksModalContent,
          nzData: { orgList: resp.data.orgList, jobId: this.jobId },
        });
      }
    });
  }

  private showCharts(): void {
    if (!this.jobId) { this.notificationService.error('Please run the job first'); return; }
    if (!this.summarySelectedRow) { this.notificationService.error('Please select row in Summary Details'); return; }
    this.notificationService.info('Chart display is not yet available in this version.');
  }
}
