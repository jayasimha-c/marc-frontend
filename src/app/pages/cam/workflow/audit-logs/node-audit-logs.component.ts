import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WorkflowService } from '../services/workflow.service';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { TableColumn, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-node-audit-logs',
  templateUrl: './node-audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NodeAuditLogsComponent implements OnInit {
  @ViewChild('detailPanel') detailPanel!: SidePanelComponent;

  data: any[] = [];
  totalRecords = 0;
  loading = true;

  selectedLog: any = null;
  changeDetails: any[] = [];
  detailLoading = false;

  isDelegationPage = false;
  pageTitle = 'Node Change Log';

  columns: TableColumn[] = [];

  constructor(
    private route: ActivatedRoute,
    private workflowService: WorkflowService,
  ) {}

  ngOnInit(): void {
    this.isDelegationPage = this.route.snapshot.url.some(seg => seg.path === 'delegation');
    this.pageTitle = this.isDelegationPage ? 'Delegation Request Log' : 'Node Change Log';
    this.buildColumns();
  }

  private buildColumns(): void {
    this.columns = [
      ...(this.isDelegationPage ? [{ header: 'Delegation ID', field: 'delegationId', sortable: true, width: '120px' } as TableColumn] : []),
      { header: 'Action', field: 'action', sortable: true, type: 'tag', width: '120px',
        tagColors: { 'Create': 'green', 'Update': 'blue', 'Delete': 'red', default: 'default' } },
      { header: 'Workflow', field: 'workflowName', sortable: true },
      { header: 'Time', field: 'time', sortable: true, width: '180px' },
      { header: 'Updated By', field: 'updatedBy', sortable: true, width: '150px' },
      ...(this.isDelegationPage ? [{ header: 'By Admin', field: 'updateByAdmin', type: 'boolean', width: '90px' } as TableColumn] : []),
    ];
  }

  loadData(event: TableQueryParams): void {
    this.loading = true;
    const api = this.isDelegationPage
      ? this.workflowService.getDelegationAuditLogs(event)
      : this.workflowService.getNodeAuditLogs(event);

    api.subscribe({
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

    const api = this.isDelegationPage
      ? this.workflowService.getDelegationLogDetails(row.id)
      : this.workflowService.getNodeLogDetails(row.id);

    api.subscribe({
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
      default: return 'info-circle';
    }
  }

  getActionColor(action: string): string {
    switch (action?.toLowerCase()) {
      case 'create': return 'green';
      case 'update': return 'blue';
      case 'delete': return 'red';
      default: return 'default';
    }
  }
}
