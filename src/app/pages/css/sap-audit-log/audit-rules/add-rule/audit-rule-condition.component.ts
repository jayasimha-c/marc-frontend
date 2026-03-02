import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { intervalConverter } from '../../sap-audit-log.model';

@Component({
  standalone: false,
  selector: 'app-audit-rule-condition',
  templateUrl: './audit-rule-condition.component.html',
})
export class AuditRuleConditionComponent implements OnChanges, OnInit {
  @Input() conditions: { interval: number; threshhold: number } = { interval: 0, threshhold: 0 };
  @Output() conditionChanged = new EventEmitter<{ interval: number; threshhold: number }>();
  @Output() exposeForm = new EventEmitter<{ form: FormGroup; open: () => void }>();

  form!: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      timeUnit: ['', Validators.required],
      interval: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      threshhold: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    });

    this.form.valueChanges.subscribe((values) => {
      const intervalRaw = values['interval'];
      const threshholdRaw = values['threshhold'];
      const timeUnit = values['timeUnit'];

      const interval = intervalRaw === '' || intervalRaw === null ? null : parseInt(intervalRaw, 10);
      const threshhold = threshholdRaw === '' || threshholdRaw === null ? null : parseInt(threshholdRaw, 10);

      if (this.form.valid && interval !== null && threshhold !== null) {
        let ms = 0;
        switch (timeUnit) {
          case 'minutes': ms = interval * 60000; break;
          case 'hours': ms = interval * 3600000; break;
          case 'days': ms = interval * 86400000; break;
        }
        this.conditionChanged.emit({ interval: ms, threshhold });
      }
    });

    this.exposeForm.emit({ form: this.form, open: () => {} });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conditions']?.currentValue) {
      const converted = intervalConverter(this.conditions.interval);
      this.form.patchValue(
        { threshhold: this.conditions.threshhold, timeUnit: converted.unit, interval: converted.value.toString() },
        { emitEvent: false }
      );
    }
  }
}
