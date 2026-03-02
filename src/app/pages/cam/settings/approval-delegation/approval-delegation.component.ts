import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { CamService } from '../../cam.service';
import { ApiResponse } from '../../../../core/models/api-response';
import { TableColumn, TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { AddApprovalDelegationComponent } from './add-approval-delegation/add-approval-delegation.component';

@Component({
  standalone: false,
  selector: 'app-approval-delegation',
  templateUrl: './approval-delegation.component.html',
})
export class ApprovalDelegationComponent implements OnInit {
  data: any[] = [];
  loading = false;
  totalRecords = 0;
  selectedRow: any = null;
  private lastQuery: TableQueryParams | null = null;

  columns: TableColumn[] = [
    { field: 'delegatorName', header: 'Delegator', filterable: true },
    { field: 'assignerName', header: 'Assign To', filterable: true },
    { field: 'requestDate', header: 'Request Date', type: 'date', dateFormat: 'dd/MM/yyyy HH:mm' },
    { field: 'validFrom', header: 'Valid From', type: 'date', dateFormat: 'dd/MM/yyyy HH:mm' },
    { field: 'validTo', header: 'Valid To', type: 'date', dateFormat: 'dd/MM/yyyy HH:mm' },
    { field: 'camApprover', header: 'CAM Approver', type: 'boolean', width: '120px', align: 'center' },
    { field: 'pamApprover', header: 'PAM Approver', type: 'boolean', width: '120px', align: 'center' },
    { field: 'pamReviewer', header: 'PAM Reviewer', type: 'boolean', width: '120px', align: 'center' },
    { field: 'active', header: 'Active', type: 'boolean', width: '80px', align: 'center' },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.openDialog('add') },
    { label: 'Edit', icon: 'edit', command: () => this.openDialog('edit') },
    { label: 'Add With Admin', icon: 'plus-circle', command: () => this.openDialog('add-with-admin') },
    { label: 'Edit With Admin', icon: 'edit', command: () => this.openDialog('edit-with-admin') },
  ];

  constructor(
    private modal: NzModalService,
    private notificationService: NotificationService,
    private camService: CamService,
  ) {}

  ngOnInit(): void {}

  onQueryChange(params: TableQueryParams): void {
    this.lastQuery = params;
    this.loadData(params);
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  private loadData(params: TableQueryParams): void {
    this.loading = true;
    const sortDir = params.sort?.direction === 'ascend' ? 1 : params.sort?.direction === 'descend' ? -1 : 1;
    this.camService.getDelegates({
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sortField: params.sort?.field || '',
      sortOrder: sortDir,
      filters: params.filters,
    }).subscribe({
      next: (resp: ApiResponse) => {
        this.data = resp.data?.rows || [];
        this.totalRecords = resp.data?.records || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private openDialog(action: string): void {
    if (action.includes('edit') && !this.selectedRow) {
      this.notificationService.error('Please select a row first');
      return;
    }

    const isAdmin = action.includes('admin');
    const isEdit = action.includes('edit');
    const title = (isEdit ? 'Edit' : 'Add') + ' Approval Delegation' + (isAdmin ? ' with Admin' : '');

    this.modal
      .create({
        nzTitle: title,
        nzContent: AddApprovalDelegationComponent,
        nzWidth: '500px',
        nzData: { formType: action, id: this.selectedRow?.id, data: this.selectedRow },
        nzFooter: null,
        nzClassName: 'updated-modal',
      })
      .afterClose.subscribe((result) => {
        if (result && this.lastQuery) {
          this.loadData(this.lastQuery);
        }
      });
  }
}
