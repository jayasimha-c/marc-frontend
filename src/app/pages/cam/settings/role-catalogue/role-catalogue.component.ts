import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RoleCatalogueService } from './role-catalogue.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AddRoleCatalogueComponent } from './add-role-catalogue/add-role-catalogue.component';
import { AddRemoveRolesComponent } from './add-remove-roles/add-remove-roles.component';
import { InlineColumn } from '../../../../shared/components/inline-table/inline-table.models';
import { TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { InlineTableComponent } from '../../../../shared/components/inline-table/inline-table.component';

const CRITICALITY_COLORS: Record<string, string> = {
  Critical: 'red', High: 'orange', Medium: 'gold', Low: 'green',
};
const YES_NO_COLORS: Record<string, string> = { Yes: 'green', No: '' };
const INCONSISTENCY_COLORS: Record<string, string> = { Issues: 'red', Clean: 'green' };
const RISK_COMPLETE_COLORS: Record<string, string> = { Complete: 'green', Pending: 'orange' };

const DIST_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

@Component({
  standalone: false,
  selector: 'app-role-catalogue',
  templateUrl: './role-catalogue.component.html',
  styleUrls: ['./role-catalogue.component.scss'],
})
export class RoleCatalogueComponent implements OnInit, OnDestroy {
  @ViewChild('inlineTable') inlineTable!: InlineTableComponent;
  private destroy$ = new Subject<void>();

  // Main table
  data: any[] = [];
  totalRecords = 0;
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  sortField = '';
  sortDirection = 'ASC';
  globalSearch = '';

  // Selection
  selectedRow: any = null;
  selectedRows: any[] = [];

  // Info data
  sapSystemList: string[] = [];
  userIds: string[] = [];
  userNameMap: Record<string, string> = {};

  // Role names for add/remove
  allSelectedRoleNames: string[] = [];

  // Secondary tables
  rolesData: any[] = [];
  rolesLoading = false;
  risksData: any[] = [];
  risksLoading = false;
  ownersData: any[] = [];
  ownersLoading = false;
  ownersDirty = false;

  // ── Dashboard Metrics ──
  metrics = { totalRoles: 0, jobProfiles: 0, systems: 0, violations: 0, riskCompletePct: 0 };
  criticalityDist: { label: string; value: number; percentage: number; color: string }[] = [];
  systemDist: { label: string; value: number; percentage: number; color: string }[] = [];
  systemTags: { label: string; value: number }[] = [];
  distributions: { title: string; icon: string; data: any[] }[] = [];

  // ── Inline Table Config ──
  inlineColumns: InlineColumn[] = [
    { field: 'roleName', header: 'Role', width: '180px', type: 'text', pasteIndex: 0 },
    { field: 'businessProcess', header: 'Business Process', width: '150px', type: 'text', pasteIndex: 1 },
    { field: 'subBusinessProcess', header: 'Sub Process', width: '170px', type: 'text', pasteIndex: 2 },
    { field: 'department', header: 'Department', width: '120px', type: 'text', pasteIndex: 3 },
    { field: 'division', header: 'Division', width: '110px', type: 'text', pasteIndex: 4 },
    { field: 'criticality', header: 'Criticality', width: '100px', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'], tagColor: CRITICALITY_COLORS },
    { field: 'sapSystem', header: 'System', width: '120px', type: 'select', options: [], showSearch: true },
    { field: 'jobProfile', header: 'Job Profile', width: '100px', type: 'select', options: ['Yes', 'No'], tagColor: YES_NO_COLORS },
    { field: 'roleCount', header: 'Role Count', width: '90px', type: 'readonly', align: 'center' },
    { field: 'roleInconsistency', header: 'Inconsistency', width: '130px', type: 'tag', tagColor: INCONSISTENCY_COLORS },
    { field: 'riskComplete', header: 'Risk Complete', width: '120px', type: 'tag', tagColor: RISK_COMPLETE_COLORS },
  ];

  tableActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.addCatalogue() },
    { label: 'Edit', icon: 'edit', command: () => this.inlineTable?.startEdit() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.deleteCatalogue() },
    { label: 'Add/Remove Roles', icon: 'swap', command: () => this.openAddRemoveRoles() },
    { label: 'Role Upload', icon: 'upload', command: () => this.goToUploadWizard() },
    { label: 'SOD Analysis', icon: 'safety-certificate', command: () => this.runSodAnalysis() },
    { label: 'Export', icon: 'download', command: () => this.exportData() },
  ];

  constructor(
    private rcService: RoleCatalogueService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
    private modal: NzModalService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Info ──

  private loadInfo(): void {
    this.rcService.getRoleCatalogueInfo().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.sapSystemList = res.data.sapSystemList || [];
          this.userIds = res.data.userIds || [];
          this.userNameMap = res.data.userNameMap || {};
          // Update sapSystem column options
          const sysCol = this.inlineColumns.find(c => c.field === 'sapSystem');
          if (sysCol) sysCol.options = this.sapSystemList;
        }
        this.loadData();
      },
      error: () => this.loadData(),
    });
  }

  // ── Main Table Data ──

  loadData(): void {
    this.loading = true;
    this.rcService.getRoleCatalogueList(this.pageIndex, this.pageSize, this.sortField, this.sortDirection, null, this.globalSearch)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res?.data?.rows) {
            this.data = res.data.rows.map((row: any) => this.transformRow(row));
            this.totalRecords = res.data.records || 0;
          }
          this.loading = false;
          this.calculateMetrics();
        },
        error: () => { this.data = []; this.loading = false; },
      });
  }

  private transformRow(row: any): any {
    const jp = row.jobProfile;
    row.jobProfile = (jp === true || jp === 1 || (typeof jp === 'string' && jp.toLowerCase() === 'yes')) ? 'Yes' : 'No';
    row.roleInconsistency = row.roleInconsistency === true ? 'Issues' : 'Clean';
    row.riskComplete = (row.riskComplete === true || row.riskComplete === 'complete') ? 'Complete' : 'Pending';
    if (row.criticality) {
      const c = row.criticality.toLowerCase();
      if (c === 'critical' || c === 'c') row.criticality = 'Critical';
      else if (c === 'h' || c.includes('high')) row.criticality = 'High';
      else if (c === 'm' || c.includes('medium')) row.criticality = 'Medium';
      else row.criticality = 'Low';
    }
    return row;
  }

  // ── Dashboard Metrics ──

  private calculateMetrics(): void {
    const rows = this.data;
    this.metrics.totalRoles = this.totalRecords;
    this.metrics.jobProfiles = rows.filter(r => r.jobProfile === 'Yes').length;
    this.metrics.violations = rows.filter(r => r.roleInconsistency === 'Issues').length;

    const complete = rows.filter(r => r.riskComplete === 'Complete').length;
    this.metrics.riskCompletePct = rows.length > 0 ? Math.round((complete / rows.length) * 100) : 0;

    const sysMap = new Map<string, number>();
    rows.forEach(r => {
      if (r.sapSystem) sysMap.set(r.sapSystem, (sysMap.get(r.sapSystem) || 0) + 1);
    });
    this.metrics.systems = sysMap.size;

    const critMap = new Map<string, number>();
    rows.forEach(r => {
      if (r.criticality) critMap.set(r.criticality, (critMap.get(r.criticality) || 0) + 1);
    });
    const critColors: Record<string, string> = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#10b981' };
    this.criticalityDist = this.toChartData(critMap, Object.values(critColors), critColors);

    if (sysMap.size <= 2) {
      this.systemTags = Array.from(sysMap).map(([name, count]) => ({ label: name, value: count }));
      this.systemDist = [];
    } else {
      this.systemTags = [];
      this.systemDist = this.toChartData(sysMap, DIST_COLORS);
    }

    this.distributions = [];
    if (this.criticalityDist.length > 0) {
      this.distributions.push({ title: 'Criticality', icon: 'warning', data: this.criticalityDist });
    }
    if (this.systemDist.length > 0) {
      this.distributions.push({ title: 'Systems', icon: 'database', data: this.systemDist });
    }
  }

  private toChartData(map: Map<string, number>, colors: string[], colorMap?: Record<string, string>): any[] {
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    if (total === 0) return [];
    const sorted = Array.from(map).sort((a, b) => b[1] - a[1]);
    let ci = 0;
    return sorted.map(([label, value]) => ({
      label,
      value,
      percentage: Math.round((value / total) * 100),
      color: colorMap?.[label] || colors[ci++ % colors.length],
    }));
  }

  // ── Inline Table Events ──

  onSearchChange(search: string): void {
    this.globalSearch = search;
    this.pageIndex = 1;
    this.loadData();
  }

  onQueryChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    if (params.sort) {
      this.sortField = params.sort.field;
      this.sortDirection = params.sort.direction === 'descend' ? 'DESC' : 'ASC';
    }
    this.globalSearch = params.globalSearch;
    this.loadData();
  }

  onSelectionChange(rows: any[]): void {
    this.selectedRows = rows;
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
    this.loadSecondaryData(row);
  }

  onInlineSave(modifiedRows: any[]): void {
    if (modifiedRows.length === 0) {
      this.notificationService.error('No rows are modified to save.');
      return;
    }
    let completed = 0;
    modifiedRows.forEach(row => {
      const payload: any = {
        id: row.id,
        roleName: row.roleName,
        businessProcess: row.businessProcess,
        subBusinessProcess: row.subBusinessProcess,
        department: row.department,
        division: row.division,
        criticality: row.criticality,
        sapSystem: row.sapSystem,
        jobProfile: row.jobProfile === 'Yes',
      };
      this.rcService.editRoleCatalogue(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          completed++;
          if (completed === modifiedRows.length) {
            this.notificationService.success(res.message || 'Saved successfully');
            this.loadData();
          }
        },
        error: () => { completed++; },
      });
    });
  }

  // ── Secondary Data ──

  private loadSecondaryData(row: any): void {
    this.rcService.getRoleCatalogueRoleNames(row.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.allSelectedRoleNames = res?.data || []; },
    });

    this.rolesLoading = true;
    const roles$ = row.roleType === 'X'
      ? this.rcService.getRoleCatalogueMultiRoles(row.id)
      : this.rcService.getRoleCatalogueRoles(row.id);
    roles$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.rolesData = res?.data || []; this.rolesLoading = false; },
      error: () => { this.rolesData = []; this.rolesLoading = false; },
    });

    this.risksLoading = true;
    this.rcService.getRoleCatalogueRoleRisks(row.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.risksData = res?.data?.rows || []; this.risksLoading = false; },
      error: () => { this.risksData = []; this.risksLoading = false; },
    });

    this.loadOwners(row.id);
  }

  private loadOwners(rcId: number): void {
    this.ownersLoading = true;
    this.ownersDirty = false;
    this.rcService.getRoleCatalogueOwners(rcId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.ownersData = res?.data?.rows || []; this.ownersLoading = false; },
      error: () => { this.ownersData = []; this.ownersLoading = false; },
    });
  }

  // ── Actions ──

  addCatalogue(): void {
    const ref = this.modal.create({
      nzTitle: 'Add Role Catalogue',
      nzContent: AddRoleCatalogueComponent,
      nzWidth: '600px',
      nzData: { saps: this.sapSystemList, action: 'add', row: {} },
      nzFooter: null,
      nzClassName: 'updated-modal',
    });
    ref.afterClose.subscribe(result => { if (result) this.loadData(); });
  }

  deleteCatalogue(): void {
    const selected = this.selectedRows;
    if (!selected.length) {
      this.notificationService.error('Please select at least one row');
      return;
    }
    this.confirmDialogService.confirm({
      title: 'Delete',
      message: 'Are you sure you want to delete?',
    }).subscribe(result => {
      if (result) {
        const ids = selected.map(r => r.id).join(',');
        this.rcService.deleteRoleCatalogues(ids).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => {
            this.notificationService.success(res.message || 'Deleted');
            this.loadData();
          },
        });
      }
    });
  }

  openAddRemoveRoles(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row');
      return;
    }
    if (this.selectedRow.jobProfile !== 'Yes') {
      this.notificationService.error('Roles can be added/removed only for Job Profile catalogue.');
      return;
    }
    const ref = this.modal.create({
      nzTitle: 'Add Roles To Role Catalogue - ' + this.selectedRow.roleName,
      nzContent: AddRemoveRolesComponent,
      nzWidth: '90vw',
      nzData: {
        rcId: this.selectedRow.id,
        sapSystemId: this.selectedRow.sapSystemId,
        sapSystem: this.selectedRow.sapSystem,
        roleName: this.selectedRow.roleName,
        allSelectedRoleNames: this.allSelectedRoleNames,
      },
      nzFooter: null,
      nzClassName: 'updated-modal',
      nzBodyStyle: { maxHeight: '80vh', overflow: 'auto' },
    });
    ref.afterClose.subscribe((res: any) => {
      if (res?.action === 'save') this.loadSecondaryData(this.selectedRow);
    });
  }

  runSodAnalysis(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row');
      return;
    }
    if (this.selectedRow.jobProfile !== 'Yes') {
      this.notificationService.error('SOD Analysis can be performed only for Job Profile catalogue.');
      return;
    }
    this.rcService.roleCataloguesValidateRules(this.selectedRow.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.rcService.roleCataloguesStartAnalysis(this.selectedRow.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => {
            this.notificationService.success(res.message || 'Analysis started');
          },
          error: (err: any) => this.notificationService.error(err.error?.message || 'Analysis failed'),
        });
      },
      error: (err: any) => this.notificationService.error(err.error?.message || 'Validation failed'),
    });
  }

  goToUploadWizard(): void {
    this.router.navigate(['/cam/settings/role-catalogue/upload-wizard']);
  }

  exportData(): void {
    this.rcService.exportRoleCatalogues(this.pageIndex, this.pageSize, this.sortField, this.sortDirection)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (data: any) => {
          const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'RoleCatalogues.xlsx';
          a.click();
          window.URL.revokeObjectURL(url);
          this.notificationService.success('Export downloaded');
        },
        error: () => this.notificationService.error('Export failed'),
      });
  }

  onRiskCompleteClick(row: any): void {
    if (!row.riskJobId) return;
    this.rcService.getSodJobInfo(row.riskJobId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.data?.job) {
          this.router.navigate(['/cam/view-results'], {
            state: { data: { ...res.data.job, type: 'RISK', targetType: 'ROLE', analysisType: 'RISK' } },
          });
        }
      },
    });
  }

  // ── Role Owners ──

  addOwnerRow(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a role catalogue.');
      return;
    }
    this.ownersData = [...this.ownersData, { userId: '', userName: '' }];
    this.ownersDirty = true;
  }

  onOwnerUserIdChange(row: any): void {
    row.userName = this.userNameMap[row.userId] || '';
    this.ownersDirty = true;
  }

  deleteOwnerRow(index: number): void {
    this.ownersData = this.ownersData.filter((_, i) => i !== index);
    this.ownersDirty = true;
  }

  getAvailableUserIds(currentUserId: string): string[] {
    const usedIds = this.ownersData.map(o => o.userId).filter(id => id && id !== currentUserId);
    return this.userIds.filter(id => !usedIds.includes(id));
  }

  saveOwners(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a role catalogue.');
      return;
    }
    this.rcService.saveOwners({
      rcID: this.selectedRow.id,
      owners: this.ownersData.filter(o => o.userId).map(o => o.userId),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notificationService.success('Owners saved successfully');
        this.ownersDirty = false;
      },
      error: () => this.notificationService.error('Failed to save owners'),
    });
  }
}
