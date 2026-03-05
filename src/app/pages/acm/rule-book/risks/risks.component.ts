import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RisksService } from './risks.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { TableColumn, TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { AddRiskComponent } from './add-risk/add-risk.component';
import { AddRulesToRiskComponent } from './add-rules-to-risk/add-rules-to-risk.component';
import { RiskDetailComponent } from './risk-detail/risk-detail.component';
import { ConsistencyCheckComponent } from './consistency-check/consistency-check.component';
import { ObjectFilterComponent, ObjectFilterData } from '../rules/object-filter/object-filter.component';

@Component({
  standalone: false,
  selector: 'app-risks',
  templateUrl: './risks.component.html',
  styleUrls: ['./risks.component.scss'],
})
export class RisksComponent implements OnInit, OnDestroy {
  @ViewChild('historyPanel') historyPanel!: SidePanelComponent;
  private destroy$ = new Subject<void>();

  // ── Data ───────────────────────────────────────────────────
  data: any[] = [];
  totalRecords = 0;
  loading = true;
  selectedRisk: any = null;
  selectedRisks: any[] = [];

  // ── Rules sub-table ────────────────────────────────────────
  riskRulesData: any[] = [];
  riskRulesLoading = false;

  // ── Object Filter ──────────────────────────────────────────
  objectFilterActive = false;
  objectFilterData: ObjectFilterData = { authObjects: [], authFields: [], values: [], matchMode: 'OR' };

  // ── Dashboard ──────────────────────────────────────────────
  riskMetrics = { totalRisks: 0 };
  riskLevelsChartData: any[] = [];
  businessProcessChartData: any[] = [];
  statusTags: { label: string; value: number }[] = [];
  distributions: { title: string; icon: string; data: any[] }[] = [];

  // ── History ────────────────────────────────────────────────
  historyLoading = false;
  historyLogs: any[] = [];
  selectedHistoryLog: any = null;
  historyDetailsLoading = false;
  historyDetails: any[] = [];
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // ── Table config ───────────────────────────────────────────
  columns: TableColumn[] = [
    { field: 'name', header: 'Risk ID', sortable: true, filterable: true, width: '140px', onClick: (row: any) => this.openDetail(row) },
    { field: 'riskDescription', header: 'Description', filterable: true },
    { field: 'businessProcessName', header: 'Business Process', sortable: true, filterable: true, width: '160px' },
    { field: 'riskTypeName', header: 'Type', sortable: true, filterable: true, width: '100px' },
    { field: 'riskLevel', header: 'Level', sortable: true, filterable: true, type: 'tag', width: '100px',
      tagColors: { Critical: 'red', High: 'orange', Medium: 'blue', Low: 'green' } },
    { field: 'crossSystemDisplay', header: 'Cross', sortable: true, width: '80px', type: 'tag',
      tagColors: { Yes: 'geekblue', No: 'default' } },
    { field: 'enabledDisplay', header: 'Enabled', sortable: true, width: '90px', type: 'tag',
      tagColors: { Active: 'success', Inactive: 'default' } },
  ];

  rulesColumns: TableColumn[] = [
    { field: 'ruleName', header: 'Rule ID', sortable: true, width: '140px' },
    { field: 'ruleDescription', header: 'Description' },
    { field: 'businessProcessName', header: 'Business Process', width: '150px' },
    { field: 'subProcName', header: 'Sub Process', width: '130px' },
    { field: 'ruleTypeName', header: 'Type', width: '100px' },
    { field: 'targetSystem', header: 'Target System', width: '120px' },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.addRisk(), pinned: true },
    { label: 'Edit', icon: 'edit', command: () => this.editRisk() },
    { label: 'Enable', icon: 'check-circle', command: () => this.enableRisk() },
    { label: 'Disable', icon: 'close-circle', command: () => this.disableRisk() },
    { label: 'Add Rules', icon: 'plus-square', command: () => this.addRulesToRisk() },
    { label: 'Consistency', icon: 'audit', command: () => this.checkConsistency() },
    { label: 'History', icon: 'history', command: () => this.viewRiskHistory() },
    { label: 'Object Filter', icon: 'filter', command: () => this.openObjectFilter() },
    { label: 'Export', icon: 'file-excel', command: () => this.exportRisks() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.deleteRisk() },
  ];

  constructor(
    private risksService: RisksService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.loadRisks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Load Risks ─────────────────────────────────────────────

  loadRisks(): void {
    this.loading = true;

    if (this.objectFilterActive) {
      const payload = {
        first: 0, rows: 10000,
        authObjects: this.objectFilterData.authObjects,
        authFields: this.objectFilterData.authFields,
        values: this.objectFilterData.values,
        matchMode: this.objectFilterData.matchMode,
      };
      this.risksService.searchRisksByObjects(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => this.handleRisksResponse(res),
        error: () => { this.data = []; this.loading = false; },
      });
    } else {
      this.risksService.getRisks().pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => this.handleRisksResponse(res),
        error: () => { this.data = []; this.loading = false; },
      });
    }
  }

  private handleRisksResponse(res: any): void {
    if (res?.data) {
      this.data = (res.data.rows || []).map((r: any) => ({
        ...r,
        businessProcessName: r.businessProcess?.name || '',
        riskTypeName: r.riskType?.name || '',
        crossSystemDisplay: r.crossSystem ? 'Yes' : 'No',
        enabledDisplay: r.enabled ? 'Active' : 'Inactive',
      }));
      this.totalRecords = res.data.records || this.data.length;
    }
    this.riskRulesData = [];
    this.selectedRisk = null;
    this.calculateMetrics();
    this.loading = false;
  }

  // ── Row click → load rules ─────────────────────────────────

  onRowClick(row: any): void {
    this.selectedRisk = row;
    this.selectedRisks = [row];
    this.loadRiskRules();
  }

  private loadRiskRules(): void {
    if (!this.selectedRisk) { this.riskRulesData = []; return; }
    this.riskRulesLoading = true;
    this.risksService.getRiskRules(this.selectedRisk.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.riskRulesData = (res?.data?.rows || []).map((r: any) => ({
          ...r,
          businessProcessName: r.businessProcess?.name || '',
          subProcName: r.subProc?.name || '',
          ruleTypeName: r.ruleType?.name || '',
          targetSystem: r.sapSystemName || (r.secondary ? 'Secondary' : 'Primary'),
        }));
        this.riskRulesLoading = false;
      },
      error: () => { this.riskRulesData = []; this.riskRulesLoading = false; },
    });
  }

  // ── CRUD ───────────────────────────────────────────────────

  addRisk(): void {
    this.risksService.getAddRiskRequired().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.openRiskModal('Add', res.data, null);
    });
  }

  editRisk(): void {
    if (!this.checkRiskSelected()) return;
    this.risksService.getEditRiskRequired(this.selectedRisk.id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.openRiskModal('Update', res.data, this.selectedRisk);
    });
  }

  deleteRisk(): void {
    if (!this.checkRiskSelected()) return;
    this.confirmDialogService.confirm({
      title: 'Delete Risk',
      message: `Are you sure you want to delete risk "${this.selectedRisk.name}"?`,
    }).subscribe(result => {
      if (result) {
        this.risksService.riskDelete(this.selectedRisk.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => {
            this.notificationService.show(res);
            if (res.success) this.loadRisks();
          },
          error: (err: any) => this.notificationService.error(err.error?.message || 'Error deleting risk'),
        });
      }
    });
  }

  enableRisk(): void {
    if (!this.checkRiskSelected()) return;
    this.risksService.riskEnable(this.selectedRisk.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.notificationService.show(res); if (res.success) this.loadRisks(); },
      error: (err: any) => this.notificationService.error(err.error?.message || 'Error'),
    });
  }

  disableRisk(): void {
    if (!this.checkRiskSelected()) return;
    this.risksService.riskDisable(this.selectedRisk.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.notificationService.show(res); if (res.success) this.loadRisks(); },
      error: (err: any) => this.notificationService.error(err.error?.message || 'Error'),
    });
  }

  // ── Add Rules to Risk ──────────────────────────────────────

  addRulesToRisk(): void {
    if (!this.checkRiskSelected()) return;
    const ref = this.modal.create({
      nzTitle: 'Add Rules To Risk — ' + (this.selectedRisk.name || ''),
      nzContent: AddRulesToRiskComponent,
      nzWidth: '75vw',
      nzFooter: null,
      nzData: { selectedRiskData: this.selectedRisk, selectedRuleData: this.riskRulesData },
    });
    ref.afterClose.subscribe(result => { if (result) this.loadRiskRules(); });
  }

  // ── Consistency Check ──────────────────────────────────────

  checkConsistency(): void {
    this.modal.create({
      nzTitle: 'Consistency Check',
      nzContent: ConsistencyCheckComponent,
      nzWidth: '90vw',
      nzFooter: null,
    });
  }

  // ── Export ─────────────────────────────────────────────────

  exportRisks(): void {
    this.risksService.getExportRisks().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      const blob = res instanceof Blob ? res : new Blob([res]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'RiskDetails.xlsx'; a.click();
      window.URL.revokeObjectURL(url);
      this.notificationService.success('Risks exported successfully');
    });
  }

  // ── Object Filter ──────────────────────────────────────────

  openObjectFilter(): void {
    const ref = this.modal.create({
      nzTitle: 'Filter by Rule Objects',
      nzContent: ObjectFilterComponent,
      nzWidth: '500px',
      nzFooter: null,
      nzData: this.objectFilterData,
    });
    ref.afterClose.subscribe((result: ObjectFilterData) => {
      if (result) {
        this.objectFilterData = result;
        this.objectFilterActive = result.authObjects.length > 0 || result.authFields.length > 0 || result.values.length > 0;
        this.loadRisks();
      }
    });
  }

  clearObjectFilter(): void {
    this.objectFilterData = { authObjects: [], authFields: [], values: [], matchMode: 'OR' };
    this.objectFilterActive = false;
    this.loadRisks();
  }

  get objectFilterCount(): number {
    return (this.objectFilterData.authObjects?.length || 0) +
      (this.objectFilterData.authFields?.length || 0) +
      (this.objectFilterData.values?.length || 0);
  }

  // ── History ────────────────────────────────────────────────

  viewRiskHistory(): void {
    if (!this.checkRiskSelected()) return;
    this.historyLoading = true;
    this.historyLogs = [];
    this.selectedHistoryLog = null;
    this.historyDetails = [];

    this.risksService.getRiskHistory(this.selectedRisk.name, this.timezone)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            this.historyLogs = res.data.map((log: any) => ({
              ...log,
              updateTimeDisplay: this.formatDate(log.updateTime),
              changeTypeDisplay: log.changeType === 0 ? 'Risk' : 'Rules',
            }));
          }
          this.historyLoading = false;
          this.historyPanel?.open();
        },
        error: () => { this.historyLoading = false; },
      });
  }

  onHistoryRowClick(row: any): void {
    this.selectedHistoryLog = row;
    this.loadHistoryDetails(row.id, row.changeType);
  }

  onHistoryPanelClosed(): void {
    this.selectedHistoryLog = null;
    this.historyDetails = [];
  }

  copyHistoryToClipboard(): void {
    if (!this.historyLogs.length) return;
    const lines = [
      `Risk: ${this.selectedRisk?.name}`,
      `Change History (${this.historyLogs.length} entries)`,
      '', '#\tDate\tAction\tType\tBy',
      ...this.historyLogs.map((r: any) => `${r.id}\t${r.updateTimeDisplay}\t${r.action}\t${r.changeTypeDisplay}\t${r.updatedBy}`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      this.notificationService.success('History copied to clipboard');
    });
  }

  copyDetailsToClipboard(): void {
    if (!this.historyDetails.length) return;
    const lines = [
      `${this.selectedHistoryLog?.action} Details`, '',
      'Action\tProperty\tBefore\tAfter',
      ...this.historyDetails.map((r: any) => `${r.action}\t${r.property}\t${r.before}\t${r.after}`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      this.notificationService.success('Details copied to clipboard');
    });
  }

  formatDate(value: any): string {
    if (!value) return '—';
    let date: Date;
    if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
      date = new Date(Number(value));
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else { return String(value); }
    if (isNaN(date.getTime())) return String(value);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${hours}:${mins}`;
  }

  // ── Private helpers ────────────────────────────────────────

  private openDetail(row: any): void {
    this.modal.create({
      nzTitle: 'Risk Details',
      nzContent: RiskDetailComponent,
      nzWidth: '70vw',
      nzFooter: null,
      nzData: { riskId: row.id },
    });
  }

  private openRiskModal(action: string, options: any, selectedRow: any): void {
    const ref = this.modal.create({
      nzTitle: action + ' Risk',
      nzContent: AddRiskComponent,
      nzWidth: '550px',
      nzFooter: null,
      nzData: { formType: action, risk: selectedRow, selectedOptions: options },
    });
    ref.afterClose.subscribe(result => { if (result) this.loadRisks(); });
  }

  private checkRiskSelected(): boolean {
    if (!this.selectedRisk) {
      this.notificationService.error('Please select a risk');
      return false;
    }
    return true;
  }

  private loadHistoryDetails(logId: number, changeType: number): void {
    this.historyDetailsLoading = true;
    this.historyDetails = [];
    const obs$ = changeType === 1
      ? this.risksService.getRiskRuleLogDetails(logId)
      : this.risksService.getRiskLogDetails(logId);

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.data?.rows) {
          this.historyDetails = changeType === 1
            ? res.data.rows.map((d: any) => ({
                action: d.action || '—', property: 'Rule',
                before: d.valueBefore || '—', after: d.valueAfter || '—',
              }))
            : res.data.rows.map((d: any) => ({
                action: 'CHANGE', property: d.name || '—',
                before: d.valueBefore || '—', after: d.valueAfter || '—',
              }));
        }
        this.historyDetailsLoading = false;
      },
      error: () => { this.historyDetailsLoading = false; },
    });
  }

  // ── Metrics (client-side from loaded data) ─────────────────

  private calculateMetrics(): void {
    const risks = this.data || [];
    this.riskMetrics.totalRisks = risks.length;
    if (!risks.length) {
      this.riskLevelsChartData = [];
      this.businessProcessChartData = [];
      this.statusTags = [];
      this.distributions = [];
      return;
    }

    // Risk levels
    const levelColors: Record<string, string> = { critical: '#dc2626', high: '#ea580c', medium: '#3b82f6', low: '#16a34a' };
    const levelCount: Record<string, number> = {};
    const bpCount: Record<string, number> = {};
    let active = 0; let inactive = 0;

    risks.forEach((r: any) => {
      const level = (r.riskLevel || '').toLowerCase();
      if (level) levelCount[level] = (levelCount[level] || 0) + 1;
      const bp = r.businessProcess?.name || 'Other';
      bpCount[bp] = (bpCount[bp] || 0) + 1;
      if (r.enabled) active++; else inactive++;
    });

    const total = risks.length;
    this.riskLevelsChartData = Object.entries(levelCount)
      .map(([key, val]) => ({ label: key.charAt(0).toUpperCase() + key.slice(1), value: val, percentage: Math.round((val / total) * 100), color: levelColors[key] || '#999' }))
      .filter(i => i.value > 0)
      .sort((a, b) => b.value - a.value);

    // Business process — top 5 + Other
    const bpColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
    const bpSorted = Object.entries(bpCount).sort((a, b) => b[1] - a[1]);
    const bpTop = bpSorted.slice(0, 5);
    const bpRest = bpSorted.slice(5).reduce((s, [, v]) => s + v, 0);
    this.businessProcessChartData = bpTop.map(([name, val], i) => ({
      label: name, value: val, percentage: Math.round((val / total) * 100), color: bpColors[i % bpColors.length],
    }));
    if (bpRest > 0) {
      this.businessProcessChartData.push({ label: 'Other', value: bpRest, percentage: Math.round((bpRest / total) * 100), color: '#d1d5db' });
    }

    // Status tags
    this.statusTags = [];
    if (active > 0) this.statusTags.push({ label: 'Active', value: active });
    if (inactive > 0) this.statusTags.push({ label: 'Inactive', value: inactive });

    // Build distributions
    this.distributions = [];
    if (this.riskLevelsChartData.length > 0) {
      this.distributions.push({ title: 'Risk Levels', icon: 'bar-chart', data: this.riskLevelsChartData });
    }
    if (this.businessProcessChartData.length > 0) {
      this.distributions.push({ title: 'Business Process', icon: 'bank', data: this.businessProcessChartData });
    }
  }
}
