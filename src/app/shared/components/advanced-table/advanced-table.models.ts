import { TemplateRef } from '@angular/core';

export type ColumnType = 'text' | 'date' | 'number' | 'boolean' | 'tag' | 'status' | 'actions' | 'link' | 'template';

export interface RowAction<T = any> {
  icon: string;
  tooltip?: string;
  danger?: boolean;
  command: (row: T) => void;
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

export interface TableAction {
  label: string;
  icon?: string;
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  danger?: boolean;
  command: () => void;
  disabled?: boolean;
  tooltip?: string;
  /** If true, this action always stays visible (never collapsed into "More") */
  pinned?: boolean;
}

export interface TableColumn<T = any> {
  field: string;
  header: string;
  type?: ColumnType;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select';
  filterOptions?: { label: string; value: any }[];
  tagColors?: Record<string, string>;
  actions?: RowAction<T>[];
  dateFormat?: string;
  numberFormat?: string;
  onClick?: (row: T) => void;
  templateRef?: TemplateRef<any>;
  align?: 'left' | 'center' | 'right';
  searchable?: boolean;
  visible?: boolean;
  headerTooltip?: string;
  cellClass?: string | ((row: T) => string);
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
  required?: boolean;
}

export interface TableQueryParams {
  pageIndex: number;
  pageSize: number;
  sort?: { field: string; direction: 'ascend' | 'descend' | null };
  filters: Record<string, string>;
  globalSearch: string;
}
