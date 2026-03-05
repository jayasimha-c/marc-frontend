import { Component, Input, OnChanges } from '@angular/core';
import { PivotChartData } from '../pivot.service';
import { ChartOptions } from '../../../models/chart.model';
import { APEX_COLORS } from './apex-theme';

@Component({
  standalone: false,
  selector: 'app-pivot-chart-line',
  template: `<common-apx-chart [chartOptions]="chartOptions" size="lg"></common-apx-chart>`,
})
export class PivotChartLineComponent implements OnChanges {
  @Input() chartData!: PivotChartData;
  @Input() area = false;

  chartOptions!: Partial<ChartOptions>;

  ngOnChanges(): void {
    if (!this.chartData) return;
    this.chartOptions = {
      series: this.chartData.series,
      chart: { type: this.area ? 'area' : 'line' },
      stroke: { curve: 'smooth', width: 2 },
      fill: this.area
        ? { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } }
        : undefined,
      markers: { size: 3, strokeWidth: 0 },
      xaxis: { categories: this.chartData.categories },
      tooltip: { shared: true, intersect: false },
      dataLabels: { enabled: false },
      colors: APEX_COLORS,
      title: { text: this.area ? 'Area Chart' : 'Line Chart' },
    };
  }
}
