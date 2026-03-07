import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { RfcMonitoringService, RfcRiskRule } from './rfc-monitoring.service';
import { TableColumn, TableAction, RowAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-rfc-rules-config',
  templateUrl: './rfc-rules-config.component.html',
})
export class RfcRulesConfigComponent implements OnInit {
  rules: any[] = [];
  totalRecords = 0;
  loading = false;

  drawerVisible = false;
  selectedRule: RfcRiskRule | null = null;
  editMode = false;

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

  columns: TableColumn[] = [
    { field: 'ruleName', header: 'Rule Name', sortable: true },
    { field: 'severity', header: 'Severity', type: 'tag', width: '100px',
      tagColors: { CRITICAL: 'red', HIGH: 'volcano', MEDIUM: 'orange', LOW: 'green', INFO: 'default' } },
    { field: 'outcomeLabel', header: 'Outcome', width: '160px' },
    { field: 'scopeType', header: 'Scope', width: '140px' },
    { field: 'statusText', header: 'Status', type: 'tag', width: '90px',
      tagColors: { Enabled: 'green', Disabled: 'default' } },
    { field: 'templateText', header: 'Template', type: 'tag', width: '90px',
      tagColors: { Yes: 'purple', No: 'default' } },
    { field: 'actions', header: 'Actions', type: 'actions', width: '180px',
      actions: this.getRowActions() },
  ];

  tableActions: TableAction[] = [
    { label: 'Create Rule', icon: 'plus', type: 'primary', command: () => this.createRule() },
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

  private getRowActions(): RowAction[] {
    return [
      { icon: 'eye', tooltip: 'View', command: (row) => this.viewRule(row) },
      { icon: 'edit', tooltip: 'Edit', command: (row) => this.editRule(row) },
      { icon: 'poweroff', tooltip: 'Toggle', command: (row) => this.toggleRule(row) },
      { icon: 'delete', tooltip: 'Delete', command: (row) => this.deleteRule(row), danger: true,
        hidden: (row) => row.isTemplate },
    ];
  }

  loadRules(): void {
    this.loading = true;
    this.rfcMonitoringService.getAllRiskRules().subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success) {
          this.rules = (resp.data || []).map((r: RfcRiskRule) => ({
            ...r,
            outcomeLabel: this.getOutcomeLabel(r.outcome),
            statusText: r.isEnabled ? 'Enabled' : 'Disabled',
            templateText: r.isTemplate ? 'Yes' : 'No',
          }));
          this.totalRecords = this.rules.length;
        }
      },
      error: () => { this.loading = false; },
    });
  }

  viewRule(rule: RfcRiskRule): void {
    this.selectedRule = { ...rule };
    this.editMode = false;
    this.drawerVisible = true;
  }

  editRule(rule: RfcRiskRule): void {
    this.selectedRule = { ...rule };
    this.editMode = true;
    this.drawerVisible = true;
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
    this.editMode = true;
    this.drawerVisible = true;
  }

  closeDrawer(): void {
    this.drawerVisible = false;
    this.selectedRule = null;
    this.editMode = false;
  }

  saveRule(): void {
    if (!this.selectedRule?.ruleName) return;
    this.rfcMonitoringService.saveRiskRule(this.selectedRule).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.notificationService.success('Rule saved successfully');
          this.closeDrawer();
          this.loadRules();
        } else {
          this.notificationService.error(resp.message || 'Failed to save rule');
        }
      },
      error: () => { this.notificationService.error('Failed to save rule'); },
    });
  }

  toggleRule(rule: RfcRiskRule): void {
    this.rfcMonitoringService.toggleRiskRule(rule.id!).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.notificationService.success(resp.data.isEnabled ? 'Rule enabled' : 'Rule disabled');
          this.loadRules();
        }
      },
    });
  }

  deleteRule(rule: RfcRiskRule): void {
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
              this.loadRules();
            }
          },
        });
      },
    });
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

  navigateBack(): void {
    this.router.navigate(['/css/monitoring/rfc-monitoring']);
  }
}
