import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ChartOptions } from '../../../shared/models/chart.model';
import { CommonApxChartComponent } from '../../../shared/components/common-apx-chart/common-apx-chart.component';
import { ComplianceService } from './compliance.service';
import { CssMonitoringService } from '../monitoring/css-monitoring.service';

export interface ComplianceFramework {
  id: string;
  name: string;
  urn: string;
  displayName: string;
  totalControls: number;
  implementedControls: number;
  complianceScore: number;
  lastAssessment: Date;
  violations: number;
  criticalViolations: number;
}

interface SeverityByFrameworkRow {
  framework: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  criticalPct: number;
  highPct: number;
  mediumPct: number;
  lowPct: number;
}

@Component({
  standalone: false,
  selector: 'app-compliance-dashboard',
  templateUrl: './compliance-dashboard.component.html',
  styleUrls: ['./compliance-dashboard.component.scss'],
  providers: [DatePipe],
})
export class ComplianceDashboardComponent implements OnInit {
  @ViewChild('complianceTrendChart') complianceTrendChart!: CommonApxChartComponent;

  complianceTrendChartOptions!: Partial<ChartOptions>;

  // Filters
  systems: any[] = [];
  frameworks: ComplianceFramework[] = [];
  selectedSystem: number | null = null;
  selectedFramework: string | null = null;
  dateRange: Date[] = [];
  activePreset: number | null = 30;

  // Stats
  statsCards: { title: string; value: string | number; icon: string; color: string }[] = [];
  overallComplianceScore = 0;
  totalViolations = 0;
  criticalFindings = 0;
  controlsCovered = 0;
  totalControls = 0;

  // Control status
  assessableControls = 0;
  nonAssessableControls = 0;

  // Severity by framework
  severityByFrameworkRows: SeverityByFrameworkRow[] = [];

  // Tables
  violationTableData: any[] = [];
  controlDetailsTableData: any[] = [];
  violationColumns = [
    { header: 'Control ID', field: 'controlId' },
    { header: 'Framework', field: 'framework' },
    { header: 'Description', field: 'description' },
    { header: 'Violations', field: 'violations' },
    { header: 'Last Checked', field: 'lastChecked', type: 'date' },
  ];
  controlColumns = [
    { header: 'Description', field: 'description' },
    { header: 'Control ID', field: 'controlId' },
    { header: 'Assessable', field: 'assessable' },
    { header: 'Violations', field: 'violations' },
    { header: 'Last Checked', field: 'lastChecked', type: 'date' },
  ];

  loading = false;

  constructor(
    private complianceService: ComplianceService,
    private cssMonitoringService: CssMonitoringService,
    private router: Router,
    private datePipe: DatePipe,
  ) {
    this.initComplianceTrendChart();
    this.buildStatsCards();
  }

  ngOnInit(): void {
    this.loadSystems();
    this.loadFrameworks();
    this.setPreset(30);
  }

  // -- Filters --

  private getFromDate(): string | null {
    if (this.dateRange?.length === 2 && this.dateRange[0]) {
      return this.datePipe.transform(this.dateRange[0], 'MM/dd/yyyy') || null;
    }
    return null;
  }

  private getToDate(): string | null {
    if (this.dateRange?.length === 2 && this.dateRange[1]) {
      return this.datePipe.transform(this.dateRange[1], 'MM/dd/yyyy') || null;
    }
    return null;
  }

  setPreset(days: number): void {
    this.activePreset = days;
    if (days === 0) {
      this.dateRange = [];
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      this.dateRange = [start, end];
    }
    this.loadDashboardData();
  }

  onDateRangeChange(): void {
    this.activePreset = null;
    this.loadDashboardData();
  }

  onFilterChange(): void {
    this.loadDashboardData();
  }

  loadSystems(): void {
    this.cssMonitoringService.getSystemList(null as any).subscribe((resp) => {
      if (resp.success) this.systems = resp.data || [];
    });
  }

  loadFrameworks(): void {
    this.complianceService.getComplianceFrameworks().subscribe((resp) => {
      if (resp.success) this.frameworks = resp.data?.rows || resp.data || [];
    });
  }

  // -- Data Loading --

  loadDashboardData(): void {
    this.loading = true;
    const from = this.getFromDate();
    const to = this.getToDate();
    const sys = this.selectedSystem;
    const fw = this.selectedFramework;

    forkJoin({
      dashboard: this.complianceService.getDashboardStat(from, to, sys, fw),
      assessable: this.complianceService.getAssessableControlStat(from, to, sys, fw),
      reqNodeViolations: this.complianceService.getReqNodeViolations(from, to, sys, fw),
      reqNodeDetails: this.complianceService.getReqNodeDetails(from, to, sys, fw),
      severityByFramework: this.complianceService.getSeverityViolationsByFramework(from, to, sys, fw),
      complianceTrend: this.complianceService.getComplianceTrend(from, to, sys, fw),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (results) => this.processResults(results),
        error: () => {},
      });
  }

  // -- Data Processing --

  private processResults(results: any): void {
    // Stats
    const stat = results?.dashboard?.data;
    if (stat) {
      this.overallComplianceScore = stat.complianceScore || 0;
      this.totalViolations = stat.totalViolations || 0;
      this.criticalFindings = stat.totalCriticalViolations || 0;
      this.controlsCovered = stat.totalControlsViolated || 0;
      this.totalControls = stat.totalControlsMapped || 0;
    }
    this.buildStatsCards();

    // Assessable controls
    const ac = results?.assessable?.data;
    if (ac) {
      this.assessableControls = ac.assessableControls || 0;
      this.nonAssessableControls = ac.nonAssessableControls || 0;
    }

    // Severity by framework
    const sfData = results?.severityByFramework?.data || [];
    this.severityByFrameworkRows = sfData.map((v: any) => {
      const c = v.critical || 0, h = v.high || 0, m = v.medium || 0, l = v.low || 0;
      const total = c + h + m + l;
      return {
        framework: v.framework, critical: c, high: h, medium: m, low: l, total,
        criticalPct: total ? (c / total) * 100 : 0,
        highPct: total ? (h / total) * 100 : 0,
        mediumPct: total ? (m / total) * 100 : 0,
        lowPct: total ? (l / total) * 100 : 0,
      };
    });

    // Compliance trend chart
    const trend = results?.complianceTrend?.data;
    if (trend) {
      this.complianceTrendChartOptions.series = trend.series || [];
      this.complianceTrendChartOptions.xaxis = { categories: trend.categories || [] };
      this.complianceTrendChart?.updateChart();
    }

    // Tables
    this.violationTableData = results?.reqNodeViolations?.data || [];
    this.controlDetailsTableData = results?.reqNodeDetails?.data || [];
  }

  private buildStatsCards(): void {
    this.statsCards = [
      { title: 'Overall Compliance', value: this.overallComplianceScore + '%', icon: 'safety-certificate', color: '#1890ff' },
      { title: 'Total Violations', value: this.totalViolations, icon: 'warning', color: '#fa8c16' },
      { title: 'Critical Findings', value: this.criticalFindings, icon: 'exclamation-circle', color: '#f5222d' },
      { title: 'Controls Covered', value: this.controlsCovered + '/' + this.totalControls, icon: 'check-square', color: '#52c41a' },
    ];
  }

  // -- Chart --

  private initComplianceTrendChart(): void {
    this.complianceTrendChartOptions = {
      series: [],
      chart: { type: 'area', height: 280 },
      colors: ['#f5222d', '#fa8c16', '#722ed1', '#52c41a'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
      xaxis: { categories: [] },
      yaxis: { title: { text: 'Violations' } },
      legend: { position: 'top' },
      tooltip: { shared: true, intersect: false },
      title: { text: 'Compliance Trend' },
      icon: 'rise',
    };
  }

  // -- Helpers --

  getControlBarPct(count: number): number {
    const total = this.assessableControls + this.nonAssessableControls;
    return total > 0 ? (count / total) * 100 : 0;
  }

  drillDownControl(row: any): void {
    this.router.navigate([`css/compliance-dashboard/control-drilldown/${row.controlUUID}`]);
  }
}
