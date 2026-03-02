import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApiResponse } from '../../../../core/models/api-response';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableAction, TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';
import { getParameterType, SapParameter } from '../sap-parameter.model';
import { SapParameterService } from '../sap-parameters.service';

@Component({
  standalone: false,
  selector: 'app-sap-parameter',
  templateUrl: './sap-parameter.component.html',
})
export class SapParameterComponent implements OnInit {
  data: SapParameter[] = [];
  totalRecords = 0;
  selectedRow: SapParameter | null = null;

  columns: TableColumn[] = [
    { field: 'parameterName', header: 'Parameter Name' },
    { field: 'description', header: 'Description' },
    { field: '_parameterType', header: 'Type' },
    { field: 'minSapVersion', header: 'Min Sap Version' },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onAction('add') },
    { label: 'Edit', icon: 'edit', command: () => this.onAction('edit') },
    { label: 'Delete', icon: 'delete', command: () => this.onAction('delete'), danger: true },
  ];

  constructor(
    private sapParameterService: SapParameterService,
    private notificationService: NotificationService,
    private modal: NzModalService,
    private router: Router,
    private activeRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.sapParameterService.getSapParameters().subscribe((resp: ApiResponse) => {
      if (resp.success) {
        const rows = resp.data.rows || resp.data || [];
        this.data = rows.map((item: any) => ({
          ...item,
          _parameterType: getParameterType(item.parameterType),
        }));
        this.totalRecords = resp.data.records || rows.length;
        if (this.selectedRow) {
          this.selectedRow = this.data.find((r) => r.id === this.selectedRow!.id) || null;
        }
      }
    });
  }

  onAction(action: 'add' | 'edit' | 'delete'): void {
    switch (action) {
      case 'add':
        this.router.navigate(['add-sap-parameter'], {
          relativeTo: this.activeRoute.parent,
          state: { parameter: null, formType: 'add' },
        });
        break;

      case 'edit':
        if (!this.isRowSelected()) break;
        this.router.navigate(['add-sap-parameter'], {
          relativeTo: this.activeRoute.parent,
          state: { parameter: this.selectedRow, formType: 'edit' },
        });
        break;

      case 'delete':
        if (!this.isRowSelected()) break;
        this.modal.confirm({
          nzTitle: 'Are you sure you want to delete this record?',
          nzOkText: 'Yes',
          nzCancelText: 'No',
          nzOkDanger: true,
          nzOnOk: () => {
            this.sapParameterService.deleteSapParameter(this.selectedRow!.id!).subscribe((resp) => {
              this.notificationService.show(resp);
              this.loadData();
            });
          },
        });
        break;
    }
  }

  private isRowSelected(): boolean {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row first');
      return false;
    }
    return true;
  }
}
