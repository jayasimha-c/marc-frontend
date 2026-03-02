import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SapRuleConditionType } from '../../../css-shared/css-shared.model';
import {
  SapAuditEvent,
  SapAuditLogField,
  SapAuditMatchMode,
  SapAuditRuleCondition,
} from '../../sap-audit-log.model';
import { map, Observable, startWith } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-audit-rule-filter',
  templateUrl: './audit-rule-filter.component.html',
})
export class AuditRuleFilterComponent implements OnInit, OnChanges {
  @Input() clients: Array<{ id: number; name: string; clientNo: string }> = [];
  @Input() events: SapAuditEvent[] = [];
  @Input() filters: SapAuditRuleCondition[] = [];
  @Output() filtersChanged = new EventEmitter<SapAuditRuleCondition[]>();

  hourOptions = this.generateHourOptions();
  filteredOptions!: Observable<string[]>;

  form!: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  private initForm(): void {
    this.form = this.formBuilder.group({
      event: [''],
      client: [''],
      message: [''],
      fromHour: [''],
      toHour: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['filters'] || changes['events']) && this.filters && this.events) {
      const formObject: any = {};
      for (const filter of this.filters) {
        switch (filter.field) {
          case SapAuditLogField.CLIENT_NO:
            const client = this.clients?.find((c) => c.clientNo === filter.values[0]);
            if (client) formObject['client'] = client.id;
            break;
          case SapAuditLogField.TIME:
            formObject['fromHour'] = parseInt(filter.values[0]);
            formObject['toHour'] = parseInt(filter.values[1]);
            break;
          case SapAuditLogField.EVENT:
            formObject['event'] = filter.values[0];
            break;
        }
      }
      this.form.patchValue(formObject, { emitEvent: false });
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.filteredOptions = this.form.get('event')!.valueChanges.pipe(
      startWith(''),
      map((value) => {
        const name = typeof value === 'string' ? value : '';
        return this.filterOptions(name);
      })
    );

    this.form.valueChanges.subscribe((values) => {
      const conditions: SapAuditRuleCondition[] = [];

      if (values.event) {
        const event = this.events?.find((e) => e.eventText === values.event);
        conditions.push({
          id: null,
          conditionType: SapRuleConditionType.EQUALS,
          values: [event ? event.key : values.event],
          field: SapAuditLogField.EVENT,
          matchMode: SapAuditMatchMode.NORMAL,
        });
      }

      if (values.client) {
        const client = this.clients?.find((c) => c.id === parseInt(values.client));
        if (client) {
          conditions.push({
            id: null,
            conditionType: SapRuleConditionType.EQUALS,
            values: [client.clientNo],
            field: SapAuditLogField.CLIENT_NO,
            matchMode: SapAuditMatchMode.NORMAL,
          });
        }
      }

      if (values.message) {
        conditions.push({
          id: null,
          conditionType: SapRuleConditionType.CONTAINS,
          values: [values.message],
          field: SapAuditLogField.MESSAGE,
          matchMode: SapAuditMatchMode.NORMAL,
        });
      }

      if (values.fromHour !== '' && values.fromHour !== null && values.toHour !== '' && values.toHour !== null) {
        const fromHour = values.fromHour == null || values.fromHour === '' ? '0' : String(values.fromHour);
        const toHour = values.toHour == null || values.toHour === '' ? '24' : String(values.toHour);
        conditions.push({
          id: null,
          conditionType: SapRuleConditionType.BETWEEN,
          values: [fromHour, toHour],
          field: SapAuditLogField.TIME,
          matchMode: SapAuditMatchMode.NORMAL,
        });
      }

      this.filtersChanged.emit(conditions);
    });
  }

  filterOptions(value: string): string[] {
    if (!this.events) return [];
    const filterValue = value.toLowerCase();
    return this.events
      .filter((option) => option.eventText.toLowerCase().includes(filterValue))
      .map((e) => e.eventText);
  }

  generateHourOptions(): Array<{ name: string; value: number }> {
    const options: Array<{ name: string; value: number }> = [];
    for (let hour = 0; hour < 24; hour++) {
      const ampm = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      options.push({ name: `${displayHour} ${ampm}`, value: hour });
    }
    return options;
  }
}
