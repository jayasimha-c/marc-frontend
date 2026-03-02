import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location, DatePipe } from '@angular/common';
import { FormControl } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ChartOptions } from '../../../../shared/models/chart.model';
import { CommonApxChartComponent } from '../../../../shared/components/common-apx-chart/common-apx-chart.component';
import { ComplianceService } from '../compliance.service';

@Component({
  standalone: false,
  selector: 'app-control-details',
  templateUrl: './control-details.component.html',
  styleUrls: ['./control-details.component.scss'],
  providers: [DatePipe],
})
export class ControlDetailsComponent implements OnInit {
  @ViewChild('violationTrendChart') violationTrendChart!: CommonApxChartComponent;
  @ViewChild('violationBySystemChart') violationBySystemChart!: CommonApxChartComponent;

  loading = false;
  controlData: any = null;
  controlMetrics: any = null;

  // Filters
  selectedSystem = new FormControl('ALL');
  systems: any[] = [];
  dateRange: Date[] = [];
  activePreset: number | null = 90;

  // Stats
  statsCards: { title: string; value: string | number; icon: string; color: string }[] = [];

  // Charts
  violationTrendChartOptions!: Partial<ChartOptions>;
  violationBySystemChartOptions!: Partial<ChartOptions>;

  // Table
  violatedRulesData: any[] = [];
  violatedRulesTotalRecords = 0;
  currentPage = 1;
  pageSize = 10;

  dateRangePresets = [
    { label: '7d', days: 7 },
    { label: '90d', days: 90 },
    { label: '6m', days: 180 },
    { label: '1y', days: 365 },
  ];

  private controlId = '';

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private complianceService: ComplianceService,
    private datePipe: DatePipe,
  ) {
    this.initCharts();
    this.buildStatsCards();
  }

  ngOnInit(): void {
    this.controlId = this.route.snapshot.paramMap.get('controlId') || '';
    this.setPreset(90);
    if (this.controlId) {
      this.loadControlDetails();
      this.loadSystems();
    }
  }

  // -- Date / Filters --

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

  setPreset(days: number): void {
    this.activePreset = days;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    this.dateRange = [start, end];
    this.reloadAll();
  }

  onDateRangeChange(): void {
    this.activePreset = null;
    this.reloadAll();
  }

  onSystemChange(): void {
    this.reloadAll();
  }

  private reloadAll(): void {
    if (!this.controlId) return;
    this.loadControlMetrics();
    this.loadViolationTrend();
    this.loadViolationsBySystem();
    this.loadViolatedRules();
  }

  // -- Data Loading --

  loadSystems(): void {
    this.complianceService.getControlSapSystems(this.controlId).subscribe((resp) => {
      if (resp.success) this.systems = resp.data || [];
    });
  }

  loadControlDetails(): void {
    this.loading = true;
    this.complianceService.getControlDetails(this.controlId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (resp) => {
          if (resp.success && resp.data) {
            this.controlData = {
              controlId: resp.data.refId || this.controlId,
              name: resp.data.name,
              description: resp.data.description,
              framework: resp.data.framework?.name || '',
              category: resp.data.framework?.description || '',
              annotation: resp.data.annotation,
            };
            this.reloadAll();
          }
        },
      });
  }

  private loadControlMetrics(): void {
    const sys = this.selectedSystem.value;
    this.complianceService.getControlMetrics(this.controlId, sys, this.getFromDate(), this.getToDate())
      .subscribe({
        next: (resp) => {
          if (resp.success && resp.data) this.controlMetrics = resp.data;
          this.buildStatsCards();
        },
        error: () => {
          this.controlMetrics = { totalViolations: 0, criticalViolations: 0, recentViolations: 0, complianceScore: 0 };
          this.buildStatsCards();
        },
      });
  }

  private loadViolationTrend(): void {
    const sys = this.selectedSystem.value;
    this.complianceService.getViolationTrend(this.controlId, sys, this.getFromDate(), this.getToDate())
      .subscribe({
        next: (resp) => {
          if (resp.success && resp.data) {
            const processed = this.processViolationTrendData(resp.data);
            this.violationTrendChartOptions.series = processed.series;
            this.violationTrendChartOptions.xaxis = { categories: processed.categories };
            this.violationTrendChart?.updateChart();
          }
        },
      });
  }

  private loadViolationsBySystem(): void {
    const sys = this.selectedSystem.value;
    this.complianceService.getViolationsBySystem(this.controlId, sys, this.getFromDate(), this.getToDate())
      .subscribe({
        next: (resp) => {
          if (resp.success && resp.data) {
            const d = resp.data;
            this.violationBySystemChartOptions.series = d.map((i: any) => i.violationCount);
            this.violationBySystemChartOptions.labels = d.map((i: any) => i.systemName);
            this.violationBySystemChart?.updateChart();
          }
        },
      });
  }

  loadViolatedRules(): void {
    const sys = this.selectedSystem.value;
    this.complianceService.getViolatedRules(this.controlId, sys, this.getFromDate(), this.getToDate(), this.currentPage, this.pageSize)
      .subscribe({
        next: (resp) => {
          if (resp.success && resp.data) {
            this.violatedRulesData = resp.data.rows || resp.data || [];
            this.violatedRulesTotalRecords = resp.data.records || this.violatedRulesData.length;
          }
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadViolatedRules();
  }

  // -- Chart Init --

  private initCharts(): void {
    this.violationTrendChartOptions = {
      series: [],
      chart: { type: 'line', height: 300 },
      title: { text: 'Violation Trend' },
      stroke: { curve: 'smooth' },
      xaxis: { categories: [] },
      colors: ['#f5222d', '#faad14', '#52c41a'],
      legend: { position: 'top' },
      icon: 'line-chart',
    };

    this.violationBySystemChartOptions = {
      series: [],
      chart: { type: 'donut', height: 300 },
      title: { text: 'Violations by System' },
      labels: [],
      colors: ['#f5222d', '#faad14', '#52c41a', '#1890ff'],
      legend: { position: 'bottom' },
      icon: 'pie-chart',
    };
  }

  // -- Helpers --

  private buildStatsCards(): void {
    this.statsCards = [
      { title: 'Total Violations', value: this.controlMetrics?.totalViolations || 0, icon: 'warning', color: '#fa8c16' },
      { title: 'Critical Violations', value: this.controlMetrics?.criticalViolations || 0, icon: 'exclamation-circle', color: '#f5222d' },
      { title: 'Recent Violations', value: this.controlMetrics?.recentViolations || 0, icon: 'clock-circle', color: '#1890ff' },
      { title: 'Compliance Score', value: (this.controlMetrics?.complianceScore || 0) + '%', icon: 'safety-certificate', color: '#52c41a' },
    ];
  }

  private processViolationTrendData(data: any[]): any {
    if (!data || !data.length) return { series: [{ name: 'Violations', data: [] }], categories: [] };

    const grouped = data.reduce((acc: any, item: any) => {
      if (!acc[item.severity]) acc[item.severity] = {};
      acc[item.severity][item.date] = item.violationCount;
      return acc;
    }, {});

    const dates = [...new Set(data.map((item: any) => item.date))].sort();
    const series = Object.keys(grouped).map((severity) => ({
      name: severity,
      data: dates.map((d) => grouped[severity][d] || 0),
    }));

    return { series, categories: dates.map((d) => new Date(d as string).toLocaleDateString()) };
  }

  getSeverityColor(severity: string): string {
    switch ((severity || '').toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'purple';
      case 'LOW': return 'green';
      default: return 'default';
    }
  }

  goBack(): void {
    this.location.back();
  }
}
