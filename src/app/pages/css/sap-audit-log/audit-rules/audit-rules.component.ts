import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';
import { SapAuditLogService } from '../sap-audit-log.service';
import { SapViolationSeverityNames } from '../../css-shared/css-shared.model';
import { SapAuditLogField, SapAuditRule } from '../sap-audit-log.model';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-audit-rules',
  templateUrl: './audit-rules.component.html',
})
export class AuditRulesComponent implements OnInit {
  rules: SapAuditRule[] = [];
  loading = false;
  selectedRule: SapAuditRule | null = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', sortable: true, filterable: true },
    { field: 'description', header: 'Description', sortable: true, filterable: true },
    {
      field: 'severity',
      header: 'Severity',
      sortable: true,
      type: 'tag',
      tagColors: {
        CRITICAL: 'red',
        HIGH: 'orange',
        MEDIUM: 'blue',
        LOW: 'green',
      },
    },
    { field: '_tags', header: 'Tags', sortable: false },
    { field: '_events', header: 'Events', sortable: false },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus', type: 'primary', command: () => this.onAdd() },
    { label: 'Edit', icon: 'edit', command: () => this.onEdit() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onDelete() },
    { label: 'Export Rules', icon: 'file-excel', command: () => this.onExport() },
  ];

  constructor(
    private sapAuditLogService: SapAuditLogService,
    private notificationService: NotificationService,
    private modal: NzModalService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private fileSaverService: FileSaverService
  ) {}

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.loading = true;
    this.sapAuditLogService.getAuditRules().subscribe({
      next: (resp) => {
        const rows = resp.data?.rows || resp.data || [];
        this.rules = rows.map((rule: any) => ({
          ...rule,
          _tags: rule.tags?.map((t: any) => t.name).join(', ') || '',
          _events:
            rule.conditions
              ?.filter((c: any) => c.field === SapAuditLogField.EVENT)
              .flatMap((c: any) => c.values)
              .join(', ') || '',
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onRowClick(row: SapAuditRule): void {
    this.selectedRule = row;
  }

  onAdd(): void {
    this.router.navigate(['add-audit-rule'], {
      relativeTo: this.activeRoute.parent,
      state: { rule: null, formType: 'add' },
    });
  }

  onEdit(): void {
    if (!this.selectedRule) {
      this.notificationService.error('Please select a row first');
      return;
    }
    this.router.navigate(['add-audit-rule'], {
      relativeTo: this.activeRoute.parent,
      state: { rule: this.selectedRule, formType: 'edit' },
    });
  }

  onDelete(): void {
    if (!this.selectedRule) {
      this.notificationService.error('Please select a row first');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Delete Confirmation',
      nzContent: 'Are you sure you want to delete this audit rule?',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.sapAuditLogService.deleteAuditRule(this.selectedRule!.id!).subscribe((resp) => {
          this.notificationService.show(resp);
          this.selectedRule = null;
          this.loadRules();
        });
      },
    });
  }

  onExport(): void {
    this.sapAuditLogService.exportAuditRules().subscribe((res) => {
      if (this.fileSaverService.saveExcel('audit-rule-export', res)) {
        this.notificationService.success('Successfully downloaded Audit Rules');
      }
    });
  }
}
