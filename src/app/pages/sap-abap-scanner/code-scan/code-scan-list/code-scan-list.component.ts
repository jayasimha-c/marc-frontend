import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { AbapService } from '../../abap.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-code-scan-list',
  templateUrl: './code-scan-list.component.html',
  styleUrls: ['./code-scan-list.component.scss'],
})
export class CodeScanListComponent implements OnInit {
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', width: '200px', sortable: false },
    {
      field: 'scanType', header: 'Scan Type', width: '140px', sortable: false,
      type: 'tag',
      tagColors: { SAP_SYSTEM: 'blue', FILE_UPLOAD: 'green', GIT_REPOSITORY: 'purple' },
    },
    { field: 'sapSystemName', header: 'System Name', width: '160px', sortable: false },
    { field: 'description', header: 'Description', ellipsis: true, sortable: false },
    { field: 'createdDate', header: 'Created At', type: 'date', width: '160px', sortable: false },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus', type: 'primary', command: () => this.onAction('add') },
    { label: 'Edit', icon: 'edit', command: () => this.onAction('edit') },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onAction('delete') },
  ];

  private lastQueryParams: TableQueryParams | null = null;

  constructor(
    private abapService: AbapService,
    private router: Router,
    private notification: NotificationService,
    private modal: NzModalService
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
    this.abapService.getCodeScanList(query).subscribe({
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
        this.router.navigate(['/sap-abap-scanner/code-scan/add'], {
          state: { codeScan: null, formType: 'add' },
        });
        break;

      case 'edit':
        if (!this.selectedRow) {
          this.notification.warn('Please select a row first');
          return;
        }
        this.router.navigate(['/sap-abap-scanner/code-scan/add'], {
          state: { codeScan: this.selectedRow, formType: 'edit' },
        });
        break;

      case 'delete':
        if (!this.selectedRow) {
          this.notification.warn('Please select a row first');
          return;
        }
        this.modal.confirm({
          nzTitle: 'Confirm Delete',
          nzContent: 'Are you sure you want to delete this code scan?',
          nzOkText: 'Delete',
          nzOkDanger: true,
          nzOnOk: () => {
            this.abapService.deleteCodeScan(this.selectedRow.id).subscribe({
              next: (res) => {
                if (res.success) {
                  this.notification.success('Deleted successfully');
                } else {
                  this.notification.error(res.message || 'Delete failed');
                }
                this.selectedRow = null;
                this.loadData();
              },
              error: (err) => this.notification.error(err.error?.message || 'Delete failed'),
            });
          },
        });
        break;
    }
  }
}
