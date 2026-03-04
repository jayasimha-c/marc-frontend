import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';
import { AbapService } from '../abap.service';
import { ApiResponse } from '../../../core/models/api-response';

interface SeverityItem {
  severity: string;
  count: number;
}

interface TrendItem {
  date: string;
  count: number;
}

@Component({
  standalone: false,
  selector: 'app-abap-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class AbapDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = false;
  error: string | null = null;
  lastRefresh: Date = new Date();

  // Filters
  dateRange: Date[] = [];
  selectedSystemId: number | null = null;
  sapSystems: any[] = [];

  // Overview stats
  dashboardData: any = null;
  activeScans: any[] = [];

  // Chart data
  severityItems: SeverityItem[] = [];
  severityTotal = 0;
  trendItems: TrendItem[] = [];
  trendMax = 0;

  // Recent scans
  recentScans: any[] = [];

  constructor(
    private abapService: AbapService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSapSystems();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== Data Loading ====================

  loadSapSystems(): void {
    this.abapService.getExecutedSapSystems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: ApiResponse) => {
          if (res.success) {
            this.sapSystems = Array.isArray(res.data) ? res.data : (res.data?.rows || []);
          }
        },
      });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    const startDate = this.dateRange?.[0] ? this.formatDate(this.dateRange[0]) : undefined;
    const endDate = this.dateRange?.[1] ? this.formatDate(this.dateRange[1]) : undefined;
    const systemId = this.selectedSystemId || undefined;
    const hasFilters = !!(startDate || endDate || systemId);

    const empty = { data: null, success: false } as any;

    const overview$ = (hasFilters
      ? this.abapService.getDashboardOverviewFiltered(startDate, endDate, systemId)
      : this.abapService.getDashboardOverview()
    ).pipe(catchError(() => of(empty)));

    const severity$ = (hasFilters
      ? this.abapService.getSeverityChartDataFiltered(startDate, endDate, systemId)
      : this.abapService.getSeverityChartData()
    ).pipe(catchError(() => of(empty)));

    const trends$ = (hasFilters
      ? this.abapService.getTrendsChartDataFiltered(startDate, endDate, systemId)
      : this.abapService.getTrendsChartData()
    ).pipe(catchError(() => of(empty)));

    const recent$ = this.abapService.getRecentScans().pipe(catchError(() => of(empty)));

    forkJoin([overview$, severity$, trends$, recent$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([overviewRes, severityRes, trendsRes, recentRes]) => {
          // Overview
          const overviewData = overviewRes?.data;
          if (overviewData) {
            this.dashboardData = overviewData.stats || overviewData;
            this.activeScans = overviewData.activeScans || [];
          } else {
            this.dashboardData = { totalScans: 0, running: 0, totalFindings: 0, criticalIssues: 0 };
            this.activeScans = [];
          }

          // Severity chart data - API returns array of { severity, count }
          this.processSeverityData(severityRes?.data);

          // Trends chart data - API returns array of { date, count }
          this.processTrendsData(trendsRes?.data);

          // Recent scans
          const recentData = recentRes?.data;
          this.recentScans = Array.isArray(recentData) ? recentData : (recentData?.rows || []);

          this.lastRefresh = new Date();
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load dashboard data';
          this.loading = false;
        },
      });
  }

  private processSeverityData(data: any): void {
    if (!data) {
      this.severityItems = [];
      this.severityTotal = 0;
      return;
    }

    // Handle array format: [{ severity: 'HIGH', count: 5 }, ...]
    if (Array.isArray(data)) {
      const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      this.severityItems = order.map(sev => {
        const found = data.find((s: any) => s.severity === sev);
        return { severity: sev, count: found?.count ?? 0 };
      });
    } else {
      // Handle object format: { critical: 5, high: 3, ... }
      this.severityItems = [
        { severity: 'CRITICAL', count: data.critical || 0 },
        { severity: 'HIGH', count: data.high || 0 },
        { severity: 'MEDIUM', count: data.medium || 0 },
        { severity: 'LOW', count: data.low || 0 },
      ];
    }
    this.severityTotal = this.severityItems.reduce((sum, s) => sum + s.count, 0);
  }

  private processTrendsData(data: any): void {
    if (!data || !Array.isArray(data) || data.length === 0) {
      this.trendItems = [];
      this.trendMax = 0;
      return;
    }
    this.trendItems = data.map((item: any) => ({
      date: item.date || item.label || '',
      count: item.count || item.value || 0,
    }));
    this.trendMax = Math.max(...this.trendItems.map(t => t.count), 1);
  }

  // ==================== Filter Handlers ====================

  onDateRangeChange(dates: Date[]): void {
    this.dateRange = dates || [];
    this.loadDashboardData();
  }

  onSystemChange(): void {
    this.loadDashboardData();
  }

  onRefresh(): void {
    this.loadDashboardData();
  }

  // ==================== Navigation ====================

  navigateToScanHistory(): void {
    this.router.navigate(['/sap-abap-scanner/scan-history']);
  }

  navigateToCodeScan(): void {
    this.router.navigate(['/sap-abap-scanner/code-scan/add']);
  }

  viewScanResult(scan: any): void {
    const executionId = scan.id || scan.executionId;
    const systemId = scan.sapSystemId;
    if (executionId && systemId) {
      this.router.navigate(['/sap-abap-scanner/scan-results/detail'], {
        queryParams: { executionId, systemId },
      });
    }
  }

  // ==================== Formatting Helpers ====================

  getStatusTag(status: string): { color: string; label: string } {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS': return { color: 'success', label: 'Completed' };
      case 'RUNNING':
      case 'IN_PROGRESS': return { color: 'processing', label: 'Running' };
      case 'FAILED':
      case 'ERROR': return { color: 'error', label: 'Failed' };
      case 'CANCELLED': return { color: 'warning', label: 'Cancelled' };
      default: return { color: 'default', label: status || 'Unknown' };
    }
  }

  getSeverityColor(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return '#cf1322';
      case 'HIGH': return '#fa541c';
      case 'MEDIUM': return '#fa8c16';
      case 'LOW': return '#52c41a';
      default: return '#888';
    }
  }

  getSeverityTagColor(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'volcano';
      case 'MEDIUM': return 'orange';
      case 'LOW': return 'green';
      default: return 'default';
    }
  }

  getSeverityPercent(count: number): number {
    if (this.severityTotal === 0) return 0;
    return Math.round((count / this.severityTotal) * 100);
  }

  getTrendPercent(count: number): number {
    if (this.trendMax === 0) return 0;
    return Math.round((count / this.trendMax) * 100);
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
