import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { RoleService } from '../role.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AddLdapTitleComponent } from './add-ldap-title/add-ldap-title.component';
import { EditLdapTitleComponent } from './edit-ldap-title/edit-ldap-title.component';

@Component({
  standalone: false,
  selector: 'app-ldap-title',
  templateUrl: './ldap-title.component.html',
})
export class LdapTitleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  data: any[] = [];
  loading = false;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'ldapTitle', header: 'Title', sortable: true, filterable: true },
    { field: 'roleCount', header: 'Role Count', sortable: true, width: '120px', align: 'center' },
  ];

  tableActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.add() },
    { label: 'Edit', icon: 'edit', command: () => this.edit() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.delete() },
    { label: 'Back', icon: 'arrow-left', command: () => this.back() },
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
    this.roleService
      .ldapTitles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.data = resp.data?.rows || [];
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
        nzTitle: 'Create LDAP Title',
        nzContent: AddLdapTitleComponent,
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
        nzTitle: 'Manage LDAP Title',
        nzContent: EditLdapTitleComponent,
        nzWidth: '40vw',
        nzData: { title: this.selectedRow.ldapTitle },
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
      .confirm({ title: 'Confirm', message: 'Are you sure you want to delete this LDAP title?' })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.roleService
          .deleteLdapTitle(this.selectedRow.ldapTitle)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
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

  back(): void {
    this.router.navigateByUrl('/admin/roles');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
