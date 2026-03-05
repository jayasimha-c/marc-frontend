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
import { TableColumn, TableAction, TableQueryParams } from './advanced-table.models';
import { NzTableLayout, NzTablePaginationPosition, NzTablePaginationType } from 'ng-zorro-antd/table';

@Component({
  standalone: false,
  selector: 'app-advanced-table',
  templateUrl: './advanced-table.component.html',
  styleUrls: ['./advanced-table.component.scss'],
})
export class AdvancedTableComponent implements OnChanges, AfterViewInit {
  // Data
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading = false;
  @Input() total?: number;

  // Toolbar
  @Input() title = '';
  @Input() subtitle = '';
  @Input() actions: TableAction[] = [];
  @Input() maxVisibleActions = 3;
  @Input() showSearch = true;
  @Input() showRefresh = true;
  @Input() showExport = false;

  // Selection
  @Input() showSelection = false;
  @Input() rowKey = 'id';

  // Table config
  @Input() size: 'small' | 'middle' | 'default' = 'middle';
  @Input() bordered = false;
  @Input() showPagination = true;
  @Input() pageSizeOptions = [10, 20, 50, 100];
  @Input() defaultPageSize = 20;
  @Input() emptyText = 'No Data';
  @Input() scrollX?: string;
  @Input() scrollY?: string;
  @Input() tableLayout: NzTableLayout = 'auto';
  @Input() paginationPosition: NzTablePaginationPosition = 'bottom';
  @Input() paginationType: NzTablePaginationType = 'default';
  @Input() simplePagination = false;
  @Input() tableTitle?: string;
  @Input() tableFooter?: string;
  @Input() showHeader = true;
  @Input() ellipsis = false;

  // Expandable rows
  @Input() expandable = false;
  @ContentChild('expandRow', { static: false }) expandRowRef?: TemplateRef<any>;
  
  // Custom templates
  @Input() customStatusTemplate?: TemplateRef<any>;
  @Input() customOperationsTemplate?: TemplateRef<any>;
  @ContentChild('customStatusTemplate', { static: false }) customStatusTemplateRef?: TemplateRef<any>;
  @ContentChild('customOperationsTemplate', { static: false }) customOperationsTemplateRef?: TemplateRef<any>;

  // Filter mode
  @Input() filterMode: 'dropdown' | 'row' = 'dropdown';

  // Column settings
  @Input() showColumnSettings = false;

  // Server-side
  @Input() serverSide = false;
  
  // External pagination control
  @Input() totalRecords?: number;
  @Input() pageSize = 20;
  @Input() pageIndex = 1;

  // Events
  @Output() queryParamsChange = new EventEmitter<TableQueryParams>();
  @Output() refresh = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() rowClick = new EventEmitter<any>();

  @ContentChild('extraToolbar', { static: false }) extraToolbarRef?: TemplateRef<any>;

  // Action overflow
  get visibleActions(): TableAction[] {
    if (this.actions.length <= this.maxVisibleActions) return this.actions;
    const pinned = this.actions.filter(a => a.pinned || a.type === 'primary' || a.danger);
    const unpinned = this.actions.filter(a => !a.pinned && a.type !== 'primary' && !a.danger);
    const slotsLeft = Math.max(0, this.maxVisibleActions - pinned.length);
    return [...pinned, ...unpinned.slice(0, slotsLeft)];
  }

  get overflowActions(): TableAction[] {
    if (this.actions.length <= this.maxVisibleActions) return [];
    const visible = this.visibleActions;
    return this.actions.filter(a => !visible.includes(a));
  }

  // Internal state
  displayData: any[] = [];
  currentPageData: any[] = [];
  globalSearch = '';
  columnFilters: Record<string, string> = {};
  sortField: string | null = null;
  sortDirection: 'ascend' | 'descend' | null = null;

  // Selection state
  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<any>();

  // Filter row visibility (for row mode)
  showFilterRow = false;

  // Filter dropdown state (for dropdown mode)
  filterVisible: Record<string, boolean> = {};
  filterSearchValues: Record<string, string> = {};

  // Expandable state
  expandedRows = new Set<any>();

  // Column settings state
  _internalColumns: TableColumn[] = [];
  columnSettingsVisible = false;
  settingsColumns: { field: string; header: string; visible: boolean; required: boolean }[] = [];

  private _initialEmitDone = false;

  ngAfterViewInit(): void {
    if (this.serverSide && !this._initialEmitDone) {
      this._initialEmitDone = true;
      setTimeout(() => this.emitQueryParams());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['defaultPageSize'] && !changes['defaultPageSize'].previousValue) {
      this.pageSize = this.defaultPageSize;
    }
    if (changes['pageSize'] && changes['pageSize'].currentValue) {
      this.pageSize = changes['pageSize'].currentValue;
    }
    if (changes['pageIndex'] && changes['pageIndex'].currentValue) {
      this.pageIndex = changes['pageIndex'].currentValue;
    }
    if (changes['columns']) {
      this._internalColumns = this.columns.map(c => ({ ...c }));
      this.showFilterRow = this.filterMode === 'row' && this.columns.some((c) => c.filterable);
    }
    if (changes['data']) {
      this.applyClientSideOperations();
      this.refreshCheckedStatus();
    }
  }

  // --- Field access (supports dot notation) ---
  getFieldValue(row: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], row);
  }

  // --- Search ---
  onGlobalSearch(): void {
    this.pageIndex = 1;
    if (this.serverSide) {
      this.emitQueryParams();
    } else {
      this.applyClientSideOperations();
    }
  }

  // --- Sorting ---
  onSort(column: TableColumn): void {
    if (!column.sortable && column.sortable !== undefined) return;
    if (this.sortField === column.field) {
      if (this.sortDirection === 'ascend') {
        this.sortDirection = 'descend';
      } else if (this.sortDirection === 'descend') {
        this.sortDirection = null;
        this.sortField = null;
      } else {
        this.sortDirection = 'ascend';
      }
    } else {
      this.sortField = column.field;
      this.sortDirection = 'ascend';
    }

    if (this.serverSide) {
      this.emitQueryParams();
    } else {
      this.applyClientSideOperations();
    }
  }

  // --- Column filters ---
  onColumnFilter(field: string, value: string): void {
    if (value) {
      this.columnFilters[field] = value;
    } else {
      delete this.columnFilters[field];
    }
    this.pageIndex = 1;

    if (this.serverSide) {
      this.emitQueryParams();
    } else {
      this.applyClientSideOperations();
    }
  }

  // --- Dropdown filter: apply & reset ---
  applyColumnFilter(field: string): void {
    const value = this.filterSearchValues[field] || '';
    this.onColumnFilter(field, value);
    this.filterVisible[field] = false;
  }

  resetColumnFilter(field: string): void {
    this.filterSearchValues[field] = '';
    this.onColumnFilter(field, '');
    this.filterVisible[field] = false;
  }

  // --- Client-side pipeline: search → filter → sort ---
  applyClientSideOperations(): void {
    if (this.serverSide) {
      this.displayData = [...this.data];
      return;
    }

    let result = [...this.data];

    // Global search
    if (this.globalSearch) {
      const term = this.globalSearch.toLowerCase();
      const searchableFields = this._internalColumns
        .filter((c) => c.searchable !== false && c.type !== 'actions' && c.visible !== false)
        .map((c) => c.field);
      result = result.filter((row) =>
        searchableFields.some((field) => {
          const val = this.getFieldValue(row, field);
          return val != null && String(val).toLowerCase().includes(term);
        })
      );
    }

    // Column filters
    for (const [field, filterVal] of Object.entries(this.columnFilters)) {
      const term = filterVal.toLowerCase();
      result = result.filter((row) => {
        const val = this.getFieldValue(row, field);
        return val != null && String(val).toLowerCase().includes(term);
      });
    }

    // Sort
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

  // --- Pagination ---
  onPageIndexChange(index: number): void {
    this.pageIndex = index;
    if (this.serverSide) {
      this.emitQueryParams();
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    if (this.serverSide) {
      this.emitQueryParams();
    }
  }

  onCurrentPageDataChange(data: any[]): void {
    this.currentPageData = data;
    this.refreshCheckedStatus();
  }

  // --- Checkbox selection ---
  onItemChecked(id: any, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
    this.refreshCheckedStatus();
    this.emitSelection();
  }

  onAllChecked(checked: boolean): void {
    this.currentPageData.forEach((item) => {
      const id = this.getFieldValue(item, this.rowKey);
      if (checked) {
        this.setOfCheckedId.add(id);
      } else {
        this.setOfCheckedId.delete(id);
      }
    });
    this.refreshCheckedStatus();
    this.emitSelection();
  }

  refreshCheckedStatus(): void {
    const pageData = this.currentPageData;
    if (pageData.length === 0) {
      this.checked = false;
      this.indeterminate = false;
      return;
    }
    this.checked = pageData.every((item) =>
      this.setOfCheckedId.has(this.getFieldValue(item, this.rowKey))
    );
    this.indeterminate =
      pageData.some((item) =>
        this.setOfCheckedId.has(this.getFieldValue(item, this.rowKey))
      ) && !this.checked;
  }

  private emitSelection(): void {
    const selected = this.data.filter((item) =>
      this.setOfCheckedId.has(this.getFieldValue(item, this.rowKey))
    );
    this.selectionChange.emit(selected);
  }

  // --- Expand ---
  toggleExpand(row: any): void {
    const key = this.getFieldValue(row, this.rowKey);
    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.add(key);
    }
  }

  isExpanded(row: any): boolean {
    return this.expandedRows.has(this.getFieldValue(row, this.rowKey));
  }

  // --- Refresh ---
  onRefresh(): void {
    if (this.serverSide) {
      this.emitQueryParams();
    }
    this.refresh.emit();
  }

  // --- Export CSV ---
  exportCsv(): void {
    const exportColumns = this.visibleColumns.filter((c) => c.type !== 'actions');
    const headers = exportColumns.map((c) => c.header);
    const rows = this.displayData.map((row) =>
      exportColumns.map((c) => {
        const val = this.getFieldValue(row, c.field);
        const formatted = this.formatCellValue(val, c);
        const str = String(formatted ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
    );

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.title || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // --- Format ---
  formatCellValue(value: any, column: TableColumn): string {
    if (value == null) return '';
    switch (column.type) {
      case 'date':
        return column.dateFormat ? value : new Date(value).toLocaleDateString();
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  }

  // --- Server-side params ---
  private emitQueryParams(): void {
    const params: TableQueryParams = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      sort: this.sortField
        ? { field: this.sortField, direction: this.sortDirection }
        : undefined,
      filters: { ...this.columnFilters },
      globalSearch: this.globalSearch,
    };
    this.queryParamsChange.emit(params);
  }

  // --- Row click ---
  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  // --- Getters ---
  get totalItems(): number {
    return this.totalRecords ?? this.total ?? this.displayData.length;
  }

  get visibleColumns(): TableColumn[] {
    return this._internalColumns.filter((c) => c.visible !== false);
  }

  getCellClass(row: any, column: TableColumn): string {
    if (!column.cellClass) return '';
    if (typeof column.cellClass === 'function') return column.cellClass(row);
    return column.cellClass;
  }

  getTagColor(value: any, column: TableColumn): string {
    return column.tagColors?.[value] || 'default';
  }

  // --- Column Settings ---
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
    this.applyClientSideOperations();
  }

  resetColumnSettings(): void {
    this.settingsColumns = this.columns.map(c => ({
      field: c.field,
      header: c.header,
      visible: c.visible !== false,
      required: !!c.required,
    }));
  }

  onSettingsDrop(event: CdkDragDrop<any>): void {
    moveItemInArray(this.settingsColumns, event.previousIndex, event.currentIndex);
  }
}
