import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Location } from '@angular/common';

export interface TitlePanelFilter {
  key: string;
  label: string;
  options: { value: any; label: string }[];
  placeholder?: string;
}

export interface TitlePanelDateRange {
  startDate: string;
  endDate: string;
}

@Component({
  standalone: false,
  selector: 'app-title-panel',
  templateUrl: './title-panel.component.html',
  styleUrls: ['./title-panel.component.scss']
})
export class TitlePanelComponent implements OnChanges {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showBack = false;

  @Input() showDateRange = false;
  @Input() datePresets: { label: string; days: number }[] = [];
  @Input() initialPreset: number | null = null;

  @Input() filters: TitlePanelFilter[] = [];

  @Output() backClicked = new EventEmitter<void>();
  @Output() dateChanged = new EventEmitter<TitlePanelDateRange>();
  @Output() presetChanged = new EventEmitter<number>();
  @Output() filtersApplied = new EventEmitter<Record<string, any>>();
  @Output() filterCleared = new EventEmitter<string>();
  @Output() allFiltersCleared = new EventEmitter<void>();

  filterPanelOpen = false;
  activePreset: number | null = null;
  dateRange: [Date, Date] | null = null;
  filterValues: Record<string, any> = {};
  activeFilters: { key: string; label: string; displayValue: string }[] = [];

  constructor(private location: Location) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) this.syncFilterValues();
    if (changes['initialPreset'] && this.initialPreset !== null && !this.activePreset) {
      this.setPreset(this.initialPreset);
    }
  }

  onBack(): void {
    this.backClicked.emit();
    if (!this.backClicked.observed) this.location.back();
  }

  onDateRangeChange(result: Date[]): void {
    if (result?.length === 2 && result[0] && result[1]) {
      this.activePreset = null;
      this.dateChanged.emit({
        startDate: this.formatDate(result[0]),
        endDate: this.formatDate(result[1])
      });
    }
  }

  onPreset(preset: { label: string; days: number }): void {
    this.setPreset(preset.days);
  }

  setPreset(days: number): void {
    this.activePreset = days;
    const end = new Date();
    const start = new Date();
    if (days > 0) {
      start.setDate(end.getDate() - days);
      this.dateRange = [start, end];
      this.presetChanged.emit(days);
      this.dateChanged.emit({
        startDate: this.formatDate(start),
        endDate: this.formatDate(end)
      });
    } else {
      this.dateRange = null;
      this.presetChanged.emit(days);
      this.dateChanged.emit({ startDate: '', endDate: '' });
    }
  }

  toggleFilterPanel(): void {
    this.filterPanelOpen = !this.filterPanelOpen;
  }

  closeFilterPanel(): void {
    this.filterPanelOpen = false;
  }

  applyFilters(): void {
    const values: Record<string, any> = {};
    this.activeFilters = [];

    this.filters.forEach(f => {
      const val = this.filterValues[f.key];
      values[f.key] = val ?? null;
      if (val != null) {
        const option = f.options.find(o => o.value === val);
        this.activeFilters.push({
          key: f.key, label: f.label,
          displayValue: option ? option.label : String(val)
        });
      }
    });

    this.filtersApplied.emit(values);
    this.filterPanelOpen = false;
  }

  removeFilter(key: string): void {
    this.filterValues[key] = null;
    this.activeFilters = this.activeFilters.filter(f => f.key !== key);
    this.filterCleared.emit(key);
    this.emitCurrentFilters();
  }

  clearAllFilters(): void {
    this.filters.forEach(f => { this.filterValues[f.key] = null; });
    this.activeFilters = [];
    this.allFiltersCleared.emit();
    this.emitCurrentFilters();
    this.filterPanelOpen = false;
  }

  get activeFilterCount(): number {
    return this.activeFilters.length;
  }

  private syncFilterValues(): void {
    const existing = { ...this.filterValues };
    this.filterValues = {};
    this.filters.forEach(f => { this.filterValues[f.key] = existing[f.key] ?? null; });
  }

  private emitCurrentFilters(): void {
    const values: Record<string, any> = {};
    this.filters.forEach(f => { values[f.key] = this.filterValues[f.key] ?? null; });
    this.filtersApplied.emit(values);
  }

  private formatDate(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${d.getFullYear()}`;
  }
}
