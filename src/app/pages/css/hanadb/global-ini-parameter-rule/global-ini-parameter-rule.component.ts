import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { HanaService } from '../hana.service';
import { SapParameterRule } from '../../sap-parameters/sap-parameter.model';
import { conditionToString, SapViolationSeverityNames } from '../../css-shared/css-shared.model';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-global-ini-parameter-rule',
  templateUrl: './global-ini-parameter-rule.component.html',
})
export class GlobalIniParameterRuleComponent implements OnInit {
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Name' },
    { field: 'parameterName', header: 'SAP Parameter' },
    { field: 'conditionsLabel', header: 'Values' },
    {
      field: 'severityLabel',
      header: 'Severity',
      type: 'tag',
      tagColors: { Critical: 'red', High: 'orange', Medium: 'blue', Low: 'green' },
    },
  ];

  actions: TableAction[] = [];

  constructor(
    private hanaService: HanaService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.hanaService.getAllParameterRules().subscribe({
      next: (resp) => {
        this.data = (resp.data?.rows || []).map((rule: SapParameterRule) => ({
          ...rule,
          parameterName: rule.parameter?.parameterName || '-',
          conditionsLabel: this.formatConditions(rule),
          severityLabel: SapViolationSeverityNames[rule.errorStatus] || rule.errorStatus,
        }));
        this.totalRecords = resp.data?.records || 0;
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load HANA parameter rules');
        this.loading = false;
      },
    });
  }

  private formatConditions(rule: SapParameterRule): string {
    if (!rule.conditions?.length) return '-';
    return rule.conditions
      .map((c) => conditionToString(c, rule.valueType))
      .join(', ');
  }
}
