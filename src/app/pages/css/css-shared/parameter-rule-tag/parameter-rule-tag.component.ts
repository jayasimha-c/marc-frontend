import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { RuleTag } from '../css-shared.model';
import { CssSharedService } from '../css-shared.service';

@Component({
  standalone: false,
  selector: 'parameter-rule-tag-component',
  templateUrl: './parameter-rule-tag.component.html',
})
export class ParameterRuleTagComponent implements OnInit {
  private static DEFAULT_TAG: RuleTag = { id: null, name: 'General' };

  @Input() selectedTags: RuleTag[] = [];
  @Input() noAdding = false;
  @Input() addDefaultTag = false;
  @Output() selectedTagsChanged = new EventEmitter<RuleTag[]>();

  tagDropdown = new FormControl<string | RuleTag>('', [this.singleSelectionValidator()]);
  tagOptions: RuleTag[] = [];
  filteredOptions!: Observable<RuleTag[]>;

  constructor(private cssSharedService: CssSharedService) {}

  singleSelectionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (typeof value === 'string') {
        return null;
      }
      return { multipleSelected: true };
    };
  }

  ngOnInit(): void {
    this.getTags();
    this.filteredOptions = this.tagDropdown.valueChanges.pipe(
      startWith(''),
      map((value) => {
        const name = typeof value === 'string' ? value : value?.name;
        return this.filter(name as string);
      })
    );
  }

  removeTag(tag: RuleTag): void {
    this.tagOptions.push(tag);
    this.tagDropdown.setValue(this.tagDropdown.getRawValue());
    this.selectedTagsChanged.emit(this.selectedTags.filter((v) => v.name !== tag.name));
  }

  onOptionSelected(event: any): void {
    let selectedValue: string = event.option.value;
    if (selectedValue.startsWith('Add "')) {
      selectedValue = selectedValue.replace('Add ', '');
      selectedValue = selectedValue.replaceAll('"', '');
    }
    if (selectedValue === '') return;

    let tag = this.tagOptions.find((v) => v.name === selectedValue);
    if (tag == null) tag = { id: null, name: selectedValue };
    this.tagOptions = this.tagOptions.filter((t) => t.name !== tag!.name);
    this.tagDropdown.reset();
    this.selectedTagsChanged.emit([...this.selectedTags, tag]);
  }

  private filter(value: string): RuleTag[] {
    if (value == null || value === '') {
      return this.tagOptions.slice().sort((a, b) => a.name.localeCompare(b.name));
    }
    const filterValue = value.toLowerCase();
    const matchingOptions = this.tagOptions.filter((option) =>
      option.name.toLowerCase().includes(filterValue)
    );

    if (!this.noAdding) {
      if (value && !this.tagOptions.some((option) => option.name.toLowerCase() === filterValue)) {
        return [{ id: null, name: `Add "${value}"` }, ...matchingOptions].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      }
    }
    return matchingOptions.sort((a, b) => a.name.localeCompare(b.name));
  }

  private getTags(): void {
    this.cssSharedService.getAllTags().subscribe((resp) => {
      const tmpOptions = this.selectedTags.map((tag) => tag.name);
      if (this.addDefaultTag) {
        let defaultTag = resp.data?.rows?.find(
          (tag: RuleTag) => tag.name === ParameterRuleTagComponent.DEFAULT_TAG.name
        );
        if (defaultTag == null) {
          defaultTag = ParameterRuleTagComponent.DEFAULT_TAG;
          this.selectedTagsChanged.emit([defaultTag]);
          tmpOptions.push(defaultTag.name);
        }
      }
      const rows = resp.data?.rows || resp.data || [];
      this.tagOptions = (Array.isArray(rows) ? rows : []).filter(
        (tag: RuleTag) => !tmpOptions.includes(tag.name)
      );
      this.tagDropdown.setValue('');
    });
  }
}
