import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SapAuditLogField, SapAuditLogFieldNames } from '../../sap-audit-log.model';

@Component({
  standalone: false,
  selector: 'app-audit-rule-grouping',
  templateUrl: './audit-rule-grouping.component.html',
})
export class AuditRuleGroupingComponent implements OnInit, OnChanges {
  @Input() grouping: string[] = [];
  @Output() groupingChanged = new EventEmitter<string[]>();

  fields = Object.values(SapAuditLogField);
  fieldNames = SapAuditLogFieldNames;

  form!: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  private initForm(): void {
    this.form = this.formBuilder.group(
      Object.fromEntries(this.fields.map((field) => [field, false]))
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['grouping']?.currentValue) {
      changes['grouping'].currentValue.forEach((value: string) => {
        const control = this.form.get(value);
        if (control) control.setValue(true);
      });
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.form.valueChanges.subscribe((values) => {
      const fields = Object.keys(values).filter((field) => values[field] === true);
      this.groupingChanged.emit(fields);
    });
  }
}
