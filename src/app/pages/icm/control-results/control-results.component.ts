import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { IcmControlService } from '../icm-control.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ResultDetailDialogComponent } from './result-detail-dialog.component';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-control-results',
  templateUrl: './control-results.component.html',
})
export class ControlResultsComponent implements OnInit {
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'sapSystemName', header: 'System', sortable: true, width: '120px' },
    { field: 'controlName', header: 'Control Name', sortable: true, ellipsis: true },
    { field: 'executionTypeName', header: 'Type', sortable: true, width: '120px',
      type: 'tag', tagColors: { Automated: 'blue', Manual: 'gold', Standard: 'green' } },
    { field: 'ruleOrScriptName', header: 'Rule / Script', sortable: true, ellipsis: true },
    { field: 'executionDate', header: 'Execution Date', type: 'date', sortable: true, width: '160px' },
    { field: 'statusName', header: 'Status', sortable: true, width: '110px',
      type: 'tag', tagColors: { Success: 'green', Failed: 'red', Running: 'processing', Pending: 'default' } },
    { field: 'resultRecordCount', header: 'Records', width: '90px', align: 'right' },
    { field: 'executionModeName', header: 'Mode', sortable: true, width: '110px' },
    {
      field: '_actions', header: '', type: 'actions', width: '60px', fixed: 'right',
      actions: [
        { icon: 'eye', tooltip: 'View Details', command: (row: any) => this.openDetail(row) },
      ],
    },
  ];

  tableActions: TableAction[] = [];

  constructor(
    private nzModal: NzModalService,
    private icmService: IcmControlService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.icmService.getExecutionResultsTableFull().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.data = res.data.rows || [];
          this.totalRecords = res.data.records || this.data.length;
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

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onRowDblClick(row: any): void {
    this.openDetail(row);
  }

  openDetail(row: any): void {
    this.nzModal.create({
      nzTitle: 'Result Details',
      nzContent: ResultDetailDialogComponent,
      nzWidth: '90vw',
      nzClassName: 'updated-modal',
      nzData: { resultData: row },
      nzFooter: null,
    });
  }
}
