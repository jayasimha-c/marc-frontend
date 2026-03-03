import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { IcmControlService } from '../icm-control.service';
import { getStatusMessage } from '../utils/status-utils';
import { TableColumn } from '../../../shared/components/advanced-table/advanced-table.models';
import { MonitoringJournalViewComponent } from './monitoring-journal-view/monitoring-journal-view.component';

@Component({
  standalone: false,
  selector: 'app-control-monitoring',
  templateUrl: './control-monitoring.component.html',
})
export class ControlMonitoringComponent implements OnInit {
  loading = false;
  data: any[] = [];
  totalRecords = 0;

  columns: TableColumn[] = [
    { field: 'sapDestinationName', header: 'System', sortable: true, ellipsis: true },
    { field: 'controlName', header: 'Control', sortable: true, ellipsis: true },
    { field: 'bpName', header: 'Business Process', sortable: true, ellipsis: true },
    { field: 'sbpName', header: 'Sub-Process', sortable: true, ellipsis: true },
    { field: 'ruleName', header: 'Rule', sortable: true, ellipsis: true },
    {
      field: 'statusLabel', header: 'Status', type: 'tag', width: '120px',
      tagColors: { None: 'default', Success: 'success', Failed: 'error', Unknown: 'warning' },
    },
    { field: 'startDate', header: 'Start Date', type: 'date', dateFormat: 'MM/dd/yyyy HH:mm', width: '160px' },
    { field: 'finishDate', header: 'Finish Date', type: 'date', dateFormat: 'MM/dd/yyyy HH:mm', width: '160px' },
    {
      field: 'actions', header: '', type: 'actions', width: '60px', fixed: 'right',
      actions: [
        { icon: 'file-search', tooltip: 'View Journal', command: (row: any) => this.openJournal(row) },
      ],
    },
  ];

  constructor(
    private icmService: IcmControlService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.icmService.getControlMonitoring(0, 500).subscribe({
      next: (res) => {
        this.data = (res.data?.rows || []).map((row: any) => ({
          ...row,
          statusLabel: getStatusMessage(row.status),
        }));
        this.totalRecords = res.data?.records || this.data.length;
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.totalRecords = 0;
        this.loading = false;
      },
    });
  }

  openJournal(row: any): void {
    this.modal.create({
      nzTitle: 'Monitoring Journal',
      nzContent: MonitoringJournalViewComponent,
      nzWidth: '90vw',
      nzData: { data: row },
      nzFooter: null,
      nzClassName: 'updated-modal',
    });
  }
}
