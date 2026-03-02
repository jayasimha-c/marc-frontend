import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RulesService } from './rules.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { TableColumn, TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { InlineColumn } from '../../../../shared/components/inline-table/inline-table.models';
import { InlineTableComponent } from '../../../../shared/components/inline-table/inline-table.component';
import { AddRuleComponent } from './add-rule/add-rule.component';
import { RuleDetailComponent } from './rule-detail/rule-detail.component';
import { ObjectFilterComponent, ObjectFilterData } from './object-filter/object-filter.component';
import { MapBpmnTaskComponent } from './map-bpmn-task/map-bpmn-task.component';

export interface RuleHistoryLog {
  id: number;
  ruleName: string;
  action: string;
  updateTime: string;
  updatedBy: string;
  changeType: number;
}

@Component({
  standalone: false,
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss'],
})
export class RulesComponent implements OnInit, OnDestroy {
  @ViewChild('historyPanel') historyPanel!: SidePanelComponent;
  @ViewChild('objectsInlineTable') objectsInlineTable!: InlineTableComponent;
  private destroy$ = new Subject<void>();

  data: any[] = [];
  totalRecords = 0;
  loading = true;
  selectedRule: any = null;
  selectedRules: any[] = [];

  ruleObjectsData: any[] = [];
  ruleObjectsLoading = false;
  objectsDirty = false;
  authObjectOptions: string[] = [];
  authFieldOptions: string[] = [];

  systemTypes: string[] = [];
  currentTableEvent: any = null;

  objectFilterActive = false;
  objectFilterData: ObjectFilterData = { authObjects: [], authFields: [], values: [], matchMode: 'OR' };

  ruleMetrics = { totalRules: 0 };
  ruleTypesChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  businessProcessChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  systemTypesChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  systemTypeTags: { label: string; value: number }[] = [];
  distributions: { title: string; icon: string; data: any[] }[] = [];

  historyLoading = false;
  historyLogs: any[] = [];
  selectedHistoryLog: any = null;
  historyDetailsLoading = false;
  historyDetails: any[] = [];
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  columns: TableColumn[] = [
    { field: 'ruleName', header: 'Rule', sortable: true, filterable: true, width: '180px', onClick: (row: any) => this.openDetail(row) },
    { field: 'ruleDescription', header: 'Description', filterable: true },
    { field: 'businessProcessName', header: 'Business Process', sortable: true, filterable: true, width: '160px' },
    { field: 'subProcName', header: 'Sub Process', sortable: true, width: '140px' },
    { field: 'ruleTypeName', header: 'Type', sortable: true, filterable: true, width: '120px' },
    { field: 'systemType', header: 'System Type', sortable: true, filterable: true, filterType: 'select', filterOptions: [], width: '120px' },
    { field: 'createdOnStr', header: 'Created On', type: 'date', sortable: true, width: '130px' },
    { field: 'modifiedOnStr', header: 'Modified On', type: 'date', sortable: true, width: '130px' },
  ];

  objectInlineColumns: InlineColumn[] = [
    { field: 'name', header: 'Auth Object', width: '200px', type: 'autocomplete', options: [], maxFilterResults: 50, pasteIndex: 0 },
    { field: 'fieldName', header: 'Auth Field', width: '200px', type: 'autocomplete', options: [], maxFilterResults: 50, pasteIndex: 1 },
    { field: 'fieldValue', header: 'Value', type: 'text', pasteIndex: 2 },
    { field: 'joinByAnd', header: 'Join AND', width: '100px', type: 'boolean', booleanLabels: ['true', 'false'], pasteIndex: 3 },
  ];

  objectActions: TableAction[] = [
    { label: 'Add', icon: 'plus', command: () => this.onObjectAddRow(), pinned: true },
    { label: 'Save', icon: 'save', type: 'primary', command: () => this.onObjectsSave(), pinned: true, disabled: true },
    { label: 'Cancel', icon: 'undo', danger: true, command: () => this.onObjectsCancel(), pinned: true, disabled: true },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.addRule() },
    { label: 'Edit', icon: 'edit', command: () => this.editRule() },
    { label: 'Copy', icon: 'copy', command: () => this.copyRule() },
    { label: 'History', icon: 'history', command: () => this.viewRuleHistory() },
    { label: 'Object Filter', icon: 'filter', command: () => this.openObjectFilter() },
    { label: 'Map BPMN', icon: 'apartment', command: () => this.mapBpmnTask() },
    { label: 'Export', icon: 'file-excel', command: () => this.exportRules() },
    { label: 'Transport', icon: 'download', command: () => this.ruleTransport() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.deleteRule() },
  ];

  constructor(
    private rulesService: RulesService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.rulesService.getSystemTypes().pipe(first()).subscribe((res: any) => {
      this.systemTypes = res.data || [];
      const sysCol = this.columns.find(c => c.field === 'systemType');
      if (sysCol) {
        sysCol.filterOptions = this.systemTypes.map(s => ({ label: s, value: s }));
      }
    });
    this.loadAutoCompleteData();
    this.loadRuleStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onQueryChange(params: TableQueryParams): void {
    this.currentTableEvent = params;
    this.loadRules(params);
  }

  loadRules(params?: TableQueryParams): void {
    this.loading = true;
    const p = params || this.currentTableEvent;
    const pg = {
      first: p ? (p.pageIndex - 1) * p.pageSize : 0,
      rows: p?.pageSize ?? 20,
      sortOrder: p?.sort?.direction === 'descend' ? -1 : 1,
      sortField: p?.sort?.field || 'ruleName',
      filters: p?.filters || {},
    };

    if (this.objectFilterActive) {
      const payload = {
        first: pg.first,
        rows: pg.rows,
        sortOrder: pg.sortOrder,
        sortField: pg.sortField,
        filters: pg.filters ? JSON.stringify(pg.filters) : '',
        authObjects: this.objectFilterData.authObjects,
        authFields: this.objectFilterData.authFields,
        values: this.objectFilterData.values,
        matchMode: this.objectFilterData.matchMode,
      };
      this.rulesService.searchRulesByObjects(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.handleRulesResponse(res);
          this.loading = false;
        },
        error: () => { this.loading = false; },
      });
    } else {
      const filtersEncoded = encodeURIComponent(JSON.stringify(pg.filters));
      this.rulesService.getRules(pg.first, pg.rows, pg.sortOrder, pg.sortField, filtersEncoded)
        .pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => {
            this.handleRulesResponse(res);
            this.loading = false;
          },
          error: () => { this.loading = false; },
        });
    }
  }

  private handleRulesResponse(res: any): void {
    if (res?.data) {
      this.data = (res.data.rows || []).map((row: any) => ({
        ...row,
        businessProcessName: row.businessProcess?.name || '',
        subProcName: row.subProc?.name || '',
        ruleTypeName: row.ruleType?.name || '',
      }));
      this.totalRecords = res.data.records || 0;
    }
  }

  onRowClick(row: any): void {
    this.selectedRule = row;
    this.selectedRules = [row];
    this.loadRuleObjects();
  }

  loadRuleObjects(): void {
    if (!this.selectedRule) { this.ruleObjectsData = []; return; }
    this.ruleObjectsLoading = true;
    this.rulesService.getRuleObjects(this.selectedRule.id, this.selectedRule.systemType)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.ruleObjectsData = res?.data?.rows || [];
          this.ruleObjectsLoading = false;
          this.objectsDirty = false;
          this.updateObjectActionStates();
        },
        error: () => { this.ruleObjectsData = []; this.ruleObjectsLoading = false; },
      });
  }

  addRule(): void {
    this.rulesService.getAddRequired().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.openRuleModal('Add', res.data, null);
    });
  }

  editRule(): void {
    if (!this.checkRuleSelected()) return;
    this.rulesService.getEditRequired(this.selectedRule.id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.openRuleModal('Update', res.data, this.selectedRule);
    });
  }

  copyRule(): void {
    if (!this.checkRuleSelected()) return;
    this.rulesService.getEditRequired(this.selectedRule.id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.openRuleModal('Copy', res.data, this.selectedRule);
    });
  }

  deleteRule(): void {
    if (!this.selectedRules.length) {
      this.notificationService.error('Please select at least one rule');
      return;
    }
    const count = this.selectedRules.length;
    this.confirmDialogService.confirm({
      title: 'Delete Rule' + (count > 1 ? 's' : ''),
      message: count > 1
        ? `Are you sure you want to delete ${count} selected rules?`
        : 'Are you sure you want to delete this rule?',
    }).subscribe(result => {
      if (result) {
        const ids = this.selectedRules.map(r => r.id).join(',');
        this.rulesService.ruleDelete(ids).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.notificationService.show(res);
              this.selectedRules = [];
              this.selectedRule = null;
              this.ruleObjectsData = [];
              this.loadRules();
            }
          },
          error: (err: any) => {
            this.notificationService.error(err.error?.message || 'Error deleting rule(s)');
          },
        });
      }
    });
  }

  exportRules(): void {
    this.rulesService.getExportRules().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.saveFile(res, 'RuleDetails.xlsx');
      this.notificationService.success('Rules exported successfully');
    });
  }

  ruleTransport(): void {
    this.rulesService.getRuleTransport().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.saveFile(res, 'RuleBook.zip');
        this.notificationService.success('Rule transport downloaded');
      },
      error: () => {
        this.notificationService.error('Error downloading rule transport');
      },
    });
  }

  mapBpmnTask(): void {
    if (!this.checkRuleSelected()) return;
    this.rulesService.getBpmnMapRule(this.selectedRule.id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.modal.create({
        nzTitle: 'Map BPMN Task',
        nzContent: MapBpmnTaskComponent,
        nzWidth: '400px',
        nzFooter: null,
        nzData: {
          bpmnList: res.data?.processes || [],
          ruleName: this.selectedRule.ruleName,
          ruleId: this.selectedRule.id,
        },
      });
    });
  }

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
        this.loadRules();
      }
    });
  }

  clearObjectFilter(): void {
    this.objectFilterData = { authObjects: [], authFields: [], values: [], matchMode: 'OR' };
    this.objectFilterActive = false;
    this.loadRules();
  }

  get objectFilterCount(): number {
    return (this.objectFilterData.authObjects?.length || 0) +
      (this.objectFilterData.authFields?.length || 0) +
      (this.objectFilterData.values?.length || 0);
  }

  viewRuleHistory(): void {
    if (!this.checkRuleSelected()) return;
    this.historyLoading = true;
    this.historyLogs = [];
    this.selectedHistoryLog = null;
    this.historyDetails = [];

    this.rulesService.getRuleHistory(this.selectedRule.ruleName, this.timezone)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            this.historyLogs = res.data.map((log: any) => ({
              ...log,
              updateTimeDisplay: this.formatDate(log.updateTime),
              changeTypeDisplay: log.changeType === 0 ? 'Rule' : 'Objects',
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
      `Rule: ${this.selectedRule?.ruleName}`,
      `Change History (${this.historyLogs.length} entries)`,
      '',
      '#\tDate\tAction\tType\tBy',
      ...this.historyLogs.map((r: any) => `${r.id}\t${r.updateTimeDisplay}\t${r.action}\t${r.changeTypeDisplay}\t${r.updatedBy}`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      this.notificationService.success('History copied to clipboard');
    });
  }

  copyDetailsToClipboard(): void {
    if (!this.historyDetails.length) return;
    const lines = [
      `${this.selectedHistoryLog?.action} Details`,
      '',
      'Action\tObject\tField\tValue\tJoin',
      ...this.historyDetails.map((r: any) => `${r.action}\t${r.objct}\t${r.field}\t${r.val}\t${r.joinByAnd}`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      this.notificationService.success('Details copied to clipboard');
    });
  }

  // ── Rule Objects (via inline-table) ──

  onObjectAddRow(): void {
    if (!this.selectedRule) {
      this.notificationService.error('Please select a rule first');
      return;
    }
    this.objectsInlineTable?.addRow();
  }

  onObjectsDirtyChange(dirty: boolean): void {
    this.objectsDirty = dirty;
    this.updateObjectActionStates();
  }

  onObjectsDataChange(data: any[]): void {
    this.ruleObjectsData = data;
  }

  onObjectsSave(): void {
    if (!this.selectedRule || !this.ruleObjectsData.length) return;
    const cleanData = this.ruleObjectsData.map(({ _modified, ...rest }) => rest);
    this.rulesService.saveRuleObjects({ ruleId: this.selectedRule.id, data: cleanData }, this.selectedRule.systemType)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.notificationService.success('Rule objects saved');
          this.objectsDirty = false;
          this.loadRuleObjects();
        },
        error: () => { this.notificationService.error('Failed to save rule objects'); },
      });
  }

  onObjectsCancel(): void {
    this.objectsDirty = false;
    this.loadRuleObjects();
  }

  private updateObjectActionStates(): void {
    this.objectActions = this.objectActions.map(a => {
      if (a.label === 'Save' || a.label === 'Cancel') {
        return { ...a, disabled: !this.objectsDirty };
      }
      return a;
    });
  }

  formatDate(value: any): string {
    if (!value) return '—';
    let date: Date;
    if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
      date = new Date(Number(value));
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else {
      return String(value);
    }
    if (isNaN(date.getTime())) return String(value);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${hours}:${mins}`;
  }

  private openDetail(row: any): void {
    this.modal.create({
      nzTitle: 'Rule Details',
      nzContent: RuleDetailComponent,
      nzWidth: '60vw',
      nzFooter: null,
      nzData: { ruleId: row.id },
    });
  }

  private openRuleModal(action: string, options: any, selectedRow: any): void {
    const ref = this.modal.create({
      nzTitle: action + ' Rule',
      nzContent: AddRuleComponent,
      nzWidth: '500px',
      nzFooter: null,
      nzData: { formType: action, selectedOptions: options, selectedRow, systemTypes: this.systemTypes },
    });
    ref.afterClose.subscribe(result => {
      if (result) this.loadRules();
    });
  }

  private checkRuleSelected(): boolean {
    if (!this.selectedRule) {
      this.notificationService.error('Please select a rule');
      return false;
    }
    return true;
  }

  private loadAutoCompleteData(): void {
    this.rulesService.autoComplete('', 'auth-object').pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.authObjectOptions = res.data || [];
      const nameCol = this.objectInlineColumns.find(c => c.field === 'name');
      if (nameCol) nameCol.options = this.authObjectOptions;
    });
    this.rulesService.autoComplete('', 'auth-field').pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.authFieldOptions = res.data || [];
      const fieldCol = this.objectInlineColumns.find(c => c.field === 'fieldName');
      if (fieldCol) fieldCol.options = this.authFieldOptions;
    });
  }

  private loadRuleStatistics(): void {
    this.rulesService.getRuleStatistics().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const stats = res.data;
          this.ruleMetrics.totalRules = stats.totalRules || 0;

          const sysRaw: { name: string; count: number }[] = stats.systemTypes || [];
          this.ruleTypesChartData = this.toChartData(stats.ruleTypes || [], ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']);
          this.businessProcessChartData = this.toChartData(stats.businessProcesses || [], ['#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6']);

          if (sysRaw.length <= 2) {
            this.systemTypeTags = sysRaw.map(s => ({ label: s.name, value: s.count }));
            this.systemTypesChartData = [];
          } else {
            this.systemTypeTags = [];
            this.systemTypesChartData = this.toChartData(sysRaw, ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']);
          }

          this.distributions = [];
          if (this.ruleTypesChartData.length > 0) {
            this.distributions.push({ title: 'Rule Types', icon: 'appstore', data: this.ruleTypesChartData });
          }
          if (this.businessProcessChartData.length > 0) {
            this.distributions.push({ title: 'Business Process', icon: 'bank', data: this.businessProcessChartData });
          }
          if (this.systemTypesChartData.length > 0) {
            this.distributions.push({ title: 'System Types', icon: 'database', data: this.systemTypesChartData });
          }
        }
      },
    });
  }

  private loadHistoryDetails(logId: number, changeType: number): void {
    this.historyDetailsLoading = true;
    this.historyDetails = [];
    const obs$ = changeType === 1
      ? this.rulesService.getRuleObjLogDetails(logId)
      : this.rulesService.getRuleLogDetails(logId);

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.data?.rows) {
          this.historyDetails = changeType === 1
            ? res.data.rows.map((d: any) => ({
                action: d.action || '—', objct: d.objct || '—',
                field: d.field || '—', val: d.val || '—',
                joinByAnd: d.joinByAnd === 'true' ? 'AND' : 'OR',
              }))
            : res.data.rows.map((d: any) => ({
                action: 'CHANGE', objct: d.name || '—', field: '',
                val: `${d.valueBefore || '—'} → ${d.valueAfter || '—'}`, joinByAnd: '',
              }));
        }
        this.historyDetailsLoading = false;
      },
      error: () => { this.historyDetailsLoading = false; },
    });
  }

  private toChartData(data: { name: string; count: number }[], colors: string[], maxItems = 5): any[] {
    if (!data.length) return [];
    const total = data.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return [];

    const sorted = [...data].sort((a, b) => b.count - a.count);

    const top = sorted.slice(0, maxItems);
    const rest = sorted.slice(maxItems);
    const restTotal = rest.reduce((sum, item) => sum + item.count, 0);

    const threshold = total * 0.02;
    const visible: { name: string; count: number }[] = [];
    let otherTotal = restTotal;
    for (const item of top) {
      if (item.count < threshold) {
        otherTotal += item.count;
      } else {
        visible.push(item);
      }
    }

    if (otherTotal > 0) {
      visible.push({ name: 'Other', count: otherTotal });
    }

    const otherColor = '#d1d5db';
    return visible.map((item, i) => ({
      label: item.name || 'Unknown',
      value: item.count,
      percentage: Math.round((item.count / total) * 100) || (item.count > 0 ? 1 : 0),
      color: item.name === 'Other' ? otherColor : colors[i % colors.length],
    }));
  }

  private saveFile(data: any, filename: string): void {
    const blob = data instanceof Blob ? data : new Blob([data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
