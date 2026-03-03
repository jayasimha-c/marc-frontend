import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IcmControlService } from '../icm-control.service';
import { NotificationService } from '../../../core/services/notification.service';
import { formatTaskStatus } from '../utils/status-utils';
import { TableColumn } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-control-task-list',
  templateUrl: './control-task-list.component.html',
})
export class ControlTaskListComponent implements OnInit {
  loading = false;
  data: any[] = [];
  totalRecords = 0;

  columns: TableColumn[] = [
    { field: 'controlName', header: 'Control Name', sortable: true, ellipsis: true },
    { field: 'scriptName', header: 'Script Name', sortable: true, ellipsis: true },
    {
      field: 'statusLabel', header: 'Status', type: 'tag', width: '120px',
      tagColors: {
        CREATED: 'blue', OPENED: 'orange', CLOSED: 'green',
        FAILED: 'red', OVERDUE: 'volcano', DRAFT: 'default', PENDING: 'default',
      },
    },
    { field: 'bpName', header: 'Business Process', sortable: true, ellipsis: true },
    { field: 'sbpName', header: 'Sub-Process', sortable: true, ellipsis: true },
    { field: 'stepCount', header: 'Steps', width: '80px', align: 'center' },
    { field: 'createdDate', header: 'Created', type: 'date', dateFormat: 'MM/dd/yyyy HH:mm', width: '150px' },
    { field: 'startDate', header: 'Started', type: 'date', dateFormat: 'MM/dd/yyyy HH:mm', width: '150px' },
    {
      field: 'actions', header: '', type: 'actions', width: '100px', fixed: 'right',
      actions: [
        { icon: 'edit', tooltip: 'Answer Task', command: (row: any) => this.answerTask(row) },
        { icon: 'eye', tooltip: 'View Control', command: (row: any) => this.viewControl(row) },
      ],
    },
  ];

  constructor(
    private router: Router,
    private icmService: IcmControlService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.icmService.getControlTasks().subscribe({
      next: (res) => {
        const rows = (res.data?.rows || []).map((row: any) => ({
          ...row,
          statusLabel: formatTaskStatus(row.status),
        }));
        this.data = rows;
        this.totalRecords = res.data?.records || rows.length;
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.totalRecords = 0;
        this.loading = false;
      },
    });
  }

  answerTask(row: any): void {
    if (!row?.id) {
      this.notification.error( 'Task ID not found');
      return;
    }
    this.router.navigate([`/icm/answer-control-task/${row.id}`]);
  }

  viewControl(row: any): void {
    if (!row?.controlId) {
      this.notification.error( 'Control ID not found');
      return;
    }
    this.router.navigate([`/icm/view-control-task/${row.controlId}`]);
  }
}
