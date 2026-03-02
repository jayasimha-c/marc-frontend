import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { CssMonitoringService } from '../css-monitoring.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';
import { getRuleTypeLabel } from '../../btp/btp.model';
import { RunNowDialogComponent } from './run-now-dialog/run-now-dialog.component';
import { CssConsistencyCheckComponent } from './consistency-check/consistency-check.component';

@Component({
  standalone: false,
  selector: 'app-sap-rule-book',
  templateUrl: './sap-rule-book.component.html',
})
export class SapRuleBookComponent implements OnInit {
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', type: 'text' },
    { field: '_ruleType', header: 'Rule Type', type: 'text' },
    { field: 'description', header: 'Description', type: 'text' },
    {
      field: 'securityLevel', header: 'Security Level', type: 'tag',
      tagColors: { LOW: 'blue', MEDIUM: 'orange', HIGH: 'red' },
    },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus', type: 'primary', command: () => this.onAdd() },
    { label: 'Edit', icon: 'edit', command: () => this.onEdit() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onDelete() },
    { label: 'Export', icon: 'download', command: () => this.onExport() },
    { label: 'Run Now', icon: 'caret-right', command: () => this.onRunNow() },
    { label: 'Job History', icon: 'history', command: () => this.onJobHistory() },
    { label: 'Consistency Check', icon: 'check-circle', command: () => this.onConsistencyCheck() },
  ];

  constructor(
    private cssMonitoringService: CssMonitoringService,
    private notificationService: NotificationService,
    private nzModal: NzModalService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private fileSaverService: FileSaverService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.cssMonitoringService.getRuleBooks().subscribe((resp) => {
      if (resp?.data) {
        this.data = (resp.data.rows || []).map((row: any) => ({
          ...row,
          _ruleType: getRuleTypeLabel(row.ruleType),
        }));
        this.totalRecords = resp.data.records || 0;
      }
    });
  }

  onRowClicked(row: any): void {
    this.selectedRow = row;
  }

  private requireSelection(): boolean {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a rule book first');
      return false;
    }
    return true;
  }

  onAdd(): void {
    this.router.navigate(['add-sap-parameter-rule-book'], {
      relativeTo: this.activeRoute.parent,
      state: { book: null, formType: 'add' },
    });
  }

  onEdit(): void {
    if (!this.requireSelection()) return;
    this.router.navigate(['add-sap-parameter-rule-book'], {
      relativeTo: this.activeRoute.parent,
      state: { book: this.selectedRow, formType: 'edit' },
    });
  }

  onDelete(): void {
    if (!this.requireSelection()) return;
    this.nzModal.confirm({
      nzTitle: 'Confirm Delete',
      nzContent: 'Are you sure you want to delete this rule book?',
      nzOkDanger: true,
      nzOnOk: () => {
        this.cssMonitoringService.deleteRuleBook(this.selectedRow.id).subscribe((resp) => {
          this.notificationService.show(resp);
          this.loadData();
        });
      },
    });
  }

  onExport(): void {
    this.cssMonitoringService.exportRuleBook().subscribe((res) => {
      if (this.fileSaverService.saveExcel('rule-book-export', res)) {
        this.notificationService.success('Rule book exported successfully');
      }
    });
  }

  onRunNow(): void {
    if (!this.requireSelection()) return;
    this.nzModal.create({
      nzTitle: 'Run Rule Book: ' + this.selectedRow.name,
      nzContent: RunNowDialogComponent,
      nzWidth: '500px',
      nzData: { ruleBook: this.selectedRow },
      nzFooter: null,
    });
  }

  onJobHistory(): void {
    if (!this.requireSelection()) return;
    this.router.navigate(['job-history'], {
      relativeTo: this.activeRoute.parent,
      queryParams: { ruleBookName: this.selectedRow.name },
    });
  }

  onConsistencyCheck(): void {
    this.nzModal.create({
      nzTitle: 'Consistency Check',
      nzContent: CssConsistencyCheckComponent,
      nzWidth: '1200px',
      nzBodyStyle: { maxHeight: '80vh', overflow: 'auto' },
      nzFooter: null,
    });
  }
}
