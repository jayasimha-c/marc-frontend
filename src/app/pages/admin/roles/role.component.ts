import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';
import { RoleService } from './role.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AddRoleComponent } from './add-role/add-role.component';
import { EditRoleComponent } from './edit-role/edit-role.component';
import { EditRoleOperationComponent } from './edit-role-operation/edit-role-operation.component';

@Component({
  standalone: false,
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.scss'],
})
export class RoleComponent implements OnInit {
  data: any[] = [];
  loading = false;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'roleName', header: 'Name', sortable: true, filterable: true },
    { field: 'roleDescription', header: 'Description', sortable: true, filterable: true },
  ];

  tableActions: TableAction[] = [
    { label: 'LDAP Titles', icon: 'unordered-list', command: () => this.goToLdapTitles() },
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.add() },
    { label: 'Edit', icon: 'edit', command: () => this.edit() },
    { label: 'Edit Operations', icon: 'setting', command: () => this.editOperations() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.delete() },
  ];

  constructor(
    private roleService: RoleService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.roleService.list().subscribe({
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

  add(): void {
    this.nzModal
      .create({
        nzTitle: 'Create a new role',
        nzContent: AddRoleComponent,
        nzWidth: '40vw',
        nzFooter: null,
        nzClassName: 'updated-modal',
      })
      .afterClose.subscribe((result) => {
        if (result) this.loadData();
      });
  }

  edit(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row.');
      return;
    }
    this.nzModal
      .create({
        nzTitle: 'Update Role',
        nzContent: EditRoleComponent,
        nzWidth: '40vw',
        nzData: { roleId: this.selectedRow.id },
        nzFooter: null,
        nzClassName: 'updated-modal',
      })
      .afterClose.subscribe((result) => {
        if (result) this.loadData();
      });
  }

  editOperations(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row.');
      return;
    }
    this.nzModal
      .create({
        nzTitle: 'Manage Role Operations',
        nzContent: EditRoleOperationComponent,
        nzWidth: '40vw',
        nzData: { role: this.selectedRow },
        nzFooter: null,
        nzClassName: 'updated-modal',
      })
      .afterClose.subscribe((result) => {
        if (result) this.loadData();
      });
  }

  delete(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row.');
      return;
    }
    this.confirmDialog
      .confirm({ title: 'Confirm', message: 'Are you sure you want to delete this role?' })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.roleService.delete(this.selectedRow.id).subscribe({
          next: (resp) => {
            this.notificationService.show(resp);
            this.loadData();
          },
          error: (err) => {
            this.notificationService.handleHttpError(err);
          },
        });
      });
  }

  private goToLdapTitles(): void {
    this.router.navigateByUrl('/admin/roles/ldap-titles');
  }
}
