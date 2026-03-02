import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrgFieldService } from '../org-field.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-org-names-variant',
  templateUrl: './org-names-variant.component.html',
})
export class OrgNamesVariantComponent implements OnInit {
  data: any[] = [];
  loading = false;
  selectedRows: any[] = [];

  columns: TableColumn[] = [
    { field: 'description', header: 'Variant Name' },
    { field: 'systemName', header: 'SAP System' },
    { field: 'orgCount', header: 'Org Count' },
  ];

  tableActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onAdd() },
    { label: 'Edit', icon: 'edit', command: () => this.onEdit() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onDelete() },
  ];

  constructor(
    private orgFieldService: OrgFieldService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.orgFieldService.getAllOrgVariants().subscribe({
      next: (res) => {
        this.data = res.success && res.data ? [...res.data] : [];
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load variants');
        this.loading = false;
      },
    });
  }

  onSelectionChange(rows: any[]): void {
    this.selectedRows = rows;
  }

  private onAdd(): void {
    this.router.navigate(['/acm/master-data/org-field/org-names-variant/create'], {
      state: { formType: 'add' },
    });
  }

  private onEdit(): void {
    if (this.selectedRows.length === 0) {
      this.notificationService.error('Please select a row to edit');
      return;
    }
    this.router.navigate(['/acm/master-data/org-field/org-names-variant/edit', this.selectedRows[0].id], {
      state: { formType: 'edit' },
    });
  }

  private onDelete(): void {
    if (this.selectedRows.length === 0) {
      this.notificationService.error('Please select a row to delete');
      return;
    }

    this.confirmDialogService.confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this variant?',
    }).subscribe(result => {
      if (result) {
        this.orgFieldService.deleteOrgVariant(this.selectedRows[0].id).subscribe({
          next: () => {
            this.notificationService.success('Deleted successfully');
            this.selectedRows = [];
            this.loadData();
          },
          error: (err) => this.notificationService.error(err.error?.message || 'Failed to delete variant'),
        });
      }
    });
  }
}
