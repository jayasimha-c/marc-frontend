import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { RfcMonitoringService, RfcRiskRule } from './rfc-monitoring.service';

@Component({
  standalone: false,
  selector: 'app-rfc-rules-config',
  templateUrl: './rfc-rules-config.component.html',
  styleUrls: ['./rfc-rules-config.component.scss'],
})
export class RfcRulesConfigComponent implements OnInit {
  rules: RfcRiskRule[] = [];
  loading = false;
  previewRule: RfcRiskRule | null = null;
  previewConditions: any[] = [];
  selectedRule: RfcRiskRule | null = null;
  showEditor = false;

  severityOptions = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  outcomeOptions = [
    { value: 'UI_WARNING', label: 'UI Warning' },
    { value: 'CREATE_FINDING', label: 'Create Finding' },
    { value: 'BLOCK_RECOMMENDATION', label: 'Block Recommendation' },
  ];
  scopeTypeOptions = [
    { value: 'ALL', label: 'All Systems' },
    { value: 'SELECTED_SYSTEMS', label: 'Selected Systems' },
    { value: 'SELECTED_LANDSCAPES', label: 'Selected Landscapes' },
  ];

  constructor(
    private rfcMonitoringService: RfcMonitoringService,
    private notificationService: NotificationService,
    private modal: NzModalService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.loading = true;
    this.rfcMonitoringService.getAllRiskRules().subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success) {
          this.rules = resp.data || [];
          if (this.rules.length > 0 && !this.previewRule) {
            this.selectRule(this.rules[0]);
          }
        }
      },
      error: () => { this.loading = false; },
    });
  }

  selectRule(rule: RfcRiskRule): void {
    this.previewRule = rule;
    this.previewConditions = this.getParsedConditions(rule);
  }

  getParsedConditions(rule: RfcRiskRule): any[] {
    if (!rule?.ruleConditions) return [];
    try {
      const conditions = JSON.parse(rule.ruleConditions);
      const list = conditions.and || conditions.or || [];
      return list.map((c: any) => ({
        field: c.field,
        fieldLabel: this.getFieldLabel(c.field),
        operator: c.operator,
        operatorLabel: this.getOperatorLabel(c.operator),
        value: c.value,
        valueFormatted: this.formatValue(c.value),
      }));
    } catch {
      return [];
    }
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      trustedRfc: 'Trusted RFC', sncEnabled: 'SNC Enabled',
      isExternal: 'External Host', hasPassword: 'Has Password',
      connectionType: 'Connection Type', isStandard: 'Standard Pattern',
    };
    return labels[field] || field;
  }

  private getOperatorLabel(operator: string): string {
    const labels: { [key: string]: string } = {
      equals: '=', not_equals: '!=', in: 'IN', not_in: 'NOT IN',
      EQUALS: '=', NOT_EQUALS: '!=', IN: 'IN', NOT_IN: 'NOT IN',
    };
    return labels[operator] || operator;
  }

  private formatValue(value: any): string {
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  toggleRule(rule: RfcRiskRule, event?: Event): void {
    event?.stopPropagation();
    this.rfcMonitoringService.toggleRiskRule(rule.id!).subscribe({
      next: (resp) => {
        if (resp.success) {
          rule.isEnabled = resp.data.isEnabled;
          if (this.previewRule?.id === rule.id) {
            this.previewRule = { ...rule };
            this.previewConditions = this.getParsedConditions(this.previewRule);
          }
        }
      },
    });
  }

  editRule(rule: RfcRiskRule, event?: Event): void {
    event?.stopPropagation();
    this.selectedRule = { ...rule };
    this.showEditor = true;
  }

  createRule(): void {
    this.selectedRule = {
      ruleName: '',
      ruleDescription: '',
      isTemplate: false,
      isEnabled: true,
      ruleConditions: '{"and":[]}',
      severity: 'MEDIUM',
      outcome: 'UI_WARNING',
      scopeType: 'ALL',
      scopeValue: undefined,
    };
    this.showEditor = true;
  }

  saveRule(): void {
    if (!this.selectedRule?.ruleName) return;
    this.rfcMonitoringService.saveRiskRule(this.selectedRule).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.notificationService.success('Rule saved successfully');
          this.showEditor = false;
          this.selectedRule = null;
          this.loadRules();
        } else {
          this.notificationService.error(resp.message || 'Failed to save rule');
        }
      },
      error: () => { this.notificationService.error('Failed to save rule'); },
    });
  }

  deleteRule(rule: RfcRiskRule, event?: Event): void {
    event?.stopPropagation();
    if (rule.isTemplate) return;

    this.modal.confirm({
      nzTitle: 'Delete Rule',
      nzContent: `Delete rule "${rule.ruleName}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.rfcMonitoringService.deleteRiskRule(rule.id!).subscribe({
          next: (resp) => {
            if (resp.success) {
              this.notificationService.success('Rule deleted');
              if (this.previewRule?.id === rule.id) {
                this.previewRule = null;
                this.previewConditions = [];
              }
              this.loadRules();
            }
          },
        });
      },
    });
  }

  cancelEdit(): void {
    this.showEditor = false;
    this.selectedRule = null;
    this.loadRules();
  }

  getSeverityColor(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'volcano';
      case 'MEDIUM': return 'orange';
      case 'LOW': return 'green';
      default: return 'default';
    }
  }

  getOutcomeLabel(outcome: string): string {
    return this.outcomeOptions.find(o => o.value === outcome)?.label || outcome;
  }

  formatDate(epochMs: number): string {
    if (!epochMs) return '-';
    return new Date(epochMs).toLocaleString();
  }

  navigateBack(): void {
    this.router.navigate(['/css/monitoring/rfc-monitoring']);
  }
}
