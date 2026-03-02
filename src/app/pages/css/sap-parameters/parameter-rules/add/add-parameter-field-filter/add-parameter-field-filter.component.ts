import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { conditionValuesToString, SapRuleConditionType, SapRuleConditionTypeNames } from '../../../../css-shared/css-shared.model';
import { NotificationService } from '../../../../../../core/services/notification.service';
import {
  HanaAuditRulesFieldNames,
  HanaAuditRulesFieldSourceMap,
  SapParameterRuleValueType,
  SapParameterSubType,
  SapParameterType,
} from '../../../sap-parameter.model';

const MULTI_VALUE_CONDITIONS: SapRuleConditionType[] = [
  SapRuleConditionType.CONTAINS,
  SapRuleConditionType.STARTS_WITH,
  SapRuleConditionType.ENDS_WITH,
  SapRuleConditionType.IN,
  SapRuleConditionType.NOT_IN,
];

const BETWEEN_CONDITIONS: SapRuleConditionType[] = [
  SapRuleConditionType.BETWEEN,
  SapRuleConditionType.NOT_BETWEEN,
];

@Component({
  standalone: false,
  selector: 'app-add-parameter-field-filter',
  templateUrl: './add-parameter-field-filter.component.html',
})
export class AddParameterFieldFilterComponent implements OnChanges, OnInit {
  @Input() parameterType: string;
  @Input() parameterSubType: string;
  @Input() filters: any[] = [];
  @Output() filtersChanged = new EventEmitter<any>();

  protected readonly sapRuleConditionTypeNames = SapRuleConditionTypeNames;
  canAddValues = false;
  conditionTypeOptions = Object.entries(SapRuleConditionTypeNames);
  fieldNames: [string, string][] = [];
  displayFilters: any[] = [];

  form!: FormGroup;

  private conditionType: SapRuleConditionType;

  get values(): FormArray {
    return this.form.get('values') as FormArray;
  }

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      values: this.formBuilder.array([this.createInputField()]),
      conditionType: [''],
      field: [''],
    });

    this.form.get('conditionType').valueChanges.subscribe((value) => {
      const type: SapRuleConditionType = SapRuleConditionType[value];
      this.conditionType = type;

      if (MULTI_VALUE_CONDITIONS.includes(type)) {
        this.canAddValues = true;
      } else if (BETWEEN_CONDITIONS.includes(type)) {
        this.canAddValues = false;
        this.values.clear();
        this.addInputField();
        this.addInputField();
      } else {
        this.canAddValues = false;
        this.values.clear();
        this.addInputField();
      }
    });

    this.form.get('field').valueChanges.subscribe(() => {
      this.conditionTypeOptions = Object.entries(SapRuleConditionTypeNames);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']?.currentValue) {
      this.displayFilters = this.filters.map((f) => ({
        value: conditionValuesToString(f, SapParameterRuleValueType.TEXT),
        ...f,
        orig: f,
      }));
    }
    if (changes['parameterType'] || changes['parameterSubType']) {
      this.loadFieldsForType(this.parameterType, this.parameterSubType);
    }
  }

  onAddCondition(): void {
    const allInputs = [
      { input: this.form.get('conditionType'), validators: [Validators.required] },
      { input: this.form.get('field'), validators: [Validators.required] },
    ];
    for (const control of this.values.controls) {
      allInputs.push({ input: control.get('value'), validators: [Validators.required] });
    }

    allInputs.forEach((i) => {
      i.input.addValidators(i.validators);
      i.input.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });

    if (!this.isFormValid()) {
      this.form.markAllAsTouched();
      return;
    }

    const field = this.form.get('field').value;
    const values = this.values.getRawValue().map((v) => v['value']);
    const condition = { id: null, values, field, conditionType: this.conditionType };
    this.filtersChanged.emit([...(this.filters ?? []), condition]);
    this.values.clear();
    this.addInputField();
    this.form.reset();
    allInputs.forEach((i) => {
      i.input.removeValidators(i.validators);
      i.input.updateValueAndValidity();
    });
  }

  addInputField(): void {
    this.values.push(this.createInputField());
  }

  removeInputField(index: number): void {
    this.values.removeAt(index);
  }

  onDelete(row: any): void {
    this.filtersChanged.emit(this.filters.filter((c) => c !== row.orig));
  }

  private loadFieldsForType(type: string, subType?: string): void {
    if (type === SapParameterType.SAP_UME) {
      const fieldList = HanaAuditRulesFieldSourceMap[SapParameterType.SAP_UME]?.['DEFAULT'] || [];
      this.fieldNames = fieldList.map((field) => [field, HanaAuditRulesFieldNames[field]]);
      return;
    }

    if (type === SapParameterType.HANA_DATABASE) {
      const subTypeKey = subType === SapParameterSubType.ACCESS_RULES ? 'ACCESS_RULES' : 'AUDIT_RULES';
      const fieldList = HanaAuditRulesFieldSourceMap[SapParameterType.HANA_DATABASE]?.[subTypeKey] || [];
      this.fieldNames = fieldList.map((field) => [field, HanaAuditRulesFieldNames[field]]);
    }
  }

  private createInputField(): FormGroup {
    return this.formBuilder.group({ value: [''] });
  }

  private isFormValid(): boolean {
    if (!this.form.get('conditionType').valid) return false;
    for (const control of this.values.controls) {
      control.updateValueAndValidity();
      if (!control.get('value').valid) return false;
    }
    return true;
  }
}
