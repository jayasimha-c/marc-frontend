import { Component, Input } from '@angular/core';

export interface RuleCondition {
  field: string;
  fieldLabel: string;
  operator: string;
  operatorLabel: string;
  value: any;
  valueFormatted: string;
  type?: string;
}

@Component({
  standalone: false,
  selector: 'app-icm-rule-conditions-table',
  templateUrl: './icm-rule-conditions-table.component.html',
})
export class IcmRuleConditionsTableComponent {
  @Input() title = 'Conditions';
  @Input() icon = 'filter';
  @Input() conditions: RuleCondition[] = [];
  @Input() logic: 'AND' | 'OR' = 'AND';
  @Input() active = true;

  getLogicDescription(): string {
    return this.logic === 'AND' ? 'All conditions must match' : 'Any condition triggers';
  }
}
