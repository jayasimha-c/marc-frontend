import { Component, Input, OnChanges } from '@angular/core';
import { PivotChartData } from '../pivot.service';
import { ChartOptions } from '../../../models/chart.model';
import { APEX_COLORS } from './apex-theme';

@Component({
  standalone: false,
  selector: 'app-pivot-chart-bar',
  template: `<common-apx-chart [chartOptions]="chartOptions" size="lg"></common-apx-chart>`,
})
export class PivotChartBarComponent implements OnChanges {
  @Input() chartData!: PivotChartData;
  @Input() stacked = false;

  chartOptions!: Partial<ChartOptions>;

  ngOnChanges(): void {
    if (!this.chartData) return;
    this.chartOptions = {
      series: this.chartData.series,
      chart: { type: 'bar', stacked: this.stacked },
      plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 0 } },
      xaxis: { categories: this.chartData.categories },
      dataLabels: { enabled: false },
      colors: APEX_COLORS,
      title: { text: this.stacked ? 'Stacked Bar' : 'Bar Chart' },
    };
  }
}
