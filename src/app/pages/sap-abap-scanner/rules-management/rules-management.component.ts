import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../core/services/notification.service';
import { AbapService } from '../abap.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-rules-management',
  templateUrl: './rules-management.component.html',
  styleUrls: ['./rules-management.component.scss'],
})
export class RulesManagementComponent implements OnInit {
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;
  ruleCount: any = null;

  // Side panel
  showDetailPanel = false;
  selectedRule: any = null;

  columns: TableColumn[] = [
    { field: 'code', header: 'ID', width: '100px', sortable: false },
    { field: 'name', header: 'Rule Name', width: '200px', sortable: false },
    { field: 'description', header: 'Description', ellipsis: true, sortable: false },
    { field: 'categoryName', header: 'Category', width: '140px', sortable: false },
    {
      field: 'severity',
      header: 'Severity',
      type: 'tag',
      width: '110px',
      sortable: false,
      tagColors: {
        Critical: 'red',
        High: 'orange',
        Medium: 'gold',
        Low: 'blue',
        Info: 'default',
      },
    },
    { field: 'createdDate', header: 'Created', type: 'date', width: '140px', sortable: false },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus', type: 'primary', command: () => this.onAction('add') },
    { label: 'Edit', icon: 'edit', command: () => this.onAction('edit') },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onAction('delete') },
    { label: 'View', icon: 'eye', command: () => this.onAction('view') },
    { label: 'Export', icon: 'download', command: () => this.onAction('export') },
    { label: 'Import', icon: 'upload', command: () => this.onAction('import') },
  ];

  private lastQueryParams: TableQueryParams | null = null;

  constructor(
    private modal: NzModalService,
    private notification: NotificationService,
    private abapService: AbapService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRuleCount();
  }

  loadRuleCount(): void {
    this.abapService.getAbapRuleCount().subscribe({
      next: (res) => {
        if (res.success) {
          this.ruleCount = res.data;
        }
      },
    });
  }

  onQueryParamsChange(params: TableQueryParams): void {
    this.lastQueryParams = params;
    this.loadData(params);
  }

  loadData(params?: TableQueryParams): void {
    const query = params || this.lastQueryParams;
    if (!query) return;

    this.loading = true;
    this.abapService.getAllRules(query).subscribe({
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
        this.router.navigate(['/sap-abap-scanner/rules-management/add-abap-rule'], {
          state: { rule: null, formType: 'add' },
        });
        break;

      case 'edit':
        if (!this.selectedRow) {
          this.notification.warn('Please select a row first');
          return;
        }
        this.router.navigate(['/sap-abap-scanner/rules-management/add-abap-rule'], {
          state: { rule: this.selectedRow, formType: 'edit' },
        });
        break;

      case 'delete':
        if (!this.selectedRow) {
          this.notification.warn('Please select a row first');
          return;
        }
        this.modal.confirm({
          nzTitle: 'Delete Rule',
          nzContent: 'Are you sure you want to delete this rule? This action cannot be undone.',
          nzOkText: 'Delete',
          nzOkDanger: true,
          nzOnOk: () => {
            this.abapService.deleteRule(this.selectedRow.id).subscribe({
              next: (res) => {
                if (res.success) {
                  this.notification.success('Deleted successfully');
                } else {
                  this.notification.error(res.message || 'Delete failed');
                }
                this.selectedRow = null;
                this.loadData();
                this.loadRuleCount();
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
        this.abapService.exportRulesReport().subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'abap_rules_report.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          },
          error: (err) => this.notification.error('Export failed: ' + (err.error?.message || 'Unknown error')),
        });
        break;

      case 'import':
        this.router.navigate(['/sap-abap-scanner/rules-management/import-rules']);
        break;
    }
  }

  // ==================== Detail Panel ====================

  openDetailPanel(row: any): void {
    this.selectedRule = row;
    this.showDetailPanel = true;
  }

  closeDetailPanel(): void {
    this.showDetailPanel = false;
    this.selectedRule = null;
  }

  editRuleFromPanel(): void {
    if (this.selectedRule) {
      this.router.navigate(['/sap-abap-scanner/rules-management/add-abap-rule'], {
        state: { rule: this.selectedRule, formType: 'edit' },
      });
    }
  }

  deleteRuleFromPanel(): void {
    if (!this.selectedRule) return;
    this.modal.confirm({
      nzTitle: 'Delete Rule',
      nzContent: 'Are you sure you want to delete this rule? This action cannot be undone.',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.abapService.deleteRule(this.selectedRule.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Deleted successfully');
            } else {
              this.notification.error(res.message || 'Delete failed');
            }
            this.loadData();
            this.loadRuleCount();
            this.closeDetailPanel();
          },
          error: (err) => this.notification.error(err.error?.message || 'Delete failed'),
        });
      },
    });
  }

  toggleRuleStatus(): void {
    if (!this.selectedRule) return;
    const actionLabel = this.selectedRule.active ? 'Deactivate' : 'Activate';
    this.modal.confirm({
      nzTitle: `${actionLabel} Rule`,
      nzContent: `Are you sure you want to ${actionLabel.toLowerCase()} this rule?`,
      nzOkText: actionLabel,
      nzOkDanger: !this.selectedRule.active ? false : true,
      nzOnOk: () => {
        this.abapService.deactivateRule(this.selectedRule.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success(`Rule ${actionLabel.toLowerCase()}d successfully`);
            } else {
              this.notification.error(res.message || `${actionLabel} failed`);
            }
            this.loadData();
            this.loadRuleCount();
            this.closeDetailPanel();
          },
          error: (err) => this.notification.error(err.error?.message || `${actionLabel} failed`),
        });
      },
    });
  }
}
