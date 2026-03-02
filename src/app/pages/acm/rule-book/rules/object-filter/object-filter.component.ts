import { Component, OnInit, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

export interface ObjectFilterData {
  authObjects: string[];
  authFields: string[];
  values: string[];
  matchMode: 'AND' | 'OR';
}

@Component({
  standalone: false,
  selector: 'app-object-filter',
  templateUrl: './object-filter.component.html',
  styleUrls: ['./object-filter.component.scss'],
})
export class ObjectFilterComponent implements OnInit {
  authObjectsText = '';
  authFieldsText = '';
  valuesText = '';
  matchMode: 'AND' | 'OR' = 'OR';

  authObjects: string[] = [];
  authFields: string[] = [];
  values: string[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) private data: ObjectFilterData,
    private modalRef: NzModalRef,
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.authObjects = this.data.authObjects || [];
      this.authFields = this.data.authFields || [];
      this.values = this.data.values || [];
      this.matchMode = this.data.matchMode || 'OR';
      this.authObjectsText = this.authObjects.join('\n');
      this.authFieldsText = this.authFields.join('\n');
      this.valuesText = this.values.join('\n');
    }
  }

  onAuthObjectsChange(): void {
    this.authObjects = this.parseValues(this.authObjectsText);
  }

  onAuthFieldsChange(): void {
    this.authFields = this.parseValues(this.authFieldsText);
  }

  onValuesChange(): void {
    this.values = this.parseValues(this.valuesText);
  }

  get hasFilters(): boolean {
    return this.authObjects.length > 0 || this.authFields.length > 0 || this.values.length > 0;
  }

  get totalFilterCount(): number {
    return this.authObjects.length + this.authFields.length + this.values.length;
  }

  applyFilter(): void {
    this.modalRef.close({
      authObjects: this.authObjects,
      authFields: this.authFields,
      values: this.values,
      matchMode: this.matchMode,
    } as ObjectFilterData);
  }

  clearAll(): void {
    this.authObjectsText = '';
    this.authFieldsText = '';
    this.valuesText = '';
    this.authObjects = [];
    this.authFields = [];
    this.values = [];
    this.matchMode = 'OR';
  }

  close(): void {
    this.modalRef.close();
  }

  private parseValues(text: string): string[] {
    if (!text.trim()) return [];
    const items = text.split(/[\n,;\t]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    return [...new Set(items)];
  }
}
