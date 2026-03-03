import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { MASTER_DATA_TYPES, MasterDataType, MasterDataItem } from './master-data.types';
import { MasterDataService } from './master-data.service';
import { MasterDataEditDialogComponent } from './master-data-edit-dialog.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-master-data-manager',
  templateUrl: './master-data-manager.component.html',
  styleUrls: ['./master-data-manager.component.scss'],
})
export class MasterDataManagerComponent implements OnInit {
  dataTypes = MASTER_DATA_TYPES;
  selectedTypeKey = 'categories';

  loading = false;
  data: MasterDataItem[] = [];
  totalRecords = 0;

  columns: TableColumn[] = [];
  actions: TableAction[] = [];

  private readonly initialDataTemplates: Record<string, MasterDataItem[]> = {
    categories: [
      { name: 'Access Control', description: 'Controls related to user access and permissions', isActive: true },
      { name: 'Change Management', description: 'Controls for managing system changes', isActive: true },
      { name: 'Data Integrity', description: 'Controls ensuring data accuracy and consistency', isActive: true },
      { name: 'Security', description: 'Security-related controls', isActive: true },
      { name: 'Segregation of Duties', description: 'SoD controls for conflict prevention', isActive: true },
      { name: 'Audit & Logging', description: 'Controls for audit trails and logging', isActive: true },
      { name: 'Backup & Recovery', description: 'Controls for data backup and disaster recovery', isActive: true },
      { name: 'Compliance', description: 'Regulatory compliance controls', isActive: true },
    ],
    groups: [
      { name: 'Finance', description: 'Financial controls group', isActive: true },
      { name: 'IT Operations', description: 'IT operational controls', isActive: true },
      { name: 'Human Resources', description: 'HR-related controls', isActive: true },
      { name: 'Procurement', description: 'Procurement and purchasing controls', isActive: true },
      { name: 'Sales', description: 'Sales process controls', isActive: true },
      { name: 'Inventory', description: 'Inventory management controls', isActive: true },
      { name: 'General', description: 'General purpose controls', isActive: true },
    ],
    regulations: [
      { name: 'SOX', description: 'Sarbanes-Oxley Act compliance' },
      { name: 'GDPR', description: 'General Data Protection Regulation' },
      { name: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' },
      { name: 'PCI-DSS', description: 'Payment Card Industry Data Security Standard' },
      { name: 'ISO 27001', description: 'Information Security Management System' },
      { name: 'COBIT', description: 'Control Objectives for Information Technologies' },
      { name: 'NIST', description: 'National Institute of Standards and Technology' },
    ],
  };

  constructor(
    private masterDataService: MasterDataService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.buildActions();
    this.updateColumns();
    this.loadData();
  }

  get selectedType(): MasterDataType {
    return this.dataTypes.find(t => t.key === this.selectedTypeKey) || this.dataTypes[0];
  }

  onCategoryChange(): void {
    this.updateColumns();
    this.loadData();
  }

  private buildActions(): void {
    this.actions = [
      { label: 'Add', icon: 'plus', type: 'primary', command: () => this.openEditDialog() },
      { label: 'Add Initial Data', icon: 'unordered-list', command: () => this.addInitialData() },
      { label: 'Export', icon: 'download', command: () => this.exportData() },
    ];
  }

  private updateColumns(): void {
    const type = this.selectedType;
    const baseCols: TableColumn[] = [
      { field: 'name', header: 'Name', sortable: true },
      { field: 'description', header: 'Description', sortable: true },
    ];

    if (type.hasActiveField) {
      baseCols.push({
        field: 'status',
        header: 'Status',
        type: 'tag',
        tagColors: { Active: 'green', Inactive: 'red' },
        sortable: true,
        width: '120px',
      });
    }

    baseCols.push({
      field: '_actions',
      header: '',
      type: 'actions',
      width: '100px',
      fixed: 'right',
      actions: [
        { icon: 'edit', tooltip: 'Edit', command: (row: MasterDataItem) => this.openEditDialog(row) },
        { icon: 'delete', tooltip: 'Delete', danger: true, command: (row: MasterDataItem) => this.deleteItem(row) },
      ],
    });

    this.columns = baseCols;
  }

  loadData(): void {
    this.loading = true;
    this.masterDataService.getAll(this.selectedType).subscribe({
      next: (res) => {
        const rows = res.data?.rows || res.data || [];
        this.data = rows.map((row: any) => {
          const isActive = row.active ?? row.isActive ?? true;
          return {
            id: row.id,
            name: row.name,
            description: row.description,
            isActive,
            status: isActive ? 'Active' : 'Inactive',
          };
        });
        this.totalRecords = this.data.length;
        this.loading = false;
      },
      error: (err) => {
        this.notificationService.handleHttpError(err);
        this.data = [];
        this.totalRecords = 0;
        this.loading = false;
      },
    });
  }

  openEditDialog(item?: MasterDataItem): void {
    const isEdit = !!item;
    const type = this.selectedType;

    this.nzModal.create({
      nzTitle: `${isEdit ? 'Edit' : 'Add'} ${type.singularLabel}`,
      nzContent: MasterDataEditDialogComponent,
      nzClassName: 'updated-modal',
      nzData: { item: item ? { ...item } : null, hasActiveField: type.hasActiveField },
      nzFooter: null,
    }).afterClose.subscribe((result: MasterDataItem | undefined) => {
      if (!result) return;

      this.loading = true;
      this.masterDataService.save(type, result, isEdit ? item : undefined).subscribe({
        next: (res) => {
          this.notificationService.show(res);
          this.loadData();
        },
        error: (err) => {
          this.notificationService.handleHttpError(err);
          this.loading = false;
        },
      });
    });
  }

  deleteItem(item: MasterDataItem): void {
    if (!item.id) return;

    this.confirmDialog.confirm({
      title: `Delete ${this.selectedType.singularLabel}`,
      message: `Are you sure you want to delete "${item.name}"?`,
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.loading = true;
      this.masterDataService.delete(this.selectedType, item.id!).subscribe({
        next: (res) => {
          this.notificationService.show(res);
          this.loadData();
        },
        error: (err) => {
          this.notificationService.handleHttpError(err);
          this.loading = false;
        },
      });
    });
  }

  addInitialData(): void {
    const initialData = this.initialDataTemplates[this.selectedTypeKey];
    if (!initialData?.length) {
      this.notificationService.warn('No initial data available for this category');
      return;
    }

    this.confirmDialog.confirm({
      title: 'Add Initial Data',
      message: `This will add ${initialData.length} default ${this.selectedType.label.toLowerCase()} to the database. Each item will be saved individually. Continue?`,
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.loading = true;
      let savedCount = 0;
      let errorCount = 0;

      const saveNext = (index: number): void => {
        if (index >= initialData.length) {
          this.loading = false;
          if (errorCount === 0) {
            this.notificationService.success(`Saved ${savedCount} items`);
          } else {
            this.notificationService.warn(`Saved ${savedCount}, failed ${errorCount}`);
          }
          this.loadData();
          return;
        }

        this.masterDataService.save(this.selectedType, initialData[index]).subscribe({
          next: () => { savedCount++; saveNext(index + 1); },
          error: () => { errorCount++; saveNext(index + 1); },
        });
      };

      saveNext(0);
    });
  }

  exportData(): void {
    const type = this.selectedType;
    let csv = type.hasActiveField ? 'Name,Description,Active\n' : 'Name,Description\n';

    this.data.forEach(row => {
      const name = (row.name || '').replace(/"/g, '""');
      const desc = (row.description || '').replace(/"/g, '""');
      if (type.hasActiveField) {
        csv += `"${name}","${desc}",${row.isActive ? 'Yes' : 'No'}\n`;
      } else {
        csv += `"${name}","${desc}"\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type.label.toLowerCase()}_export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.notificationService.success('Export completed');
  }
}
