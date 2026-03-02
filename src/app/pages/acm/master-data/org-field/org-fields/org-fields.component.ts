import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { OrgFieldService } from '../org-field.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AddOrgFieldComponent } from './add-org-field/add-org-field.component';
import { InitializeDialogComponent } from './initialize-dialog/initialize-dialog.component';
import { DownloadDialogComponent } from './download-dialog/download-dialog.component';
import { TableColumn, TableAction } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-org-fields',
  templateUrl: './org-fields.component.html',
  styleUrls: ['./org-fields.component.scss'],
})
export class OrgFieldsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Table 1: ORG Field Catalogue
  data: any[] = [];
  loading = false;
  selectedRow: any = null;
  searchText = new FormControl('');

  columns: TableColumn[] = [
    { field: 'fieldName', header: 'ORG Field' },
    { field: 'description', header: 'Description' },
    { field: 'sapSystemName', header: 'SAP System' },
    { field: 'active', header: 'Active', type: 'boolean' },
  ];

  tableActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onAdd() },
    { label: 'Edit', icon: 'edit', command: () => this.onEdit() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onDelete() },
    { label: 'Initialize Default', icon: 'setting', command: () => this.onInitialize() },
    { label: 'Download', icon: 'download', command: () => this.onDownload() },
  ];

  // Table 2: ORG Field Values (inline editable)
  fieldValues: any[] = [];
  fieldValuesLoading = false;
  orgNames: string[] = [];
  editMode = false;

  constructor(
    private orgFieldService: OrgFieldService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadOrgNames();
    this.loadData('');
    this.searchText.valueChanges.pipe(
      debounceTime(500),
      takeUntil(this.destroy$),
    ).subscribe(value => this.loadData(value || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Table 1 ──

  loadData(search: string): void {
    this.loading = true;
    this.orgFieldService.getOrgFields(search).subscribe({
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

  onRowClick(row: any): void {
    this.selectedRow = row;
    this.editMode = false;
    this.loadFieldValues();
  }

  private loadOrgNames(): void {
    this.orgFieldService.getOrgNames().subscribe({
      next: (res) => {
        this.orgNames = (res.data?.rows || []).map((r: any) => r.name);
      },
      error: () => { this.orgNames = []; },
    });
  }

  private loadFieldValues(): void {
    if (!this.selectedRow) return;
    this.fieldValuesLoading = true;
    this.orgFieldService.getOrgFieldValues(this.selectedRow.id).subscribe({
      next: (res) => {
        this.fieldValues = (res.data?.rows || []).map((r: any) => ({ ...r }));
        this.fieldValuesLoading = false;
      },
      error: () => {
        this.fieldValues = [];
        this.fieldValuesLoading = false;
      },
    });
  }

  onAdd(): void {
    this.nzModal.create({
      nzTitle: 'Add ORG Field',
      nzContent: AddOrgFieldComponent,
      nzWidth: '480px',
      nzData: { formType: 'Add' },
      nzFooter: null,
      nzClassName: 'updated-modal',
    }).afterClose.subscribe(() => this.loadData(this.searchText.value || ''));
  }

  onEdit(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row to edit');
      return;
    }
    this.nzModal.create({
      nzTitle: 'Edit ORG Field',
      nzContent: AddOrgFieldComponent,
      nzWidth: '480px',
      nzData: { formType: 'Edit', data: this.selectedRow },
      nzFooter: null,
      nzClassName: 'updated-modal',
    }).afterClose.subscribe(() => this.loadData(this.searchText.value || ''));
  }

  onDelete(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row to delete');
      return;
    }
    this.confirmDialogService.confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this org field?',
    }).subscribe(result => {
      if (result) {
        this.orgFieldService.deleteOrgField(this.selectedRow.id).subscribe({
          next: () => {
            this.notificationService.success('Deleted successfully');
            this.selectedRow = null;
            this.fieldValues = [];
            this.loadData(this.searchText.value || '');
          },
          error: (err) => this.notificationService.error(err.error?.message || 'Delete failed'),
        });
      }
    });
  }

  onInitialize(): void {
    this.nzModal.create({
      nzTitle: 'Initialize Default Org Fields',
      nzContent: InitializeDialogComponent,
      nzWidth: '450px',
      nzFooter: null,
      nzClassName: 'updated-modal',
    }).afterClose.subscribe(sapSystemId => {
      if (sapSystemId) {
        this.orgFieldService.initializeDefaultOrgFields(sapSystemId).subscribe({
          next: (res) => {
            this.notificationService.success(res.message || 'Default org fields initialized successfully');
            this.loadData(this.searchText.value || '');
          },
          error: (err) => this.notificationService.error(err.error?.message || 'Failed to initialize org fields'),
        });
      }
    });
  }

  onDownload(): void {
    this.nzModal.create({
      nzTitle: 'Download ORG Fields',
      nzContent: DownloadDialogComponent,
      nzWidth: '450px',
      nzFooter: null,
      nzClassName: 'updated-modal',
    });
  }

  // ── Table 2: Field Values ──

  onEditValues(): void {
    this.editMode = true;
  }

  onCancelEdit(): void {
    this.editMode = false;
    this.loadFieldValues();
  }

  onAddRow(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select an ORG Field first');
      return;
    }
    this.editMode = true;
    this.fieldValues = [...this.fieldValues, { orgName: '', fieldValue: '', isNew: true }];
  }

  onSaveValues(): void {
    if (!this.selectedRow) return;
    const dataToSave = this.fieldValues.map(({ isNew, ...item }) => item);
    this.orgFieldService.saveOrgFieldValues({ fieldId: this.selectedRow.id, data: dataToSave }).subscribe({
      next: () => {
        this.notificationService.success('Saved successfully');
        this.editMode = false;
        this.loadFieldValues();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Save failed'),
    });
  }

  onDeleteRow(index: number): void {
    this.fieldValues.splice(index, 1);
    this.fieldValues = [...this.fieldValues];
  }
}
