import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ManualScriptService } from './manual-script.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ScriptPreviewDialogComponent } from './script-preview-dialog.component';
import { ScriptHistoryDialogComponent } from './script-history-dialog.component';
import { ScriptImportDialogComponent } from './script-import-dialog.component';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-manual-script-list',
  template: `
    <div style="padding: 16px;">
      <app-advanced-table
        title="Manual Scripts"
        [columns]="columns"
        [data]="data"
        [loading]="loading"
        [totalRecords]="data.length"
        [actions]="tableActions"
        (refresh)="loadData()"
        (rowClick)="onRowClick($event)"
        emptyText="No manual scripts found">
      </app-advanced-table>
    </div>
  `,
})
export class ManualScriptListComponent implements OnInit {
  loading = false;
  data: any[] = [];

  columns: TableColumn[] = [
    { field: 'scriptName', header: 'Script Name', sortable: true, ellipsis: true },
    { field: 'scriptDescription', header: 'Description', sortable: true, ellipsis: true },
    { field: 'stepCount', header: 'Steps', width: '80px', align: 'right' },
    { field: 'statusLabel', header: 'Status', type: 'tag', width: '100px',
      tagColors: { Active: 'green', Inactive: 'default' } },
    {
      field: '_actions', header: '', type: 'actions', width: '180px', fixed: 'right',
      actions: [
        { icon: 'eye', tooltip: 'Preview', command: (row: any) => this.onPreview(row) },
        { icon: 'edit', tooltip: 'Edit', command: (row: any) => this.onEdit(row) },
        { icon: 'copy', tooltip: 'Clone', command: (row: any) => this.onClone(row) },
        { icon: 'history', tooltip: 'History', command: (row: any) => this.onHistory(row) },
        { icon: 'delete', tooltip: 'Delete', danger: true, command: (row: any) => this.onDelete(row) },
      ],
    },
  ];

  tableActions: TableAction[] = [
    { label: 'Add Script', icon: 'plus', type: 'primary', command: () => this.onAdd() },
    { label: 'Export', icon: 'download', command: () => this.onExport() },
    { label: 'Import', icon: 'upload', command: () => this.onImport() },
    { label: 'Step Library', icon: 'read', command: () => this.onStepLibrary() },
  ];

  constructor(
    private router: Router,
    private nzModal: NzModalService,
    private scriptService: ManualScriptService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.scriptService.getManualScripts().subscribe({
      next: resp => {
        this.data = (resp.data?.rows || resp.data || []).map((row: any) => ({
          ...row,
          statusLabel: row.isActive ? 'Active' : 'Inactive',
          stepCount: row.steps?.length || 0,
        }));
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.loading = false;
        this.notificationService.error('Failed to load scripts');
      },
    });
  }

  onRowClick(row: any): void {
    this.onPreview(row);
  }

  onAdd(): void {
    this.router.navigate(['/icm/master-data/scripts/edit/new']);
  }

  onEdit(row: any): void {
    this.router.navigate(['/icm/master-data/scripts/edit', row.id]);
  }

  onPreview(row: any): void {
    this.nzModal.create({
      nzTitle: 'Script Preview',
      nzContent: ScriptPreviewDialogComponent,
      nzWidth: '700px',
      nzClassName: 'updated-modal',
      nzData: { scriptId: row.id },
      nzFooter: null,
    }).afterClose.subscribe(result => {
      if (result?.action === 'edit') {
        this.router.navigate(['/icm/master-data/scripts/edit', result.scriptId]);
      }
    });
  }

  onHistory(row: any): void {
    this.nzModal.create({
      nzTitle: 'Change History - ' + row.scriptName,
      nzContent: ScriptHistoryDialogComponent,
      nzWidth: '600px',
      nzClassName: 'updated-modal',
      nzData: { scriptId: row.id, scriptName: row.scriptName },
      nzFooter: null,
    });
  }

  onClone(row: any): void {
    this.confirmDialog.confirm({
      title: 'Clone Script',
      message: `Clone "${row.scriptName}"?`,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.scriptService.cloneScript(row.id).subscribe({
        next: resp => { this.notificationService.show(resp); this.loadData(); },
        error: err => this.notificationService.handleHttpError(err),
      });
    });
  }

  onDelete(row: any): void {
    this.confirmDialog.confirm({
      title: 'Delete Script',
      message: `Delete "${row.scriptName}"?`,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.scriptService.deleteManualScripts(row.id).subscribe({
        next: resp => { this.notificationService.show(resp); this.loadData(); },
        error: err => this.notificationService.handleHttpError(err),
      });
    });
  }

  onExport(): void {
    this.scriptService.exportToExcel().subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'manual_scripts_export.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.success('Export completed');
      },
      error: () => this.notificationService.error('Failed to export scripts'),
    });
  }

  onImport(): void {
    this.nzModal.create({
      nzTitle: 'Import Scripts',
      nzContent: ScriptImportDialogComponent,
      nzWidth: '500px',
      nzClassName: 'updated-modal',
      nzMaskClosable: false,
      nzData: {},
      nzFooter: null,
    }).afterClose.subscribe(result => {
      if (result?.refreshNeeded) this.loadData();
    });
  }

  onStepLibrary(): void {
    this.router.navigate(['/icm/master-data/step-library']);
  }
}
