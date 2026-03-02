import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { ReportService } from '../report.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';
import { ApiResponse } from '../../../../core/models/api-response';
import { StatisticsModalComponent } from './statistics-modal.component';
import { OrgChecksModalComponent } from './org-checks-modal.component';

type TabType = 'ANALYSIS' | 'SIMULATION' | 'ONLINE' | 'SCHEDULED' | 'NON-ABAP';

interface TabConfig {
  type: TabType;
  title: string;
  data: any[];
  totalRecords: number;
  loading: boolean;
  selectedRows: Set<any>;
  allChecked: boolean;
  indeterminate: boolean;
  pageIndex: number;
  pageSize: number;
  sortField: string;
  sortOrder: number;
  globalFilter: string;
}

const DEFAULT_PAGE_SIZE = 10;

@Component({
  standalone: false,
  selector: 'app-sod-results',
  templateUrl: './sod-results.component.html',
  styleUrls: ['./sod-results.component.scss'],
})
export class SodResultsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  selectedTabIndex = 0;

  tabs: TabConfig[] = [
    this.createTab('ANALYSIS', 'Offline'),
    this.createTab('SIMULATION', 'Simulation'),
    this.createTab('ONLINE', 'Online'),
    this.createTab('SCHEDULED', 'Dashboard'),
    this.createTab('NON-ABAP', 'Non-ABAP'),
  ];

  constructor(
    private reportService: ReportService,
    private router: Router,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
    private fileSaverService: FileSaverService,
  ) {}

  ngOnInit(): void {
    // Data loads via nz-table's (nzQueryParams) on first render
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Tab & Table State ─────────────────────────────────────

  get activeTab(): TabConfig {
    return this.tabs[this.selectedTabIndex];
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  onQueryParamsChange(params: NzTableQueryParams, tab: TabConfig): void {
    const { pageSize, pageIndex, sort } = params;
    const activeSort = sort.find(s => s.value !== null);

    tab.pageIndex = pageIndex;
    tab.pageSize = pageSize;

    if (activeSort) {
      tab.sortField = activeSort.key;
      tab.sortOrder = activeSort.value === 'ascend' ? 1 : -1;
    } else {
      tab.sortField = tab.type === 'NON-ABAP' ? 'startedOn' : 'startedOnStr';
      tab.sortOrder = 1;
    }

    this.loadTabData(tab);
  }

  onGlobalFilterChange(value: string, tab: TabConfig): void {
    tab.globalFilter = value;
    tab.pageIndex = 1;
    this.loadTabData(tab);
  }

  // ── Data Loading ──────────────────────────────────────────

  private loadTabData(tab: TabConfig): void {
    tab.loading = true;

    const event = {
      first: (tab.pageIndex - 1) * tab.pageSize,
      rows: tab.pageSize,
      sortOrder: tab.sortOrder,
      sortField: tab.sortField,
      filters: {},
      globalFilter: tab.globalFilter || null,
    };

    const serviceCall = this.getServiceCall(tab.type, event);

    serviceCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success) {
          tab.data = resp.data.rows || [];
          tab.totalRecords = resp.data.records || 0;
        } else {
          tab.data = [];
          tab.totalRecords = 0;
        }
        this.resetSelection(tab);
        tab.loading = false;
      },
      error: () => {
        tab.data = [];
        tab.totalRecords = 0;
        tab.loading = false;
      },
    });
  }

  private getServiceCall(type: TabType, event: any) {
    switch (type) {
      case 'ANALYSIS':
        return this.reportService.getAnalysisJobs(event);
      case 'SIMULATION':
        return this.reportService.getSimulations(event);
      case 'ONLINE':
        return this.reportService.getAdhocAnalysis(event);
      case 'SCHEDULED':
        return this.reportService.getScheduledJobs(event);
      case 'NON-ABAP':
        return this.reportService.getNonAbapJobs(event);
    }
  }

  private reloadActiveTab(): void {
    this.loadTabData(this.activeTab);
  }

  // ── Checkbox Selection ────────────────────────────────────

  onAllChecked(checked: boolean, tab: TabConfig): void {
    tab.data.forEach(row => {
      if (checked) {
        tab.selectedRows.add(row);
      } else {
        tab.selectedRows.delete(row);
      }
    });
    this.refreshCheckState(tab);
  }

  onItemChecked(row: any, checked: boolean, tab: TabConfig): void {
    if (checked) {
      tab.selectedRows.add(row);
    } else {
      tab.selectedRows.delete(row);
    }
    this.refreshCheckState(tab);
  }

  private refreshCheckState(tab: TabConfig): void {
    const allChecked = tab.data.length > 0 && tab.data.every(row => tab.selectedRows.has(row));
    const noneChecked = tab.data.every(row => !tab.selectedRows.has(row));
    tab.allChecked = allChecked;
    tab.indeterminate = !allChecked && !noneChecked;
  }

  private resetSelection(tab: TabConfig): void {
    tab.selectedRows = new Set();
    tab.allChecked = false;
    tab.indeterminate = false;
  }

  private getSelectedArray(tab: TabConfig): any[] {
    return Array.from(tab.selectedRows);
  }

  // ── Row Actions ───────────────────────────────────────────

  onView(row: any, tab: TabConfig): void {
    if (row.status === 'RUNNING') {
      this.notificationService.error('This task is still running, result data is not available at the moment.');
      return;
    }
    if (row.status === 'ERROR') {
      this.notificationService.error('Cannot view the results of a failed job.');
      return;
    }
    this.router.navigate(['acm/reports/sod-results/view'], {
      state: { data: { ...row, type: tab.type } },
    });
  }

  onViewWithBpmn(row: any, tab: TabConfig): void {
    if (row.status === 'RUNNING') {
      this.notificationService.error('This task is still running, result data is not available at the moment.');
      return;
    }
    if (row.status === 'ERROR') {
      this.notificationService.error('Cannot view the results of a failed job.');
      return;
    }
    this.router.navigate(['acm/reports/sod-results/view'], {
      state: { data: { ...row, type: tab.type }, bpmn: true },
    });
  }

  onDelete(tab: TabConfig): void {
    const selected = this.getSelectedArray(tab);
    if (!selected.length) {
      this.notificationService.error('Please select at least one row.');
      return;
    }

    this.confirmDialogService.confirm({
      title: 'Delete Results',
      message: `Are you sure you want to delete ${selected.length} selected result(s)?`,
    }).subscribe(result => {
      if (!result) return;

      const jobIds = selected.map(r => r.id).join(',');
      const deleteCall = tab.type === 'NON-ABAP'
        ? this.reportService.deleteNonAbapResults(jobIds)
        : this.reportService.deleteResults(jobIds);

      deleteCall.pipe(takeUntil(this.destroy$)).subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.notificationService.success('Results deleted successfully.');
            this.reloadActiveTab();
          } else {
            this.notificationService.error(resp.message || 'Failed to delete results.');
          }
        },
        error: (err: any) => {
          this.notificationService.error(err.error?.message || 'Error deleting results.');
        },
      });
    });
  }

  onSodStatistics(row: any): void {
    if (row.analysisType !== 'RISK') {
      this.notificationService.error('Please select only RISK type analysis jobs.');
      return;
    }

    this.reportService.sodAnalysisStats(row.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success) {
          this.nzModal.create({
            nzTitle: 'SOD Statistics',
            nzContent: StatisticsModalComponent,
            nzWidth: '90vw',
            nzFooter: null,
            nzData: { data: resp },
          });
        }
      },
      error: (err: any) => {
        this.notificationService.error(err.error?.message || 'Error loading statistics.');
      },
    });
  }

  onOrgCheck(row: any): void {
    this.reportService.checkFieldExistance(row.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success) {
          this.notificationService.success(resp.message || 'Field check passed.');
          this.nzModal.create({
            nzTitle: 'Start Org Checks - Select Organizations',
            nzContent: OrgChecksModalComponent,
            nzWidth: '40vw',
            nzFooter: null,
            nzData: { data: row, option: resp.data, mode: 'simulation' },
          });
        }
      },
      error: (err: any) => {
        this.notificationService.error(err.error?.message || 'Error checking org fields.');
      },
    });
  }

  onRoleSODMatrix(row: any): void {
    if (row.targetType !== 'ROLE' || row.analysisType !== 'RULE') {
      this.notificationService.error('Matrix Report is available only for target type of ROLE and analysis type of RULE.');
      return;
    }
    if (row.status === 'RUNNING') {
      this.notificationService.error('This task is still running, result data is not available at the moment.');
      return;
    }

    this.notificationService.success('We are preparing your report, please wait...');

    this.reportService.generateMatrixReport(row.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (resp: any) => {
        this.fileSaverService.saveAnyFile(resp);
      },
      error: (err: any) => {
        this.notificationService.error(err.error?.message || 'Error generating matrix report.');
      },
    });
  }

  onPivot(row: any, tab: TabConfig): void {
    // Placeholder for pivot navigation
    this.notificationService.info('Pivot functionality is not yet implemented.');
  }

  // ── Compare Jobs ──────────────────────────────────────────

  addJobsToCompare(): void {
    const tab = this.activeTab;
    const selected = this.getSelectedArray(tab);

    if (!selected.length) {
      this.notificationService.error('Please select rows to compare.');
      return;
    }

    if (selected.length !== 2) {
      this.notificationService.error('Please select exactly two rows to compare.');
      return;
    }

    if (selected[0].analysisType !== 'RISK' || selected[1].analysisType !== 'RISK') {
      this.notificationService.error('Please select only RISK analysis type jobs.');
      return;
    }

    if (selected[0].targetType !== selected[1].targetType) {
      this.notificationService.error('Please select jobs with the same target type.');
      return;
    }

    const jobIds = selected[0].id + ',' + selected[1].id;
    this.reportService.sodCompare(jobIds).pipe(takeUntil(this.destroy$)).subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success) {
          this.notificationService.success('SOD comparison completed.');
        } else {
          this.notificationService.error(resp.message || 'Comparison failed.');
        }
      },
      error: (err: any) => {
        this.notificationService.error(err.error?.message || 'Error comparing jobs.');
      },
    });
  }

  // ── Status Tag Helpers ────────────────────────────────────

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'RUNNING': return 'blue';
      case 'ERROR': return 'red';
      case 'PENDING': return 'orange';
      default: return 'default';
    }
  }

  // ── Private Helpers ───────────────────────────────────────

  private createTab(type: TabType, title: string): TabConfig {
    return {
      type,
      title,
      data: [],
      totalRecords: 0,
      loading: false,
      selectedRows: new Set(),
      allChecked: false,
      indeterminate: false,
      pageIndex: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sortField: type === 'NON-ABAP' ? 'startedOn' : 'startedOnStr',
      sortOrder: 1,
      globalFilter: '',
    };
  }

  private requireSingleSelection(tab: TabConfig): any | null {
    const selected = this.getSelectedArray(tab);
    if (!selected.length) {
      this.notificationService.error('Please select a row.');
      return null;
    }
    if (selected.length > 1) {
      this.notificationService.error('Please select only one row.');
      return null;
    }
    return selected[0];
  }
}

