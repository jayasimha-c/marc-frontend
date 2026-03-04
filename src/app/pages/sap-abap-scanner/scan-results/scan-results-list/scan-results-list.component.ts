import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AbapService } from '../../abap.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-scan-results-list',
  templateUrl: './scan-results-list.component.html',
  styleUrls: ['./scan-results-list.component.scss'],
})
export class ScanResultsListComponent implements OnInit {
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;
  scanHistoryCount: any = {};

  private lastQueryParams: TableQueryParams | null = null;

  columns: TableColumn[] = [
    { field: 'scanName', header: 'Scan Name', sortable: false },
    { field: 'sapSystemName', header: 'SAP System', width: '160px', sortable: false },
    { field: 'totalPrograms', header: 'Programs', width: '100px', sortable: false },
    { field: 'totalFindings', header: 'Findings', width: '100px', sortable: false },
    { field: 'status', header: 'Status', width: '120px', sortable: false, type: 'tag',
      tagColors: { COMPLETED: 'green', FAILED: 'red', RUNNING: 'processing', PENDING: 'default', CANCELLED: 'orange' } },
    { field: 'startedAt', header: 'Started At', type: 'date', width: '160px', sortable: false },
    { field: 'completedAt', header: 'Completed At', type: 'date', width: '160px', sortable: false },
  ];

  actions: TableAction[] = [
    { label: 'View Results', icon: 'eye', type: 'primary', command: () => this.onAction('view') },
  ];

  constructor(
    private abapService: AbapService,
    private router: Router,
    private notification: NotificationService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadCount();
  }

  onQueryParamsChange(params: TableQueryParams): void {
    this.lastQueryParams = params;
    this.loadData(params);
  }

  loadData(params?: TableQueryParams): void {
    const query = params || this.lastQueryParams;
    if (!query) return;

    this.loading = true;
    this.abapService.getScanHistoryList(query).subscribe({
      next: (res) => {
        if (res.success) {
          this.data = res.data?.rows || [];
          this.totalRecords = res.data?.records || 0;
        }
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.totalRecords = 0;
        this.loading = false;
      },
    });
  }

  loadCount(): void {
    this.abapService.getScanHistoryCount().subscribe({
      next: (res) => {
        if (res.success) {
          this.scanHistoryCount = res.data || {};
        }
      },
    });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onAction(action: string): void {
    if (action === 'view') {
      if (!this.selectedRow) {
        this.notification.warn('Please select a scan execution first');
        return;
      }
      this.router.navigate(['/sap-abap-scanner/scan-results/detail'], {
        queryParams: {
          executionId: this.selectedRow.id || this.selectedRow.executionId,
          systemId: this.selectedRow.sapSystemId,
        },
      });
    }
  }
}
