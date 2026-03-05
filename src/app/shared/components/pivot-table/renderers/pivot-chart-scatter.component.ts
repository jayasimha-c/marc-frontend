import { Component, Input, OnChanges } from '@angular/core';
import { PivotChartData } from '../pivot.service';
import { ChartOptions } from '../../../models/chart.model';
import { APEX_COLORS } from './apex-theme';

@Component({
  standalone: false,
  selector: 'app-pivot-chart-scatter',
  template: `<common-apx-chart [chartOptions]="chartOptions" size="lg"></common-apx-chart>`,
})
export class PivotChartScatterComponent implements OnChanges {
  @Input() chartData!: PivotChartData;

  chartOptions!: Partial<ChartOptions>;

  ngOnChanges(): void {
    if (!this.chartData) return;

    const categories = this.chartData.categories;
    const series = this.chartData.series.map(s => ({
      name: s.name,
      data: s.data.map((val, ci) => ({ x: ci, y: val ?? null })),
    }));

    this.chartOptions = {
      series,
      chart: { type: 'scatter' },
      xaxis: {
        type: 'numeric',
        labels: {
          formatter: (val: number) => categories[Math.round(val)] ?? '',
        },
      },
      dataLabels: { enabled: false },
      colors: APEX_COLORS,
      title: { text: 'Scatter Plot' },
    };
  }
}
