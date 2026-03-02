import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { OrgFieldService } from '../org-field.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AddOrgNameComponent } from './add-org-name/add-org-name.component';
import { TableColumn, TableAction } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-org-names',
  templateUrl: './org-names.component.html',
})
export class OrgNamesComponent implements OnInit {
  data: any[] = [];
  loading = false;

  columns: TableColumn[] = [
    { field: 'name', header: 'Org Name' },
    { field: 'description', header: 'Description' },
  ];

  tableActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onAdd() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onDelete() },
  ];

  selectedRows: any[] = [];

  constructor(
    private orgFieldService: OrgFieldService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.orgFieldService.getOrgNames().subscribe({
      next: (res) => {
        this.data = res.data?.rows || [];
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.loading = false;
      },
    });
  }

  onSelectionChange(rows: any[]): void {
    this.selectedRows = rows;
  }

  private onAdd(): void {
    this.nzModal.create({
      nzTitle: 'Add ORG Name',
      nzContent: AddOrgNameComponent,
      nzWidth: '480px',
      nzData: { formType: 'Add' },
      nzFooter: null,
      nzClassName: 'updated-modal',
    }).afterClose.subscribe(() => this.loadData());
  }

  private onDelete(): void {
    if (this.selectedRows.length === 0) {
      this.notificationService.error('Please select a row to delete');
      return;
    }

    this.confirmDialogService.confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this org name?',
    }).subscribe(result => {
      if (result) {
        this.orgFieldService.deleteOrgName(this.selectedRows[0].id).subscribe({
          next: () => {
            this.notificationService.success('Deleted successfully');
            this.selectedRows = [];
            this.loadData();
          },
          error: (err) => this.notificationService.error(err.error?.message || 'Delete failed'),
        });
      }
    });
  }
}
