import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ContentChild,
  TemplateRef,
  AfterViewInit,
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { InlineColumn, TableAction, TableQueryParams } from './inline-table.models';
import { NzTableLayout } from 'ng-zorro-antd/table';
import { UserPreferenceService } from '../../../core/services/user-preference.service';
import { GridPreferences } from '../../../core/models/user-preference.model';

@Component({
  standalone: false,
  selector: 'app-inline-table',
  templateUrl: './inline-table.component.html',
  styleUrls: ['./inline-table.component.scss'],
})
export class InlineTableComponent implements OnChanges, AfterViewInit {
  // Data
  @Input() data: any[] = [];
  @Input() columns: InlineColumn[] = [];
  @Input() loading = false;

  // Toolbar
  @Input() title = '';
  @Input() subtitle = '';
  @Input() actions: TableAction[] = [];
  @Input() maxVisibleActions = 3;
  @Input() showSearch = false;
  @Input() showRefresh = false;

  // Selection
  @Input() showSelection = false;
  @Input() rowKey = 'id';

  // Editing
  @Input() editMode: 'always' | 'toggle' = 'always';

  // Table config
  @Input() size: 'small' | 'middle' | 'default' = 'middle';
  @Input() bordered = false;
  @Input() showPagination = true;
  @Input() pageSizeOptions = [10, 20, 50, 100];
  @Input() defaultPageSize = 20;
  @Input() emptyText = 'No Data';
  @Input() scrollX?: string;
  @Input() scrollY?: string;
  @Input() tableLayout: NzTableLayout = 'fixed';
  @Input() showRowNumbers = false;
  @Input() showRowActions = false;
  @Input() showColumnSettings = false;

  // Persistence
  @Input() storageKey?: string;

  // Server-side
  @Input() serverSide = false;
  @Input() totalRecords?: number;
  @Input() pageSize = 20;
  @Input() pageIndex = 1;

  // New row template — used when adding rows
  @Input() newRowDefaults: Record<string, any> = {};

  // Extra toolbar projection
  @ContentChild('extraToolbar', { static: false }) extraToolbarRef?: TemplateRef<any>;

  // Events
  @Output() dataChange = new EventEmitter<any[]>();
  @Output() dirtyChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<any[]>();
  @Output() cancel = new EventEmitter<void>();
  @Output() rowAdd = new EventEmitter<any>();
  @Output() rowDelete = new EventEmitter<{ row: any; index: number }>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() queryParamsChange = new EventEmitter<TableQueryParams>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() refresh = new EventEmitter<void>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() cellChange = new EventEmitter<{ row: any; field: string; value: any }>();

  // Internal state
  isEditing = false;
  globalSearch = '';
  modifiedIds = new Set<any>();
  private originalData: any[] = [];

  // Pagination
  displayData: any[] = [];
  currentPageData: any[] = [];

  // Sort
  sortField: string | null = null;
  sortDirection: 'ascend' | 'descend' | null = null;

  // Selection
  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<any>();

  // Autocomplete filter cache
  filteredOptions: Record<string, string[]> = {};

  // Cached action arrays (avoid re-creation each change detection)
  _visibleActions: TableAction[] = [];
  _overflowActions: TableAction[] = [];
  _isDirty = false;
  private _editModeActions: TableAction[] = [
    { label: 'Save', icon: 'save', type: 'primary', pinned: true, command: () => this.saveEdit() },
    { label: 'Cancel', icon: 'undo', danger: true, pinned: true, command: () => this.cancelEdit() },
  ];

  private _initialEmitDone = false;

  // Column settings state
  _internalColumns: InlineColumn[] = [];
  columnSettingsVisible = false;
  settingsColumns: { field: string; header: string; visible: boolean; required: boolean }[] = [];

  private _prefsLoaded = false;

  constructor(private userPreferenceService: UserPreferenceService) {}

  // ─── TrackBy functions ───

  trackByLabel(_: number, action: TableAction): string {
    return action.label;
  }

  trackByField(_: number, col: InlineColumn): string {
    return col.field;
  }

  trackByIndex(index: number): number {
    return index;
  }

  // ─── Action overflow ───

  private recomputeActions(): void {
    const acts = (this.editMode === 'toggle' && this.isEditing) ? this._editModeActions : this.actions;
    if (acts.length <= this.maxVisibleActions) {
      this._visibleActions = acts;
      this._overflowActions = [];
    } else {
      const pinned = acts.filter(a => a.pinned || a.type === 'primary' || a.danger);
      const unpinned = acts.filter(a => !a.pinned && a.type !== 'primary' && !a.danger);
      const slotsLeft = Math.max(0, this.maxVisibleActions - pinned.length);
      this._visibleActions = [...pinned, ...unpinned.slice(0, slotsLeft)];
      this._overflowActions = acts.filter(a => !this._visibleActions.includes(a));
    }
  }

  // ─── Lifecycle ───

  ngAfterViewInit(): void {
    if (this.serverSide && !this._initialEmitDone) {
      this._initialEmitDone = true;
      setTimeout(() => this.emitQueryParams());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editMode']) {
      this.isEditing = this.editMode === 'always';
      this.recomputeActions();
    }
    if (changes['defaultPageSize'] && !changes['defaultPageSize'].previousValue) {
      this.pageSize = this.defaultPageSize;
    }
    if (changes['pageSize'] && changes['pageSize'].currentValue) {
      this.pageSize = changes['pageSize'].currentValue;
    }
    if (changes['pageIndex'] && changes['pageIndex'].currentValue) {
      this.pageIndex = changes['pageIndex'].currentValue;
    }
    if (changes['data']) {
      this.applyClientSideOperations();
      this.refreshCheckedStatus();
    }
    if (changes['columns']) {
      this._internalColumns = this.columns.map(c => ({ ...c }));
      this.initAutocompleteFilters();
      if (this.storageKey && !this._prefsLoaded) {
        this._prefsLoaded = true;
        this.loadColumnPreferences();
      }
    }
    if (changes['actions'] || changes['maxVisibleActions']) {
      this.recomputeActions();
    }
  }

  // ─── Field access ───

  getFieldValue(row: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], row);
  }

  setFieldValue(row: any, field: string, value: any): void {
    const parts = field.split('.');
    let obj = row;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
  }

  // ─── Search ───

  onGlobalSearch(): void {
    this.pageIndex = 1;
    this.searchChange.emit(this.globalSearch);
    if (this.serverSide) {
      this.emitQueryParams();
    } else {
      this.applyClientSideOperations();
    }
  }

  // ─── Sorting ───

  onSort(col: InlineColumn): void {
    if (col.type === 'template') return;
    if (this.sortField === col.field) {
      if (this.sortDirection === 'ascend') this.sortDirection = 'descend';
      else if (this.sortDirection === 'descend') { this.sortDirection = null; this.sortField = null; }
      else this.sortDirection = 'ascend';
    } else {
      this.sortField = col.field;
      this.sortDirection = 'ascend';
    }
    if (this.serverSide) {
      this.emitQueryParams();
    } else {
      this.applyClientSideOperations();
    }
  }

  // ─── Client-side pipeline ───

  applyClientSideOperations(): void {
    if (this.serverSide) {
      this.displayData = [...this.data];
      return;
    }
    let result = [...this.data];
    if (this.globalSearch) {
      const term = this.globalSearch.toLowerCase();
      result = result.filter(row =>
        this.columns.some(col => {
          if (col.type === 'template') return false;
          const val = this.getFieldValue(row, col.field);
          return val != null && String(val).toLowerCase().includes(term);
        })
      );
    }
    if (this.sortField && this.sortDirection) {
      const dir = this.sortDirection === 'ascend' ? 1 : -1;
      const field = this.sortField;
      result.sort((a, b) => {
        const va = this.getFieldValue(a, field);
        const vb = this.getFieldValue(b, field);
        if (va == null && vb == null) return 0;
        if (va == null) return -dir;
        if (vb == null) return dir;
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb)) * dir;
      });
    }
    this.displayData = result;
  }

  // ─── Pagination ───

  onPageIndexChange(index: number): void {
    this.pageIndex = index;
    if (this.serverSide) this.emitQueryParams();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    if (this.serverSide) this.emitQueryParams();
  }

  onCurrentPageDataChange(data: any[]): void {
    this.currentPageData = data;
    this.refreshCheckedStatus();
  }

  // ─── Selection ───

  onItemChecked(id: any, checked: boolean): void {
    checked ? this.setOfCheckedId.add(id) : this.setOfCheckedId.delete(id);
    this.refreshCheckedStatus();
    this.emitSelection();
  }

  onAllChecked(checked: boolean): void {
    this.currentPageData.forEach(item => {
      const id = this.getFieldValue(item, this.rowKey);
      checked ? this.setOfCheckedId.add(id) : this.setOfCheckedId.delete(id);
    });
    this.refreshCheckedStatus();
    this.emitSelection();
  }

  refreshCheckedStatus(): void {
    const pageData = this.currentPageData;
    if (pageData.length === 0) { this.checked = false; this.indeterminate = false; return; }
    this.checked = pageData.every(item => this.setOfCheckedId.has(this.getFieldValue(item, this.rowKey)));
    this.indeterminate = pageData.some(item => this.setOfCheckedId.has(this.getFieldValue(item, this.rowKey))) && !this.checked;
  }

  private emitSelection(): void {
    const selected = this.data.filter(item => this.setOfCheckedId.has(this.getFieldValue(item, this.rowKey)));
    this.selectionChange.emit(selected);
  }

  getSelectedRows(): any[] {
    return this.data.filter(item => this.setOfCheckedId.has(this.getFieldValue(item, this.rowKey)));
  }

  // ─── Editing ───

  startEdit(): void {
    this.isEditing = true;
    this.originalData = this.data.map(row => ({ ...row }));
    this.modifiedIds.clear();
    this.updateDirty(false);
    this.recomputeActions();
  }

  cancelEdit(): void {
    if (this.editMode === 'toggle') {
      this.isEditing = false;
      this.data = this.originalData.map(row => ({ ...row }));
      this.dataChange.emit(this.data);
      this.applyClientSideOperations();
    }
    this.modifiedIds.clear();
    this.updateDirty(false);
    this.recomputeActions();
    this.cancel.emit();
  }

  saveEdit(): void {
    const modified = this.getModifiedRows();
    this.save.emit(modified);
    if (this.editMode === 'toggle') {
      this.isEditing = false;
      this.recomputeActions();
    }
  }

  onCellChange(row: any, field: string): void {
    row._modified = true;
    const key = this.getFieldValue(row, this.rowKey);
    if (key != null) {
      this.modifiedIds.add(key);
    }
    this.updateDirty(true);
    this.dataChange.emit(this.data);
    this.cellChange.emit({ row, field, value: this.getFieldValue(row, field) });
  }

  getModifiedRows(): any[] {
    return this.data.filter(r => r._modified);
  }

  markClean(): void {
    this.data.forEach(r => delete r._modified);
    this.modifiedIds.clear();
    this.updateDirty(false);
  }

  private updateDirty(dirty: boolean): void {
    this._isDirty = dirty;
    this.dirtyChange.emit(dirty);
  }

  // ─── Row operations ───

  addRow(): void {
    const newRow: any = { _modified: true, ...this.newRowDefaults };
    this.columns.forEach(col => {
      if (!(col.field in newRow)) {
        if (col.type === 'boolean') newRow[col.field] = 'false';
        else newRow[col.field] = '';
      }
    });
    this.data = [...this.data, newRow];
    this.dataChange.emit(this.data);
    this.updateDirty(true);
    this.applyClientSideOperations();
    this.rowAdd.emit(newRow);
  }

  insertRow(index: number): void {
    const newRow: any = { _modified: true, ...this.newRowDefaults };
    this.columns.forEach(col => {
      if (!(col.field in newRow)) {
        if (col.type === 'boolean') newRow[col.field] = 'false';
        else newRow[col.field] = '';
      }
    });
    this.data = [
      ...this.data.slice(0, index + 1),
      newRow,
      ...this.data.slice(index + 1),
    ];
    this.dataChange.emit(this.data);
    this.updateDirty(true);
    this.applyClientSideOperations();
    this.rowAdd.emit(newRow);
  }

  deleteRow(index: number): void {
    const removed = this.data[index];
    this.data = this.data.filter((_, i) => i !== index);
    this.dataChange.emit(this.data);
    this.updateDirty(true);
    this.applyClientSideOperations();
    this.rowDelete.emit({ row: removed, index });
  }

  // ─── Paste from Excel ───

  onPaste(event: ClipboardEvent, rowIndex: number, colIndex: number): void {
    const text = event.clipboardData?.getData('text/plain');
    if (!text) return;
    const hasMultiple = text.includes('\t') || text.includes('\n');
    if (!hasMultiple) return;

    event.preventDefault();
    const pasteFields = this.getPasteFields();
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const updated = [...this.data];

    for (let r = 0; r < lines.length; r++) {
      const cells = lines[r].split('\t');
      const targetRow = rowIndex + r;

      if (targetRow >= updated.length) {
        const newRow: any = { _modified: true, ...this.newRowDefaults };
        this.columns.forEach(col => {
          if (!(col.field in newRow)) {
            if (col.type === 'boolean') newRow[col.field] = 'false';
            else newRow[col.field] = '';
          }
        });
        for (let c = 0; c < cells.length; c++) {
          const fi = colIndex + c;
          if (fi < pasteFields.length) {
            newRow[pasteFields[fi]] = cells[c]?.trim() || '';
          }
        }
        updated.push(newRow);
      } else {
        for (let c = 0; c < cells.length; c++) {
          const fi = colIndex + c;
          if (fi < pasteFields.length) {
            updated[targetRow][pasteFields[fi]] = cells[c]?.trim() || '';
          }
        }
        updated[targetRow]._modified = true;
      }

      const key = this.getFieldValue(updated[targetRow >= updated.length ? updated.length - 1 : targetRow], this.rowKey);
      if (key != null) this.modifiedIds.add(key);
    }

    this.data = updated;
    this.dataChange.emit(this.data);
    this.updateDirty(true);
    this.applyClientSideOperations();
  }

  private getPasteFields(): string[] {
    const cols = [...this.columns].filter(c => c.type !== 'readonly' && c.type !== 'template');
    const withIndex = cols.filter(c => c.pasteIndex != null);
    if (withIndex.length > 0) {
      return withIndex.sort((a, b) => a.pasteIndex! - b.pasteIndex!).map(c => c.field);
    }
    return cols.map(c => c.field);
  }

  // ─── Autocomplete ───

  private initAutocompleteFilters(): void {
    this.columns.forEach(col => {
      if (col.type === 'autocomplete') {
        const opts = typeof col.options === 'function' ? [] : (col.options || []);
        this.filteredOptions[col.field] = opts.slice(0, col.maxFilterResults || 50);
      }
    });
  }

  onAutocompleteFilter(col: InlineColumn, value: string): void {
    const allOpts = typeof col.options === 'function' ? [] : (col.options || []);
    const max = col.maxFilterResults || 50;
    if (col.filterFn) {
      this.filteredOptions[col.field] = col.filterFn(value, allOpts).slice(0, max);
    } else if (!value) {
      this.filteredOptions[col.field] = allOpts.slice(0, max);
    } else {
      const upper = value.toUpperCase();
      this.filteredOptions[col.field] = allOpts.filter(o => o.toUpperCase().includes(upper)).slice(0, max);
    }
  }

  getAutocompleteOptions(col: InlineColumn): string[] {
    return this.filteredOptions[col.field] || [];
  }

  // ─── Display helpers ───

  getDisplayValue(row: any, col: InlineColumn): string {
    const val = this.getFieldValue(row, col.field);
    if (col.displayFn) return col.displayFn(val, row);
    if (val == null) return '';
    return String(val);
  }

  getTagColor(value: any, col: InlineColumn): string {
    if (!col.tagColor) return 'default';
    if (typeof col.tagColor === 'string') return col.tagColor;
    if (typeof col.tagColor === 'function') return col.tagColor(value);
    return col.tagColor[value] || 'default';
  }

  getSelectOptions(row: any, col: InlineColumn): string[] {
    if (!col.options) return [];
    return typeof col.options === 'function' ? col.options(row) : col.options;
  }

  getBooleanLabels(col: InlineColumn): [string, string] {
    return col.booleanLabels || ['true', 'false'];
  }

  // ─── Refresh ───

  onRefresh(): void {
    if (this.serverSide) this.emitQueryParams();
    this.refresh.emit();
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  // ─── Server-side params ───

  private emitQueryParams(): void {
    const params: TableQueryParams = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      sort: this.sortField ? { field: this.sortField, direction: this.sortDirection } : undefined,
      filters: {},
      globalSearch: this.globalSearch,
    };
    this.queryParamsChange.emit(params);
  }

  // ─── Getters ───

  get totalItems(): number {
    return this.totalRecords ?? this.displayData.length;
  }

  get editableColumns(): InlineColumn[] {
    return this.columns.filter(c => c.type !== 'readonly' && c.type !== 'template');
  }

  get visibleColumns(): InlineColumn[] {
    return this._internalColumns.filter(c => c.visible !== false);
  }

  // ─── Column Settings ───

  openColumnSettings(): void {
    this.settingsColumns = this._internalColumns.map(c => ({
      field: c.field,
      header: c.header,
      visible: c.visible !== false,
      required: !!c.required,
    }));
    this.columnSettingsVisible = true;
  }

  applyColumnSettings(): void {
    const map = new Map(this._internalColumns.map(c => [c.field, c]));
    this._internalColumns = this.settingsColumns.map(s => {
      const col = map.get(s.field)!;
      if (s.visible) { delete col.visible; } else { col.visible = false; }
      return col;
    });
    this.columnSettingsVisible = false;
    this.saveColumnPreferences();
  }

  resetColumnSettings(): void {
    this.settingsColumns = this.columns.map(c => ({
      field: c.field,
      header: c.header,
      visible: c.visible !== false,
      required: !!c.required,
    }));
    if (this.storageKey) {
      this.userPreferenceService.resetGridPreferences(this.storageKey).subscribe();
    }
  }

  onSettingsDrop(event: CdkDragDrop<any>): void {
    moveItemInArray(this.settingsColumns, event.previousIndex, event.currentIndex);
  }

  // ─── Column Preference Persistence ───

  private loadColumnPreferences(): void {
    if (!this.storageKey) return;
    this.userPreferenceService.getGridPreferences(this.storageKey).subscribe(prefs => {
      if (prefs?.columns?.order?.length) {
        this.applyStoredPreferences(prefs);
      }
    });
  }

  private applyStoredPreferences(prefs: GridPreferences): void {
    const colMap = new Map(this._internalColumns.map(c => [c.field, c]));
    const visibleSet = prefs.columns?.visible?.length
      ? new Set(prefs.columns.visible)
      : null;
    const order = prefs.columns?.order || [];

    const ordered: InlineColumn[] = [];
    for (const field of order) {
      const col = colMap.get(field);
      if (col) {
        ordered.push(col);
        colMap.delete(field);
      }
    }
    colMap.forEach(col => ordered.push(col));

    if (visibleSet) {
      for (const col of ordered) {
        if (visibleSet.has(col.field)) {
          delete col.visible;
        } else {
          col.visible = false;
        }
      }
    }

    this._internalColumns = ordered;
  }

  private saveColumnPreferences(): void {
    if (!this.storageKey) return;
    const visible = this._internalColumns
      .filter(c => c.visible !== false)
      .map(c => c.field);
    const order = this._internalColumns.map(c => c.field);
    this.userPreferenceService.mergeGridPreferences(this.storageKey, {
      columns: { visible, order }
    });
  }
}
