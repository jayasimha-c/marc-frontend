import { Component, Input, OnChanges } from '@angular/core';
import { PivotChartData } from '../pivot.service';
import { ChartOptions } from '../../../models/chart.model';

@Component({
  standalone: false,
  selector: 'app-pivot-chart-heatmap',
  template: `<common-apx-chart [chartOptions]="chartOptions" size="lg"></common-apx-chart>`,
})
export class PivotChartHeatmapComponent implements OnChanges {
  @Input() chartData!: PivotChartData;
  @Input() maxValue = 100;

  chartOptions!: Partial<ChartOptions>;

  ngOnChanges(): void {
    if (!this.chartData) return;

    const q1 = this.maxValue * 0.25;
    const q2 = this.maxValue * 0.5;
    const q3 = this.maxValue * 0.75;

    this.chartOptions = {
      series: this.chartData.heatmapSeries,
      chart: {
        type: 'heatmap',
        height: Math.max(300, this.chartData.heatmapSeries.length * 36),
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.6,
          radius: 0,
          colorScale: {
            ranges: [
              { from: 0, to: q1, name: 'Low', color: '#bae7ff' },
              { from: q1, to: q2, name: 'Medium', color: '#69c0ff' },
              { from: q2, to: q3, name: 'High', color: '#1890ff' },
              { from: q3, to: this.maxValue * 2, name: 'Critical', color: '#003a8c' },
            ],
          },
        },
      },
      dataLabels: { enabled: true, style: { fontSize: '10px' } },
      colors: ['#1890ff'],
      title: { text: 'Heatmap' },
    };
  }
}
