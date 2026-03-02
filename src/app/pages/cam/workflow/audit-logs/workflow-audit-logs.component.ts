import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { WorkflowService } from '../services/workflow.service';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { TableColumn, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-workflow-audit-logs',
  templateUrl: './workflow-audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class WorkflowAuditLogsComponent implements OnInit {
  @ViewChild('detailPanel') detailPanel!: SidePanelComponent;

  data: any[] = [];
  totalRecords = 0;
  loading = true;

  selectedLog: any = null;
  changeDetails: any[] = [];
  detailLoading = false;

  columns: TableColumn[] = [
    { header: 'Action', field: 'action', sortable: true, type: 'tag', width: '120px',
      tagColors: { 'Create': 'green', 'Update': 'blue', 'Delete': 'red', default: 'default' } },
    { header: 'Workflow Name', field: 'workflowName', sortable: true },
    { header: 'Time', field: 'time', sortable: true, width: '180px' },
    { header: 'Updated By', field: 'updatedBy', sortable: true, width: '150px' },
  ];

  constructor(private workflowService: WorkflowService) {}

  ngOnInit(): void {}

  loadData(event: TableQueryParams): void {
    this.loading = true;
    this.workflowService.getWorkflowAuditLogs(event).subscribe({
      next: (resp) => {
        this.data = resp.data?.rows || [];
        this.totalRecords = resp.data?.records || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onRowClick(row: any): void {
    this.selectedLog = row;
    this.detailLoading = true;
    this.detailPanel.open();

    this.workflowService.getWorkflowLogDetails(row.id).subscribe({
      next: (resp) => {
        this.changeDetails = resp.data?.rows || resp.data || [];
        this.detailLoading = false;
      },
      error: () => { this.detailLoading = false; },
    });
  }

  getActionIcon(action: string): string {
    switch (action?.toLowerCase()) {
      case 'create': return 'plus-circle';
      case 'update': return 'edit';
      case 'delete': return 'delete';
      case 'approve': return 'check-circle';
      case 'reject': return 'close-circle';
      default: return 'info-circle';
    }
  }

  getActionColor(action: string): string {
    switch (action?.toLowerCase()) {
      case 'create': return 'green';
      case 'update': return 'blue';
      case 'delete': return 'red';
      case 'approve': return 'green';
      case 'reject': return 'red';
      default: return 'default';
    }
  }
}
