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
  availableLoading = false;
  selectedAvailable: any[] = [];
  setOfAvailableChecked = new Set<number>();

  // Selected rules (right side)
  selectedRules: any[] = [];
  selectedLoading = false;
  setOfRemoveChecked = new Set<number>();

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

  availableColumns = [
    { field: 'ruleName', header: 'Rule ID', width: '130px' },
    { field: 'ruleDescription', header: 'Description' },
    { field: 'businessProcessName', header: 'Business Process', width: '150px' },
    { field: 'subProcName', header: 'Sub Process', width: '130px' },
    { field: 'ruleTypeName', header: 'Type', width: '100px' },
  ];

  selectedColumns = [
    { field: 'ruleName', header: 'Rule ID', width: '130px' },
    { field: 'ruleDescription', header: 'Description' },
    { field: 'businessProcessName', header: 'Business Process', width: '150px' },
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
        },
        error: () => { this.availableRules = []; this.availableLoading = false; },
      });
  }

  onAvailableChecked(id: number, checked: boolean): void {
    if (checked) this.setOfAvailableChecked.add(id); else this.setOfAvailableChecked.delete(id);
  }

  onAvailableAllChecked(checked: boolean): void {
    this.availableRules.forEach(r => checked ? this.setOfAvailableChecked.add(r.id) : this.setOfAvailableChecked.delete(r.id));
  }

  get availableAllChecked(): boolean { return this.availableRules.length > 0 && this.availableRules.every(r => this.setOfAvailableChecked.has(r.id)); }
  get availableIndeterminate(): boolean { return this.setOfAvailableChecked.size > 0 && !this.availableAllChecked; }

  // ── Selected rules ─────────────────────────────────────────

  onRemoveChecked(id: number, checked: boolean): void {
    if (checked) this.setOfRemoveChecked.add(id); else this.setOfRemoveChecked.delete(id);
  }

  onRemoveAllChecked(checked: boolean): void {
    this.selectedRules.forEach(r => checked ? this.setOfRemoveChecked.add(r.id) : this.setOfRemoveChecked.delete(r.id));
  }

  get removeAllChecked(): boolean { return this.selectedRules.length > 0 && this.selectedRules.every(r => this.setOfRemoveChecked.has(r.id)); }
  get removeIndeterminate(): boolean { return this.setOfRemoveChecked.size > 0 && !this.removeAllChecked; }

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

  removeSelected(): void {
    if (!this.setOfRemoveChecked.size) { this.notificationService.error('Select rules to remove'); return; }
    this.setOfRemoveChecked.forEach(id => delete this.systemMap[id]);
    this.selectedRules = this.selectedRules.filter(r => !this.setOfRemoveChecked.has(r.id));
    this.setOfRemoveChecked.clear();
    this.loadAvailable();
  }

  removeAll(): void {
    this.selectedRules = [];
    this.systemMap = {};
    this.setOfRemoveChecked.clear();
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
      case 3: this.rcSelection = 'OTHER'; break;
    }
  }

  // ── Save ───────────────────────────────────────────────────

  save(): void {
    if (this.isCrossSystem && this.selectedRules.length > 0) {
      const missing = this.selectedRules.filter(r => !this.systemMap[r.id]);
      if (missing.length) {
        this.notificationService.error(`${missing.length} rule(s) missing system assignment`);
        return;
      }
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
