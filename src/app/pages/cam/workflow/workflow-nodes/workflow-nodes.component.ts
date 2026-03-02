import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { WorkflowService } from '../services/workflow.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction, RowAction } from '../../../../shared/components/advanced-table/advanced-table.models';

const PROTECTED_NODES = ['ARC', 'ROLEAPPROVER', 'ADMANAGER'];

@Component({
  standalone: false,
  selector: 'app-workflow-nodes',
  templateUrl: './workflow-nodes.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class WorkflowNodesComponent implements OnInit {
  data: any[] = [];
  loading = true;

  columns: TableColumn[] = [
    { header: 'Name', field: 'name', sortable: true },
    { header: 'Workflows', field: 'workflowNames', sortable: true, ellipsis: true },
    { header: 'Comments Required', field: 'commentsRequired', type: 'boolean', width: '140px' },
    { header: 'SoD Mandatory', field: 'mustCheckRisk', type: 'boolean', width: '120px' },
    { header: 'Approve Despite Risks', field: 'approveIfRiskPresent', type: 'boolean', width: '160px' },
    { header: 'Risk Detour', field: 'enableRiskDetour', type: 'boolean', width: '110px' },
    { header: 'Actions', field: 'actions', type: 'actions', width: '100px',
      actions: this.getRowActions() },
  ];

  actions: TableAction[] = [
    { label: 'Add Node Type', icon: 'plus', type: 'primary',
      command: () => this.router.navigate(['/cam/workflow/nodes/create']) },
  ];

  constructor(
    private workflowService: WorkflowService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private getRowActions(): RowAction[] {
    return [
      { icon: 'edit', tooltip: 'Edit', command: (row) => this.router.navigate(['/cam/workflow/nodes/edit', row.id]) },
      { icon: 'delete', tooltip: 'Delete', danger: true, command: (row) => this.deleteNode(row),
        hidden: (row) => PROTECTED_NODES.includes(row.name) },
    ];
  }

  loadData(): void {
    this.loading = true;
    this.workflowService.getNodeList().subscribe({
      next: (resp) => {
        this.data = (resp.data?.nodes || []).map((n: any) => ({
          ...n,
          workflowNames: (n.workflows || []).map((w: any) => w.name).join(', '),
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  deleteNode(row: any): void {
    this.confirmDialogService.confirm({
      title: 'Delete Node Type',
      message: `Are you sure you want to delete node type "${row.name}"?`,
      confirmBtnText: 'Delete',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.workflowService.deleteNodeType(row.id).subscribe({
          next: (resp) => { this.notificationService.show(resp); this.loadData(); },
          error: (err) => this.notificationService.handleHttpError(err),
        });
      }
    });
  }
}
