import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { AuthenticationMgmtService } from '../authentication.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AddEditOperationComponent } from './add-edit-operation/add-edit-operation.component';

@Component({
  standalone: false,
  selector: 'app-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss'],
})
export class OperationComponent implements OnInit {
  data: any[] = [];
  loading = false;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'operationName', header: 'Name', sortable: true, filterable: true },
    { field: 'roleDescription', header: 'Description', sortable: true, filterable: true },
    { field: 'grantedAuthority', header: 'Authority', sortable: true, filterable: true },
  ];

  tableActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onAction('add') },
    { label: 'Edit', icon: 'edit', command: () => this.onAction('edit') },
  ];

  constructor(
    private authService: AuthenticationMgmtService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.authService.getOperations().subscribe({
      next: (resp) => {
        if (resp.data) {
          this.data = resp.data.rows || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onAction(action: string): void {
    if (action === 'edit' && !this.selectedRow) {
      this.notificationService.error('Please select a row for editing.');
      return;
    }

    this.nzModal
      .create({
        nzTitle: (action === 'add' ? 'Add' : 'Edit') + ' Operation',
        nzContent: AddEditOperationComponent,
        nzWidth: '40vw',
        nzData: { formType: action, data: this.selectedRow },
        nzFooter: null,
        nzClassName: 'updated-modal',
      })
      .afterClose.subscribe(() => {
        this.loadData();
      });
  }
}
