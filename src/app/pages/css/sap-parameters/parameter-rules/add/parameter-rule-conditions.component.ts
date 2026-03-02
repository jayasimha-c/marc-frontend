import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {
  SapParameterRuleCondition,
  SapParameterRuleValueType,
  SapParameterSubType,
  SapParameterSubTypeNames,
} from '../../sap-parameter.model';
import { SapRuleConditionType, SapRuleConditionTypeNames } from '../../../css-shared/css-shared.model';

@Component({
  standalone: false,
  selector: 'parameter-rule-conditions',
  templateUrl: './parameter-rule-conditions.component.html',
  styleUrls: ['./parameter-rule-conditions.component.scss'],
})
export class ParameterRuleConditionsComponent implements OnChanges {
  @Input() parameterSubType: SapParameterSubType | null;
  @Input() valueType: SapParameterRuleValueType | null;
  @Input() conditions: SapParameterRuleCondition[] = [];
  @Output() conditionChanged = new EventEmitter<SapParameterRuleCondition[]>();

  @ViewChildren('valueInput') valueInputs: QueryList<ElementRef<HTMLInputElement>>;

  conditionTypeOptions: [SapRuleConditionType, string][] = [];
  protected readonly SapParameterSubTypeNames = SapParameterSubTypeNames;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valueType']) {
      this.conditionTypeOptions = this.getConditionTypeOptions(this.valueType);
    }
  }

  trackByCond(index: number): number {
    return index;
  }

  compareValues(a: any, b: any): boolean {
    return a === b;
  }

  onAddCondition(): void {
    const defaultType = this.conditionTypeOptions.length > 0
      ? this.conditionTypeOptions[0][0]
      : SapRuleConditionType.EQUALS;
    const defaultValues = this.getInputType(defaultType) === 'boolean' ? ['true'] : [];

    this.conditions = [...this.conditions, { id: null, conditionType: defaultType, values: defaultValues }];
    this.conditionChanged.emit(this.conditions);

    setTimeout(() => {
      const inputs = this.valueInputs?.toArray();
      if (inputs?.length) {
        inputs[inputs.length - 1].nativeElement.focus();
      }
    });
  }

  onDelete(index: number): void {
    this.conditions = this.conditions.filter((_, i) => i !== index);
    this.conditionChanged.emit(this.conditions);
  }

  onConditionTypeChange(index: number, newType: SapRuleConditionType): void {
    const cond = { ...this.conditions[index] };
    const newInputType = this.getInputType(newType);
    cond.conditionType = newType;

    if (newInputType === 'boolean') {
      cond.values = ['true'];
    } else if (this.isBetween(newType) && newInputType === 'date') {
      cond.values = [cond.values[0] || '', cond.values[1] || ''];
    }

    this.conditions = this.conditions.map((c, i) => (i === index ? cond : c));
    this.conditionChanged.emit(this.conditions);
  }

  focusInput(index: number): void {
    this.valueInputs?.toArray()?.[index]?.nativeElement?.focus();
  }

  onValueKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.trim();

    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (val) {
        this.addValue(index, val);
        input.value = '';
      }
    } else if (event.key === 'Backspace' && !val) {
      const cond = this.conditions[index];
      if (cond.values.length > 0) {
        this.removeValue(index, cond.values.length - 1, event);
      }
    }
  }

  onValueBlur(event: FocusEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.trim();
    if (val) {
      this.addValue(index, val);
      input.value = '';
    }
  }

  addValue(index: number, value: string): void {
    const cond = { ...this.conditions[index] };
    if (!cond.values.includes(value)) {
      cond.values = [...cond.values, value];
      this.conditions = this.conditions.map((c, i) => (i === index ? cond : c));
      this.conditionChanged.emit(this.conditions);
    }
  }

  removeValue(condIndex: number, valIndex: number, event: Event): void {
    event.stopPropagation();
    const cond = { ...this.conditions[condIndex] };
    cond.values = cond.values.filter((_, i) => i !== valIndex);
    this.conditions = this.conditions.map((c, i) => (i === condIndex ? cond : c));
    this.conditionChanged.emit(this.conditions);
  }

  onBooleanChange(index: number, value: string): void {
    const cond = { ...this.conditions[index], values: [value] };
    this.conditions = this.conditions.map((c, i) => (i === index ? cond : c));
    this.conditionChanged.emit(this.conditions);
  }

  onDateChange(condIndex: number, slotIndex: number, date: Date): void {
    const cond = { ...this.conditions[condIndex] };
    const values = [...cond.values];
    values[slotIndex] = date ? date.toISOString() : '';
    cond.values = values;
    this.conditions = this.conditions.map((c, i) => (i === condIndex ? cond : c));
    this.conditionChanged.emit(this.conditions);
  }

  getInputType(conditionType: SapRuleConditionType): 'text' | 'boolean' | 'date' {
    if (conditionType === SapRuleConditionType.EMPTY || this.valueType === SapParameterRuleValueType.BOOLEAN) {
      return 'boolean';
    }
    if (this.valueType === SapParameterRuleValueType.DATE) {
      return 'date';
    }
    return 'text';
  }

  isBetween(conditionType: SapRuleConditionType): boolean {
    return conditionType === SapRuleConditionType.BETWEEN || conditionType === SapRuleConditionType.NOT_BETWEEN;
  }

  getPlaceholder(conditionType: SapRuleConditionType): string {
    if (this.valueType === SapParameterRuleValueType.NUMBER) {
      return this.isBetween(conditionType) ? 'e.g. 1, 100' : 'Enter number values...';
    }
    return 'Enter values... (press Enter to add)';
  }

  formatDisplayValue(value: any): string {
    if (this.valueType === SapParameterRuleValueType.DATE && value) {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    }
    return `"${value}"`;
  }

  private getConditionTypeOptions(valueType: SapParameterRuleValueType): [SapRuleConditionType, string][] {
    if (valueType == null) {
      return [];
    }

    let options: SapRuleConditionType[] = [];

    switch (valueType) {
      case SapParameterRuleValueType.TEXT:
        options = [
          SapRuleConditionType.EQUALS, SapRuleConditionType.NOT_EQUALS,
          SapRuleConditionType.IN, SapRuleConditionType.NOT_IN,
          SapRuleConditionType.CONTAINS, SapRuleConditionType.NOT_CONTAINS,
          SapRuleConditionType.STARTS_WITH, SapRuleConditionType.NOT_STARTS_WITH,
          SapRuleConditionType.ENDS_WITH, SapRuleConditionType.NOT_ENDS_WITH,
          SapRuleConditionType.EMPTY,
        ];
        break;
      case SapParameterRuleValueType.NUMBER:
        options = [
          SapRuleConditionType.EQUALS, SapRuleConditionType.NOT_EQUALS,
          SapRuleConditionType.IN, SapRuleConditionType.NOT_IN,
          SapRuleConditionType.GREATER, SapRuleConditionType.GREATER_EQUALS,
          SapRuleConditionType.LESSER, SapRuleConditionType.LESSER_EQUALS,
          SapRuleConditionType.BETWEEN, SapRuleConditionType.NOT_BETWEEN,
          SapRuleConditionType.EMPTY,
        ];
        break;
      case SapParameterRuleValueType.BOOLEAN:
        options = [SapRuleConditionType.IS_SET];
        break;
      case SapParameterRuleValueType.DATE:
        options = [
          SapRuleConditionType.EQUALS, SapRuleConditionType.NOT_EQUALS,
          SapRuleConditionType.IN, SapRuleConditionType.NOT_IN,
          SapRuleConditionType.GREATER, SapRuleConditionType.GREATER_EQUALS,
          SapRuleConditionType.LESSER, SapRuleConditionType.LESSER_EQUALS,
          SapRuleConditionType.BETWEEN, SapRuleConditionType.NOT_BETWEEN,
          SapRuleConditionType.EMPTY,
        ];
        break;
    }

    return options.map((t) => [t, SapRuleConditionTypeNames[t]]);
  }
}
