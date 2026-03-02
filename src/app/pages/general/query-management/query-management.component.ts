import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { VisualQueryBuilderService } from '../visual-query-builder/visual-query-builder.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-query-management',
  templateUrl: './query-management.component.html',
  styleUrls: ['./query-management.component.scss'],
})
export class QueryManagementComponent implements OnInit {
  isLoading = false;
  tableData: any[] = [];
  queryStats: any = {};

  selectedRow: any = null;

  // Flow visualizer
  flowVisible = false;
  flowLoading = false;
  flowQueryData: any = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Query Name', sortable: true, onClick: (row: any) => this.openDetail(row) },
    { field: 'description', header: 'Description', sortable: true },
    { field: 'createdBy', header: 'Created By', sortable: true },
    { field: 'createdDate', header: 'Created Date', type: 'date', sortable: true },
    { field: 'modifiedBy', header: 'Modified By', sortable: true },
    { field: 'modifiedDate', header: 'Modified Date', type: 'date', sortable: true },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus', type: 'primary', command: () => this.onAdd() },
    { label: 'View Flow', icon: 'branches', command: () => this.onViewFlow() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onDelete() },
  ];

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private vqbService: VisualQueryBuilderService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadQueries();
    this.loadQueryStats();
  }

  loadQueries(): void {
    this.isLoading = true;
    this.vqbService.getAllQueries().subscribe({
      next: (res) => {
        this.tableData = res.data?.rows || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.notificationService.handleHttpError(err);
        this.isLoading = false;
      },
    });
  }

  loadQueryStats(): void {
    this.vqbService.getQueryStats().subscribe({
      next: (res) => {
        this.queryStats = res.data || {};
      },
      error: (err) => {
        this.notificationService.handleHttpError(err);
      },
    });
  }

  openDetail(row: any): void {
    this.router.navigate([`/general/visual-query-builder/${row.id}`]);
  }

  onAdd(): void {
    this.router.navigate(['visual-query-builder'], {
      relativeTo: this.activeRoute.parent,
      state: { formType: 'add' },
    });
  }

  onDelete(): void {
    if (!this.selectedRow) {
      this.notificationService.warn('Please select a row first');
      return;
    }
    this.confirmDialogService
      .confirm({ title: 'Confirm Delete', message: 'Are you sure you want to delete this query?' })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.vqbService.deleteRuleById(this.selectedRow.id).subscribe({
            next: (res) => {
              this.notificationService.show(res);
              this.loadQueries();
              this.loadQueryStats();
            },
            error: (err) => this.notificationService.handleHttpError(err),
          });
        }
      });
  }

  onViewFlow(): void {
    if (!this.selectedRow) {
      this.notificationService.warn('Please select a row first');
      return;
    }
    this.flowLoading = true;
    this.flowVisible = true;
    this.flowQueryData = null;
    this.vqbService.getRuleById(this.selectedRow.id).subscribe({
      next: (res) => {
        this.flowQueryData = res.data;
        this.flowLoading = false;
      },
      error: (err) => {
        this.notificationService.handleHttpError(err);
        this.flowLoading = false;
        this.flowVisible = false;
      },
    });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }
}
