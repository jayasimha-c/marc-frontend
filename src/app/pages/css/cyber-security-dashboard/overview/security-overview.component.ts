import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CssDashboardService } from '../css-dashboard.service';
import { SecurityStats, SeverityEntry, SystemRow, TriageEntry } from '../security.model';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { CommonApxChartComponent } from '../../../../shared/components/common-apx-chart/common-apx-chart.component';

@Component({
  standalone: false,
  selector: 'app-security-overview',
  templateUrl: './security-overview.component.html',
  styleUrls: ['./security-overview.component.scss'],
  providers: [DatePipe],
})
export class SecurityOverviewComponent implements OnInit, OnDestroy {
  @ViewChild('eventTrendsChart') eventTrendsChart!: CommonApxChartComponent;

  private destroy$ = new Subject<void>();
  loading = true;

  // Filters
  sapSystems: any[] = [];
  selectedSystemId = '-1';
  dateRange: Date[] = [];
  activePreset: number | null = 90;
  readonly datePresets = [
    { label: '7d', days: 7 },
    { label: '1m', days: 30 },
    { label: '3m', days: 90 },
    { label: '1y', days: 365 },
  ];

  // Stats
  stats: SecurityStats = {
    total: 0, systems: 0, critical: 0, high: 0,
    medium: 0, low: 0, open: 0, inProgress: 0,
    resolved: 0, falsePositive: 0,
  };
  statsCards: { title: string; value: string | number; icon: string; color: string }[] = [];

  // Severity distribution
  severityBar = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  sevPct = { critical: 0, high: 0, medium: 0, low: 0 };

  // System rows
  systemRows: SystemRow[] = [];

  // Triage
  triageEntries: TriageEntry[] = [];
  triageTotal = 0;

  // Critical events
  criticalEvents: any[] = [];

  // Timeline chart
  timelineChartOptions!: Partial<ChartOptions>;

  constructor(
    private cssDashboardService: CssDashboardService,
    private router: Router,
    private datePipe: DatePipe,
  ) {
    this.initTimelineChart();
  }

  ngOnInit(): void {
    this.setPreset(90);
    this.loadSystems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -- Filters --

  private loadSystems(): void {
    this.cssDashboardService.getAllSystems().subscribe({
      next: (resp) => {
        if (resp.success) {
          this.sapSystems = resp.data || [];
        }
      },
    });
  }

  setPreset(days: number): void {
    this.activePreset = days;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    this.dateRange = [start, end];
    this.loadData();
  }

  onDateRangeChange(): void {
    this.activePreset = null;
    this.loadData();
  }

  onSystemChange(): void {
    this.loadData();
  }

  private getFromDate(): string {
    if (this.dateRange?.length === 2 && this.dateRange[0]) {
      return this.datePipe.transform(this.dateRange[0], 'MM/dd/yyyy') || '';
    }
    return '';
  }

  private getToDate(): string {
    if (this.dateRange?.length === 2 && this.dateRange[1]) {
      return this.datePipe.transform(this.dateRange[1], 'MM/dd/yyyy') || '';
    }
    return '';
  }

  // -- Chart Init --

  private initTimelineChart(): void {
    this.timelineChartOptions = {
      series: [],
      chart: { type: 'area', height: 280, stacked: true, toolbar: { show: true } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 0 },
      fill: { type: 'solid', opacity: 0.8 },
      legend: { show: true, position: 'bottom', horizontalAlign: 'center', fontSize: '12px' },
      xaxis: { categories: [], labels: { style: { fontSize: '12px', colors: '#8e8da4' } } },
      yaxis: { title: { text: 'Number of Issues' } },
      title: { text: 'Event Trends', align: 'left' },
      icon: 'area-chart',
    };
  }

  // -- Data Loading --

  private loadData(): void {
    this.loading = true;
    const fromDate = this.getFromDate();
    const toDate = this.getToDate();
    const sysId = this.selectedSystemId;
    const sev = 'ALL';

    forkJoin({
      severity: this.cssDashboardService.getSystemWiseSeverityCount(fromDate, toDate, sysId, sev),
      alerts: this.cssDashboardService.getAlertStatus(sysId, fromDate, toDate, sev),
      critical: this.cssDashboardService.getRecentCriticalEvents(fromDate, toDate, sysId),
      dashCount: this.cssDashboardService.getDashboardDataCount(sysId, fromDate, toDate, sev),
      timeline: this.cssDashboardService.getSecurityTimeLine(fromDate, toDate, sysId, sev, '24h'),
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ severity, alerts, critical, dashCount, timeline }) => {
        this.processStats(dashCount.data);
        this.processSystemSeverity(severity.data);
        this.processAlertStatus(alerts.data || []);
        this.criticalEvents = (critical.data || []).slice(0, 6);
        this.processTimeline(timeline.data);
      },
    });
  }

  private processStats(data: any): void {
    if (!data) return;
    this.stats.total = data.totalEvents || 0;
    this.stats.systems = data.systems || 0;
    this.stats.critical = 0;
    this.stats.high = 0;
    this.stats.medium = 0;
    this.stats.low = 0;
    (data.severityCount || []).forEach((entry: SeverityEntry) => {
      if (entry.severity === 'CRITICAL') this.stats.critical = entry.total_count;
      else if (entry.severity === 'HIGH') this.stats.high = entry.total_count;
      else if (entry.severity === 'MEDIUM') this.stats.medium = entry.total_count;
      else if (entry.severity === 'LOW') this.stats.low = entry.total_count;
    });
    this.buildStatsCards();
  }

  private processSystemSeverity(data: Record<string, Record<string, number>>): void {
    if (!data) return;
    const systems = Object.keys(data);

    this.systemRows = systems.map((name) => {
      const c = data[name]['CRITICAL'] || 0;
      const h = data[name]['HIGH'] || 0;
      const m = data[name]['MEDIUM'] || 0;
      const l = data[name]['LOW'] || 0;
      const total = c + h + m + l;
      return {
        name, critical: c, high: h, medium: m, low: l, total,
        criticalPct: total ? (c / total) * 100 : 0,
        highPct: total ? (h / total) * 100 : 0,
        mediumPct: total ? (m / total) * 100 : 0,
        lowPct: total ? (l / total) * 100 : 0,
      };
    }).sort((a, b) => b.total - a.total);

    // Aggregate severity bar
    let cr = 0, hi = 0, me = 0, lo = 0;
    systems.forEach((sys) => {
      cr += data[sys]['CRITICAL'] || 0;
      hi += data[sys]['HIGH'] || 0;
      me += data[sys]['MEDIUM'] || 0;
      lo += data[sys]['LOW'] || 0;
    });
    const total = cr + hi + me + lo;
    this.severityBar = { critical: cr, high: hi, medium: me, low: lo, total };
    this.sevPct = {
      critical: total ? (cr / total) * 100 : 0,
      high: total ? (hi / total) * 100 : 0,
      medium: total ? (me / total) * 100 : 0,
      low: total ? (lo / total) * 100 : 0,
    };
  }

  private processAlertStatus(alertData: any[]): void {
    const countMap: Record<string, number> = {};
    alertData.forEach((item) => { countMap[item.status] = item.total_count; });

    const toDo = countMap['todo'] || 0;
    const inProgress = countMap['inprogress'] || 0;
    const resolved = countMap['resolved'] || 0;
    const falsePositive = countMap['falsepositive'] || 0;

    this.triageEntries = [
      { key: 'todo', label: 'To Do', count: toDo, color: '#f5222d' },
      { key: 'inprogress', label: 'In Progress', count: inProgress, color: '#fa8c16' },
      { key: 'resolved', label: 'Resolved', count: resolved, color: '#52c41a' },
      { key: 'falsepositive', label: 'False Positive', count: falsePositive, color: '#8c8c8c' },
    ];
    this.triageTotal = toDo + inProgress + resolved + falsePositive;

    this.stats.open = toDo + inProgress;
    this.stats.resolved = resolved;
    this.buildStatsCards();
  }

  private processTimeline(data: any): void {
    if (!data) return;
    const categories = data.categories || [];
    const series = data.eventSeries || [];

    this.timelineChartOptions.xaxis = { ...this.timelineChartOptions.xaxis, categories };
    this.timelineChartOptions.series = [...series];
    this.eventTrendsChart?.updateChart();
  }

  // -- Helpers --

  private buildStatsCards(): void {
    this.statsCards = [
      { title: 'Critical', value: this.stats.critical, icon: 'exclamation-circle', color: '#f5222d' },
      { title: 'High', value: this.stats.high, icon: 'warning', color: '#fa8c16' },
      { title: 'Open', value: this.stats.open, icon: 'clock-circle', color: '#1890ff' },
      { title: 'Resolved', value: this.stats.resolved, icon: 'check-circle', color: '#52c41a' },
    ];
  }

  getTriageBarPct(entry: TriageEntry): number {
    return this.triageTotal > 0 ? (entry.count / this.triageTotal) * 100 : 0;
  }

  navigateToEventLogs(systemName?: string, severity?: string): void {
    const queryParams: any = {};
    if (systemName) queryParams.systemName = systemName;
    if (severity) queryParams.severity = severity;
    this.router.navigate(['/css/cyber-security-dashboard/event-logs'], { queryParams });
  }
}
