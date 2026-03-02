import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil, tap, catchError, throwError } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AddUserComponent } from './add-user/add-user.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { UserRoleComponent } from './user-role/user-role.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AuthenticationMgmtService } from '../authentication.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-admin-users',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  users: any[] = [];
  loading = false;
  selectedUser: any = null;

  columns: TableColumn[] = [
    { field: 'id', header: 'Id', sortable: true, filterable: true, width: '80px' },
    { field: 'username', header: 'Username', sortable: true, filterable: true },
    { field: 'firstName', header: 'First Name', sortable: true, filterable: true },
    { field: 'lastName', header: 'Last Name', sortable: true, filterable: true },
    { field: 'email', header: 'Email', sortable: true, filterable: true },
    { field: 'enabled', header: 'Enabled', type: 'boolean', sortable: true, width: '100px', align: 'center' },
  ];

  tableActions: TableAction[] = [
    { label: 'Add', icon: 'user-add', type: 'primary', command: () => this.addUser() },
    { label: 'Edit', icon: 'edit', command: () => this.updateUser('Edit') },
    { label: 'Copy', icon: 'copy', command: () => this.updateUser('Copy') },
    { label: 'Roles', icon: 'team', command: () => this.roles() },
    { label: 'Password', icon: 'lock', command: () => this.updatePassword() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.deleteUser() },
  ];

  constructor(
    private authService: AuthenticationMgmtService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    this.authService.list()
      .pipe(takeUntil(this.destroy$))
      .subscribe(resp => {
        this.users = resp.data?.rows || [];
        this.loading = false;
      });
  }

  onRowClick(row: any): void {
    this.selectedUser = row;
  }

  private addUser(): void {
    this.selectedUser = null;
    this.openUserModal('Add');
  }

  private updateUser(action: string): void {
    if (!this.checkUserSelected()) return;
    this.openUserModal(action);
  }

  private checkUserSelected(): boolean {
    if (!this.selectedUser) {
      this.notificationService.error('Please select a user');
      return false;
    }
    return true;
  }

  private openUserModal(action: string): void {
    this.nzModal
      .create({
        nzTitle: action + ' User',
        nzContent: AddUserComponent,
        nzWidth: '40vw',
        nzData: { user: this.selectedUser, formType: action },
        nzFooter: null,
        nzClassName: 'updated-modal',
      })
      .afterClose.subscribe(result => {
        if (result) {
          this.loadUsers();
          this.selectedUser = null;
        }
      });
  }

  private updatePassword(): void {
    if (!this.checkUserSelected()) return;
    this.nzModal.create({
      nzTitle: 'Update User Password',
      nzContent: PasswordResetComponent,
      nzWidth: '40vw',
      nzData: { user: this.selectedUser },
      nzFooter: null,
      nzClassName: 'updated-modal',
    });
  }

  private roles(): void {
    if (!this.checkUserSelected()) return;
    this.nzModal.create({
      nzTitle: 'Change User Roles',
      nzContent: UserRoleComponent,
      nzWidth: '40vw',
      nzData: { user: this.selectedUser },
      nzFooter: null,
      nzClassName: 'updated-modal',
    });
  }

  private deleteUser(): void {
    if (!this.checkUserSelected()) return;
    this.confirmDialogService
      .confirm({ title: 'Confirm', message: 'Are you sure you want to delete this user?' })
      .subscribe(result => {
        if (result) {
          this.authService.delete(this.selectedUser.id)
            .pipe(
              tap(resp => {
                this.notificationService.show(resp);
                this.loadUsers();
                this.selectedUser = null;
              }),
              catchError(err => {
                this.notificationService.error(err?.error?.message || 'Delete failed');
                return throwError(() => err);
              }),
              takeUntil(this.destroy$),
            )
            .subscribe();
        }
      });
  }
}
