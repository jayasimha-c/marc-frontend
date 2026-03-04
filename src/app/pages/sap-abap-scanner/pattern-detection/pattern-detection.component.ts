import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../core/services/notification.service';
import { AbapService } from '../abap.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';
import { GridRequestBuilder } from '../../../core/utils/grid-request.builder';

@Component({
  standalone: false,
  selector: 'app-pattern-detection',
  templateUrl: './pattern-detection.component.html',
  styleUrls: ['./pattern-detection.component.scss'],
})
export class PatternDetectionComponent implements OnInit {
  @ViewChild('jsonFileInput') jsonFileInput!: ElementRef<HTMLInputElement>;

  isImporting = false;
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;

  // Side panel
  showDetailPanel = false;
  selectedPattern: any = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', width: '180px', sortable: false },
    { field: 'description', header: 'Description', ellipsis: true, sortable: false },
    {
      field: 'evaluationStrategy',
      header: 'Strategy',
      type: 'tag',
      width: '160px',
      sortable: false,
      tagColors: {
        SINGLE_STAGE: 'blue',
        MULTI_STAGE: 'purple',
        MULTI_STAGE_EXCLUSIVE: 'orange',
      },
    },
    { field: 'regexPatterns', header: 'Patterns', width: '100px', sortable: false },
    {
      field: 'active',
      header: 'Active',
      type: 'tag',
      width: '90px',
      sortable: false,
      tagColors: { true: 'green', false: 'red' },
    },
    { field: 'createdDate', header: 'Created', type: 'date', width: '140px', sortable: false },
    { field: 'modifiedDate', header: 'Modified', type: 'date', width: '140px', sortable: false },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus', type: 'primary', command: () => this.onAction('add') },
    { label: 'Edit', icon: 'edit', command: () => this.onAction('edit') },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onAction('delete') },
    { label: 'View', icon: 'eye', command: () => this.onAction('view') },
    { label: 'Export', icon: 'download', command: () => this.onAction('export') },
    { label: 'Export JSON', icon: 'code', command: () => this.onAction('exportJson') },
    { label: 'Import JSON', icon: 'upload', command: () => this.onAction('importJson') },
  ];

  private lastQueryParams: TableQueryParams | null = null;

  constructor(
    private modal: NzModalService,
    private notification: NotificationService,
    private abapService: AbapService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  onQueryParamsChange(params: TableQueryParams): void {
    this.lastQueryParams = params;
    this.loadData(params);
  }

  loadData(params?: TableQueryParams): void {
    const query = params || this.lastQueryParams;
    if (!query) return;

    this.loading = true;
    this.abapService.getDetectionPatternList(query).subscribe({
      next: (res) => {
        this.data = res.data?.rows || [];
        this.totalRecords = res.data?.records || 0;
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.totalRecords = 0;
        this.loading = false;
      },
    });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onAction(action: string): void {
    switch (action) {
      case 'add':
        this.router.navigate(['/sap-abap-scanner/detection-patterns/create']);
        break;

      case 'edit':
        if (!this.selectedRow) {
          this.notification.warn('Please select a row first');
          return;
        }
        this.router.navigate(['/sap-abap-scanner/detection-patterns/edit', this.selectedRow.id]);
        break;

      case 'delete':
        if (!this.selectedRow) {
          this.notification.warn('Please select a row first');
          return;
        }
        this.modal.confirm({
          nzTitle: 'Delete Confirmation',
          nzContent: 'Are you sure you want to delete this detection pattern?',
          nzOkText: 'Delete',
          nzOkDanger: true,
          nzOnOk: () => {
            this.abapService.deleteDetectionPattern(this.selectedRow.id).subscribe({
              next: () => {
                this.notification.success('Deleted successfully');
                this.selectedRow = null;
                this.loadData();
              },
              error: (err) => this.notification.error(err.error?.message || 'Delete failed'),
            });
          },
        });
        break;

      case 'view':
        if (!this.selectedRow) {
          this.notification.warn('Please select a row first');
          return;
        }
        this.openDetailPanel(this.selectedRow);
        break;

      case 'export':
        this.abapService.exportExcel('pattern').subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pattern.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          },
          error: (err) => this.notification.error('Export failed: ' + (err.error?.message || 'Unknown error')),
        });
        break;

      case 'exportJson':
        this.abapService.exportDetectionPatternsJsonBackground().subscribe({
          next: (resp) => {
            if (resp.success) {
              this.notification.success('JSON export started in background.');
              this.modal.confirm({
                nzTitle: 'Export Started',
                nzContent: 'JSON export is running in the background. Go to Export Results to download when complete.',
                nzOkText: 'Go to Export Results',
                nzCancelText: 'Stay Here',
                nzOnOk: () => this.router.navigate(['/general/export-results']),
              });
            } else {
              this.notification.error(resp.message || 'Failed to start export');
            }
          },
          error: (err) => this.notification.error('Failed to start export: ' + (err.error?.message || 'Unknown error')),
        });
        break;

      case 'importJson':
        this.jsonFileInput.nativeElement.value = '';
        this.jsonFileInput.nativeElement.click();
        break;
    }
  }

  onJsonFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.name.toLowerCase().endsWith('.json')) {
      this.notification.error('Only .json files are accepted');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.notification.error('File size must be less than 10MB');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Import Detection Patterns',
      nzContent: 'How should existing patterns (matched by name) be handled?',
      nzOkText: 'Overwrite Existing',
      nzCancelText: 'Append Only (Skip Existing)',
      nzOnOk: () => this.executeJsonImport(file, 'OVERWRITE'),
      nzOnCancel: () => this.executeJsonImport(file, 'APPEND'),
    });
  }

  private executeJsonImport(file: File, importMode: string): void {
    this.isImporting = true;
    this.abapService.importDetectionPatternsJson(file, importMode).subscribe({
      next: (res) => {
        this.isImporting = false;
        if (res.success) {
          const d = res.data;
          let msg = `Import complete. Created: ${d.created}`;
          if (d.updated > 0) msg += `, Updated: ${d.updated}`;
          if (d.skipped > 0) msg += `, Skipped: ${d.skipped}`;
          if (d.failed > 0) msg += `, Failed: ${d.failed}`;
          this.notification.success(msg);
        } else {
          this.notification.error(res.message || 'Import failed');
        }
        this.loadData();
      },
      error: (err) => {
        this.isImporting = false;
        this.notification.error(err.error?.message || 'Import failed');
      },
    });
  }

  // ==================== Detail Panel ====================

  formatPatternCount(patterns: any[]): string {
    if (!patterns || !Array.isArray(patterns)) return '0 patterns';
    return patterns.length === 1 ? '1 pattern' : `${patterns.length} patterns`;
  }

  getPatternCategory(pattern: string): string {
    if (!pattern) return 'OTHER';
    const lower = pattern.toLowerCase();
    if (lower.includes('select') || lower.includes('update') || lower.includes('delete')) return 'SQL';
    if (lower.includes('call') || lower.includes('method')) return 'METHOD';
    if (lower.includes('try') || lower.includes('catch')) return 'EXCEPTION';
    return 'OTHER';
  }

  getPatternComplexity(pattern: string): string {
    if (!pattern) return 'Simple';
    const indicators = pattern.match(/[\[\]\(\)\{\}\+\*\?\|\^\$\.\\]/g);
    const count = indicators ? indicators.length : 0;
    if (count > 10) return 'Complex';
    if (count > 5) return 'Medium';
    return 'Simple';
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'SQL': return 'database';
      case 'METHOD': return 'function';
      case 'EXCEPTION': return 'exclamation-circle';
      default: return 'code';
    }
  }

  openDetailPanel(row: any): void {
    const firstPattern = row.regexPatterns?.length > 0 ? row.regexPatterns[0].regexPattern : '';
    this.selectedPattern = {
      ...row,
      category: this.getPatternCategory(firstPattern),
      complexity: this.getPatternComplexity(firstPattern),
      patternCount: row.regexPatterns?.length || 0,
    };
    this.showDetailPanel = true;
  }

  closeDetailPanel(): void {
    this.showDetailPanel = false;
    this.selectedPattern = null;
  }

  editPatternFromPanel(): void {
    if (this.selectedPattern) {
      this.router.navigate(['/sap-abap-scanner/detection-patterns/edit', this.selectedPattern.id]);
    }
  }

  deletePatternFromPanel(): void {
    if (!this.selectedPattern) return;
    this.modal.confirm({
      nzTitle: 'Delete Confirmation',
      nzContent: 'Are you sure you want to delete this detection pattern?',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.abapService.deleteDetectionPattern(this.selectedPattern.id).subscribe({
          next: () => {
            this.notification.success('Deleted successfully');
            this.loadData();
            this.closeDetailPanel();
          },
          error: (err) => this.notification.error(err.error?.message || 'Delete failed'),
        });
      },
    });
  }
}
