import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { conditionValuesToString, SapRuleConditionType, SapRuleConditionTypeNames } from '../../../css-shared/css-shared.model';
import {
  SapAuditEvent,
  SapAuditLogField,
  SapAuditLogFieldNames,
  SapAuditMatchMode,
  SapAuditRuleCondition,
} from '../../sap-audit-log.model';
import { WhitelistValuesModalComponent } from './whitelist-values-modal.component';
import { map, Observable, startWith } from 'rxjs';
import { NotificationService } from '../../../../../core/services/notification.service';

interface WhitelistEntry {
  id: number;
  name: string;
  type: string;
  field: string;
  pattern: string;
  description: string;
  valueList: string;
  createdDate: string | null;
  modifiedDate: string;
  active: boolean;
}

@Component({
  standalone: false,
  selector: 'app-audit-rule-filter-advanced',
  templateUrl: './audit-rule-filter-advanced.component.html',
})
export class AuditRuleFilterAdvancedComponent implements OnInit, OnChanges {
  @Input() clients: Array<{ id: number; name: string; clientNo: string }> = [];
  @Input() matchMode!: SapAuditMatchMode;
  @Input() filters: SapAuditRuleCondition[] = [];
  @Input() events: SapAuditEvent[] = [];
  @Output() filtersChanged = new EventEmitter<SapAuditRuleCondition[]>();

  MatchMode = SapAuditMatchMode;
  displayFilters: (SapAuditRuleCondition & { orig: SapAuditRuleCondition; value: string; isWhiteList?: boolean; whiteListValues?: string })[] = [];
  canAddValues = false;
  conditionTypeOptions = Object.entries(SapRuleConditionTypeNames);
  sapRuleConditionTypeNames = SapRuleConditionTypeNames;
  fieldNames = Object.entries(SapAuditLogFieldNames);

  filteredOptions!: Observable<string[]>;
  preSavedValues: WhitelistEntry[] = [];

  private conditionType!: SapRuleConditionType;

  form!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private nzModal: NzModalService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']?.currentValue) {
      this.displayFilters = this.filters.map((f) => {
        let displayValue: string;
        let isWhiteList = false;
        let whiteListValues = '';

        if (f.whiteList) {
          isWhiteList = true;
          const preSavedEntry = this.preSavedValues.find((entry) => entry.id === f.whiteList!.id);
          displayValue = preSavedEntry ? preSavedEntry.name : `WhiteList ${f.whiteList.id}`;
          whiteListValues = preSavedEntry ? preSavedEntry.valueList : f.whiteList.valueList || '';
        } else {
          displayValue = conditionValuesToString(f, 'TEXT');
        }

        return { value: displayValue, isWhiteList, whiteListValues, ...f, orig: f };
      });
    }
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      commaSeparatedValues: [''],
      conditionType: [''],
      field: [''],
    });

    this.form.get('conditionType')!.valueChanges.subscribe((value) => {
      const type: SapRuleConditionType = SapRuleConditionType[value as keyof typeof SapRuleConditionType];
      this.conditionType = type;
      this.canAddValues = false;

      if (
        [
          SapRuleConditionType.CONTAINS,
          SapRuleConditionType.STARTS_WITH,
          SapRuleConditionType.ENDS_WITH,
          SapRuleConditionType.IN,
          SapRuleConditionType.NOT_IN,
        ].includes(type)
      ) {
        this.canAddValues = true;
        this.form.get('commaSeparatedValues')!.setValidators([Validators.required]);
      } else if (type === SapRuleConditionType.BETWEEN || type === SapRuleConditionType.NOT_BETWEEN) {
        this.canAddValues = true;
        this.form.get('commaSeparatedValues')!.setValidators([Validators.required, this.exactlyTwoValuesValidator]);
      } else {
        this.form.get('commaSeparatedValues')!.setValidators([Validators.required]);
      }
      this.form.get('commaSeparatedValues')!.updateValueAndValidity();
    });

    this.form.get('field')!.valueChanges.subscribe((field) => {
      if (field === SapAuditLogField.EVENT || field === SapAuditLogField.CLIENT_NO) {
        this.conditionTypeOptions = [
          [SapRuleConditionType.EQUALS, SapRuleConditionTypeNames[SapRuleConditionType.EQUALS]],
          [SapRuleConditionType.IN, SapRuleConditionTypeNames[SapRuleConditionType.IN]],
        ];
      } else {
        this.conditionTypeOptions = Object.entries(SapRuleConditionTypeNames);
      }
    });

    this.filteredOptions = this.form.get('commaSeparatedValues')!.valueChanges.pipe(
      startWith(''),
      map((value) => {
        if (typeof value === 'object') return [];
        if (!this.events || !this.clients) return [];
        const currentValue = value ? value.split(',').pop()?.trim() || '' : '';
        if (currentValue.length < 1) return [];
        const field = this.form.get('field')!.value;
        if (field === SapAuditLogField.EVENT) {
          return this.events
            .filter((o) => o.eventText.toLowerCase().includes(currentValue.toLowerCase()))
            .map((e) => e.eventText);
        } else if (field === SapAuditLogField.CLIENT_NO) {
          return this.clients
            .filter((c) => (c.name + c.clientNo).toLowerCase().includes(currentValue.toLowerCase()))
            .map((c) => `${c.name} ${c.clientNo}`);
        }
        return [];
      })
    );
  }

  onAddCondition(): void {
    const allInputs = [
      { input: this.form.get('conditionType')!, validators: [Validators.required] },
      { input: this.form.get('field')!, validators: [Validators.required] },
      { input: this.form.get('commaSeparatedValues')!, validators: [Validators.required] },
    ];

    allInputs.forEach((i) => {
      i.input.addValidators(i.validators);
      i.input.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });

    if (!this.isFormValid()) {
      this.form.markAllAsTouched();
    } else {
      const field = this.form.get('field')!.value;
      const commaSeparatedInput = this.form.get('commaSeparatedValues')!.value || '';
      const selectedPreSavedEntry = (this.form.get('commaSeparatedValues') as any)['selectedPreSavedEntry'];

      const condition: any = {
        id: null,
        field,
        conditionType: this.conditionType,
        matchMode: this.matchMode,
      };

      if (selectedPreSavedEntry?.id) {
        condition.whiteList = { id: selectedPreSavedEntry.id, valueList: selectedPreSavedEntry.valueList };
        condition.values = null;
      } else {
        const inputValues = commaSeparatedInput.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
        const values: string[] = [];
        for (const inputValue of inputValues) {
          if (field === SapAuditLogField.EVENT) {
            const event = this.events?.find((e) => e.eventText === inputValue);
            values.push(event ? event.key : inputValue);
          } else if (field === SapAuditLogField.CLIENT_NO) {
            const client = this.clients?.find((c) => inputValue.includes(c.clientNo));
            if (!client) {
              this.notificationService.error(`No client found for: ${inputValue}`);
              return;
            }
            values.push(client.clientNo);
          } else {
            values.push(inputValue);
          }
        }
        condition.values = values;
      }

      this.filtersChanged.emit([...(this.filters ?? []), condition]);
      this.form.reset();
      delete (this.form.get('commaSeparatedValues') as any)['selectedPreSavedEntry'];

      allInputs.forEach((i) => {
        i.input.removeValidators(i.validators);
        i.input.updateValueAndValidity();
      });
    }
  }

  onDelete(row: { orig: SapAuditRuleCondition }): void {
    this.filtersChanged.emit(this.filters.filter((c) => c !== row.orig));
  }

  onOptionSelected(selectedOption: any): void {
    if (selectedOption && typeof selectedOption === 'object' && selectedOption.name) {
      this.form.get('commaSeparatedValues')!.setValue(selectedOption.name);
      (this.form.get('commaSeparatedValues') as any)['selectedPreSavedEntry'] = selectedOption;
    }
  }

  showWhiteListModal(condition: any): void {
    const rawValues = condition.whiteListValues || '';
    const formattedValues = rawValues.split(',').map((v: string) => v.trim()).join('\n');
    this.nzModal.create({
      nzTitle: 'WhiteList Values',
      nzContent: WhitelistValuesModalComponent,
      nzData: { values: formattedValues || 'No values available' },
      nzWidth: '40vw',
      nzBodyStyle: { maxHeight: '80vh', overflow: 'auto' },
      nzClassName: 'updated-modal',
      nzFooter: null,
    });
  }

  private isFormValid(): boolean {
    return (
      this.form.get('conditionType')!.valid &&
      this.form.get('field')!.valid &&
      this.form.get('commaSeparatedValues')!.valid
    );
  }

  private exactlyTwoValuesValidator = (control: any) => {
    const value = control.value || '';
    const values = value.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
    return values.length === 2 ? null : { exactlyTwoValues: true };
  };
}
