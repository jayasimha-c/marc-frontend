import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { RisksService } from '../risks.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-rules-to-risk',
  templateUrl: './add-rules-to-risk.component.html',
  styleUrls: ['./add-rules-to-risk.component.scss'],
})
export class AddRulesToRiskComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  riskId = 0;
  isCrossSystem = false;

  // Available rules (left side)
  availableRules: any[] = [];
  filteredAvailableRules: any[] = [];
  availableLoading = false;
  searchText = '';
  selectedAvailable: any[] = [];
  setOfAvailableChecked = new Set<number>();

  // Selected rules
  selectedRules: any[] = [];

  // Cross-system
  availableSystems: any[] = [];
  systemMap: Record<number, number> = {};

  // Risk condition
  rcSelection = 'OR';
  rCondition = '';
  selectedConditionId = 1;
  riskConditions = [
    { id: 1, name: 'Join all by OR' },
    { id: 2, name: 'Join all by AND' },
    { id: 3, name: 'Other' },
  ];

  // Visual Group Builder
  conditionGroups: { operator: 'AND' | 'OR'; ruleNames: string[] }[] = [];
  interGroupOperator: 'AND' | 'OR' = 'AND';

  availableColumns = [
    { field: 'ruleName', header: 'Rule ID', width: '130px' },
    { field: 'ruleDescription', header: 'Description' },
    { field: 'ruleTypeName', header: 'Type', width: '100px' },
  ];

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private risksService: RisksService,
    private notificationService: NotificationService,
    public modalRef: NzModalRef,
  ) {}

  ngOnInit(): void {
    this.riskId = this.dialogData.selectedRiskData?.id;
    this.isCrossSystem = this.dialogData.selectedRiskData?.crossSystem || false;

    if (!this.riskId) {
      this.notificationService.error('No risk selected');
      this.modalRef.close(false);
      return;
    }

    // Load existing selected rules
    if (this.dialogData.selectedRuleData?.length > 0) {
      this.selectedRules = [...this.dialogData.selectedRuleData];
      this.selectedRules.forEach(r => {
        if (r.sapSystemId) this.systemMap[r.id] = r.sapSystemId;
      });
    }

    if (this.isCrossSystem) {
      this.loadSystems();
    }

    this.loadAvailable();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Available rules ────────────────────────────────────────

  loadAvailable(): void {
    this.availableLoading = true;
    const excludeIds = this.selectedRules.map(r => r.id);
    this.risksService.getFilteredRules(0, 99999, 1, 'ruleName', '', excludeIds)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.availableRules = (res?.data?.rows || []).map((r: any) => ({
            ...r,
            businessProcessName: r.businessProcess?.name || '',
            subProcName: r.subProc?.name || '',
            ruleTypeName: r.ruleType?.name || '',
          }));
          this.availableLoading = false;
          this.filterRules();
        },
        error: () => { this.availableRules = []; this.filteredAvailableRules = []; this.availableLoading = false; },
      });
  }

  filterRules(): void {
    if (!this.searchText.trim()) {
      this.filteredAvailableRules = this.availableRules;
    } else {
      const term = this.searchText.toLowerCase();
      this.filteredAvailableRules = this.availableRules.filter(r =>
        (r.ruleName || '').toLowerCase().includes(term) ||
        (r.ruleDescription || '').toLowerCase().includes(term) ||
        (r.ruleTypeName || '').toLowerCase().includes(term)
      );
    }
  }

  onAvailableChecked(id: number, checked: boolean): void {
    if (checked) this.setOfAvailableChecked.add(id); else this.setOfAvailableChecked.delete(id);
  }

  onAvailableAllChecked(checked: boolean): void {
    this.filteredAvailableRules.forEach(r => checked ? this.setOfAvailableChecked.add(r.id) : this.setOfAvailableChecked.delete(r.id));
  }

  get availableAllChecked(): boolean { return this.filteredAvailableRules.length > 0 && this.filteredAvailableRules.every(r => this.setOfAvailableChecked.has(r.id)); }
  get availableIndeterminate(): boolean { return this.setOfAvailableChecked.size > 0 && !this.availableAllChecked; }

  // ── Transfer actions ───────────────────────────────────────

  addSelected(): void {
    if (!this.setOfAvailableChecked.size) { this.notificationService.error('Select rules to add'); return; }
    const toAdd = this.availableRules.filter(r => this.setOfAvailableChecked.has(r.id));
    this.selectedRules = [...this.selectedRules, ...toAdd];
    this.setOfAvailableChecked.clear();
    this.loadAvailable();
  }

  addAll(): void {
    if (!this.availableRules.length) return;
    this.selectedRules = [...this.selectedRules, ...this.availableRules];
    this.setOfAvailableChecked.clear();
    this.loadAvailable();
  }

  removeRule(rule: any): void {
    delete this.systemMap[rule.id];
    this.selectedRules = this.selectedRules.filter(r => r.id !== rule.id);
    // Also remove from condition groups
    this.conditionGroups.forEach(g => {
      const idx = g.ruleNames.indexOf(rule.ruleName);
      if (idx >= 0) g.ruleNames.splice(idx, 1);
    });
    this.buildConditionString();
    this.loadAvailable();
  }

  removeAllRules(): void {
    this.selectedRules = [];
    this.systemMap = {};
    this.conditionGroups = [];
    this.rCondition = '';
    this.loadAvailable();
  }

  // ── Cross-system ───────────────────────────────────────────

  loadSystems(): void {
    this.risksService.getSystemsForCrossSystem().pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.availableSystems = res.data || [];
    });
  }

  onSystemChange(ruleId: number, systemId: number): void {
    if (systemId) this.systemMap[ruleId] = systemId; else delete this.systemMap[ruleId];
  }

  // ── Risk condition ─────────────────────────────────────────

  onConditionChange(id: number): void {
    switch (id) {
      case 1: this.rcSelection = 'OR'; this.rCondition = ''; break;
      case 2: this.rcSelection = 'AND'; this.rCondition = ''; break;
      case 3:
        this.rcSelection = 'OTHER';
        if (this.conditionGroups.length === 0) {
          this.initGroupsFromSelected();
        }
        break;
    }
  }

  // ── Group Builder ───────────────────────────────────────────

  initGroupsFromSelected(): void {
    if (this.selectedRules.length === 0) return;
    this.conditionGroups = [{
      operator: 'OR',
      ruleNames: this.selectedRules.map(r => r.ruleName),
    }];
    this.buildConditionString();
  }

  get unassignedRules(): string[] {
    const assigned = new Set<string>();
    this.conditionGroups.forEach(g => g.ruleNames.forEach(n => assigned.add(n)));
    return this.selectedRules.map(r => r.ruleName).filter(n => !assigned.has(n));
  }

  addGroup(): void {
    this.conditionGroups.push({ operator: 'OR', ruleNames: [] });
  }

  removeGroup(index: number): void {
    this.conditionGroups.splice(index, 1);
    this.buildConditionString();
  }

  toggleGroupOperator(index: number): void {
    const g = this.conditionGroups[index];
    g.operator = g.operator === 'OR' ? 'AND' : 'OR';
    this.buildConditionString();
  }

  toggleInterGroupOperator(): void {
    this.interGroupOperator = this.interGroupOperator === 'AND' ? 'OR' : 'AND';
    this.buildConditionString();
  }

  addRuleToGroup(ruleName: string, groupIndex: number): void {
    // Remove from any existing group first
    this.conditionGroups.forEach(g => {
      const idx = g.ruleNames.indexOf(ruleName);
      if (idx >= 0) g.ruleNames.splice(idx, 1);
    });
    this.conditionGroups[groupIndex].ruleNames.push(ruleName);
    this.buildConditionString();
  }

  removeRuleFromGroup(ruleName: string, groupIndex: number): void {
    const g = this.conditionGroups[groupIndex];
    const idx = g.ruleNames.indexOf(ruleName);
    if (idx >= 0) g.ruleNames.splice(idx, 1);
    this.buildConditionString();
  }

  buildConditionString(): void {
    const parts = this.conditionGroups
      .filter(g => g.ruleNames.length > 0)
      .map(g => {
        const expr = g.ruleNames.join(` ${g.operator} `);
        return g.ruleNames.length > 1 ? `(${expr})` : expr;
      });
    this.rCondition = parts.join(` ${this.interGroupOperator} `);
  }

  // ── Validation & Save ──────────────────────────────────────

  get validationErrors(): string[] {
    const errors: string[] = [];

    if (this.selectedRules.length === 0) {
      errors.push('No rules selected');
      return errors;
    }

    if (this.isCrossSystem) {
      const missing = this.selectedRules.filter(r => !this.systemMap[r.id]);
      if (missing.length) {
        errors.push(`${missing.length} rule(s) missing target system`);
      }
    }

    if (this.rcSelection === 'OTHER') {
      const emptyGroups = this.conditionGroups.filter(g => g.ruleNames.length === 0);
      if (emptyGroups.length) {
        errors.push(`${emptyGroups.length} empty group(s) — remove or add rules`);
      }

      const assigned = new Set<string>();
      this.conditionGroups.forEach(g => g.ruleNames.forEach(n => assigned.add(n)));
      const unassigned = this.selectedRules.filter(r => !assigned.has(r.ruleName));
      if (unassigned.length) {
        errors.push(`${unassigned.length} rule(s) not in any group: ${unassigned.map(r => r.ruleName).join(', ')}`);
      }

      const allNames: string[] = [];
      this.conditionGroups.forEach(g => allNames.push(...g.ruleNames));
      const dupes = allNames.filter((n, i) => allNames.indexOf(n) !== i);
      if (dupes.length) {
        errors.push(`Duplicate rule(s) across groups: ${[...new Set(dupes)].join(', ')}`);
      }

      if (!this.rCondition.trim()) {
        errors.push('Expression is empty — add rules to groups');
      }
    }

    return errors;
  }

  save(): void {
    const errors = this.validationErrors;
    if (errors.length) {
      this.notificationService.error(errors[0]);
      return;
    }

    const payload = {
      riskId: this.riskId,
      selectedRules: this.selectedRules.map(r => r.id),
      rcSelection: this.rcSelection,
      rCondition: this.rcSelection === 'OTHER' ? this.rCondition : this.rcSelection,
      systemMap: this.isCrossSystem ? this.systemMap : null,
    };

    this.risksService.saveSelectedRules(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.notificationService.show(res); this.modalRef.close(true); },
      error: (err: any) => this.notificationService.error(err.error?.message || 'Error saving rules'),
    });
  }
}
