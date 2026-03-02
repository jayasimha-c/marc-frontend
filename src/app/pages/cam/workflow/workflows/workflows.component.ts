import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { WorkflowService } from '../services/workflow.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction, RowAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-workflows',
  templateUrl: './workflows.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class WorkflowsComponent implements OnInit {
  data: any[] = [];
  loading = true;

  columns: TableColumn[] = [
    { header: 'Workflow Name', field: 'name', sortable: true },
    { header: 'Type', field: 'type', sortable: true, type: 'tag',
      tagColors: { 'ADD_USER': 'blue', 'CHANGE_USER': 'cyan', 'LOCK_UNLOCK_USER': 'orange', 'RESET_PWD': 'purple', 'DELETE_USER': 'red', default: 'default' } },
    { header: 'Active', field: 'active', type: 'boolean', width: '90px' },
    { header: 'Actions', field: 'actions', type: 'actions', width: '140px',
      actions: this.getRowActions() },
  ];

  actions: TableAction[] = [
    { label: 'Add Workflow', icon: 'plus', type: 'primary', command: () => this.router.navigate(['/cam/workflow/workflows/create']) },
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
      { icon: 'swap', tooltip: 'Toggle Status', command: (row) => this.toggleStatus(row) },
      { icon: 'edit', tooltip: 'Edit', command: (row) => this.router.navigate(['/cam/workflow/workflows/edit', row.id]) },
      { icon: 'delete', tooltip: 'Delete', danger: true, command: (row) => this.deleteWorkflow(row) },
    ];
  }

  loadData(): void {
    this.loading = true;
    this.workflowService.getWorkflowList().subscribe({
      next: (resp) => {
        this.data = resp.data?.workflows || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  toggleStatus(row: any): void {
    this.workflowService.statusWorkflow(row.id, !row.active).subscribe({
      next: (resp) => { this.notificationService.show(resp); this.loadData(); },
      error: (err) => this.notificationService.handleHttpError(err),
    });
  }

  deleteWorkflow(row: any): void {
    this.confirmDialogService.confirm({
      title: 'Delete Workflow',
      message: `Are you sure you want to delete workflow "${row.name}"?`,
      confirmBtnText: 'Delete',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.workflowService.deleteWorkflow(row.id).subscribe({
          next: (resp) => { this.notificationService.show(resp); this.loadData(); },
          error: (err) => this.notificationService.handleHttpError(err),
        });
      }
    });
  }
}
