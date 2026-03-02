import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { CamService } from '../../cam.service';
import { ApiResponse } from '../../../../core/models/api-response';
import { AddUserRestrictionsComponent } from './add-user-restrictions/add-user-restrictions.component';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

interface UserException {
  id: number;
  userId: string;
  system: { destinationName: string };
}

@Component({
  standalone: false,
  selector: 'app-user-restrictions',
  templateUrl: './user-restrictions.component.html',
})
export class UserRestrictionsComponent implements OnInit {
  data: UserException[] = [];
  sapSystemList: any[] = [];
  loading = false;
  selectedRows: UserException[] = [];

  columns: TableColumn<UserException>[] = [
    { field: 'userId', header: 'User ID', filterable: true },
    { field: 'system.destinationName', header: 'System Name', filterable: true },
  ];

  tableActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onAdd() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onDelete() },
  ];

  constructor(
    private modal: NzModalService,
    private notificationService: NotificationService,
    private camService: CamService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.camService.getUserException().subscribe({
      next: (resp: any) => {
        this.data = resp?.data?.list || [];
        this.sapSystemList = resp?.data?.sapSystems || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSelectionChange(selected: UserException[]): void {
    this.selectedRows = selected;
  }

  onAdd(): void {
    this.modal
      .create({
        nzTitle: 'Add User Exception',
        nzContent: AddUserRestrictionsComponent,
        nzWidth: '500px',
        nzData: this.sapSystemList,
        nzFooter: null,
      })
      .afterClose.subscribe((result) => {
        if (result) {
          this.notificationService.success(result);
          this.loadData();
        }
      });
  }

  onDelete(): void {
    if (this.selectedRows.length === 0) {
      this.notificationService.error('Please select a row');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Confirm Delete',
      nzContent: 'Are you sure you want to delete the selected records?',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        const ids = this.selectedRows.map((r) => r.id);
        this.camService.deleteUserException(ids).subscribe((resp: ApiResponse) => {
          this.notificationService.success(resp.message || 'Deleted successfully');
          this.selectedRows = [];
          this.loadData();
        });
      },
    });
  }
}
