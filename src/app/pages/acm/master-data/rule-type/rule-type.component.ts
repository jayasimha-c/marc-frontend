import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RuleTypeService } from './rule-type.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AddRuleTypeComponent } from './add-rule-type/add-rule-type.component';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-rule-type',
  templateUrl: './rule-type.component.html',
})
export class RuleTypeComponent implements OnInit {
  data: any[] = [];
  loading = false;
  selectedRows: any[] = [];

  columns: TableColumn[] = [
    { field: 'name', header: 'Rule Type' },
  ];

  tableActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onAdd() },
    { label: 'Edit', icon: 'edit', command: () => this.onEdit() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onDelete() },
  ];

  constructor(
    private ruleTypeService: RuleTypeService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.ruleTypeService.getRuleTypes().subscribe({
      next: (res) => {
        this.data = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.loading = false;
      },
    });
  }

  onSelectionChange(rows: any[]): void {
    this.selectedRows = rows;
  }

  private onAdd(): void {
    this.nzModal.create({
      nzTitle: 'Add Rule Type',
      nzContent: AddRuleTypeComponent,
      nzWidth: '450px',
      nzData: { formType: 'Add' },
      nzFooter: null,
      nzClassName: 'updated-modal',
    }).afterClose.subscribe(() => {
      this.loadData();
      this.selectedRows = [];
    });
  }

  private onEdit(): void {
    if (this.selectedRows.length === 0) {
      this.notificationService.error('Please select a row to edit');
      return;
    }
    this.nzModal.create({
      nzTitle: 'Edit Rule Type',
      nzContent: AddRuleTypeComponent,
      nzWidth: '450px',
      nzData: { formType: 'Edit', data: this.selectedRows[0] },
      nzFooter: null,
      nzClassName: 'updated-modal',
    }).afterClose.subscribe(() => {
      this.loadData();
      this.selectedRows = [];
    });
  }

  private onDelete(): void {
    if (this.selectedRows.length === 0) {
      this.notificationService.error('Please select a row to delete');
      return;
    }

    this.confirmDialogService.confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this rule type?',
    }).subscribe(result => {
      if (result) {
        this.ruleTypeService.deleteRuleType(this.selectedRows[0].id).subscribe({
          next: () => {
            this.notificationService.success('Deleted successfully');
            this.selectedRows = [];
            this.loadData();
          },
          error: (err) => this.notificationService.error(err.error?.message || 'Delete failed'),
        });
      }
    });
  }
}
