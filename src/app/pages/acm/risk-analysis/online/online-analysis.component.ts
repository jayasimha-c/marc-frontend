import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { filter, Subscription } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { RiskAnalysisOnlineService } from '../risk-analysis-online.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';
import { PreSelectionModalComponent } from './pre-selection-modal.component';

const DEFAULT_PAGINATION = { first: 0, rows: 10, sortOrder: 1, sortField: '', filters: {}, globalFilter: null };

@Component({
  standalone: false,
  selector: 'app-online-analysis',
  templateUrl: './online-analysis.component.html',
})
export class OnlineAnalysisComponent implements OnInit, OnDestroy {
  currentStep = 0;
  preSelection: any = { selectedTargetType: 'USER', selectedAnalysisType: 'RULE' };
  jobId: any;
  analysisComplete = false;
  header = 'Online Analysis';

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
    { field: 'userName', header: 'User Name' },
    { field: 'bname', header: 'User ID' },
    { field: 'userType', header: 'Type' },
    { field: 'orgName', header: 'User Group' },
    { field: 'businessProcess', header: 'Business Process' },
    { field: 'businessSubProcess', header: 'Sub Process' },
    { field: 'ruleName', header: 'Rule' },
    { field: 'ruleDesc', header: 'Rule Description' },
  ];

  // Detailed report table
  detailedData: any[] = [];
  detailedTotal = 0;
  detailedCols = [
    { field: 'userName', header: 'User' },
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
    { label: 'Show Chart', icon: 'pie-chart', command: () => this.showCharts() },
    { label: 'Assign Mitigation', icon: 'solution', command: () => this.assignMitigation() },
  ];

  private routerSubscription!: Subscription;
  private dialogOpen = false;

  constructor(
    private apiService: RiskAnalysisOnlineService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private fileSaverService: FileSaverService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.routerSubscription = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.analysisComplete = false;
      this.initializeComponent();
    });
  }

  initializeComponent(): void {
    if (this.dialogOpen) return;
    this.dialogOpen = true;
    this.nzModal.create({
      nzTitle: 'AdHoc PreSelection',
      nzContent: PreSelectionModalComponent,
      nzWidth: '40vw',
      nzMaskClosable: false,
      nzClosable: false,
      nzFooter: null,
    }).afterClose.subscribe((result) => {
      this.dialogOpen = false;
      if (result) {
        this.preSelection = result.preSelection;
        setTimeout(() => this.apiService.preSelectedData.next(result.preSelection), 100);
        this.configureMenuForAnalysisType();
        this.configureColumnsForAnalysisType();
        this.configureColumnsForTargetType();
      }
    });
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
    this.apiService.getResultSummary(jobId, event).subscribe((resp) => {
      if (resp.success && resp.data?.rows?.length > 0) {
        this.summaryData = resp.data.rows;
        this.summaryTotal = resp.data.records;
      }
    });
  }

  private getDetailedData(jobId: string, event: any): void {
    if (!jobId) return;
    this.apiService.getDetailedResult(jobId, event).subscribe((resp) => {
      if (resp.success && resp.data?.rows?.length > 0) {
        this.detailedData = resp.data.rows;
        this.detailedTotal = resp.data.records;
      }
    });
  }

  // -- Menu actions --

  menuAction(action: string): void {
    if (action === 'run' || action === 'runInBackground') {
      if (!this.checkValidations(action)) return;

      if (action === 'run') {
        this.notificationService.info('Please wait while the Analysis is running...');
      }

      this.apiService.startAnalysis(action === 'runInBackground', {
        selectedusers: this.preSelection.selectedusers,
        selectedRules: this.preSelection.selectedRules,
        selectedSAP: this.preSelection.selectedSAP,
        selectedRisks: this.preSelection.selectedRisks,
        options: {
          excludeInactive: this.preSelection.options?.excludeInactive,
          excludeUnassigned: this.preSelection.options?.excludeUnassigned,
          includeMitigations: this.preSelection.options?.includeMitigations,
          orgFieldCheck: this.preSelection.options?.orgFieldCheck,
          referenceUser: this.preSelection.options?.referenceUser,
        },
        selectedTargetType: this.preSelection.selectedTargetType,
        selectedAnalysisType: this.preSelection.selectedAnalysisType,
        background: action === 'runInBackground',
      }).subscribe((resp) => {
        if (action === 'runInBackground') {
          this.analysisComplete = false;
          this.apiService.openRunBackgroundAlert();
        } else if (resp.success) {
          this.analysisComplete = true;
          this.jobId = resp.data.jobId;
          this.getDetailedData(this.jobId, DEFAULT_PAGINATION);
          this.notificationService.success('Completed the Analysis, results are available now.');
        }
      });
    }
  }

  private checkValidations(action: string): boolean {
    if (!this.preSelection.selectedusers || this.preSelection.selectedusers.length === 0) {
      const msg = this.preSelection.selectedTargetType === 'USER'
        ? 'Please select Users before proceeding.'
        : 'Please select Roles before proceeding.';
      this.notificationService.error(msg);
      return false;
    }
    if (action === 'run' && this.preSelection.selectedusers.length >= 100) {
      this.notificationService.error(
        `For more than 100 ${this.preSelection.selectedTargetType}, Please start the analysis in Background`
      );
      return false;
    }
    if (this.preSelection.selectedAnalysisType === 'RISK' &&
        (!this.preSelection.selectedRisks || this.preSelection.selectedRisks.length === 0)) {
      this.notificationService.error('Please select Risk before proceeding.');
      return false;
    }
    if (this.preSelection.selectedAnalysisType === 'RULE' &&
        (!this.preSelection.selectedRules || this.preSelection.selectedRules.length === 0)) {
      this.notificationService.error('Please select Rules before proceeding.');
      return false;
    }
    return true;
  }

  private exportSummaryResults(): void {
    if (!this.jobId) { this.notificationService.error('Please run the job first'); return; }
    this.apiService.getExportSummaryResults(this.jobId).subscribe((resp) => this.fileSaverService.saveAnyFile(resp));
  }

  private exportDetailResults(): void {
    if (!this.jobId) { this.notificationService.error('Please run the job first'); return; }
    this.apiService.getExportDetailResults(this.jobId).subscribe((resp) => this.fileSaverService.saveAnyFile(resp));
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
    // Chart modal would be opened here — stub for now
    this.notificationService.info('Chart display is not yet available in this version.');
  }

  private assignMitigation(): void {
    if (!this.jobId) { this.notificationService.error('Please run the job first'); return; }
    if (!this.summarySelectedRow) { this.notificationService.error('Please select row in Summary Details'); return; }
    this.apiService.getSapSystemNameForAssignMitigation(this.jobId).subscribe((resp) => {
      if (resp.success) {
        // Mitigation modal would be opened here — stub for now
        this.notificationService.info('Assign Mitigation is not yet available in this version.');
      }
    });
  }

  // -- Column configuration --

  private configureMenuForAnalysisType(): void {
    if (this.preSelection?.selectedAnalysisType === 'RULE') {
      this.analysisMenuList = this.analysisMenuList.filter(
        (m) => m.label !== 'Show Chart' && m.label !== 'Assign Mitigation'
      );
    }
    if (this.preSelection?.selectedTargetType === 'ROLE') {
      const hasRoleMatrix = this.analysisMenuList.some((m) => m.label === 'Role SOD Matrix');
      if (!hasRoleMatrix) {
        this.analysisMenuList.push({
          label: 'Role SOD Matrix', icon: 'table', command: () => {},
        });
      }
    }
  }

  private configureColumnsForAnalysisType(): void {
    if (this.preSelection?.selectedAnalysisType === 'RISK') {
      this.summaryCols = [
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
      this.detailedCols = [
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
    }
  }

  private configureColumnsForTargetType(): void {
    if (this.preSelection?.selectedTargetType === 'ROLE') {
      this.summaryCols = this.summaryCols
        .filter((col) => col.field !== 'userType' && col.field !== 'orgName')
        .map((col) => {
          if (col.field === 'bname') return { ...col, header: 'Role ID' };
          if (col.field === 'userName') return { ...col, header: 'Role Description' };
          return col;
        });
      this.detailedCols = this.detailedCols.map((col) => {
        if (col.field === 'bname') return { ...col, header: 'Role ID' };
        if (col.field === 'userName') return { ...col, header: 'Role Description' };
        return col;
      });
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
}

// Simple org checks modal content (stub)
import { Inject, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  standalone: false,
  selector: 'app-org-checks-modal-content',
  template: `
    <div style="padding: 16px;">
      <nz-table #orgTable [nzData]="dialogData.orgList || []" nzSize="small" [nzShowPagination]="false"
                [nzScroll]="{ y: '40vh' }">
        <thead><tr><th>Organization</th><th>Selected</th></tr></thead>
        <tbody>
          <tr *ngFor="let org of orgTable.data">
            <td>{{ org.name || org }}</td>
            <td><label nz-checkbox [(ngModel)]="org.selected"></label></td>
          </tr>
        </tbody>
      </nz-table>
    </div>
    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Close</button>
      <button nz-button nzType="primary" (click)="startChecks()">Start Checks</button>
    </div>
  `,
})
export class OrgChecksModalContent {
  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
    @Optional() public modal: NzModalRef,
  ) {}

  startChecks(): void {
    const selectedOrgs = (this.dialogData.orgList || []).filter((o: any) => o.selected);
    this.modal.close({ selectedOrgs, jobId: this.dialogData.jobId });
  }
}
