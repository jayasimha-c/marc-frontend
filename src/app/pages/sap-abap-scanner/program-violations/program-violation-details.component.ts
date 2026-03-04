import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AbapService } from '../abap.service';
import { AbapSourceModalComponent } from '../import/abap-source-modal.component';
import { RequestIssue } from '../../general/general.model';
import { AddIssueComponent } from '../../general/issues/add/add-issue.component';
import { NotificationService } from '../../../core/services/notification.service';

interface ProgramSummaryVO {
  programName: string;
  programId: string;
  systemName: string;
  sapSystemId: string;
  executionId: number;
  programType: string;
  progPackage: string;
  changedBy: string;
  changedOn: string;
  totalViolations: number;
  rulesViolated: number;
  totalFindings: number;
  lastScanned: string;
  highestSeverity: string;
  issueLink?: string;
  issueCreated?: boolean;
}

interface ViolationDetailsVO {
  ruleId: number;
  ruleName: string;
  ruleDescription: string;
  whiteListed: boolean;
  severity: string;
  status: string;
  category: string;
  violationCount: number;
  findings: FindingDetailsVO[];
  findingsCurrentPage?: number;
  findingsPageSize?: number;
  findingsTotalElements?: number;
  findingsTotalPages?: number;
  findingsFirst?: boolean;
  findingsLast?: boolean;
  findingsLoading?: boolean;
  showAllFindings?: boolean;
}

interface FindingDetailsVO {
  findingId: number;
  lineNumber: number;
  fileName: string;
  matchedCodeSnippet: string;
  pattern: PatternDetailsVO;
}

interface PatternDetailsVO {
  patternId: number;
  patternName: string;
  description: string;
  regexPattern: string;
}

interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Component({
  standalone: false,
  selector: 'app-program-violation-details',
  templateUrl: './program-violation-details.component.html',
  styleUrls: ['./program-violation-details.component.scss'],
})
export class ProgramViolationDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  programDetails: ProgramSummaryVO | null = null;
  violationDetails: ViolationDetailsVO[] = [];
  violationsPagedResponse: PagedResponse<ViolationDetailsVO> | null = null;

  executionId: number | null = null;
  systemId: number | null = null;
  programId: number | null = null;

  severityFilter = 'ALL';
  violationPagination = { pageIndex: 0, pageSize: 10, sort: 'severity', direction: 'ASC' };

  Math = Math;
  loading = false;
  loadingViolations = false;
  error: string | null = null;

  selectedViolation: ViolationDetailsVO | null = null;
  selectedRuleIds = new Set<number>();
  showRuleSelection = false;
  whitelistProcessing = false;

  readonly DEFAULT_FINDINGS_PAGE_SIZE = 10;

  issueDescription: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private abapService: AbapService,
    private modal: NzModalService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    this.executionId = params.get('executionId') ? +params.get('executionId')! : null;
    this.systemId = params.get('systemId') ? +params.get('systemId')! : null;
    this.programId = params.get('programId') ? +params.get('programId')! : null;

    if (this.executionId && this.systemId && this.programId) {
      this.loadAllData();
    } else {
      this.error = 'Invalid route parameters';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData(): void {
    if (!this.executionId || !this.systemId || !this.programId) return;
    this.loading = true;
    this.error = null;
    this.loadProgramSummary();
    this.loadViolationsPaginated();
  }

  loadProgramSummary(): void {
    if (!this.executionId || !this.systemId || !this.programId) return;
    this.abapService.getProgramViolationSummaryDetails(this.executionId, this.systemId, this.programId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.programDetails = res.data;
          }
        },
        error: () => {},
      });
  }

  loadViolationsPaginated(): void {
    if (!this.executionId || !this.systemId || !this.programId) return;
    this.loadingViolations = true;

    this.abapService.getProgramViolationsPaginated(
      this.executionId, this.systemId, this.programId,
      this.violationPagination.pageIndex, this.violationPagination.pageSize,
      this.violationPagination.sort, this.violationPagination.direction,
      this.severityFilter === 'ALL' ? undefined : this.severityFilter
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.violationsPagedResponse = res.data;
            this.violationDetails = res.data.content || [];
            if (this.violationDetails.length > 0) {
              const prev = this.selectedViolation
                ? this.violationDetails.find(v => v.ruleId === this.selectedViolation!.ruleId)
                : null;
              this.selectViolation(prev || this.violationDetails[0]);
            } else {
              this.selectedViolation = null;
            }
          } else {
            this.error = res.message || 'Failed to load violations';
          }
          this.loadingViolations = false;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load violations';
          this.loadingViolations = false;
          this.loading = false;
        },
      });
  }

  applyViolationFilters(): void {
    this.violationPagination.pageIndex = 0;
    this.loadViolationsPaginated();
  }

  onViolationPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.violationPagination.pageIndex = event.pageIndex;
    this.violationPagination.pageSize = event.pageSize;
    this.loadViolationsPaginated();
  }

  onViolationPageSizeChange(pageSize: number): void {
    this.violationPagination.pageSize = pageSize;
    this.violationPagination.pageIndex = 0;
    this.loadViolationsPaginated();
  }

  selectViolation(violation: ViolationDetailsVO): void {
    this.selectedViolation = violation;
    if (violation.findingsCurrentPage === undefined) {
      violation.findingsCurrentPage = 0;
      violation.findingsPageSize = this.DEFAULT_FINDINGS_PAGE_SIZE;
      violation.showAllFindings = false;
      violation.findingsLoading = false;
      this.loadViolationFindings(violation);
    }
  }

  loadViolationFindings(violation: ViolationDetailsVO): void {
    if (!this.executionId || !this.systemId || !this.programId || !violation.ruleId) return;
    violation.findingsLoading = true;

    this.abapService.getProgramRuleFindingsPaginated(
      this.executionId, this.systemId, this.programId, violation.ruleId,
      violation.findingsCurrentPage || 0,
      violation.findingsPageSize || this.DEFAULT_FINDINGS_PAGE_SIZE,
      'lineNumber', 'ASC'
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          violation.findingsLoading = false;
          if (res.success && res.data) {
            violation.findings = res.data.content || [];
            violation.findingsTotalElements = res.data.totalElements;
            violation.findingsTotalPages = res.data.totalPages;
            violation.findingsFirst = res.data.first;
            violation.findingsLast = res.data.last;
          } else {
            violation.findings = [];
          }
        },
        error: () => {
          violation.findingsLoading = false;
          violation.findings = [];
        },
      });
  }

  changeFindingsPage(violation: ViolationDetailsVO, pageIndex: number): void {
    violation.findingsCurrentPage = pageIndex;
    this.loadViolationFindings(violation);
  }

  changeFindingsPageSize(violation: ViolationDetailsVO, pageSize: number): void {
    violation.findingsPageSize = pageSize;
    violation.findingsCurrentPage = 0;
    this.loadViolationFindings(violation);
  }

  getGroupedFindings(violation: ViolationDetailsVO): { [key: string]: FindingDetailsVO[] } {
    const findings = violation.findings || [];
    return findings.reduce((groups, finding) => {
      const key = finding.fileName || 'main.abap';
      if (!groups[key]) groups[key] = [];
      groups[key].push(finding);
      return groups;
    }, {} as { [key: string]: FindingDetailsVO[] });
  }

  getFindingsTotalCount(violation: ViolationDetailsVO): number {
    return violation.findingsTotalElements || 0;
  }

  getFindingsPageInfo(violation: ViolationDetailsVO): { start: number; end: number; total: number } {
    const total = this.getFindingsTotalCount(violation);
    if (total === 0) return { start: 0, end: 0, total: 0 };
    const pageSize = violation.findingsPageSize || this.DEFAULT_FINDINGS_PAGE_SIZE;
    const currentPage = violation.findingsCurrentPage || 0;
    const start = (currentPage * pageSize) + 1;
    const end = Math.min((currentPage + 1) * pageSize, total);
    return { start, end, total };
  }

  shouldShowFindingsPagination(violation: ViolationDetailsVO): boolean {
    const total = this.getFindingsTotalCount(violation);
    const pageSize = violation.findingsPageSize || this.DEFAULT_FINDINGS_PAGE_SIZE;
    return total > pageSize;
  }

  // ==================== Rule Selection ====================

  toggleRuleSelectionMode(): void {
    this.showRuleSelection = !this.showRuleSelection;
    if (!this.showRuleSelection) this.selectedRuleIds.clear();
  }

  toggleRuleSelection(ruleId: number): void {
    if (this.selectedRuleIds.has(ruleId)) {
      this.selectedRuleIds.delete(ruleId);
    } else {
      this.selectedRuleIds.add(ruleId);
    }
  }

  selectAllRules(): void {
    this.violationDetails.forEach(v => this.selectedRuleIds.add(v.ruleId));
  }

  clearSelectedRules(): void {
    this.selectedRuleIds.clear();
  }

  isRuleSelected(ruleId: number): boolean {
    return this.selectedRuleIds.has(ruleId);
  }

  // ==================== Whitelist Actions ====================

  whitelistAllRules(): void {
    if (!this.programId || !this.systemId) return;
    this.modal.confirm({
      nzTitle: 'Whitelist All Rules',
      nzContent: `Are you sure you want to whitelist ALL rules for "${this.programDetails?.programName}"? This cannot be easily undone.`,
      nzOkText: 'Whitelist All',
      nzOkDanger: true,
      nzOnOk: () => {
        this.whitelistProcessing = true;
        this.abapService.whitelistAllRules(this.programId!, this.systemId!).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.notification.success('All rules whitelisted successfully');
            this.loadAllData();
            this.whitelistProcessing = false;
          },
          error: () => {
            this.notification.error('Failed to whitelist rules');
            this.whitelistProcessing = false;
          },
        });
      },
    });
  }

  whitelistSelectedRules(): void {
    if (!this.programId || !this.systemId || this.selectedRuleIds.size === 0) {
      this.notification.warn('Please select at least one rule');
      return;
    }
    const ids = Array.from(this.selectedRuleIds);
    this.modal.confirm({
      nzTitle: 'Whitelist Selected Rules',
      nzContent: `Whitelist ${ids.length} selected rule(s) for "${this.programDetails?.programName}"?`,
      nzOkText: `Whitelist ${ids.length} Rule(s)`,
      nzOkDanger: true,
      nzOnOk: () => {
        this.whitelistProcessing = true;
        this.abapService.whitelistSelectedRules(this.programId!, this.systemId!, ids).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.notification.success(`${ids.length} rule(s) whitelisted`);
            this.selectedRuleIds.clear();
            this.showRuleSelection = false;
            this.loadAllData();
            this.whitelistProcessing = false;
          },
          error: () => {
            this.notification.error('Failed to whitelist rules');
            this.whitelistProcessing = false;
          },
        });
      },
    });
  }

  whitelistSingleRule(ruleId: number, ruleName: string): void {
    if (!this.programId || !this.systemId) return;
    this.modal.confirm({
      nzTitle: 'Whitelist Rule',
      nzContent: `Whitelist "${ruleName}" for "${this.programDetails?.programName}"?`,
      nzOkText: 'Whitelist Rule',
      nzOkDanger: true,
      nzOnOk: () => {
        this.whitelistProcessing = true;
        this.abapService.whitelistSingleRule(this.programId!, this.systemId!, ruleId).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.notification.success(`Rule "${ruleName}" whitelisted`);
            this.loadAllData();
            this.whitelistProcessing = false;
          },
          error: () => {
            this.notification.error('Failed to whitelist rule');
            this.whitelistProcessing = false;
          },
        });
      },
    });
  }

  // ==================== View Source ====================

  onViewProgram(programId: any, sapSystemId: any): void {
    if (!programId || !sapSystemId) {
      this.notification.error('Program ID or System ID is missing');
      return;
    }
    this.abapService.getAbapProgram(programId, sapSystemId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        if (result.success) {
          this.modal.create({
            nzTitle: 'ABAP Source Code',
            nzContent: AbapSourceModalComponent,
            nzData: result,
            nzWidth: '95vw',
            nzFooter: null,
            nzClassName: 'abap-source-modal-panel',
          });
        } else {
          this.notification.error('Failed to load ABAP program');
        }
      },
      error: (err) => this.notification.error(err?.error?.error || 'Failed to load ABAP program'),
    });
  }

  // ==================== Issue Creation ====================

  createIssueForProgram(): void {
    if (!this.programDetails || this.violationDetails.length === 0) {
      this.notification.warn('No violations found to create an issue for');
      return;
    }

    this.abapService.getIssueDescription(this.programId!, this.executionId!).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.issueDescription = res.data;
        const title = `ABAP Rule Violation in Program - ${this.programDetails!.programName} in System - ${this.programDetails!.systemName}`;
        const issue = new RequestIssue(title, this.issueDescription, null, null, this.executionId, this.programId);

        this.modal.create({
          nzTitle: 'Create Issue',
          nzContent: AddIssueComponent,
          nzWidth: '60vw',
          nzData: issue,
          nzFooter: null,
        }).afterClose.pipe(takeUntil(this.destroy$)).subscribe((response) => {
          if (response) this.loadAllData();
        });
      },
      error: () => {},
    });
  }

  hasIssue(): boolean {
    return this.programDetails?.issueCreated === true || !!this.programDetails?.issueLink;
  }

  getIssueLabel(): string {
    if (!this.programDetails?.issueLink) return 'Issue';
    const match = this.programDetails.issueLink.match(/\/issues\/([A-Z]+-\d+)/);
    return match ? match[1] : 'Issue';
  }

  openIssueLink(): void {
    if (this.programDetails?.issueLink) {
      window.open(this.programDetails.issueLink, '_blank', 'noopener,noreferrer');
    }
  }

  // ==================== Navigation ====================

  back(): void {
    history.back();
  }

  viewProgramScanHistory(): void {
    if (!this.executionId || !this.systemId || !this.programId) return;
    this.router.navigate(['/sap-abap-scanner/program-history', this.executionId, this.systemId, this.programId]);
  }

  // ==================== Helpers ====================

  formatProgramType(type: string): string {
    const typeMap: Record<string, string> = {
      R: 'Report', '1': 'Executable Program', I: 'Include',
      M: 'Module Pool', F: 'Function Group', S: 'Subroutine Pool',
      T: 'Type Pool', J: 'Interface', K: 'Class',
      X: 'Transformation', Q: 'DB Procedure Proxy', B: 'Behavior Definition',
      DDLS: 'CDS View', DCLS: 'Access Control', DDLX: 'Metadata Extension',
    };
    return typeMap[type?.toUpperCase()] || type || 'N/A';
  }

  isCdsType(type: string): boolean {
    return ['DDLS', 'DCLS', 'DDLX'].includes(type?.toUpperCase());
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getSeverityColor(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'volcano';
      case 'MEDIUM': return 'orange';
      case 'LOW': return 'blue';
      default: return 'default';
    }
  }
}
