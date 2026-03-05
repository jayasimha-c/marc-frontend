import { Injectable } from '@angular/core';

export interface PivotConfig {
  rows: string[];
  cols: string[];
  value: string;
  aggregator: 'count' | 'countDistinct' | 'sum' | 'avg' | 'min' | 'max';
}

export interface PivotResult {
  rowHeaders: string[][];
  colHeaders: string[][];
  cells: (number | null)[][];
  rowTotals: number[];
  colTotals: number[];
  grandTotal: number;
}

export interface PivotChartData {
  categories: string[];
  series: { name: string; data: (number | null)[] }[];
  heatmapSeries: { name: string; data: { x: string; y: number | null }[] }[];
}

@Injectable({ providedIn: 'root' })
export class PivotService {

  compute(data: Record<string, any>[], config: PivotConfig): PivotResult {
    const { rows, cols, value, aggregator } = config;
    const isCountType = aggregator === 'count' || aggregator === 'countDistinct';

    const rowKeyMap = new Map<string, string[]>();
    const colKeyMap = new Map<string, string[]>();

    // For countDistinct we store raw values as strings to count unique
    const cellRawStrings = new Map<string, Set<string>>();
    const rowRawStrings = new Map<string, Set<string>>();
    const colRawStrings = new Map<string, Set<string>>();
    const allRawStrings = new Set<string>();

    // For numeric aggregators
    const cellValues = new Map<string, number[]>();
    const rowRawValues = new Map<string, number[]>();
    const colRawValues = new Map<string, number[]>();
    const allRawValues: number[] = [];

    for (const record of data) {
      const rowParts = rows.map(r => String(record[r] ?? ''));
      const colParts = cols.map(c => String(record[c] ?? ''));
      const rowKey = rowParts.join('||');
      const colKey = colParts.join('||');

      if (!rowKeyMap.has(rowKey)) rowKeyMap.set(rowKey, rowParts);
      if (!colKeyMap.has(colKey)) colKeyMap.set(colKey, colParts);

      const cellKey = rowKey + '|||' + colKey;

      if (aggregator === 'countDistinct') {
        const rawStr = String(record[value] ?? '');

        if (!cellRawStrings.has(cellKey)) cellRawStrings.set(cellKey, new Set());
        cellRawStrings.get(cellKey)!.add(rawStr);

        if (!rowRawStrings.has(rowKey)) rowRawStrings.set(rowKey, new Set());
        rowRawStrings.get(rowKey)!.add(rawStr);

        if (!colRawStrings.has(colKey)) colRawStrings.set(colKey, new Set());
        colRawStrings.get(colKey)!.add(rawStr);

        allRawStrings.add(rawStr);
      } else {
        const raw = aggregator === 'count' ? 1 : Number(record[value]);
        const isValid = aggregator === 'count' || !isNaN(raw);

        if (isValid) {
          const numVal = aggregator === 'count' ? 1 : raw;

          if (!cellValues.has(cellKey)) cellValues.set(cellKey, []);
          cellValues.get(cellKey)!.push(numVal);

          if (!rowRawValues.has(rowKey)) rowRawValues.set(rowKey, []);
          rowRawValues.get(rowKey)!.push(numVal);

          if (!colRawValues.has(colKey)) colRawValues.set(colKey, []);
          colRawValues.get(colKey)!.push(numVal);

          allRawValues.push(numVal);
        }
      }
    }

    const rowHeaders = Array.from(rowKeyMap.values());
    const colHeaders = Array.from(colKeyMap.values());
    const rowKeys = Array.from(rowKeyMap.keys());
    const colKeys = Array.from(colKeyMap.keys());

    let cells: (number | null)[][];
    let rowTotals: number[];
    let colTotals: number[];
    let grandTotal: number;

    if (aggregator === 'countDistinct') {
      cells = rowKeys.map(rk =>
        colKeys.map(ck => {
          const s = cellRawStrings.get(rk + '|||' + ck);
          return s ? s.size : null;
        })
      );
      rowTotals = rowKeys.map(rk => rowRawStrings.get(rk)?.size ?? 0);
      colTotals = colKeys.map(ck => colRawStrings.get(ck)?.size ?? 0);
      grandTotal = allRawStrings.size;
    } else {
      cells = rowKeys.map(rk =>
        colKeys.map(ck => {
          const vals = cellValues.get(rk + '|||' + ck);
          return vals ? this.aggregate(vals, aggregator) : null;
        })
      );
      rowTotals = rowKeys.map(rk => {
        const vals = rowRawValues.get(rk);
        return vals ? this.aggregate(vals, aggregator) : 0;
      });
      colTotals = colKeys.map(ck => {
        const vals = colRawValues.get(ck);
        return vals ? this.aggregate(vals, aggregator) : 0;
      });
      grandTotal = allRawValues.length > 0 ? this.aggregate(allRawValues, aggregator) : 0;
    }

    return { rowHeaders, colHeaders, cells, rowTotals, colTotals, grandTotal };
  }

  toChartData(result: PivotResult): PivotChartData {
    const categories = result.colHeaders.map(ch => ch.join(' / '));

    const series = result.rowHeaders.map((rh, ri) => ({
      name: rh.join(' / '),
      data: result.cells[ri].map(v => v ?? 0),
    }));

    const heatmapSeries = result.rowHeaders.map((rh, ri) => ({
      name: rh.join(' / '),
      data: result.colHeaders.map((ch, ci) => ({
        x: ch.join(' / '),
        y: result.cells[ri][ci] ?? 0,
      })),
    }));

    return { categories, series, heatmapSeries };
  }

  private aggregate(values: number[], aggregator: PivotConfig['aggregator']): number {
    switch (aggregator) {
      case 'count':
        return values.length;
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return values.length;
    }
  }
}
