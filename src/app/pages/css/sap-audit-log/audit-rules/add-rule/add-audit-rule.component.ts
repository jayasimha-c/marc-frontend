import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RuleTag, SapRuleConditionType, SapViolationSeverityNames } from '../../../css-shared/css-shared.model';
import { RuleBookStateService } from '../../../css-shared/previous-state.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import {
  SapAuditEvent,
  SapAuditLogField,
  SapAuditMatchMode,
  SapAuditRule,
  SapAuditRuleCondition,
} from '../../sap-audit-log.model';
import { SapAuditLogService } from '../../sap-audit-log.service';
import { generateAIPrompt, EXAMPLE_PROMPTS } from './audit-rule-ai-schema';
import { AuditRuleValidatorService, ValidationResult } from './audit-rule-validator.service';

@Component({
  standalone: false,
  selector: 'app-add-audit-rule',
  templateUrl: './add-audit-rule.component.html',
  styleUrls: ['./add-audit-rule.component.scss'],
})
export class AddAuditRuleComponent implements OnInit {
  filters: { [key: string]: SapAuditRuleCondition[] } = {};
  grouping: string[] = [];
  condition: { interval: number; threshhold: number } = { interval: 0, threshhold: 0 };

  severityOptions = Object.entries(SapViolationSeverityNames);
  clients: Array<{ id: number; name: string; clientNo: string }> = [];
  events: SapAuditEvent[] = [];
  MatchMode = SapAuditMatchMode;

  addDefaultTag = true;
  tags: RuleTag[] = [];

  selectedTabIndex = 0;
  aiJsonInput = '';
  validationResult: ValidationResult | null = null;
  promptCopied = false;
  examplePrompts = EXAMPLE_PROMPTS;

  formType: string;
  form: FormGroup;

  private childForms: { form: FormGroup; open?: () => void }[] = [];
  private rule: SapAuditRule;

  constructor(
    private formBuilder: FormBuilder,
    private sapAuditLogService: SapAuditLogService,
    private location: Location,
    private bookStateService: RuleBookStateService,
    private notificationService: NotificationService,
    private auditRuleValidator: AuditRuleValidatorService
  ) {
    this.rule = history.state.rule;
    this.formType = history.state.formType;

    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      severity: [null, [Validators.required]],
      description: '',
    });

    if (this.rule != null) {
      this.form.patchValue({
        name: this.rule.name,
        severity: this.rule.severity,
        description: this.rule.description,
      });

      this.grouping = this.rule.groupedBy;
      this.condition = { interval: this.rule.interval, threshhold: this.rule.threshhold };
      this.filters = { filter: [], normal: [], blacklist: [], whitelist: [], reset: [] };

      for (const cond of this.rule.conditions) {
        if (cond.matchMode === SapAuditMatchMode.BLACKLIST) {
          this.filters['blacklist'].push(cond);
        } else if (cond.matchMode === SapAuditMatchMode.WHITELIST) {
          this.filters['whitelist'].push(cond);
        } else if (cond.matchMode === SapAuditMatchMode.RESET) {
          this.filters['reset'].push(cond);
        } else {
          const simpleFilters: Record<string, SapRuleConditionType> = {
            [SapAuditLogField.EVENT]: SapRuleConditionType.EQUALS,
            [SapAuditLogField.CLIENT_NO]: SapRuleConditionType.EQUALS,
            [SapAuditLogField.MESSAGE]: SapRuleConditionType.CONTAINS,
            [SapAuditLogField.TIME]: SapRuleConditionType.BETWEEN,
          };
          const isSimple = Object.keys(simpleFilters).some(
            (key) => key === cond.field && simpleFilters[key] === cond.conditionType
          );
          if (isSimple) {
            this.filters['filter'].push(cond);
          } else {
            this.filters['normal'].push(cond);
          }
        }
      }

      this.addDefaultTag = false;
      this.tags = this.rule.tags;
    }
  }

  ngOnInit(): void {
    this.sapAuditLogService.getAuditEvents().subscribe((resp) => {
      this.events = resp.data?.rows || resp.data || [];
    });
  }

  onBack(): void {
    this.location.back();
  }

  onSave(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    for (const child of this.childForms) {
      if (!child.form.valid) {
        child.form.markAllAsTouched();
        if (child.open) child.open();
        return;
      }
    }

    const conditions = Object.values(this.filters).flatMap((c) => c);
    const rule: SapAuditRule = {
      id: this.formType === 'add' ? null : this.rule.id,
      name: this.form.get('name')!.value,
      severity: this.form.get('severity')!.value,
      description: this.form.get('description')!.value,
      groupedBy: this.grouping,
      conditions,
      tags: this.tags,
      ...this.condition,
    };

    this.sapAuditLogService.saveAuditRule(rule).subscribe((resp) => {
      this.notificationService.show(resp);
      if (this.bookStateService.hasState()) {
        this.bookStateService.setChildResource({ audit: resp.data, parameter: null });
      }
      this.location.back();
    });
  }

  onFiltersChanged(conditions: SapAuditRuleCondition[], key: string): void {
    this.filters[key] = conditions;
  }

  onTagsChanged(tags: RuleTag[]): void {
    this.tags = tags;
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

  // AI Assistant Methods
  copyAIPrompt(): void {
    const prompt = generateAIPrompt();
    navigator.clipboard
      .writeText(prompt)
      .then(() => {
        this.promptCopied = true;
        setTimeout(() => (this.promptCopied = false), 3000);
        this.notificationService.success('AI prompt copied to clipboard!');
      })
      .catch(() => {
        this.notificationService.error('Failed to copy prompt to clipboard');
      });
  }

  copyExamplePrompt(example: string): void {
    navigator.clipboard.writeText(example).catch(() => {});
  }

  validateJson(): void {
    if (!this.aiJsonInput || this.aiJsonInput.trim() === '') {
      this.validationResult = {
        valid: false,
        errors: ['Please paste JSON content to validate'],
        warnings: [],
      };
      return;
    }
    this.validationResult = this.auditRuleValidator.validate(this.aiJsonInput);
  }

  importFromJson(): void {
    if (!this.validationResult?.valid || !this.validationResult.parsedRule) return;

    const rule = this.validationResult.parsedRule;
    this.form.patchValue({
      name: rule.name,
      severity: rule.severity,
      description: rule.description || '',
    });

    this.grouping = rule.groupedBy || [];
    this.condition = { interval: rule.interval, threshhold: rule.threshhold };

    this.filters = { filter: [], normal: [], blacklist: [], whitelist: [], reset: [] };
    for (const cond of rule.conditions) {
      if (cond.matchMode === SapAuditMatchMode.BLACKLIST) {
        this.filters['blacklist'].push(cond);
      } else if (cond.matchMode === SapAuditMatchMode.WHITELIST) {
        this.filters['whitelist'].push(cond);
      } else if (cond.matchMode === SapAuditMatchMode.RESET) {
        this.filters['reset'].push(cond);
      } else {
        const simpleFilters: Record<string, SapRuleConditionType> = {
          [SapAuditLogField.EVENT]: SapRuleConditionType.EQUALS,
          [SapAuditLogField.CLIENT_NO]: SapRuleConditionType.EQUALS,
          [SapAuditLogField.MESSAGE]: SapRuleConditionType.CONTAINS,
          [SapAuditLogField.TIME]: SapRuleConditionType.BETWEEN,
        };
        const isSimple = Object.keys(simpleFilters).some(
          (key) => key === cond.field && simpleFilters[key] === cond.conditionType
        );
        if (isSimple) this.filters['filter'].push(cond);
        else this.filters['normal'].push(cond);
      }
    }

    this.selectedTabIndex = 0;
    this.notificationService.success('Rule imported successfully! Review and save.');
  }

  clearJsonInput(): void {
    this.aiJsonInput = '';
    this.validationResult = null;
  }

  formatInterval(ms: number): string {
    return this.auditRuleValidator.formatInterval(ms);
  }
}
