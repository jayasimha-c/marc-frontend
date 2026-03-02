import { Component, Input, OnChanges } from '@angular/core';
import { ChartOptions } from '../../../shared/models/chart.model';
import { ReportService } from '../reports/report.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-sod-risk-summary',
  templateUrl: './sod-risk-summary.component.html',
})
export class SodRiskSummaryComponent implements OnChanges {
  @Input() systemId: number = 0;
  @Input() startDate = '';
  @Input() endDate = '';

  loading = false;
  totalViolations = 0;
  criticalViolations = 0;
  affectedUsers = 0;
  selectedRisks = 0;

  riskDistributionChart: Partial<ChartOptions> = {};
  violationTrendsChart: Partial<ChartOptions> = {};
  topViolationsChart: Partial<ChartOptions> = {};

  constructor(private reportService: ReportService, private notify: NotificationService) {}

  ngOnChanges(): void {
    if (this.systemId && this.startDate && this.endDate) {
      this.loadData();
    }
  }

  private loadData(): void {
    this.loading = true;
    this.reportService.getDashboardSodRiskSummary(this.systemId, this.startDate, this.endDate).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          const d = resp.data;
          this.totalViolations = d.totalSodViolations || 0;
          this.criticalViolations = d.criticalViolations || 0;
          this.affectedUsers = d.affectedUsers || 0;
          this.selectedRisks = d.selectedTotalRisks || 0;
          this.buildCharts(d);
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.handleHttpError(err);
      },
    });
  }

  private buildCharts(data: any): void {
    const dist = data.riskLevelDistribution || [];
    this.riskDistributionChart = {
      series: dist.map((d: any) => d.value),
      chart: { type: 'donut', height: 300, toolbar: { show: false } },
      labels: dist.map((d: any) => d.label),
      colors: ['#f5222d', '#fa8c16', '#faad14', '#52c41a'],
      title: { text: 'Risk Distribution' },
      plotOptions: { pie: { donut: { size: '60%' } } },
      legend: { position: 'bottom' },
      noData: { text: 'No data available' },
    };

    const trends = data.violationTrends || [];
    this.violationTrendsChart = {
      series: [
        { name: 'New Violations', data: trends.map((t: any) => t.newViolations || 0) },
        { name: 'Resolved', data: trends.map((t: any) => t.resolvedViolations || 0) },
      ],
      chart: { type: 'area', height: 280, toolbar: { show: false } },
      xaxis: { categories: trends.map((t: any) => t.date) },
      colors: ['#f5222d', '#52c41a'],
      title: { text: 'Violation Trends' },
      stroke: { curve: 'smooth', width: 2 },
      dataLabels: { enabled: false },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.5, opacityTo: 0.1 } },
      noData: { text: 'No data available' },
    };

    const topBp = data.topViolationsByBP || [];
    this.topViolationsChart = {
      series: [{ name: 'Violations', data: topBp.map((b: any) => b.count || 0) }],
      chart: { type: 'bar', height: 280, toolbar: { show: false } },
      xaxis: { categories: topBp.map((b: any) => b.name) },
      colors: ['#722ed1'],
      title: { text: 'Top Violations by Business Process' },
      plotOptions: { bar: { horizontal: true } },
      dataLabels: { enabled: false },
      noData: { text: 'No data available' },
    };
  }
}
