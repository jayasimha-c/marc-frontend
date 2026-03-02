import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { SapParameterService } from '../sap-parameters.service';

interface AbapRule {
  id: number;
  name: string;
  ruleName?: string;
  ruleDescription?: string;
}

@Component({
  standalone: false,
  selector: 'app-search-select',
  templateUrl: './search-select.component.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: SearchSelectComponent, multi: true }],
})
export class SearchSelectComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() placeholder = 'Search SAP ABAP Rules...';
  @Input() disabled = false;
  @Input() rule: any;
  @Output() selectionChange = new EventEmitter<AbapRule>();

  searchControl = new FormControl<AbapRule | null>(null);
  items: AbapRule[] = [];
  isLoading = false;
  selectedItem: AbapRule | null = null;

  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(private sapParameterService: SapParameterService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rule']?.currentValue) {
      const ruleData = changes['rule'].currentValue;
      if (ruleData.ruleName && ruleData.ruleDescription) {
        this.selectedItem = {
          id: ruleData.id,
          name: ruleData.ruleName,
          ruleName: ruleData.ruleName,
          ruleDescription: ruleData.ruleDescription,
        };
        this.searchControl.setValue(this.selectedItem);
      }
    }
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => {
        if (typeof value !== 'string') {
          return of([]);
        }
        return this.loadItems(value.length >= 2 ? value : '');
      })
    ).subscribe();
  }

  displayFn = (option: AbapRule): string => {
    if (!option) {
      return '';
    }
    if (option.ruleDescription) {
      return `${option.ruleName || option.name} - ${option.ruleDescription}`;
    }
    return option.ruleName || option.name;
  };

  onOptionSelected(selectedRule: AbapRule): void {
    if (selectedRule) {
      this.selectedItem = selectedRule;
      this.onChange(selectedRule.id);
      this.selectionChange.emit(selectedRule);
    }
  }

  writeValue(obj: any): void {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.searchControl.disable();
    } else {
      this.searchControl.enable();
    }
  }

  private loadItems(search: string) {
    this.isLoading = true;
    return this.sapParameterService.getAbapRules(0, 20, search).pipe(
      map((response: any) => {
        this.isLoading = false;
        this.items = (response.data?.rows || response.rows || []).map((rule: any) => ({
          id: rule.id,
          name: rule.ruleName || rule.name,
          ruleName: rule.ruleName,
          ruleDescription: rule.ruleDescription,
        }));
        return this.items;
      }),
      catchError(() => {
        this.isLoading = false;
        this.items = [];
        return of([]);
      })
    );
  }
}
