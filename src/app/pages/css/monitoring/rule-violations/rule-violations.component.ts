import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { CssMonitoringService } from '../css-monitoring.service';
import { getRuleTypeLabel } from '../../btp/btp.model';
import { RequestIssue } from '../../../general/general.model';
import { AddIssueComponent } from '../../../general/issues/add/add-issue.component';

export interface ViolationGroup {
  ruleName: string;
  ruleId: number;
  type: string;
  severity: string;
  ruleDescription: string;
  violations: any[];
}

@Component({
  standalone: false,
  selector: 'app-rule-violations',
  templateUrl: './rule-violations.component.html',
  styleUrls: ['./rule-violations.component.scss'],
})
export class RuleViolationsComponent implements OnInit {
  // Stats
  violationStats: any = {};
  statsLoading = false;

  // Filters
  searchText = new FormControl('');
  activeTypeFilter = 'ALL';
  activeSeverityFilters: string[] = [];

  // Data
  allViolations: any[] = [];
  loading = false;

  // Grouped
  ruleGroups: ViolationGroup[] = [];
  pagedRuleGroups: ViolationGroup[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 20;

  // Panel
  leftPanelCollapsed = false;

  // Selection
  selectedGroup: ViolationGroup | null = null;
  selectedViolation: any = null;
  violationDetail: any = null;
  detailLoading = false;

  statsCards: { title: string; value: number; icon: string; color: string }[] = [];

  typeFilters = [
    { key: 'ALL', label: 'All', icon: '' },
    { key: 'SAP_PARAMETER', label: 'Parameter', icon: 'control' },
    { key: 'AUDIT_LOG', label: 'Audit Log', icon: 'file-text' },
    { key: 'BTP', label: 'BTP', icon: 'cloud' },
    { key: 'HANA_DATABASE', label: 'HANA', icon: 'database' },
  ];

  constructor(
    private nzModal: NzModalService,
    private cssMonitoringService: CssMonitoringService,
    private notificationService: NotificationService,
    private router: Router,
    private activeRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.buildStatsCards();
    this.loadStats();
    this.loadAllViolations();
    this.searchText.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.rebuildGroups();
    });
  }

  // -- Stats --

  loadStats(): void {
    this.statsLoading = true;
    this.cssMonitoringService.getViolationsCount().subscribe({
      next: (resp) => {
        this.violationStats = resp.data || {};
        this.buildStatsCards();
        this.statsLoading = false;
      },
      error: () => {
        this.buildStatsCards();
        this.statsLoading = false;
      },
    });
  }

  private buildStatsCards(): void {
    this.statsCards = [
      { title: 'Total Violations', value: this.violationStats.totalCount || 0, icon: 'warning', color: '#f5222d' },
      { title: 'Critical', value: this.violationStats.totalCriticalSeverity || 0, icon: 'exclamation-circle', color: '#fa541c' },
      { title: 'High', value: this.violationStats.totalHighSeverity || 0, icon: 'warning', color: '#fa8c16' },
      { title: 'Systems Affected', value: this.violationStats.totalSystems || 0, icon: 'cluster', color: '#1890ff' },
      { title: 'Open Issues', value: this.violationStats.totalOpenIssues || 0, icon: 'exception', color: '#52c41a' },
    ];
  }

  // -- Data Loading --

  loadAllViolations(): void {
    this.loading = true;
    this.cssMonitoringService.getAllViolationsV2().subscribe({
      next: (resp) => {
        this.allViolations = resp.data?.rows || [];
        this.rebuildGroups();
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  refresh(): void {
    this.loadStats();
    this.loadAllViolations();
    this.selectedGroup = null;
    this.selectedViolation = null;
    this.violationDetail = null;
    this.currentPage = 1;
  }

  // -- Grouping & Filtering --

  rebuildGroups(): void {
    let filtered = [...this.allViolations];
    const search = (this.searchText.value || '').toLowerCase().trim();

    if (search) {
      filtered = filtered.filter(
        (v) =>
          (v.ruleName || '').toLowerCase().includes(search) ||
          (v.sapSystemName || '').toLowerCase().includes(search) ||
          (v.schedulerName || '').toLowerCase().includes(search),
      );
    }

    if (this.activeTypeFilter !== 'ALL') {
      filtered = filtered.filter((v) => v.type === this.activeTypeFilter);
    }

    if (this.activeSeverityFilters.length > 0) {
      filtered = filtered.filter((v) =>
        this.activeSeverityFilters.includes((v.severity || '').toUpperCase()),
      );
    }

    const groupMap = new Map<string, ViolationGroup>();
    for (const v of filtered) {
      const key = `${v.ruleId}_${v.ruleName}_${v.type}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          ruleName: v.ruleName,
          ruleId: v.ruleId,
          type: v.type,
          severity: v.severity,
          ruleDescription: v.ruleDescription || '',
          violations: [],
        });
      }
      groupMap.get(key)!.violations.push(v);
    }

    this.ruleGroups = Array.from(groupMap.values()).sort((a, b) => {
      const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const aO = order[(a.severity || '').toUpperCase()] ?? 9;
      const bO = order[(b.severity || '').toUpperCase()] ?? 9;
      if (aO !== bO) return aO - bO;
      return b.violations.length - a.violations.length;
    });
    this.updatePagedGroups();
  }

  // -- Pagination --

  get totalPages(): number {
    return Math.ceil(this.ruleGroups.length / this.pageSize);
  }

  private updatePagedGroups(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedRuleGroups = this.ruleGroups.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagedGroups();
  }

  // -- Filters --

  setTypeFilter(type: string): void {
    this.activeTypeFilter = type;
    this.currentPage = 1;
    this.rebuildGroups();
  }

  toggleSeverityFilter(severity: string): void {
    const idx = this.activeSeverityFilters.indexOf(severity);
    if (idx >= 0) {
      this.activeSeverityFilters.splice(idx, 1);
    } else {
      this.activeSeverityFilters.push(severity);
    }
    this.currentPage = 1;
    this.rebuildGroups();
  }

  isSeverityActive(severity: string): boolean {
    return this.activeSeverityFilters.includes(severity);
  }

  getCountForType(type: string): number {
    if (type === 'ALL') return this.allViolations.length;
    return this.allViolations.filter((v) => v.type === type).length;
  }

  // -- Selection --

  selectGroup(group: ViolationGroup): void {
    this.selectedGroup = group;
    if (group.violations.length > 0) {
      this.selectViolation(group.violations[0], group);
    }
  }

  selectViolation(violation: any, group: ViolationGroup): void {
    this.selectedGroup = group;
    this.selectedViolation = violation;
    this.loadViolationDetail(violation);
  }

  isGroupSelected(group: ViolationGroup): boolean {
    return this.selectedGroup === group;
  }

  onViewFullDetail(): void {
    if (!this.selectedViolation) return;
    this.router.navigate(
      [`/css/monitoring/view-violations/${this.selectedViolation.id}/${this.selectedViolation.type}`],
    );
  }

  // -- Detail --

  loadViolationDetail(violation: any): void {
    this.detailLoading = true;
    this.violationDetail = null;
    this.cssMonitoringService.getViolationById(violation.id, violation.type).subscribe({
      next: (resp) => {
        this.violationDetail = resp.data;
        this.detailLoading = false;
      },
      error: () => (this.detailLoading = false),
    });
  }

  // -- Helpers --

  getTypeLabel(type: string): string {
    return getRuleTypeLabel(type);
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'SAP_PARAMETER': return 'control';
      case 'AUDIT_LOG': return 'file-text';
      case 'BTP': return 'cloud';
      case 'HANA_DATABASE': return 'database';
      case 'SAP_UME': return 'user';
      case 'SAP_ABAP': return 'code';
      default: return 'audit';
    }
  }

  getSeverityColor(severity: string): string {
    switch ((severity || '').toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'gold';
      case 'LOW': return 'green';
      default: return 'default';
    }
  }

  // -- Issue Creation --

  onCreateIssue(): void {
    if (!this.selectedViolation) return;
    this.openIssueDialog(this.selectedViolation);
  }

  onCreateIssueForViolation(violation: any): void {
    this.openIssueDialog(violation);
  }

  onBulkCreateIssues(): void {
    if (!this.selectedGroup) return;
    const target = this.selectedGroup.violations.find((v) => !v.issueName) || this.selectedGroup.violations[0];
    this.openIssueDialog(target);
  }

  private openIssueDialog(violation: any): void {
    const issue = new RequestIssue(
      violation.ruleName || 'Violation',
      violation.ruleDescription || '',
      violation,
      null,
    );
    this.nzModal.create({
      nzTitle: 'Add Issue',
      nzContent: AddIssueComponent,
      nzWidth: '60vw',
      nzData: issue,
      nzFooter: null,
      nzClassName: 'updated-modal',
    }).afterClose.subscribe(() => {
      this.loadAllViolations();
      this.loadStats();
    });
  }
}
