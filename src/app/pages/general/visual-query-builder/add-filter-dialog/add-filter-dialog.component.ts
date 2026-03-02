import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTagModule } from 'ng-zorro-antd/tag';

export interface FilterDialogData {
  fieldName: string;
  fieldType: string;
  tableName: string;
  filterType: 'extraction' | 'rule';
  availableFields?: any[];
  formattedFieldName?: string;
}

@Component({
  selector: 'app-add-filter-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzFormModule, NzInputModule, NzSelectModule, NzButtonModule,
    NzIconModule, NzDividerModule, NzDatePickerModule, NzTagModule,
  ],
  templateUrl: './add-filter-dialog.component.html',
  styleUrls: ['./add-filter-dialog.component.scss'],
})
export class AddFilterDialogComponent implements OnInit {
  filterForm: FormGroup;
  operators: string[] = [];
  functions: any[] = [];
  showFunctionParams = false;
  paramCount = 0;
  availableFields: any[] = [];
  showFieldSelector = false;
  showValuePanel = false;
  valueList: string[] = [];
  newValue = '';

  stringOperators = [
    'Equal', 'Not Equal', 'In', 'Not In', 'Begins With', 'Not Begins With',
    'Contains', 'Not Contains', 'Ends With', 'Not Ends With',
    'Is Empty', 'Is Not Empty', 'Is Null', 'Is Not Null',
  ];
  numberOperators = [
    'Equal', 'Not Equal', 'In', 'Not In', 'Less', 'Less or Equal',
    'Greater', 'Greater or Equal', 'Between', 'Not Between', 'Is Null', 'Is Not Null',
  ];
  dateOperators = [
    'Equal', 'Not Equal', 'In', 'Not In', 'Less', 'Less or Equal',
    'Greater', 'Greater or Equal', 'Between', 'Not Between', 'Is Null', 'Is Not Null',
  ];

  dateFunctions = [
    { value: '', label: 'No Function', params: 0 },
    { value: 'current_date', label: 'Current Date', params: 0 },
    { value: 'current_date-1', label: 'Yesterday', params: 0 },
    { value: 'current_date-n', label: 'N Days Ago', params: 1 },
  ];
  stringFunctions = [
    { value: '', label: 'No Function', params: 0 },
    { value: 'trim', label: 'trim', params: 0 },
    { value: 'lower', label: 'lower case', params: 0 },
    { value: 'upper', label: 'upper case', params: 0 },
    { value: 'substr', label: 'substring', params: 2 },
    { value: 'left', label: 'left characters', params: 1 },
    { value: 'right', label: 'right characters', params: 1 },
    { value: 'lpad', label: 'left padding', params: 2 },
    { value: 'rpad', label: 'right padding', params: 2 },
    { value: 'fieldComp', label: 'field compare', params: 1 },
    { value: '~#MC', label: 'MC', params: 0 },
  ];
  numberFunctions = [{ value: '', label: 'No Function', params: 0 }];

  constructor(
    private fb: FormBuilder,
    public modal: NzModalRef,
    @Inject(NZ_MODAL_DATA) public data: FilterDialogData,
  ) {
    this.filterForm = this.fb.group({
      field: [data.fieldName, Validators.required],
      operator: ['Equal', Validators.required],
      value: ['', Validators.required],
      value2: [''],
      function: [''],
      param1: [''], param2: [''], param3: [''], param4: [''], param5: [''],
      logicalOperator: ['AND'],
    });
  }

  ngOnInit(): void {
    if (this.data.filterType === 'rule' && this.data.availableFields?.length) {
      this.availableFields = this.data.availableFields;
      this.showFieldSelector = true;
      const current = this.availableFields.find(f => f.name === this.data.fieldName && f.tableName === this.data.tableName);
      if (current) this.filterForm.patchValue({ field: current.name });
    }
    this.setupOperators();
    this.setupFunctions();
    this.setupFormListeners();
  }

  onFieldChange(value: any): void {
    const sel = this.availableFields.find(f => f.name === value);
    if (sel) {
      this.data.fieldType = sel.type;
      this.data.fieldName = sel.name;
      this.data.tableName = sel.tableName;
      this.data.formattedFieldName = sel.formattedFieldName;
      this.setupOperators();
      this.setupFunctions();
      this.filterForm.patchValue({ operator: 'Equal', function: '', value: '', value2: '' });
    }
  }

  setupOperators(): void {
    switch (this.getFieldBaseType()) {
      case 'number': this.operators = this.numberOperators; break;
      case 'date': this.operators = this.dateOperators; break;
      default: this.operators = this.stringOperators;
    }
  }

  setupFunctions(): void {
    switch (this.getFieldBaseType()) {
      case 'number': this.functions = this.numberFunctions; break;
      case 'date': this.functions = this.dateFunctions; break;
      default: this.functions = this.stringFunctions;
    }
  }

  setupFormListeners(): void {
    this.filterForm.get('operator')?.valueChanges.subscribe(op => {
      if (op === 'Between' || op === 'Not Between') {
        this.filterForm.get('value2')?.setValidators([Validators.required]);
      } else {
        this.filterForm.get('value2')?.clearValidators();
      }
      this.filterForm.get('value2')?.updateValueAndValidity();
      if (['Is Null', 'Is Not Null', 'Is Empty', 'Is Not Empty'].includes(op)) {
        this.filterForm.get('value')?.clearValidators();
        this.filterForm.get('value')?.setValue(null);
      } else {
        this.filterForm.get('value')?.setValidators([Validators.required]);
      }
      this.filterForm.get('value')?.updateValueAndValidity();
    });
    this.filterForm.get('function')?.valueChanges.subscribe(fn => {
      const sel = this.functions.find(f => f.value === fn);
      this.paramCount = sel?.params || 0;
      this.showFunctionParams = this.paramCount > 0;
      for (let i = 1; i <= 5; i++) {
        const c = this.filterForm.get('param' + i);
        if (i <= this.paramCount) { c?.setValidators([Validators.required]); if (!c?.value) c?.setValue(''); }
        else { c?.clearValidators(); c?.setValue(''); }
        c?.updateValueAndValidity();
      }
      const vc = this.filterForm.get('value');
      if (['current_date', 'current_date-1', 'current_date-n'].includes(fn)) {
        vc?.setValue(''); vc?.disable({ emitEvent: false });
      } else { vc?.enable({ emitEvent: false }); }
    });
  }

  getFieldBaseType(): string {
    const t = this.data.fieldType?.toUpperCase();
    if (['NUMC', 'DEC', 'CURR', 'QUAN', 'INT4', 'INT8'].includes(t)) return 'number';
    if (['DATS', 'TIMS'].includes(t)) return 'date';
    return 'string';
  }

  onCancel(): void { this.modal.close(); }

  onAdd(): void {
    if (!this.filterForm.valid) return;
    const v = this.filterForm.value;
    const rule: any = { field: this.data.fieldName, operator: v.operator, value: v.value, type: this.getFieldBaseType() };
    if (this.isDateField()) {
      if (v.value instanceof Date) rule.value = this.formatDateForSAP(v.value);
      if (v.value2 instanceof Date) rule.value2 = this.formatDateForSAP(v.value2);
    }
    if ((v.operator === 'Between' || v.operator === 'Not Between') && v.value2) {
      if (!rule.value2) rule.value2 = v.value2;
    }
    if (v.function) {
      for (let i = 1; i <= 5; i++) { if (v['param' + i]) rule['param' + i] = v['param' + i]; }
      rule.function = this.buildFunctionString(v.function, v);
      if (v.function === 'current_date-n' && v.param1) rule.dateOffsetN = parseInt(v.param1, 10);
    }
    this.modal.close({ filterType: this.data.filterType, rule, logicalOperator: v.logicalOperator });
  }

  buildFunctionString(funcName: string, formValue: any): string {
    const sel = this.functions.find(f => f.value === funcName);
    const cnt = sel?.params || 0;
    if (cnt === 0) return funcName;
    const args: string[] = [];
    for (let i = 1; i <= cnt; i++) { const val = formValue['param' + i]; if (val !== undefined && val !== '') args.push(val); }
    return args.length > 0 ? `${funcName}(${args.join(',')})` : funcName;
  }

  getTitle(): string {
    const name = this.data.formattedFieldName || this.availableFields?.find(f => f.name === this.data.fieldName && f.tableName === this.data.tableName)?.formattedFieldName || this.data.fieldName;
    return this.data.filterType === 'extraction' ? `Add Extraction Filter for ${name}` : `Add Rule Filter for ${name}`;
  }

  showValue(): boolean {
    const op = this.filterForm.get('operator')?.value;
    return !['Is Null', 'Is Not Null', 'Is Empty', 'Is Not Empty'].includes(op);
  }

  showValue2(): boolean {
    const op = this.filterForm.get('operator')?.value;
    return op === 'Between' || op === 'Not Between';
  }

  openValuePanel(): void {
    const cur = this.filterForm.get('value')?.value;
    this.valueList = cur ? cur.split(',').map((v: string) => v.trim()).filter((v: string) => v) : [];
    this.newValue = '';
    this.showValuePanel = true;
  }

  addValue(): void { if (this.newValue?.trim()) { this.valueList.push(this.newValue.trim()); this.newValue = ''; } }
  removeValue(i: number): void { this.valueList.splice(i, 1); }
  clearAllValues(): void { this.valueList = []; this.newValue = ''; }

  async copyFromClipboard(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { this.valueList.push(...text.split(/\r?\n/).map(v => v.trim()).filter(v => v)); }
    } catch { /* clipboard not available */ }
  }

  insertValues(): void { this.filterForm.patchValue({ value: this.valueList.join(', ') }); this.showValuePanel = false; }
  cancelValuePanel(): void { this.showValuePanel = false; this.newValue = ''; }
  shouldShowValueButton(): boolean { const op = this.filterForm.get('operator')?.value; return op === 'In' || op === 'Not In'; }
  isDateField(): boolean { return this.getFieldBaseType() === 'date'; }

  formatDateForSAP(date: Date): string {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  getFormattedValue(controlName: string): string {
    const v = this.filterForm.get(controlName)?.value;
    if (!v) return '';
    if (this.isDateField() && v instanceof Date) return this.formatDateForSAP(v);
    return String(v);
  }

  getFieldDisplayName(): string {
    return this.data.formattedFieldName || this.availableFields?.find(f => f.name === this.data.fieldName && f.tableName === this.data.tableName)?.formattedFieldName || this.data.fieldName;
  }
}
