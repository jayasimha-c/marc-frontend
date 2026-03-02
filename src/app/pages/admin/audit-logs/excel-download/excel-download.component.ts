import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuditLogsService } from '../audit-logs.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-excel-download',
  templateUrl: './excel-download.component.html',
})
export class ExcelDownloadComponent implements OnInit {

  columns: TableColumn[] = [
    { field: 'profileName', header: 'Profile Name', sortable: true, filterable: true },
    { field: 'description', header: 'Status', sortable: true },
    { field: 'completionMessage', header: 'Result', sortable: true },
    { field: 'startedOnStr', header: 'Started On', sortable: true },
    { field: 'completedOnStr', header: 'Completed On', sortable: true },
    { field: 'reportModule', header: 'Report Type', sortable: true, filterable: true },
    { field: 'reportType', header: 'Report', sortable: true },
    { field: 'runBy', header: 'Run By', sortable: true, filterable: true },
  ];

  data: any[] = [];
  total = 0;
  loading = false;
  selectedRow: any = null;

  tableActions: TableAction[] = [
    { label: 'Download', icon: 'download', type: 'default', command: () => this.onAction('download') },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onAction('delete') },
  ];

  constructor(
    private auditLogsService: AuditLogsService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.auditLogsService.getExportList().subscribe({
      next: (resp: any) => {
        this.data = Array.isArray(resp) ? resp : (resp?.data || []);
        this.total = this.data.length;
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

  onAction(action: string): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row first');
      return;
    }
    // Action handling placeholder
  }
}
