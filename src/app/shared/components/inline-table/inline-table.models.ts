import { TemplateRef } from '@angular/core';

export type { TableAction, TableQueryParams } from '../advanced-table/advanced-table.models';

export type InlineColumnType = 'text' | 'select' | 'autocomplete' | 'textarea' | 'boolean' | 'number' | 'readonly' | 'tag' | 'template';

export interface InlineColumn<T = any> {
  field: string;
  header: string;
  width?: string;
  type?: InlineColumnType;
  /** Options for select/autocomplete columns — static array or function per row */
  options?: string[] | ((row: T) => string[]);
  /** Enable search in nz-select */
  showSearch?: boolean;
  /** Custom filter function for autocomplete */
  filterFn?: (term: string, options: string[]) => string[];
  /** Max autocomplete results (default 50) */
  maxFilterResults?: number;
  /** Tag color — string, map, or function */
  tagColor?: string | Record<string, string> | ((value: any) => string);
  /** Template ref for 'template' type columns */
  templateRef?: TemplateRef<any>;
  /** Custom display function for view mode */
  displayFn?: (value: any, row: T) => string;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  /** Explicit column order for paste operations */
  pasteIndex?: number;
  required?: boolean;
  visible?: boolean;
  /** Labels for boolean select: [trueLabel, falseLabel] */
  booleanLabels?: [string, string];
  /** Allow clear in select */
  allowClear?: boolean;
  /** Placeholder text */
  placeholder?: string;
}
