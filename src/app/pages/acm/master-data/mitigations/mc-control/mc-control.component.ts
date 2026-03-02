import { Component, OnInit, OnDestroy } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { MitigationsService } from '../mitigations.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AddMitigationComponent } from './add-mitigation/add-mitigation.component';
import { AddRemoveUsersComponent } from './add-remove-users/add-remove-users.component';
import { AddRemoveOwnersComponent } from './add-remove-owners/add-remove-owners.component';
import { AddRemoveIcmControlsComponent } from './add-remove-icm-controls/add-remove-icm-controls.component';
import { TableColumn, TableAction } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-mc-control',
  templateUrl: './mc-control.component.html',
  styleUrls: ['./mc-control.component.scss'],
})
export class MCControlComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Main table
  data: any[] = [];
  total = 0;
  loading = true;
  selectedMitigation: any = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Mitigation ID', sortable: true, filterable: true },
    { field: 'description', header: 'Description', sortable: true, filterable: true },
    { field: 'sapSystemName', header: 'System', sortable: true, filterable: true, width: '120px' },
    { field: 'riskName', header: 'Risk', sortable: true, filterable: true, type: 'link' },
    { field: 'riskDescription', header: 'Risk Description', sortable: true },
    { field: 'notification', header: 'Notification', type: 'boolean', width: '100px' },
  ];

  tableActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', pinned: true, command: () => this.onAdd() },
    { label: 'Edit', icon: 'edit', command: () => this.onEdit() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onDelete() },
    { label: 'Add/Remove Users', icon: 'team', command: () => this.onManageUsers() },
    { label: 'Add/Remove Owners', icon: 'user-add', command: () => this.onManageOwners() },
    { label: 'Add/Remove ICM Controls', icon: 'control', command: () => this.onManageIcmControls() },
  ];

  // Sub-tables
  usersData: any[] = [];
  ownersData: any[] = [];
  icmControlsData: any[] = [];
  activeTabIndex = 0;

  constructor(
    private mitigationsService: MitigationsService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Main Table ───────────────────────────────────────────

  onQueryParamsChange(params: any): void {
    this.loading = true;
    const { pageIndex, pageSize, sort, filters, globalSearch } = params;
    const sortField = sort?.key || '';
    const sortOrder = sort?.value === 'ascend' ? 1 : -1;

    // Build filters object
    const filterObj: any = {};
    if (filters) {
      Object.entries(filters).forEach(([key, val]: [string, any]) => {
        if (val) filterObj[key] = [{ value: val, matchMode: 'contains' }];
      });
    }
    if (globalSearch) {
      filterObj.global = globalSearch;
    }

    const first = (pageIndex - 1) * pageSize;
    this.mitigationsService.getAllMitigations(first, pageSize, sortOrder, sortField, filterObj)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.data = (res.data?.rows || []).map((row: any) => ({
            ...row,
            hasAttachment: !!(row.attachmentId || row.dbAttachmentId),
          }));
          this.total = res.data?.records || 0;
          this.loading = false;
          // Clear sub-tables when main data changes
          this.usersData = [];
          this.ownersData = [];
          this.icmControlsData = [];
          this.selectedMitigation = null;
        },
        error: () => {
          this.data = [];
          this.loading = false;
        },
      });
  }

  onRowClick(row: any): void {
    this.selectedMitigation = row;
    this.loadSubTables(row.id);
  }

  private loadSubTables(mitigationId: number): void {
    this.mitigationsService.getMitigationUsers(mitigationId)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.usersData = res.data || []; },
      });

    this.mitigationsService.getMitigationOwners(mitigationId)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.ownersData = res.data || []; },
      });

    this.mitigationsService.getMitigationIcmControls(mitigationId, 0, 50, 1, '', null)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.icmControlsData = res.data?.rows || []; },
      });
  }

  // ── Actions ──────────────────────────────────────────────

  onAdd(): void {
    const ref = this.nzModal.create({
      nzTitle: 'Add Mitigation',
      nzContent: AddMitigationComponent,
      nzWidth: '500px',
      nzFooter: null,
      nzData: { formType: 'add' },
    });
    ref.afterClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.refreshTable();
    });
  }

  onEdit(): void {
    if (!this.checkSelected()) return;
    const ref = this.nzModal.create({
      nzTitle: 'Edit Mitigation',
      nzContent: AddMitigationComponent,
      nzWidth: '500px',
      nzFooter: null,
      nzData: { formType: 'edit', mitigationData: this.selectedMitigation },
    });
    ref.afterClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.refreshTable();
    });
  }

  onDelete(): void {
    if (!this.checkSelected()) return;
    this.confirmDialog.confirm({
      title: 'Delete',
      message: 'Please confirm before deleting.',
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.mitigationsService.deleteMitigation(this.selectedMitigation.id)
        .pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.notificationService.success(`The Mitigation: ${this.selectedMitigation.name} has been deleted successfully.`);
              this.refreshTable();
            }
          },
          error: (err: any) => this.notificationService.error(err?.error?.message || 'Delete failed'),
        });
    });
  }

  onManageUsers(): void {
    if (!this.checkSelected()) return;
    const ref = this.nzModal.create({
      nzTitle: `Add Users To Mitigation - ${this.selectedMitigation.name}`,
      nzContent: AddRemoveUsersComponent,
      nzWidth: '90vw',
      nzFooter: null,
      nzClassName: 'updated-modal',
      nzData: { mitigationId: this.selectedMitigation.id, mitigationName: this.selectedMitigation.name },
    });
    ref.afterClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.loadSubTables(this.selectedMitigation.id);
    });
  }

  onManageOwners(): void {
    if (!this.checkSelected()) return;
    const ref = this.nzModal.create({
      nzTitle: `Add Owners To Mitigation - ${this.selectedMitigation.name}`,
      nzContent: AddRemoveOwnersComponent,
      nzWidth: '90vw',
      nzFooter: null,
      nzClassName: 'updated-modal',
      nzData: { mitigationId: this.selectedMitigation.id, mitigationName: this.selectedMitigation.name },
    });
    ref.afterClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.loadSubTables(this.selectedMitigation.id);
    });
  }

  onManageIcmControls(): void {
    if (!this.checkSelected()) return;
    const ref = this.nzModal.create({
      nzTitle: `Add ICM Controls To Mitigation - ${this.selectedMitigation.name}`,
      nzContent: AddRemoveIcmControlsComponent,
      nzWidth: '85vw',
      nzFooter: null,
      nzClassName: 'updated-modal',
      nzData: { mitigationId: this.selectedMitigation.id, mitigationName: this.selectedMitigation.name },
    });
    ref.afterClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.loadSubTables(this.selectedMitigation.id);
    });
  }

  private checkSelected(): boolean {
    if (!this.selectedMitigation) {
      this.notificationService.error('Please select a row');
      return false;
    }
    return true;
  }

  private refreshTable(): void {
    // Re-trigger query with current params by toggling loading
    this.onQueryParamsChange({ pageIndex: 1, pageSize: 20, sort: {}, filters: {} });
  }
}
