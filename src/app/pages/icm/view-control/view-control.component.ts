import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { IcmControlService } from '../icm-control.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AddNotificationDialogComponent } from '../add-control/add-notification-dialog.component';
import { ControlRuleResultComponent } from './control-rule-result/control-rule-result.component';
import { RuleCondition } from './icm-rule-conditions-table/icm-rule-conditions-table.component';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';

enum ControlType {
  AUTOMATED = 1,
  MANUAL = 2,
  STANDARD_AUTOMATED = 3,
}

@Component({
  standalone: false,
  selector: 'app-view-control',
  templateUrl: './view-control.component.html',
  styleUrls: ['./view-control.component.scss'],
})
export class ViewControlComponent implements OnInit {
  controlId: number;
  control: any = null;
  selectedType = 0;
  formType: 'view' | 'edit' = 'view';
  isEditing = false;
  saving = false;

  step1Form: FormGroup;

  // Dropdown data
  criticallyList: any[] = [];
  bpList: any[] = [];
  sbpList: any[] = [];
  regulationList: any[] = [];
  groupList: any[] = [];
  categoryList: any[] = [];
  impactList: any[] = [];
  typeList: any[] = [];

  // Detail view rows
  detailRows: { label: string; value: string; span?: number }[][] = [];

  // Rules/Scripts tab
  stdControl: any = null;
  scripts: any[] = [];
  rules: any[] = [];

  // Parsed rule conditions for display
  extractionConditions: RuleCondition[] = [];
  ruleConditions: RuleCondition[] = [];
  extractionLogic: 'AND' | 'OR' = 'AND';
  ruleLogic: 'AND' | 'OR' = 'OR';
  outputFields: string[] = [];
  ruleTableName = '';
  ruleName = '';
  hasJoin = false;
  joinInfo: { srcTable: string; srcField: string; targetTable: string; targetField: string } | null = null;

  // Execution results
  executionResults: any[] = [];
  resultColumns: TableColumn[] = [
    { field: 'revision', header: 'Revision', width: '80px', sortable: true },
    { field: 'executionDate', header: 'Execution Date', type: 'date', dateFormat: 'MM/dd/yyyy HH:mm', width: '180px' },
    { field: 'resultCount', header: 'Results', width: '100px', align: 'center' },
    {
      field: 'actions', header: '', type: 'actions', width: '60px', fixed: 'right',
      actions: [
        { icon: 'eye', tooltip: 'View Results', command: (row: any) => this.openRuleResult(row) },
      ],
    },
  ];

  scriptColumns: TableColumn[] = [
    { field: 'id', header: 'Script ID', sortable: true, width: '100px' },
    { field: 'icmManualScript.scriptName', header: 'Script Name', sortable: true },
    { field: 'icmManualScript.isActive', header: 'Active', type: 'boolean', width: '80px' },
  ];

  // Notify tab
  notifySettings: any[] = [];
  notifyColumns: TableColumn[] = [
    { field: 'controlRole.name', header: 'Role', sortable: true },
    { field: 'icmUserVo.username', header: 'User', sortable: true },
    { field: 'icmUserVo.email', header: 'Email', sortable: true },
    { field: 'dateFrom', header: 'Date From', type: 'date', sortable: true },
    { field: 'dateTo', header: 'Date To', type: 'date', sortable: true },
    { field: 'isActive', header: 'Active', type: 'boolean', width: '80px' },
  ];

  notifyActions: TableAction[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private nzModal: NzModalService,
    private controlService: IcmControlService,
    private notificationService: NotificationService,
  ) {
    this.step1Form = this.fb.group({
      controlName: [{ value: '', disabled: true }],
      critically: [{ value: null, disabled: true }, Validators.required],
      businessProcess: [{ value: null, disabled: true }, Validators.required],
      businessSubProcess: [{ value: null, disabled: true }, Validators.required],
      description: [{ value: '', disabled: true }, Validators.required],
      regulation: [{ value: null, disabled: true }, Validators.required],
      group: [{ value: null, disabled: true }, Validators.required],
      category: [{ value: null, disabled: true }, Validators.required],
      impact: [{ value: null, disabled: true }, Validators.required],
      type: [{ value: null, disabled: true }, Validators.required],
    });
  }

  ngOnInit(): void {
    this.controlId = Number(this.route.snapshot.paramMap.get('controlId'));
    this.loadDropdowns();
    this.loadControl();
  }

  private loadDropdowns(): void {
    this.controlService.getCriticalityList().subscribe({ next: (r) => this.criticallyList = r.data?.rows || [] });
    this.controlService.getBPList().subscribe({ next: (r) => this.bpList = r.data?.rows || [] });
    this.controlService.getRegulationList().subscribe({ next: (r) => this.regulationList = r.data?.rows || [] });
    this.controlService.getGroupList().subscribe({ next: (r) => this.groupList = r.data?.rows || [] });
    this.controlService.getCategoryList().subscribe({ next: (r) => this.categoryList = r.data?.rows || [] });
    this.controlService.getImpactList().subscribe({ next: (r) => this.impactList = r.data?.rows || [] });
    this.controlService.getControlTypeList().subscribe({ next: (r) => this.typeList = r.data?.rows || [] });
  }

  private loadControl(): void {
    this.controlService.getControlById(this.controlId).subscribe({
      next: (res) => {
        this.control = res.data;
        if (!this.control) return;

        this.selectedType = this.control.controlType?.id || 0;
        this.scripts = Array.isArray(this.control.scripts) ? this.control.scripts : [];
        this.rules = this.control.rules || [];
        this.notifySettings = this.control.notifySettings || [];

        this.initializeForm();
        this.buildDetailRows();
        this.loadSubProcesses();
        this.loadStdControl();
        this.parseRuleConditions();
        this.loadExecutionResults();
      },
      error: (err) => {
        this.notificationService.handleHttpError(err);
      },
    });
  }

  private initializeForm(): void {
    this.step1Form.patchValue({
      controlName: this.control.name,
      critically: this.control.criticality?.id,
      businessProcess: this.control.businessProcess?.id,
      businessSubProcess: this.control.businessSubProcess?.id,
      description: this.control.description,
      regulation: this.control.regulations?.[0]?.id || null,
      group: this.control.group,
      category: this.control.category,
      impact: this.control.impact,
      type: this.control.controlType?.id,
    });
  }

  private buildDetailRows(): void {
    this.detailRows = [
      [
        { label: 'Control Name', value: this.control.name || '-' },
        { label: 'Control Type', value: this.control.controlType?.name || '-' },
        { label: 'Criticality', value: this.control.criticality?.name || '-' },
      ],
      [
        { label: 'Business Process', value: this.control.businessProcess?.name || '-' },
        { label: 'Sub Process', value: this.control.businessSubProcess?.name || '-' },
        { label: 'Regulation', value: this.control.regulations?.[0]?.name || '-' },
      ],
      [
        { label: 'Group', value: this.lookupName(this.groupList, this.control.group) },
        { label: 'Category', value: this.lookupName(this.categoryList, this.control.category) },
        { label: 'Impact', value: this.lookupName(this.impactList, this.control.impact) },
      ],
      [
        { label: 'Status', value: this.control.isActive ? 'Active' : 'Inactive' },
        { label: 'Last Executed', value: this.control.lastExecutedDate ? new Date(this.control.lastExecutedDate).toLocaleString() : '-' },
        { label: 'Created', value: this.control.created ? new Date(this.control.created).toLocaleString() : '-' },
      ],
      [
        { label: 'Description', value: this.control.description || '-', span: 3 },
      ],
    ];
  }

  private lookupName(list: any[], id: any): string {
    if (!id) return '-';
    const item = list.find(i => i.id === id);
    return item?.name || '-';
  }

  private loadSubProcesses(): void {
    const bpId = this.control.businessProcess?.id;
    if (bpId) {
      this.controlService.getBusinessSubProcesses(bpId).subscribe({
        next: (r) => this.sbpList = r.data?.rows || [],
      });
    }
  }

  private loadStdControl(): void {
    if (this.selectedType === ControlType.STANDARD_AUTOMATED && this.control.stdControlId) {
      this.controlService.getStdControls().subscribe({
        next: (r) => {
          const list = r.data?.rows || [];
          this.stdControl = list.find((s: any) => s.id === this.control.stdControlId);
        },
      });
    }
  }

  // --- Rule condition parsing ---

  private parseRuleConditions(): void {
    if (this.selectedType !== ControlType.AUTOMATED || !this.rules?.length) return;

    const rule = this.rules[0];
    this.ruleName = rule.name || 'Rule';
    this.ruleTableName = rule.icmTable?.formattedTableName || rule.icmTable?.tableName || '';
    this.outputFields = (rule.fields || []).map((f: any) => f.formattedFieldName || f.fieldName);

    // Join info
    if (rule.joins?.length) {
      const join = rule.joins[0];
      this.hasJoin = true;
      this.joinInfo = {
        srcTable: join.srcTable?.formattedTableName || join.srcTable?.tableName || '-',
        srcField: join.srcField?.formattedFieldName || join.srcField?.fieldName || '-',
        targetTable: join.targetTable?.formattedTableName || join.targetTable?.tableName || '-',
        targetField: join.targetField?.formattedFieldName || join.targetField?.fieldName || '-',
      };
    }

    // Parse extraction filter
    const tableFields = rule.icmTable?.fields || [];
    try {
      const parsed = this.parseJsonString(rule.jsonFilter);
      this.extractionLogic = (parsed.condition || 'and').toUpperCase() as 'AND' | 'OR';
      this.extractionConditions = this.flattenRules(parsed.rules || [], tableFields);
    } catch { this.extractionConditions = []; }

    // Parse violation rule
    try {
      const parsed = this.parseJsonString(rule.jsonRule);
      this.ruleLogic = (parsed.condition || 'or').toUpperCase() as 'AND' | 'OR';
      this.ruleConditions = this.flattenRules(parsed.rules || [], tableFields);
    } catch { this.ruleConditions = []; }
  }

  private parseJsonString(jsonStr: string): any {
    if (!jsonStr) return { rules: [] };
    let cleaned = jsonStr;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    cleaned = cleaned.replace(/\\"/g, '"');
    return JSON.parse(cleaned);
  }

  private flattenRules(rules: any[], fields: any[]): RuleCondition[] {
    const result: RuleCondition[] = [];
    for (const rule of rules) {
      if (rule.rules && Array.isArray(rule.rules)) {
        result.push(...this.flattenRules(rule.rules, fields));
      } else if (rule.field) {
        const field = fields.find((f: any) => f.fieldName?.toLowerCase() === rule.field?.toLowerCase());
        result.push({
          field: rule.field,
          fieldLabel: field?.description || field?.formattedFieldName || rule.field,
          operator: rule.operator || '=',
          operatorLabel: this.getOperatorLabel(rule.operator || '='),
          value: rule.value,
          valueFormatted: this.formatValue(rule.value, rule.type, rule.function),
          type: rule.type,
        });
      }
    }
    return result;
  }

  private getOperatorLabel(op: string): string {
    const map: Record<string, string> = {
      '=': '=', equal: '=', equals: '=',
      '!=': '\u2260', '<>': '\u2260', not_equal: '\u2260',
      '>': '>', greater: '>', greater_than: '>',
      '>=': '\u2265', greater_or_equal: '\u2265',
      '<': '<', less: '<', less_than: '<',
      '<=': '\u2264', less_or_equal: '\u2264',
      in: 'IN', not_in: 'NOT IN',
      contains: 'contains', not_contains: 'not contains',
      begins_with: 'starts with', ends_with: 'ends with',
      is_null: 'is empty', is_not_null: 'is not empty',
      between: 'between', like: 'LIKE',
    };
    return map[op?.toLowerCase()] || op;
  }

  private formatValue(value: any, type?: string, fnName?: string): string {
    if (fnName === 'current_date') return 'Today';
    if (fnName === 'current_date-1') return 'Yesterday';
    if (fnName?.startsWith('current_date-')) return fnName;
    if (value == null) return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (type === 'date' && typeof value === 'string') {
      if (value === 'current_date') return 'Today';
      if (value.startsWith('current_date-')) return value;
    }
    return String(value);
  }

  // --- Execution Results ---

  private loadExecutionResults(): void {
    if (this.selectedType !== ControlType.AUTOMATED && this.selectedType !== ControlType.STANDARD_AUTOMATED) return;
    this.controlService.getExecutionResultsByControl(this.controlId).subscribe({
      next: (res) => { this.executionResults = res.data?.rows || []; },
      error: () => { this.executionResults = []; },
    });
  }

  openRuleResult(row: any): void {
    this.nzModal.create({
      nzTitle: 'Rule Execution Results',
      nzContent: ControlRuleResultComponent,
      nzWidth: '90vw',
      nzData: { data: row, controlId: this.controlId },
      nzFooter: null,
      nzClassName: 'updated-modal',
    });
  }

  // --- Header actions ---

  get controlTypeLabel(): string {
    switch (this.selectedType) {
      case ControlType.AUTOMATED: return 'Automated Control';
      case ControlType.MANUAL: return 'Manual Control';
      case ControlType.STANDARD_AUTOMATED: return 'Standard Control';
      default: return 'Control';
    }
  }

  get rulesTabTitle(): string {
    switch (this.selectedType) {
      case ControlType.MANUAL: return 'Manual Scripts';
      case ControlType.STANDARD_AUTOMATED: return 'Standard Control';
      default: return 'Rules';
    }
  }

  goToList(): void {
    this.router.navigate(['/icm/controls']);
  }

  toggleEdit(): void {
    this.formType = this.formType === 'view' ? 'edit' : 'view';
    this.isEditing = this.formType === 'edit';

    const alwaysDisabled = ['controlName', 'type'];
    if (this.isEditing) {
      Object.keys(this.step1Form.controls).forEach(key => {
        if (alwaysDisabled.includes(key)) {
          this.step1Form.get(key)!.disable();
        } else {
          this.step1Form.get(key)!.enable();
        }
      });
      this.notifyActions = [
        { label: 'Add Notification', icon: 'plus', type: 'primary', command: () => this.openAddNotification() },
      ];
    } else {
      this.step1Form.disable();
      this.notifyActions = [];
    }
  }

  handleSave(): void {
    if (!this.isEditing) return;

    const notifyPayload = this.notifySettings.map(item => ({
      isActive: item.isActive,
      dateFrom: new Date(item.dateFrom).toISOString(),
      dateTo: new Date(item.dateTo).toISOString(),
      icmUser: item.icmUser || item.icmUserVo?.id,
      controlRoleId: item.controlRole?.id || item.controlRoleId,
    }));

    const scriptsData = this.selectedType === ControlType.MANUAL
      ? this.scripts.map(s => {
          const { executeType, ...rest } = s;
          if (rest.icmManualScript) {
            const { stepInfo, ...filteredScript } = rest.icmManualScript;
            return { ...rest, icmManualScript: filteredScript };
          }
          return rest;
        })
      : [];

    const ruleData = this.selectedType === ControlType.AUTOMATED && this.rules.length > 0
      ? this.rules.map(r => ({ id: r.id }))
      : [];

    const payload = {
      oldControl: { id: this.controlId },
      newControl: {
        id: this.controlId,
        name: this.control.name,
        criticality: { id: this.step1Form.getRawValue().critically },
        description: this.step1Form.getRawValue().description,
        businessProcess: { id: this.step1Form.getRawValue().businessProcess },
        businessSubProcess: { id: this.step1Form.getRawValue().businessSubProcess },
        regulations: [{ id: this.step1Form.getRawValue().regulation }],
        category: this.step1Form.getRawValue().category,
        controlType: { id: this.step1Form.getRawValue().type },
        group: this.step1Form.getRawValue().group,
        impact: this.step1Form.getRawValue().impact,
        stdControlId: this.control.stdControlId,
        rules: ruleData,
        scripts: scriptsData,
        notifySettings: notifyPayload,
        isActive: this.control.isActive,
      },
    };

    this.saving = true;
    this.controlService.saveControl(payload).subscribe({
      next: (resp) => {
        this.saving = false;
        this.notificationService.show(resp);
        this.formType = 'view';
        this.isEditing = false;
        this.loadControl();
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.handleHttpError(err);
      },
    });
  }

  handleExecute(): void {
    if (this.selectedType === ControlType.STANDARD_AUTOMATED) {
      this.controlService.executeStandardControl(this.controlId).subscribe({
        next: (r) => this.notificationService.success(r?.message || 'Execution started'),
        error: (e) => this.notificationService.handleHttpError(e),
      });
    } else {
      const systemId = this.control?.sapSystemId;
      if (!systemId) {
        this.notificationService.error('No system configured. Execute via a scheduler or set a default system.');
        return;
      }
      this.controlService.execute(this.controlId, systemId).subscribe({
        next: (r) => this.notificationService.success(r?.message || 'Execution started'),
        error: (e) => this.notificationService.handleHttpError(e),
      });
    }
  }

  handleSimulate(): void {
    if (this.selectedType === ControlType.STANDARD_AUTOMATED) {
      this.controlService.simulateStandardControl(this.controlId).subscribe({
        next: (r) => this.notificationService.success(r?.message || 'Simulation started'),
        error: (e) => this.notificationService.handleHttpError(e),
      });
    } else {
      const systemId = this.control?.sapSystemId;
      if (!systemId) {
        this.notificationService.error('No system configured. Simulate via a scheduler or set a default system.');
        return;
      }
      this.controlService.simulate(this.controlId, systemId).subscribe({
        next: (r) => this.notificationService.success(r?.message || 'Simulation started'),
        error: (e) => this.notificationService.handleHttpError(e),
      });
    }
  }

  // --- Notify ---

  openAddNotification(): void {
    this.nzModal.create({
      nzTitle: 'Add Notification',
      nzContent: AddNotificationDialogComponent,
      nzClassName: 'updated-modal',
      nzFooter: null,
    }).afterClose.subscribe((result: any) => {
      if (!result) return;
      const mapped = {
        controlRole: { id: result.controlRoleId.id, name: result.controlRoleId.name },
        icmUserVo: { id: result.icmUser.id, username: result.icmUser.username, email: result.icmUser.email },
        icmUser: result.icmUser.id,
        isActive: result.isActive,
        dateFrom: result.dateFrom instanceof Date ? result.dateFrom.toISOString().split('T')[0] : result.dateFrom,
        dateTo: result.dateTo instanceof Date ? result.dateTo.toISOString().split('T')[0] : result.dateTo,
      };
      this.notifySettings = [...this.notifySettings, mapped];
    });
  }

  removeNotification(row: any): void {
    const userId = row.icmUserVo?.id || row.icmUser;
    this.notifySettings = this.notifySettings.filter(n => (n.icmUserVo?.id || n.icmUser) !== userId);
  }
}
