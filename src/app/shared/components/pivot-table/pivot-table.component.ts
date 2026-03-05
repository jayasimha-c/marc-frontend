import {
  Component, Input, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { PivotService, PivotConfig, PivotResult, PivotChartData } from './pivot.service';

export type PivotRenderer =
  'table' | 'bar' | 'stacked-bar' | 'line' | 'area' | 'scatter' | 'heatmap';

export const RENDERER_OPTIONS: { value: PivotRenderer; label: string; icon: string }[] = [
  { value: 'table',       label: 'Table',   icon: 'table' },
  { value: 'bar',         label: 'Bar',     icon: 'bar-chart' },
  { value: 'stacked-bar', label: 'Stacked', icon: 'bar-chart' },
  { value: 'line',        label: 'Line',    icon: 'line-chart' },
  { value: 'area',        label: 'Area',    icon: 'area-chart' },
  { value: 'scatter',     label: 'Scatter', icon: 'dot-chart' },
  { value: 'heatmap',     label: 'Heatmap', icon: 'heat-map' },
];

@Component({
  standalone: false,
  selector: 'app-pivot-table',
  templateUrl: './pivot-table.component.html',
  styleUrls: ['./pivot-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotTableComponent implements OnChanges {
  @Input() data: Record<string, any>[] = [];
  @Input() value = '';
  @Input() initialRows: string[] = [];
  @Input() initialCols: string[] = [];
  @Input() aggregator: PivotConfig['aggregator'] = 'count';
  @Input() enableHeatmap = true;
  @Input() showTotals = true;
  @Input() defaultRenderer: PivotRenderer = 'table';

  allFields: string[] = [];
  activeRows: string[] = [];
  activeCols: string[] = [];
  unusedFields: string[] = [];
  result: PivotResult | null = null;
  chartData: PivotChartData | null = null;
  selectedAggregator: PivotConfig['aggregator'] = 'count';
  selectedValue = '';
  activeRenderer: PivotRenderer = 'table';
  rendererOptions = RENDERER_OPTIONS;

  constructor(
    private pivotService: PivotService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aggregator']) {
      this.selectedAggregator = this.aggregator;
    }
    if (changes['value']) {
      this.selectedValue = this.value;
    }
    if (changes['defaultRenderer']) {
      this.activeRenderer = this.defaultRenderer;
    }

    if (changes['data'] || changes['initialRows'] || changes['initialCols']) {
      this.deriveFields();
      this.recompute();
    }
  }

  onAggregatorChange(): void {
    // Reset value field when switching to count (not needed)
    if (this.selectedAggregator === 'count') {
      this.selectedValue = '';
    }
    this.recompute();
  }

  private deriveFields(): void {
    if (!this.data || this.data.length === 0) {
      this.allFields = [];
      this.activeRows = [];
      this.activeCols = [];
      this.unusedFields = [];
      return;
    }

    this.allFields = Object.keys(this.data[0]);
    this.activeRows = this.initialRows.filter(f => this.allFields.includes(f));
    this.activeCols = this.initialCols.filter(f => this.allFields.includes(f));

    const assigned = new Set([...this.activeRows, ...this.activeCols]);
    this.unusedFields = this.allFields.filter(f => !assigned.has(f));
  }

  drop(event: CdkDragDrop<string[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    this.recompute();
  }

  recompute(): void {
    if (!this.data || this.data.length === 0) {
      this.result = null;
      this.chartData = null;
      this.cdr.markForCheck();
      return;
    }

    if (this.activeRows.length === 0 && this.activeCols.length === 0) {
      this.result = null;
      this.chartData = null;
      this.cdr.markForCheck();
      return;
    }

    this.result = this.pivotService.compute(this.data, {
      rows: this.activeRows,
      cols: this.activeCols,
      value: this.selectedValue,
      aggregator: this.selectedAggregator,
    });
    this.chartData = this.pivotService.toChartData(this.result);
    this.cdr.markForCheck();
  }

  removeField(field: string, from: 'rows' | 'cols'): void {
    const source = from === 'rows' ? this.activeRows : this.activeCols;
    const idx = source.indexOf(field);
    if (idx >= 0) {
      source.splice(idx, 1);
      this.unusedFields.push(field);
      this.recompute();
    }
  }

  setRenderer(r: PivotRenderer): void {
    this.activeRenderer = r;
  }

  fmt(val: number | null): string {
    if (val === null) return '\u2014';
    return Number.isInteger(val) ? val.toString() : val.toFixed(2);
  }

  getHeatColor(val: number | null, colTotal: number): string {
    if (val === null || !this.enableHeatmap || colTotal === 0) return '';
    const pct = Math.min(val / colTotal, 1);
    return `rgba(24, 144, 255, ${pct * 0.35})`;
  }

  exportCSV(): void {
    if (!this.result) return;

    const lines: string[] = [];

    const headerCells = [
      ...this.activeRows,
      ...this.result.colHeaders.map(ch => ch.join(' / ')),
    ];
    if (this.showTotals) headerCells.push('Total');
    lines.push(headerCells.map(c => this.csvEscape(c)).join(','));

    this.result.rowHeaders.forEach((rh, ri) => {
      const row = [
        ...rh,
        ...this.result!.cells[ri].map(c => c === null ? '' : String(c)),
      ];
      if (this.showTotals) row.push(String(this.result!.rowTotals[ri]));
      lines.push(row.map(c => this.csvEscape(c)).join(','));
    });

    if (this.showTotals) {
      const totalRow = [
        ...this.activeRows.map(() => ''),
        ...this.result.colTotals.map(t => String(t)),
        String(this.result.grandTotal),
      ];
      totalRow[0] = 'Total';
      lines.push(totalRow.map(c => this.csvEscape(c)).join(','));
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pivot-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private csvEscape(val: string): string {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return '"' + val.replace(/"/g, '""') + '"';
    }
    return val;
  }
}
