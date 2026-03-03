import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { IcmControlService } from '../icm-control.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RuleAuditLogsDialogComponent } from './rule-audit-logs-dialog.component';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-control-list',
  templateUrl: './control-list.component.html',
  styleUrls: ['./control-list.component.scss'],
})
export class ControlListComponent implements OnInit {
  searchOpen = false;
  filterForm: FormGroup;

  // Dashboard metrics
  totalControls = 0;
  controlTypeChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  criticalityChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  businessProcessChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  metricsLoading = false;

  // Dropdown data
  criticallyList: any[] = [];
  bpList: any[] = [];
  sbpList: any[] = [];

  // Table
  controls: any[] = [];
  totalRecords = 0;
  loading = false;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Control', sortable: true, ellipsis: true },
    { field: 'bpName', header: 'Business Process', sortable: true, ellipsis: true },
    { field: 'sbpName', header: 'Sub Process', sortable: true, ellipsis: true },
    { field: 'created', header: 'Created', type: 'date', sortable: true, width: '130px' },
    { field: 'criticalityName', header: 'Criticality', sortable: true, width: '120px',
      tagColors: { Critical: 'red', High: 'orange', Medium: 'gold', Low: 'green' }, type: 'tag' },
    { field: 'controlTypeName', header: 'Type', sortable: true, width: '130px' },
    { field: 'scheduleKind', header: 'Schedule', sortable: true, width: '120px' },
    { field: 'lastExecutedDate', header: 'Last Executed', type: 'date', sortable: true, width: '140px' },
    { field: 'active', header: 'Active', type: 'boolean', width: '80px' },
  ];

  tableActions: TableAction[] = [
    { label: 'Add Control', icon: 'plus', type: 'primary', command: () => this.router.navigate(['/icm/controls/add']) },
    { label: 'View', icon: 'eye', type: 'default', command: () => this.viewSelected() },
    { label: 'Rule Audit Logs', icon: 'audit', type: 'default', command: () => this.openRuleAuditLogs() },
  ];

  // Pagination state
  private currentFirst = 0;
  private currentRows = 20;
  private currentSortField = '';
  private currentSortOrder = 1;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private nzModal: NzModalService,
    private controlService: IcmControlService,
    private notificationService: NotificationService,
  ) {
    this.filterForm = this.fb.group({
      controlName: [''],
      criticality: [null],
      businessProcess: [null],
      businessSubProcess: [null],
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
    this.loadControls();
    this.loadDashboardMetrics();

    this.filterForm.get('businessProcess')!.valueChanges.subscribe(bpId => {
      if (bpId) {
        this.controlService.getBusinessSubProcesses(bpId).subscribe({
          next: (r) => this.sbpList = r.data?.rows || [],
          error: () => this.sbpList = [],
        });
      } else {
        this.sbpList = [];
      }
      this.filterForm.get('businessSubProcess')!.setValue(null);
    });
  }

  private loadDropdowns(): void {
    this.controlService.getCriticalityList().subscribe({ next: (r) => this.criticallyList = r.data?.rows || [] });
    this.controlService.getBPList().subscribe({ next: (r) => this.bpList = r.data?.rows || [] });
  }

  loadControls(): void {
    this.loading = true;
    const f = this.filterForm.value;
    const params: any = {
      cn: f.controlName || undefined,
      criticality: f.criticality || undefined,
      bp: f.businessProcess || undefined,
      sp: f.businessSubProcess || undefined,
      first: this.currentFirst,
      rows: this.currentRows,
      sortField: this.currentSortField,
      sortOrder: this.currentSortOrder,
    };
    this.controlService.getControlList(params).subscribe({
      next: (res) => {
        this.controls = res.data?.rows || [];
        this.totalRecords = res.data?.records || 0;
        this.loading = false;
      },
      error: () => {
        this.controls = [];
        this.totalRecords = 0;
        this.loading = false;
      },
    });
  }

  onQueryParamsChange(params: any): void {
    this.currentFirst = (params.pageIndex - 1) * params.pageSize;
    this.currentRows = params.pageSize;
    if (params.sort?.field) {
      this.currentSortField = params.sort.field;
      this.currentSortOrder = params.sort.direction === 'descend' ? -1 : 1;
    }
    this.loadControls();
  }

  onSearch(): void {
    this.currentFirst = 0;
    this.loadControls();
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onRowDoubleClick(row: any): void {
    if (row?.id) {
      this.router.navigate([`/icm/controls/${row.id}`]);
    }
  }

  viewSelected(): void {
    if (!this.selectedRow?.id) {
      this.notificationService.warn('Please select a control to view');
      return;
    }
    this.router.navigate([`/icm/controls/${this.selectedRow.id}`]);
  }

  openRuleAuditLogs(): void {
    this.nzModal.create({
      nzTitle: 'Control Rule Change Logs',
      nzContent: RuleAuditLogsDialogComponent,
      nzWidth: '90vw',
      nzFooter: null,
      nzClassName: 'updated-modal',
    });
  }

  // --- Dashboard metrics ---

  private loadDashboardMetrics(): void {
    this.metricsLoading = true;
    this.controlService.getControlList({ first: 0, rows: 10000, sortField: '', sortOrder: 1 }).subscribe({
      next: (res) => {
        const rows = res.data?.rows || [];
        this.totalControls = res.data?.records || rows.length;
        this.generateCriticalityChart(rows);
        this.generateControlTypeChart(rows);
        this.generateBusinessProcessChart(rows);
        this.metricsLoading = false;
      },
      error: () => {
        this.totalControls = 0;
        this.criticalityChartData = [];
        this.controlTypeChartData = [];
        this.businessProcessChartData = [];
        this.metricsLoading = false;
      },
    });
  }

  private generateCriticalityChart(controls: any[]): void {
    const colors: Record<string, string> = { critical: '#dc2626', high: '#ea580c', medium: '#f59e0b', low: '#16a34a' };
    const priorityOrder = ['critical', 'high', 'medium', 'low'];
    const counts: Record<string, number> = {};
    controls.forEach((c) => {
      const key = (c.criticalityName || 'unknown').toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    const total = controls.length;
    this.criticalityChartData = Object.keys(counts)
      .filter(k => k !== 'unknown')
      .map(k => ({
        label: k.charAt(0).toUpperCase() + k.slice(1),
        value: counts[k],
        percentage: total > 0 ? Math.round((counts[k] / total) * 100) : 0,
        color: colors[k] || '#6b7280',
      }))
      .sort((a, b) => {
        const ai = priorityOrder.indexOf(a.label.toLowerCase());
        const bi = priorityOrder.indexOf(b.label.toLowerCase());
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
  }

  private generateControlTypeChart(controls: any[]): void {
    let automated = 0, manual = 0;
    controls.forEach((c) => {
      const t = (c.controlTypeName || '').toLowerCase();
      if (t.includes('automated') || t.includes('standard')) automated++;
      else manual++;
    });
    const total = controls.length;
    this.controlTypeChartData = [
      { label: 'Automated', value: automated, percentage: total > 0 ? Math.round((automated / total) * 100) : 0, color: '#16a34a' },
      { label: 'Manual', value: manual, percentage: total > 0 ? Math.round((manual / total) * 100) : 0, color: '#f59e0b' },
    ].filter(i => i.value > 0);
  }

  private generateBusinessProcessChart(controls: any[]): void {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const counts = new Map<string, number>();
    controls.forEach((c) => {
      const name = c.bpName || 'Other';
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    const total = controls.length;
    this.businessProcessChartData = Array.from(counts.entries())
      .map(([name, count], i) => ({
        label: name,
        value: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }
}
