import { Component, OnInit, ViewChild, AfterViewInit, TemplateRef } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CamService } from '../../cam.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiResponse } from '../../../../core/models/api-response';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { InlineColumn, TableAction as ITableAction } from '../../../../shared/components/inline-table/inline-table.models';
import { InlineTableComponent } from '../../../../shared/components/inline-table/inline-table.component';
import { AddUserProvisionFieldComponent } from './add-user-provision-field/add-user-provision-field.component';

@Component({
  standalone: false,
  selector: 'app-user-provision-field',
  templateUrl: './user-provision-field.component.html',
})
export class UserProvisionFieldComponent implements OnInit, AfterViewInit {
  @ViewChild('valuesTable') valuesTable!: InlineTableComponent;
  @ViewChild('fieldValueTpl', { static: true }) fieldValueTpl!: TemplateRef<any>;

  // ─── Master table (fields) ────────────────────────
  fieldsData: any[] = [];
  fieldsLoading = false;
  selectedField: any = null;

  fieldsColumns: TableColumn[] = [
    { field: 'fieldName', header: 'Field', filterable: true },
    { field: 'fieldDesc', header: 'Description', filterable: true },
    { field: 'active', header: 'Active', type: 'boolean', width: '80px', align: 'center' },
  ];

  fieldsActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onFieldAction('add') },
    { label: 'Edit', icon: 'edit', command: () => this.onFieldAction('edit') },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onFieldAction('delete') },
  ];

  // ─── Detail table (field values) ──────────────────
  valuesData: any[] = [];
  valuesLoading = false;

  valuesColumns: InlineColumn[] = [
    {
      field: 'sapSystem',
      header: 'Select System',
      type: 'select',
      showSearch: true,
      options: [],
    },
    {
      field: 'fieldValue',
      header: 'Field Value',
      type: 'template',
    },
  ];

  valuesActions: ITableAction[] = [
    { label: 'Save', icon: 'save', type: 'primary', pinned: true, command: () => this.onValuesSave() },
    { label: 'Add Row', icon: 'plus-circle', command: () => this.onValuesAddRow() },
    { label: 'Discard', icon: 'undo', danger: true, command: () => this.loadFieldValues() },
  ];

  // ─── Reference data ───────────────────────────────
  fieldNamesList: string[] = [];
  sapSystems: string[] = [];
  dateFormats: string[] = [];
  timeFormats: string[] = [];
  languageList: string[] = [];
  pp2Values = ['H(old) for hold', 'G(o) for output immediately'];
  pp3Values = ['D(elete) for delete immediately', 'K(eep) for keep'];
  decimalFormats = ['1234567,89', '1234567.89', '1234 567,89'];

  constructor(
    private modal: NzModalService,
    private camService: CamService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadFields();
    this.loadRequiredInfo();
  }

  ngAfterViewInit(): void {
    const valueCol = this.valuesColumns.find(c => c.field === 'fieldValue');
    if (valueCol && this.fieldValueTpl) {
      valueCol.templateRef = this.fieldValueTpl;
    }
  }

  // ─── Master table handlers ────────────────────────

  onFieldRowClick(row: any): void {
    this.selectedField = row;
    this.loadFieldValues();
  }

  private onFieldAction(action: string): void {
    switch (action) {
      case 'add':
        this.openFieldDialog('add');
        break;
      case 'edit':
        if (!this.selectedField) {
          this.notificationService.error('Please select a row first');
          return;
        }
        this.openFieldDialog('edit');
        break;
      case 'delete':
        if (!this.selectedField) {
          this.notificationService.error('Please select a row first');
          return;
        }
        this.modal.confirm({
          nzTitle: 'Confirm',
          nzContent: 'Are you sure you want to delete this record?',
          nzOkText: 'Delete',
          nzOkDanger: true,
          nzOnOk: () => {
            this.camService.provisionUserFieldDelete(this.selectedField.id).subscribe({
              next: (resp: ApiResponse) => {
                this.notificationService.success(resp.message || 'Deleted successfully');
                this.selectedField = null;
                this.valuesData = [];
                this.loadFields();
              },
              error: ({ error }) => {
                this.notificationService.error(error?.message || 'Delete failed');
              },
            });
          },
        });
        break;
    }
  }

  private openFieldDialog(action: string): void {
    this.modal
      .create({
        nzTitle: action === 'edit' ? 'Edit User Provision Field' : 'Add User Provision Field',
        nzContent: AddUserProvisionFieldComponent,
        nzWidth: '500px',
        nzData: { action, data: this.selectedField, fields: this.fieldNamesList },
        nzFooter: null,
        nzClassName: 'updated-modal',
      })
      .afterClose.subscribe((result) => {
        if (result) this.loadFields();
      });
  }

  // ─── Detail table handlers ────────────────────────

  onValuesAddRow(): void {
    if (!this.selectedField) {
      this.notificationService.error('Please select a field first');
      return;
    }
    this.valuesTable.addRow();
  }

  onValuesSave(): void {
    if (!this.selectedField) return;

    const payload = {
      fieldId: this.selectedField.id,
      data: this.valuesData
        .map(r => ({ sapSystem: r.sapSystem, fieldValue: r.fieldValue }))
        .filter(r => r.sapSystem),
    };

    this.camService.provisionUserFieldSaveValues(payload).subscribe({
      next: () => {
        this.notificationService.success('Saved successfully');
        this.valuesTable?.markClean();
      },
      error: ({ error }) => {
        this.notificationService.error(error?.message || 'Save failed');
      },
    });
  }

  onValueChange(row: any): void {
    this.valuesTable.onCellChange(row, 'fieldValue');
  }

  private readonly fieldValueMap: Record<string, () => string[]> = {
    LANGU: () => this.languageList,
    DATFM: () => this.dateFormats,
    TIMEFM: () => this.timeFormats,
    SPDB: () => this.pp2Values,
    SPDA: () => this.pp3Values,
    DCPFM: () => this.decimalFormats,
  };

  getFieldValueOptions(): string[] {
    const fn = this.fieldValueMap[this.selectedField?.fieldName];
    return fn ? fn() : [];
  }

  hasDropdownValues(): boolean {
    return !!this.fieldValueMap[this.selectedField?.fieldName];
  }

  // ─── Data loading ─────────────────────────────────

  private loadFields(): void {
    this.fieldsLoading = true;
    this.camService.getAllProvisionUserFields().subscribe({
      next: (resp: ApiResponse) => {
        this.fieldsData = resp.data?.rows || [];
        this.fieldsLoading = false;
      },
      error: () => {
        this.fieldsLoading = false;
      },
    });
  }

  loadFieldValues(): void {
    if (!this.selectedField?.id) {
      this.valuesData = [];
      return;
    }
    this.valuesLoading = true;
    this.camService.getProvisionUserField(this.selectedField.id).subscribe({
      next: (resp: ApiResponse) => {
        this.valuesData = resp.data?.rows || [];
        this.valuesLoading = false;
      },
      error: () => {
        this.valuesLoading = false;
      },
    });
  }

  private loadRequiredInfo(): void {
    this.camService.getProvisionUserRequiredInfo().subscribe((resp: ApiResponse) => {
      this.sapSystems = resp.data?.systems || [];
      this.fieldNamesList = resp.data?.fields || [];
      this.dateFormats = resp.data?.dateFormats || [];
      this.timeFormats = resp.data?.timeFormats || [];
      this.languageList = resp.data?.languagList || [];

      // Update sapSystem column options
      const sysCol = this.valuesColumns.find(c => c.field === 'sapSystem');
      if (sysCol) sysCol.options = this.sapSystems;
    });
  }
}
