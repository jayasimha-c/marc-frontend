import { Location } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResponse } from '../../../../../core/models/api-response';
import { RuleBookStateService, RuleStateService } from '../../../css-shared/previous-state.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import {
  SapParameterRuleCondition,
  SapParameter,
  SapParameterRule,
  SapParameterRuleValueTypeNames,
  SapParameterRuleValueType,
  SapParameterTypeNames,
  SapParameterSubTypeNames,
  SapParameterType,
  SapParameterSubType,
} from '../../sap-parameter.model';
import { RuleTag, SapRuleConditionType, SapViolationSeverity, SapViolationSeverityNames } from '../../../css-shared/css-shared.model';
import { SapParameterService } from '../../sap-parameters.service';
import { SelectParameterDialog } from './select-parameter-dialog.component';
import {
  SapAuditEvent,
  SapAuditMatchMode,
  SapAuditRule,
  SapAuditRuleCondition,
} from '../../../sap-audit-log/sap-audit-log.model';
import { generateAIPrompt, EXAMPLE_PROMPTS } from '../../../sap-audit-log/audit-rules/add-rule/audit-rule-ai-schema';
import { AuditRuleValidatorService, ValidationResult } from '../../../sap-audit-log/audit-rules/add-rule/audit-rule-validator.service';
import { CssSharedService } from '../../../css-shared/css-shared.service';
import { BtpService } from '../../../btp/btp.service';
import { SapAuditLogService } from '../../../sap-audit-log/sap-audit-log.service';

@Component({
  standalone: false,
  selector: 'app-add-parameter-rule',
  templateUrl: './add-parameter-rule.component.html',
  styleUrls: ['./add-parameter-rule.component.scss'],
})
export class AddParameterRuleComponent implements OnInit, AfterViewInit {
  private parameters: SapParameter[];
  parameterSearchControl = new FormControl<string | SapParameter>('');
  filteredParameters: SapParameter[] = [];

  formType: string;
  isReadonly = false;
  private rule: SapParameterRule;
  conditions: SapParameterRuleCondition[] = [];
  tags: RuleTag[] = [];
  addDefaultTag = true;
  selectedRequirements: any[] = [];
  testResult: SafeHtml = '';
  valueType: SapParameterRuleValueType;

  // Stepper
  currentStep = 0;

  // AI Assistant
  aiJsonInput = '';
  validationResult: ValidationResult | null = null;
  promptCopied = false;
  examplePrompts = EXAMPLE_PROMPTS;
  showAiImport = false;

  errorStatusOptions = Object.entries(SapViolationSeverityNames);
  valueTypeOptions = Object.entries(SapParameterRuleValueTypeNames);
  parameterTypeOptions = Object.entries(SapParameterTypeNames);
  parameterSubTypeOptions = Object.entries(SapParameterSubTypeNames);

  form!: FormGroup;

  // Audit log fields
  auditRuleFilters: { [key: string]: SapAuditRuleCondition[] } = {};
  grouping: string[] = [];
  condition: { interval: number; threshhold: number } = { interval: 86400000, threshhold: 1 };
  clients: Array<{ id: number; name: string; clientNo: string }> = [];
  events: SapAuditEvent[];
  MatchMode = SapAuditMatchMode;
  builderConditions: SapAuditRuleCondition[] = [];

  // Section toggle states
  parameterExpanded = true;
  conditionsSectionExpanded = true;
  testSectionExpanded = true;
  abapRuleExpanded = true;
  btpRuleDefExpanded = true;
  btpExceptionsExpanded = true;

  ruleDefinitions: any[] = [];
  tagList: any[] = [];
  filters: any = {};
  acmRule: any;
  private childForms: { form: FormGroup; open?: () => void }[] = [];
  private auditRule: SapAuditRule;

  protected readonly SapParameterType = SapParameterType;

  constructor(
    private formBuilder: FormBuilder,
    private sapParameterService: SapParameterService,
    private notificationService: NotificationService,
    private cssSharedService: CssSharedService,
    private sanitizer: DomSanitizer,
    private location: Location,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private nzModal: NzModalService,
    private ruleStateService: RuleStateService,
    private sapAuditLogService: SapAuditLogService,
    private btpService: BtpService,
    private bookStateService: RuleBookStateService,
    private auditRuleValidator: AuditRuleValidatorService
  ) {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      caseSensitive: [false, [Validators.required]],
      valueType: [SapParameterRuleValueType.NUMBER],
      parameterType: [SapParameterType.SAP_PARAMETER],
      errorStatus: [SapViolationSeverity.HIGH, [Validators.required]],
      parameter: [''],
      tag: [''],
      parameterSubType: [SapParameterSubType.INI_FILE],
      testValue: [''],
      ruleDefinitionId: [''],
      whiteList: '',
      blackList: '',
      description: '',
      acmRuleId: [''],
    });

    this.getRuleDefinitionData();

    // Load rule from state service or history
    if (ruleStateService.hasState()) {
      this.rule = ruleStateService.getPreviousState();
      this.formType = this.rule?.id == null ? 'add' : 'edit';
      if (ruleStateService.hasChildResource()) {
        this.rule.parameter = ruleStateService.getChildResource();
      }
      ruleStateService.clearState();
    } else {
      this.rule = history.state.rule;
      this.formType = history.state.formType;
    }

    this.isReadonly = this.formType === 'view';

    if (this.rule) {
      if (this.rule.parameterType === SapParameterType.AUDIT_LOG) {
        this.initAuditLog();
      } else {
        this.patchRule(this.rule);
      }
    }

    if (this.isReadonly) {
      this.form.disable();
      this.parameterSearchControl.disable();
    }
  }

  ngOnInit(): void {
    this.getTags();
    this.valueType = this.form.get('valueType')?.value;
    this.form.get('testValue').valueChanges.subscribe(() => (this.testResult = ''));

    this.parameterSearchControl.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        this.filteredParameters = this.filterParametersList(value);
      }
    });

    const initialType = this.form.get('parameterType').value;
    this.fetchSapParameters(initialType);

    this.form.get('parameterType').valueChanges.subscribe((newType) => {
      if (newType === SapParameterType.BTP || newType === SapParameterType.AUDIT_LOG) return;
      this.fetchSapParameters(newType);
    });

    this.form.get('valueType')?.valueChanges.subscribe((value) => {
      this.valueType = SapParameterRuleValueType[value];
    });

    this.form.get('tag')?.valueChanges.subscribe((selectedId) => {
      const selectedTag = this.tagList.find((tag) => tag.id === selectedId);
      if (selectedTag) this.tags = [selectedTag];
    });

    this.sapParameterService.getUtilSystems().subscribe((resp: ApiResponse) => {
      if (resp.data) {
        this.clients = [...new Set(resp.data.flatMap((s: any) => s.clients))] as any;
      }
    });

    this.sapAuditLogService.getAuditEvents().subscribe((resp: ApiResponse) => {
      if (resp.data) this.events = resp.data.rows || resp.data;
    });
  }

  ngAfterViewInit(): void {}

  // ─── Rule Patching ───

  private patchRule(rule: SapParameterRule): void {
    this.form.patchValue({ parameterType: rule.parameterType ?? SapParameterType.SAP_PARAMETER });

    if (rule.acmRuleId) {
      this.acmRule = { id: rule.acmRuleId, ruleName: rule?.ruleVO?.ruleName, ruleDescription: rule?.ruleVO?.ruleDescription };
    }

    this.form.patchValue({
      name: rule.name,
      caseSensitive: rule.caseSensitive ?? false,
      valueType: rule.valueType,
      errorStatus: rule.errorStatus ?? rule.severity,
      parameter: rule.parameter?.id,
      parameterSubType: rule.parameterSubType,
      tag: rule.tags?.[0]?.id ?? rule.tag ?? '',
      ruleDefinitionId: rule.ruleDefinitionId,
      whiteList: rule.whiteList,
      blackList: rule.blackList,
      description: rule.description,
      acmRuleId: this.acmRule,
    });

    this.valueType = rule.valueType;
    this.addDefaultTag = false;

    if (rule.tags?.length) {
      this.tags = rule.tags;
    } else if (rule.tag) {
      this.tags = [{ id: rule.tag, name: rule.tag }];
    } else {
      this.tags = [];
    }

    this.conditions = rule.conditions ?? [];
    if (rule.fieldRuleConditions) {
      this.filters['filter'] = rule.fieldRuleConditions;
    }

    if (rule.parameter) {
      this.parameterSearchControl.setValue(rule.parameter);
    }

    if (rule.requirementNodes) {
      this.selectedRequirements = rule.requirementNodes;
    }
  }

  // ─── Data Fetching ───

  private fetchSapParameters(parameterType: string): void {
    if ([SapParameterType.BTP, SapParameterType.AUDIT_LOG, SapParameterType.SAP_ABAP].includes(parameterType as SapParameterType)) return;
    this.sapParameterService.getSapParameters(parameterType).subscribe((response) => {
      this.parameters = response.data?.rows || response.data || [];
      this.filteredParameters = this.parameters;
      this.preselectParameter();
    });
  }

  private getTags(): void {
    this.cssSharedService.getAllTags().subscribe((resp: ApiResponse) => {
      this.tagList = resp.data?.rows || resp.data || [];
    });
  }

  private getRuleDefinitionData(): void {
    this.btpService.getRuleDefinitions().subscribe({
      next: (res) => { this.ruleDefinitions = res.data?.rows || []; },
      error: () => { this.ruleDefinitions = []; },
    });
  }

  // ─── Save ───

  onSave(): void {
    if (this.form.get('parameterType').value === SapParameterType.AUDIT_LOG) {
      this.saveAuditLog();
      return;
    }

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const rule = this.createRuleFromState();

    if (rule.parameterType === SapParameterType.BTP) {
      this.btpService.saveRule(rule).subscribe({
        next: () => this.router.navigate(['/css/sap-parameters/parameter-rules']),
        error: (err: any) => this.notificationService.error(err?.message || 'Error while saving rule'),
      });
    } else {
      this.sapParameterService.saveParameterRule(rule).subscribe((resp) => {
        this.notificationService.show(resp);
        if (this.bookStateService.hasState()) {
          this.bookStateService.setChildResource({ audit: null, parameter: resp.data });
        }
        this.location.back();
      });
    }
  }

  onBack(): void {
    this.location.back();
  }

  enableEdit(): void {
    this.isReadonly = false;
    this.formType = 'edit';
    this.form.enable();
    this.parameterSearchControl.enable();
  }

  navigateBack(): void {
    this.router.navigate(['/css/sap-parameters/parameter-rules']);
  }

  // ─── Conditions / Tags / Requirements ───

  onConditionsChanged(conditions: SapParameterRuleCondition[]): void {
    this.conditions = conditions;
  }

  onTagsChanged(tags: RuleTag[]): void {
    this.tags = tags;
  }

  onFrameworkRequirementChanged(requirements: any[]): void {
    this.selectedRequirements = requirements;
  }

  getRuleContext(): any {
    const formVal = this.form.value;
    const paramName = this.parameterSearchControl.value;
    return {
      name: formVal.name,
      description: formVal.description,
      parameterType: formVal.parameterType,
      errorStatus: formVal.errorStatus,
      parameterName: typeof paramName === 'string' ? paramName : (paramName as SapParameter)?.parameterName || '',
      conditions: this.conditions.length > 0
        ? this.conditions.map((c) => `${c.conditionType}: ${(c.values || []).join(',')}`).join('; ')
        : '',
    };
  }

  // ─── Test ───

  testValue(): void {
    const rule = this.createRuleFromState();
    this.sapParameterService.testParameterRule(rule, this.form.get('testValue').value).subscribe((resp: ApiResponse) => {
      const condition: SapParameterRuleCondition = resp.data;
      if (condition == null) {
        this.testResult = this.sanitizer.bypassSecurityTrustHtml("<div style='color: green'>passed -> no violation</div>");
      } else {
        this.testResult = this.sanitizer.bypassSecurityTrustHtml(
          "<div style='color: red'>Failed check -> violation is created for condition:</div> " +
            SapRuleConditionType[condition.conditionType] + '(' + condition.values + ')'
        );
      }
    });
  }

  // ─── Parameter Actions ───

  onParameter(action: 'add' | 'edit' | 'select'): void {
    const rule = this.createRuleFromState();
    if (action === 'add') {
      this.ruleStateService.setPreviousState(rule);
      this.router.navigate(['add-sap-parameter'], {
        relativeTo: this.activeRoute.parent,
        state: { parameter: null, formType: 'add' },
      });
    } else if (action === 'edit') {
      this.ruleStateService.setPreviousState(rule);
      this.router.navigate(['add-sap-parameter'], {
        relativeTo: this.activeRoute.parent,
        state: { parameter: this.parameter, formType: 'edit' },
      });
    } else {
      this.nzModal.create({
        nzTitle: 'Connect Parameter',
        nzContent: SelectParameterDialog,
        nzWidth: '60vw',
        nzClassName: 'updated-modal',
        nzData: { parameters: this.parameters },
        nzFooter: null,
      }).afterClose.subscribe((parameter) => {
        if (parameter) this.form.get('parameter').setValue(parameter.id);
      });
    }
  }

  get parameter(): SapParameter {
    const id = this.form.get('parameter').value;
    if (id == null || this.parameters == null) return null;
    return this.parameters.find((p) => p.id === id) || null;
  }

  displayParameterFn = (param: any): string => {
    if (!param || typeof param === 'string') return param || '';
    return param.description ? `${param.parameterName} - ${param.description}` : param.parameterName;
  };

  onParameterSelected(event: any): void {
    const parameter = event.option?.value || event.nzValue;
    if (parameter) this.form.get('parameter').setValue(parameter.id);
  }

  private filterParametersList(search: string): SapParameter[] {
    if (!this.parameters) return [];
    if (!search) return this.parameters;
    const lower = search.toLowerCase();
    return this.parameters.filter(
      (p) => p.parameterName?.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower)
    );
  }

  private preselectParameter(): void {
    const parameterId = this.form.get('parameter').value;
    if (parameterId && this.parameters) {
      const param = this.parameters.find((p) => p.id === parameterId);
      if (param) this.parameterSearchControl.setValue(param);
    }
  }

  // ─── Rule State Builder ───

  private createRuleFromState(): SapParameterRule {
    const rule: SapParameterRule = {
      id: null,
      name: this.form.get('name').value,
      caseSensitive: this.form.get('caseSensitive').value,
      errorStatus: this.form.get('errorStatus').value,
      parameter: this.parameter,
      conditions: this.conditions,
      valueType: this.form.get('valueType').value,
      parameterType: this.form.get('parameterType').value,
      tags: this.tags,
      acmRuleId: this.acmRule?.id,
    };

    if (rule.parameterType === SapParameterType.HANA_DATABASE) {
      rule.parameterSubType = this.form.get('parameterSubType').value;
    }
    if (rule.parameterType === SapParameterType.BTP) {
      rule.severity = this.form.get('errorStatus').value;
      rule.description = this.form.get('description').value;
      rule.ruleDefinitionId = this.form.get('ruleDefinitionId').value;
      rule.whiteList = this.form.get('whiteList').value;
      rule.blackList = this.form.get('blackList').value;
      rule.tag = this.tags[0]?.id;
    }

    rule['fieldRuleConditions'] = this.filters['filter'];
    rule.conditions = this.conditions;

    if (this.formType === 'edit') {
      rule.id = this.rule.id;
    }

    if (this.selectedRequirements?.length > 0) {
      rule.requirementNodes = this.selectedRequirements
        .filter((r) => r && r.id != null && r.id !== '')
        .map((r) => ({ id: r.id, name: r.name || '' }));
      if (rule.requirementNodes.length === 0) delete rule.requirementNodes;
    }

    return rule;
  }

  // ─── Visibility Helpers ───

  showFieldFilter(parameterType: string | null, parameterSubType: string | null): boolean {
    if (parameterType === 'SAP_UME' || parameterType === 'BTP') return true;
    if (parameterSubType && ['AUDIT_RULES', 'ACCESS_RULES'].includes(parameterSubType)) return true;
    return false;
  }

  showParameterField(parameterType: string | null, parameterSubType: string | null): boolean {
    return !this.showFieldFilter(parameterType, parameterSubType);
  }

  showDescriptionField(parameterType: string): boolean {
    return parameterType === SapParameterType.BTP || parameterType === SapParameterType.AUDIT_LOG;
  }

  get selectedParameterType(): string {
    return this.form.get('parameterType').value;
  }

  get selectedParameterSubType(): string {
    return this.form.get('parameterSubType').value;
  }

  // ─── Filters ───

  onFiltersChanged(conditions: any[], key: string): void {
    this.filters[key] = conditions;
  }

  // ─── Audit Log ───

  onAuditRuleFiltersChanged(conditions: SapAuditRuleCondition[], key: string): void {
    this.auditRuleFilters[key] = conditions;
  }

  onExposeForm(form: { form: FormGroup; open?: () => void }): void {
    this.childForms.push(form);
  }

  onConditionChanged(condition: { interval: number; threshhold: number }): void {
    this.condition = condition;
  }

  onGroupingChanged(grouping: string[]): void {
    this.grouping = grouping;
  }

  onBuilderConditionsChange(conditions: SapAuditRuleCondition[]): void {
    this.builderConditions = conditions;
    this.auditRuleFilters = {
      filter: [],
      normal: conditions.filter((c) => c.matchMode === SapAuditMatchMode.NORMAL),
      whitelist: conditions.filter((c) => c.matchMode === SapAuditMatchMode.WHITELIST),
      blacklist: conditions.filter((c) => c.matchMode === SapAuditMatchMode.BLACKLIST),
      reset: conditions.filter((c) => c.matchMode === SapAuditMatchMode.RESET),
    };
  }

  onThreshholdChange(threshhold: number): void {
    this.condition.threshhold = threshhold;
  }

  onIntervalChange(interval: number): void {
    this.condition.interval = interval;
  }

  initAuditLog(): void {
    this.auditRule = history.state.rule;
    this.formType = history.state.formType;

    if (this.auditRule != null) {
      this.form.patchValue({
        name: this.auditRule.name,
        errorStatus: this.auditRule.severity,
        description: this.auditRule.description,
        parameterType: SapParameterType.AUDIT_LOG,
        tag: this.auditRule.tags?.[0]?.id,
      });

      this.grouping = this.auditRule.groupedBy || [];
      this.condition = { interval: this.auditRule.interval || 86400000, threshhold: this.auditRule.threshhold || 1 };
      this.selectedRequirements = this.auditRule.requirementNodes || [];
      this.builderConditions = this.auditRule.conditions || [];

      this.auditRuleFilters = { filter: [], normal: [], blacklist: [], whitelist: [], reset: [] };
      for (const cond of this.auditRule.conditions || []) {
        if (cond.matchMode === SapAuditMatchMode.BLACKLIST) this.auditRuleFilters['blacklist'].push(cond);
        else if (cond.matchMode === SapAuditMatchMode.WHITELIST) this.auditRuleFilters['whitelist'].push(cond);
        else if (cond.matchMode === SapAuditMatchMode.RESET) this.auditRuleFilters['reset'].push(cond);
        else this.auditRuleFilters['normal'].push(cond);
      }

      this.addDefaultTag = false;
      this.tags = this.auditRule.tags || [];
    }
  }

  onAcmRuleSelected(selectedRule: any): void {
    if (selectedRule) this.acmRule = selectedRule;
  }

  saveAuditLog(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const conditions = this.builderConditions.length > 0
      ? this.builderConditions
      : Object.values(this.auditRuleFilters).flatMap((c) => c);

    const myAuditRule: SapAuditRule = {
      id: this.formType === 'add' ? null : this.auditRule?.id,
      name: this.form.get('name').value,
      severity: this.form.get('errorStatus').value,
      description: this.form.get('description').value,
      groupedBy: this.grouping,
      conditions,
      tags: this.tags,
      ...this.condition,
    };

    if (this.selectedRequirements?.length > 0) {
      myAuditRule.requirementNodes = this.selectedRequirements
        .filter((r) => r && r.id != null && r.id !== '')
        .map((r) => ({ id: r.id, name: r.name || '' }));
      if (myAuditRule.requirementNodes.length === 0) delete myAuditRule.requirementNodes;
    }

    this.sapAuditLogService.saveAuditRule(myAuditRule).subscribe((resp) => {
      this.notificationService.show(resp);
      if (this.bookStateService.hasState()) {
        this.bookStateService.setChildResource({ audit: resp.data, parameter: null });
      }
      this.location.back();
    });
  }

  onSeverityKeydown(event: KeyboardEvent): void {
    const mapping: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 };
    if (mapping[event.key] !== undefined) {
      const [value] = this.errorStatusOptions[mapping[event.key]];
      this.form.get('errorStatus')?.setValue(value);
      event.preventDefault();
    }
  }

  // ─── AI Assistant ───

  copyAIPrompt(): void {
    const prompt = generateAIPrompt();
    navigator.clipboard.writeText(prompt).then(() => {
      this.promptCopied = true;
      setTimeout(() => (this.promptCopied = false), 3000);
      this.notificationService.success('AI prompt copied to clipboard!');
    });
  }

  copyExamplePrompt(example: string): void {
    navigator.clipboard.writeText(example).then(() => {
      this.notificationService.success('Example copied to clipboard!');
    });
  }

  validateJson(): void {
    if (!this.aiJsonInput?.trim()) {
      this.validationResult = { valid: false, errors: ['Please paste JSON content to validate'], warnings: [] };
      return;
    }
    this.validationResult = this.auditRuleValidator.validate(this.aiJsonInput);
  }

  importFromJson(): void {
    if (!this.validationResult?.valid || !this.validationResult.parsedRule) return;
    const rule = this.validationResult.parsedRule;

    this.form.patchValue({
      name: rule.name,
      errorStatus: rule.severity,
      description: rule.description || '',
      tag: rule.tags?.[0]?.id || '',
    });

    if (rule.tags?.length > 0) {
      this.tags = rule.tags;
      this.addDefaultTag = false;
    }

    this.grouping = rule.groupedBy || [];
    this.condition = { interval: rule.interval, threshhold: rule.threshhold };
    this.builderConditions = rule.conditions || [];

    this.auditRuleFilters = {
      filter: [],
      normal: rule.conditions.filter((c: any) => c.matchMode === SapAuditMatchMode.NORMAL || !c.matchMode),
      blacklist: rule.conditions.filter((c: any) => c.matchMode === SapAuditMatchMode.BLACKLIST),
      whitelist: rule.conditions.filter((c: any) => c.matchMode === SapAuditMatchMode.WHITELIST),
      reset: rule.conditions.filter((c: any) => c.matchMode === SapAuditMatchMode.RESET),
    };

    this.showAiImport = false;
    this.notificationService.success('Rule imported successfully! Review and save.');
  }

  clearJsonInput(): void {
    this.aiJsonInput = '';
    this.validationResult = null;
  }
}
