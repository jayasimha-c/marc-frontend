import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiResponse } from '../../../core/models/api-response';
import { TableColumn, TableAction, RowAction } from '../../../shared/components/advanced-table/advanced-table.models';
import { ReadinessCheckService } from './readiness-check.service';
import {
  ModuleInfo,
  ModuleReadinessVO,
  ReadinessCheckVO,
  ReadinessCheckStatus
} from './readiness-check.model';

@Component({
  standalone: false,
  selector: 'app-admin-readiness-check',
  templateUrl: './readiness-check.component.html',
  styleUrls: ['./readiness-check.component.scss']
})
export class ReadinessCheckComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  modules: ModuleInfo[] = [];
  selectedModule: ModuleInfo | null = null;
  moduleReadiness: ModuleReadinessVO | null = null;

  loading = false;
  loadingModules = false;
  runningCheckId: string | null = null;

  tableData: any[] = [];

  columns: TableColumn[] = [
    { field: 'rowNum', header: '#', width: '60px', sortable: false },
    { field: 'checkId', header: 'Check ID', width: '150px', filterable: true },
    { field: 'category', header: 'Category', width: '140px', filterable: true },
    { field: 'name', header: 'Task Evaluated', width: '250px', filterable: true },
    { field: 'required', header: 'Required', width: '110px' },
    { field: 'statusMessage', header: 'Message' },
    {
      field: 'status', header: 'Result', width: '130px', type: 'tag',
      tagColors: {
        'Completed': 'success',
        'Failed': 'error',
        'Warning': 'warning',
        'Disabled': 'default'
      }
    },
    {
      field: 'actions', header: 'Actions', type: 'actions', width: '120px',
      actions: [
        {
          icon: 'reload',
          tooltip: 'Re-run check',
          command: (row: any) => this.rerunCheck(row)
        },
        {
          icon: 'setting',
          tooltip: 'Go to configuration',
          command: (row: any) => this.navigateToConfig(row),
          hidden: (row: any) => !row.navigationRoute
        }
      ]
    }
  ];

  tableActions: TableAction[] = [
    {
      label: 'Run Checks',
      icon: 'caret-right',
      type: 'primary',
      command: () => this.runChecks(),
      disabled: false
    }
  ];

  constructor(
    private readinessService: ReadinessCheckService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadModules();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadModules(): void {
    this.loadingModules = true;
    this.readinessService.getAvailableModules()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.modules = resp.data;
          }
          this.loadingModules = false;
        },
        error: () => { this.loadingModules = false; }
      });
  }

  onModuleSelect(module: ModuleInfo): void {
    this.selectedModule = module;
    this.moduleReadiness = null;
    this.tableData = [];
  }

  runChecks(): void {
    if (!this.selectedModule) return;

    this.loading = true;
    this.moduleReadiness = null;
    this.tableData = [];

    this.readinessService.checkModule(this.selectedModule.code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.moduleReadiness = resp.data;
            this.buildTableData();
          }
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  private buildTableData(): void {
    if (!this.moduleReadiness) return;

    const data: any[] = [];
    let rowNum = 1;

    const statusMap: Record<string, string> = {
      'PASS': 'Completed',
      'FAIL': 'Failed',
      'WARNING': 'Warning',
      'NOT_APPLICABLE': 'Disabled'
    };

    for (const category of this.moduleReadiness.categories) {
      for (const check of category.checks) {
        data.push({
          rowNum: rowNum++,
          checkId: check.checkId,
          category: category.name,
          name: check.name,
          required: check.required || '-',
          description: check.description,
          status: statusMap[check.status] || check.status,
          originalStatus: check.status,
          statusMessage: check.statusMessage || '-',
          navigationRoute: check.navigationRoute,
          _originalCheck: check
        });
      }
    }

    this.tableData = data;
  }

  rerunCheck(rowData: any): void {
    const check = rowData._originalCheck || rowData;
    this.runningCheckId = check.checkId;

    this.readinessService.runSingleCheck(check.checkId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data && this.moduleReadiness) {
            const updatedCheck = resp.data;
            for (const category of this.moduleReadiness.categories) {
              const idx = category.checks.findIndex(c => c.checkId === check.checkId);
              if (idx !== -1) {
                category.checks[idx] = updatedCheck;
                break;
              }
            }
            this.recalculateTotals();
            this.buildTableData();
          }
          this.runningCheckId = null;
        },
        error: () => { this.runningCheckId = null; }
      });
  }

  navigateToConfig(rowData: any): void {
    const route = rowData.navigationRoute || rowData._originalCheck?.navigationRoute;
    if (route) {
      this.router.navigateByUrl(route);
    }
  }

  getModuleIcon(code: string): string {
    const icons: Record<string, string> = {
      'GENERAL': 'setting',
      'ACM': 'safety',
      'CAM': 'control',
      'CSS': 'safety-certificate',
      'PAM': 'key',
      'ICM': 'audit',
      'LICENSE': 'check-circle',
      'CUM': 'team',
      'SERVICENOW': 'robot'
    };
    return icons[code] || 'appstore';
  }

  getStatusColor(): string {
    if (!this.moduleReadiness) return 'default';
    if (this.moduleReadiness.failedChecks > 0) return 'error';
    if (this.moduleReadiness.warningChecks > 0) return 'warning';
    return 'success';
  }

  private recalculateTotals(): void {
    if (!this.moduleReadiness) return;

    let passed = 0, failed = 0, warning = 0, na = 0;

    for (const category of this.moduleReadiness.categories) {
      let catPassed = 0, catFailed = 0, catWarning = 0, catNa = 0;

      for (const check of category.checks) {
        switch (check.status) {
          case ReadinessCheckStatus.PASS: passed++; catPassed++; break;
          case ReadinessCheckStatus.FAIL: failed++; catFailed++; break;
          case ReadinessCheckStatus.WARNING: warning++; catWarning++; break;
          case ReadinessCheckStatus.NOT_APPLICABLE: na++; catNa++; break;
        }
      }

      category.passedCount = catPassed;
      category.failedCount = catFailed;
      category.warningCount = catWarning;
      category.notApplicableCount = catNa;
    }

    this.moduleReadiness.passedChecks = passed;
    this.moduleReadiness.failedChecks = failed;
    this.moduleReadiness.warningChecks = warning;
    this.moduleReadiness.notApplicableChecks = na;
    this.moduleReadiness.totalChecks = passed + failed + warning + na;

    const applicable = this.moduleReadiness.totalChecks - na;
    this.moduleReadiness.readinessPercentage = applicable > 0
      ? Math.round((passed / applicable) * 100) : 100;

    if (failed > 0) {
      this.moduleReadiness.overallStatus = 'Not Ready';
    } else if (warning > 0) {
      this.moduleReadiness.overallStatus = 'Ready with Warnings';
    } else {
      this.moduleReadiness.overallStatus = 'Ready';
    }
  }
}
