import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../core/services/notification.service';
import { AuditLogsService } from './audit-logs.service';
import { ExportComponent } from './export/export.component';
import { TableColumn, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';
import { DatePipe } from '@angular/common';

@Component({
  standalone: false,
  selector: 'app-admin-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
  providers: [DatePipe],
})
export class AuditLogsComponent implements OnInit {

  // Main table
  columns: TableColumn[] = [
    { field: 'action', header: 'Action', sortable: true, filterable: true },
    { field: 'table', header: 'Table', sortable: true, filterable: true },
    { field: 'time', header: 'Time', type: 'date', sortable: true },
    { field: 'username', header: 'User', sortable: true, filterable: true },
    { field: 'auditableName', header: 'Auditable Name', sortable: true, filterable: true },
  ];
  data: any[] = [];
  total = 0;
  loading = false;

  // Detail table
  detailColumns: TableColumn[] = [
    { field: 'property', header: 'Property' },
    { field: 'before', header: 'Before' },
    { field: 'after', header: 'After' },
  ];
  detailData: any[] = [];

  // Date range
  dateRange: Date[] = [];

  constructor(
    private auditLogsService: AuditLogsService,
    private notificationService: NotificationService,
    private nzModal: NzModalService,
    private datePipe: DatePipe,
  ) {}

  ngOnInit(): void {}

  onQueryChange(params: TableQueryParams): void {
    this.loadData({
      first: (params.pageIndex - 1) * params.pageSize,
      rows: params.pageSize,
      sortOrder: params.sort?.direction === 'ascend' ? 1 : -1,
      sortField: params.sort?.field || '',
      filters: params.filters || {},
    });
  }

  loadData(event: any): void {
    this.loading = true;
    this.auditLogsService.getAuditLog(event).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.data = resp.data.rows || [];
          this.total = resp.data.records || 0;
          this.detailData = [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onRowSelect(row: any): void {
    if (row?.values) {
      const changeLogs = Object.entries(row.values);
      this.detailData = changeLogs.map(([key, value]) => ({
        property: key,
        after: value,
      }));
    }
  }

  export(): void {
    if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
      const startDate = this.datePipe.transform(this.dateRange[0], 'dd/MM/yyyy') || '';
      const endDate = this.datePipe.transform(this.dateRange[1], 'dd/MM/yyyy') || '';

      this.auditLogsService.exportAuditLog(startDate, endDate).subscribe({
        next: () => {
          this.nzModal.create({
            nzTitle: 'Success',
            nzContent: ExportComponent,
            nzWidth: '40vw',
            nzFooter: null,
            nzClassName: 'updated-modal',
          });
        },
        error: () => {
          this.notificationService.error('Export failed');
        },
      });
    } else {
      this.notificationService.error('Select Date range!');
    }
  }
}
