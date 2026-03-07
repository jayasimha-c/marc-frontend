- - - # Pivot Table Component — Development Specification
      ## MARC GRC Angular + NG-ZORRO + ApexCharts

      ---

      ## 1. Overview

      Build a fully interactive, drag-and-drop **Pivot Table** component in Angular using **no jQuery**.

      Stack:
      - `@angular/cdk/drag-drop` — field drag-and-drop between zones
      - NG-ZORRO (`nz-select`, `nz-tag`, `nz-empty`, `nz-button`) — UI chrome
      - Native `<table>` — pivot table output
      - `ng-apexcharts` — chart renderers (Bar, Stacked Bar, Line, Area, Scatter, Heatmap)

      A **renderer switcher** toolbar lets the user toggle between Table view and any chart type.
      The same `PivotResult` data feeds both the table and all chart renderers.
      Must match MARC GRC dark theme: `#0a0a0a` background, sharp corners (`border-radius: 0`), JetBrains Mono font.

      ---

      ## 2. File Structure
      ```
      src/app/shared/components/pivot-table/
      ├── pivot-table.module.ts
      ├── pivot-table.component.ts
      ├── pivot-table.component.html
      ├── pivot-table.component.scss
      ├── pivot.service.ts
      └── renderers/
          ├── apex-theme.ts                   ← shared ApexCharts config
          ├── pivot-chart-bar.component.ts
          ├── pivot-chart-line.component.ts
          ├── pivot-chart-scatter.component.ts
          └── pivot-chart-heatmap.component.ts
      ```

      ---

      ## 3. Install
      ```bash
      npm install ng-apexcharts apexcharts
      ```

      Add to `angular.json` scripts array:
      ```json
      "node_modules/apexcharts/dist/apexcharts.min.js"
      ```

      ---

      ## 4. `pivot.service.ts`

      ### Interfaces
      ```typescript
      export interface PivotConfig {
        rows: string[];
        cols: string[];
        value: string;
        aggregator: 'count' | 'sum' | 'avg' | 'min' | 'max';
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
      ```

      ### `compute(data, config): PivotResult`

      1. For each record extract `rowKey = rows.map(r => record[r]).join('||')` and `colKey = cols.map(c => record[c]).join('||')`.
      2. Accumulate numeric values in `Map<string, number[]>` keyed by `"rowKey|||colKey"`.
      3. Track unique row/col keys in insertion order via `Map<string, string[]>`.
      4. Apply aggregation per cell:
         - `count` → `values.length` (all records, NaN-safe)
         - `sum`   → `values.reduce((a,b)=>a+b,0)`
         - `avg`   → sum / count
         - `min`   → `Math.min(...values)`
         - `max`   → `Math.max(...values)`
         - Empty cell → `null`
      5. Compute `rowTotals`, `colTotals`, `grandTotal` from raw values.

      ### `toChartData(result: PivotResult): PivotChartData`
      ```typescript
      const categories = result.colHeaders.map(ch => ch.join(' / '));
      
      const series = result.rowHeaders.map((rh, ri) => ({
        name: rh.join(' / '),
        data: result.cells[ri].map(v => v ?? 0)
      }));
      
      const heatmapSeries = result.rowHeaders.map((rh, ri) => ({
        name: rh.join(' / '),
        data: result.colHeaders.map((ch, ci) => ({
          x: ch.join(' / '),
          y: result.cells[ri][ci] ?? 0
        }))
      }));
      
      return { categories, series, heatmapSeries };
      ```

      Decorate: `@Injectable({ providedIn: 'root' })`.

      ---

      ## 5. `renderers/apex-theme.ts`

      Define and export these constants. All renderer components import from here — never define chart config inline.
      ```typescript
      export const APEX_DARK_THEME = {
        mode: 'dark', palette: 'palette1'
      };
      
      export const APEX_CHART_BASE = {
        background: '#0a0a0a',
        foreColor: '#888888',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        toolbar: { show: true, tools: { download: true, zoom: true, reset: true } },
        animations: { enabled: true, speed: 300 }
      };
      
      export const APEX_GRID = {
        borderColor: '#2a2a2a',
        strokeDashArray: 4
      };
      
      export const APEX_XAXIS_BASE = {
        labels: { style: { colors: '#666', fontSize: '11px' } },
        axisBorder: { color: '#2a2a2a' },
        axisTicks: { color: '#2a2a2a' }
      };
      
      export const APEX_YAXIS_BASE = {
        labels: { style: { colors: '#666', fontSize: '11px' } }
      };
      
      export const APEX_TOOLTIP_BASE = {
        theme: 'dark',
        style: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }
      };
      
      export const APEX_DATALABELS_OFF = { enabled: false };
      
      export const APEX_COLORS = [
        '#6366f1','#3b82f6','#a855f7','#10b981',
        '#f59e0b','#ef4444','#06b6d4','#ec4899'
      ];
      ```

      ---

      ## 6. Renderer Types
      ```typescript
      export type PivotRenderer =
        'table' | 'bar' | 'stacked-bar' | 'line' | 'area' | 'scatter' | 'heatmap';
      
      export const RENDERER_OPTIONS = [
        { value: 'table',       label: 'Table',   icon: 'table'      },
        { value: 'bar',         label: 'Bar',     icon: 'bar-chart'  },
        { value: 'stacked-bar', label: 'Stacked', icon: 'bar-chart'  },
        { value: 'line',        label: 'Line',    icon: 'line-chart' },
        { value: 'area',        label: 'Area',    icon: 'area-chart' },
        { value: 'scatter',     label: 'Scatter', icon: 'dot-chart'  },
        { value: 'heatmap',     label: 'Heatmap', icon: 'heat-map'   },
      ];
      ```

      ---

      ## 7. `pivot-table.component.ts`

      ### Inputs

      | Input             | Type                                  | Default   | Description                 |
      | ----------------- | ------------------------------------- | --------- | --------------------------- |
      | `data`            | `Record<string,any>[]`                | `[]`      | Flat data records           |
      | `value`           | `string`                              | `''`      | Field to aggregate          |
      | `initialRows`     | `string[]`                            | `[]`      | Pre-assigned row fields     |
      | `initialCols`     | `string[]`                            | `[]`      | Pre-assigned col fields     |
      | `aggregator`      | `'count'\|'sum'\|'avg'\|'min'\|'max'` | `'count'` | Default aggregation         |
      | `enableHeatmap`   | `boolean`                             | `true`    | Cell coloring in table view |
      | `showTotals`      | `boolean`                             | `true`    | Totals row/col              |
      | `defaultRenderer` | `PivotRenderer`                       | `'table'` | Starting renderer           |

      ### State
      ```typescript
      allFields: string[]
      activeRows: string[]
      activeCols: string[]
      unusedFields: string[]
      result: PivotResult | null
      chartData: PivotChartData | null
      selectedAggregator: PivotConfig['aggregator']
      activeRenderer: PivotRenderer
      rendererOptions = RENDERER_OPTIONS
      ```

      ### Methods

      **`ngOnChanges`** — Re-derive `allFields` from `data[0]` keys excluding `value`. Apply `initialRows`/`initialCols`. Build `unusedFields` = remaining. Call `recompute()`.

      **`drop(event: CdkDragDrop<string[]>)`** — `moveItemInArray` same container, `transferArrayItem` cross-container. Call `recompute()`.

      **`recompute()`** — If both zones empty set `result = chartData = null`. Else call `pivotService.compute()` → `result`, then `pivotService.toChartData(result)` → `chartData`. Call `cdr.markForCheck()`.

      **`removeField(field, from: 'rows'|'cols')`** — Splice from zone, push to `unusedFields`, call `recompute()`.

      **`setRenderer(r: PivotRenderer)`** — `activeRenderer = r`.

      **`fmt(val: number|null): string`** — `'—'` for null; integer string if `Number.isInteger`; else `val.toFixed(2)`.

      **`getHeatColor(val, colTotal): string`** — `''` if null or `!enableHeatmap`. `pct = Math.min(val/colTotal,1)`. Return `rgba(99,102,241,${(pct*0.45).toFixed(2)})`.

      **`exportCSV()`** — Build CSV string (header row + data rows + totals row). Download via `Blob` + `URL.createObjectURL`. Filename `pivot-${Date.now()}.csv`.

      Use `ChangeDetectionStrategy.OnPush`.

      ---

      ## 8. `pivot-table.component.html`

      ### Layout
      ```
      ┌──────────────────────────────────────────────────────┐
      │ FIELD BUILDER                                        │
      │ [Fields zone] [Rows zone] [Cols zone] [Aggregator]   │
      ├──────────────────────────────────────────────────────┤
      │ RENDERER TOOLBAR                              [CSV↓] │
      │ [Table][Bar][Stacked][Line][Area][Scatter][Heatmap]   │
      ├──────────────────────────────────────────────────────┤
      │ OUTPUT (switches on activeRenderer)                  │
      │   table       → native <table>                       │
      │   bar/stacked → app-pivot-chart-bar [stacked]=bool   │
      │   line/area   → app-pivot-chart-line [area]=bool     │
      │   scatter     → app-pivot-chart-scatter              │
      │   heatmap     → app-pivot-chart-heatmap              │
      │   (no data)   → nz-empty                            │
      └──────────────────────────────────────────────────────┘
      ```

      ### CDK Drop Zones
      ```html
      <!-- UNUSED -->
      <div cdkDropList #unusedList="cdkDropList" id="unused"
           [cdkDropListData]="unusedFields"
           [cdkDropListConnectedTo]="[rowList, colList]"
           (cdkDropListDropped)="drop($event)" class="drop-zone">
        <nz-tag *ngFor="let f of unusedFields" cdkDrag class="drag-chip">{{f}}</nz-tag>
        <span *ngIf="!unusedFields.length" class="empty-hint">empty</span>
      </div>
      
      <!-- ROWS -->
      <div cdkDropList #rowList="cdkDropList" id="rows"
           [cdkDropListData]="activeRows"
           [cdkDropListConnectedTo]="[unusedList, colList]"
           (cdkDropListDropped)="drop($event)" class="drop-zone">
        <nz-tag *ngFor="let f of activeRows" cdkDrag nzColor="blue" class="drag-chip">
          {{f}}<span class="remove-btn" (click)="removeField(f,'rows')">×</span>
        </nz-tag>
        <span *ngIf="!activeRows.length" class="empty-hint">drag here</span>
      </div>
      
      <!-- COLS -->
      <div cdkDropList #colList="cdkDropList" id="cols"
           [cdkDropListData]="activeCols"
           [cdkDropListConnectedTo]="[unusedList, rowList]"
           (cdkDropListDropped)="drop($event)" class="drop-zone">
        <nz-tag *ngFor="let f of activeCols" cdkDrag nzColor="purple" class="drag-chip">
          {{f}}<span class="remove-btn" (click)="removeField(f,'cols')">×</span>
        </nz-tag>
        <span *ngIf="!activeCols.length" class="empty-hint">drag here</span>
      </div>
      
      <!-- AGGREGATOR -->
      <nz-select [(ngModel)]="selectedAggregator" (ngModelChange)="recompute()" style="width:120px">
        <nz-option nzValue="count" nzLabel="Count"></nz-option>
        <nz-option nzValue="sum"   nzLabel="Sum"></nz-option>
        <nz-option nzValue="avg"   nzLabel="Average"></nz-option>
        <nz-option nzValue="min"   nzLabel="Min"></nz-option>
        <nz-option nzValue="max"   nzLabel="Max"></nz-option>
      </nz-select>
      ```

      ### Renderer Toolbar
      ```html
      <div class="renderer-toolbar" *ngIf="result">
        <div class="renderer-buttons">
          <button *ngFor="let r of rendererOptions"
                  class="renderer-btn"
                  [class.active]="activeRenderer === r.value"
                  (click)="setRenderer(r.value)">
            <span nz-icon [nzType]="r.icon" nzTheme="outline"></span>
            {{r.label}}
          </button>
        </div>
        <button nz-button nzSize="small" (click)="exportCSV()">
          <span nz-icon nzType="download"></span> CSV
        </button>
      </div>
      ```

      ### Output Area
      ```html
      <ng-container *ngIf="result; else emptyTpl">
      
        <!-- TABLE -->
        <div class="pivot-scroll" *ngIf="activeRenderer === 'table'">
          <table class="pivot-table">
            <thead>
              <tr>
                <th *ngFor="let r of activeRows" class="row-header-cell">{{r}}</th>
                <th *ngFor="let ch of result.colHeaders" class="col-header-cell">{{ch.join(' / ')}}</th>
                <th *ngIf="showTotals" class="total-cell">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let rh of result.rowHeaders; let ri = index">
                <td *ngFor="let label of rh" class="row-label">{{label}}</td>
                <td *ngFor="let cell of result.cells[ri]; let ci = index"
                    class="value-cell"
                    [class.null-cell]="cell === null"
                    [style.background]="getHeatColor(cell, result.colTotals[ci])">
                  {{fmt(cell)}}
                </td>
                <td *ngIf="showTotals" class="total-cell">{{fmt(result.rowTotals[ri])}}</td>
              </tr>
            </tbody>
            <tfoot *ngIf="showTotals">
              <tr>
                <td [attr.colspan]="activeRows.length" class="row-label">Total</td>
                <td *ngFor="let t of result.colTotals" class="total-cell">{{fmt(t)}}</td>
                <td class="grand-total">{{fmt(result.grandTotal)}}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      
        <!-- BAR (grouped) -->
        <app-pivot-chart-bar *ngIf="activeRenderer === 'bar' && chartData"
          [chartData]="chartData" [stacked]="false">
        </app-pivot-chart-bar>
      
        <!-- BAR (stacked) -->
        <app-pivot-chart-bar *ngIf="activeRenderer === 'stacked-bar' && chartData"
          [chartData]="chartData" [stacked]="true">
        </app-pivot-chart-bar>
      
        <!-- LINE -->
        <app-pivot-chart-line *ngIf="activeRenderer === 'line' && chartData"
          [chartData]="chartData" [area]="false">
        </app-pivot-chart-line>
      
        <!-- AREA -->
        <app-pivot-chart-line *ngIf="activeRenderer === 'area' && chartData"
          [chartData]="chartData" [area]="true">
        </app-pivot-chart-line>
      
        <!-- SCATTER -->
        <app-pivot-chart-scatter *ngIf="activeRenderer === 'scatter' && chartData"
          [chartData]="chartData">
        </app-pivot-chart-scatter>
      
        <!-- HEATMAP -->
        <app-pivot-chart-heatmap *ngIf="activeRenderer === 'heatmap' && chartData"
          [chartData]="chartData" [maxValue]="result.grandTotal">
        </app-pivot-chart-heatmap>
      
      </ng-container>
      <ng-template #emptyTpl>
        <nz-empty nzNotFoundContent="Drag fields into Rows or Columns to build your pivot"></nz-empty>
      </ng-template>
      ```

      ---

      ## 9. Renderer Sub-Components

      All are **dumb components**: `@Input() chartData` + `ngOnChanges` builds `chartOptions`. No service calls.

      ### `pivot-chart-bar.component.ts`
      - Selector: `app-pivot-chart-bar`
      - Inputs: `chartData: PivotChartData`, `stacked: boolean`
      - Template: `<apx-chart [series] [chart] [xaxis] [yaxis] [plotOptions] [colors] [grid] [tooltip] [dataLabels] [theme]>`
      - Chart type: `'bar'`, height `400`
      - `stacked`: pass directly to `chart.stacked`
      - `plotOptions.bar`: `{ horizontal: false, columnWidth: '55%', borderRadius: 0 }`
      - X-axis categories from `chartData.categories`
      - Use `APEX_CHART_BASE`, `APEX_GRID`, `APEX_XAXIS_BASE`, `APEX_YAXIS_BASE`, `APEX_TOOLTIP_BASE`, `APEX_DATALABELS_OFF`, `APEX_COLORS`, `APEX_DARK_THEME`

      ### `pivot-chart-line.component.ts`
      - Selector: `app-pivot-chart-line`
      - Inputs: `chartData: PivotChartData`, `area: boolean`
      - Chart type: `this.area ? 'area' : 'line'`, height `400`
      - `stroke: { curve: 'smooth', width: 2 }`
      - When `area`: `fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } }`
      - `markers: { size: 3, strokeWidth: 0 }`
      - `tooltip: { ...APEX_TOOLTIP_BASE, shared: true, intersect: false }`

      ### `pivot-chart-scatter.component.ts`
      - Selector: `app-pivot-chart-scatter`
      - Input: `chartData: PivotChartData`
      - Build series from `chartData.series`: each row becomes a series where `data = s.data.map((val, ci) => ({ x: ci, y: val ?? null }))`
      - Chart type: `'scatter'`, height `400`
      - X-axis: `type: 'numeric'`, labels formatter maps index → `chartData.categories[parseInt(val)]`
      - Custom tooltip shows row name + column label + value

      ### `pivot-chart-heatmap.component.ts`
      - Selector: `app-pivot-chart-heatmap`
      - Inputs: `chartData: PivotChartData`, `maxValue: number`
      - Series: `chartData.heatmapSeries`
      - Chart type: `'heatmap'`, height `Math.max(300, series.length * 36)`
      - `plotOptions.heatmap: { shadeIntensity: 0.6, radius: 0, colorScale: { ranges: [...] } }`
      - Color scale ranges keyed off `maxValue` (dynamic — divide into 4 quartiles)
      - `dataLabels: { enabled: true, style: { fontSize: '10px', colors: ['#e0e0e0'] } }`
      - Single color ramp: `colors: ['#6366f1']`

      ---

      ## 10. `pivot-table.component.scss`
      ```scss
      $bg-primary:   #0a0a0a;
      $bg-surface:   #111111;
      $bg-elevated:  #1a1a1a;
      $border:       #2a2a2a;
      $text-primary: #e0e0e0;
      $text-muted:   #555555;
      $accent:       #6366f1;
      $total-bg:     #161616;
      $grand-bg:     #1e1e2e;
      
      .pivot-wrapper {
        display: flex; flex-direction: column; gap: 12px;
        font-size: 12px;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
      }
      
      .field-builder {
        display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap;
        padding: 12px; background: $bg-surface; border: 1px solid $border; border-radius: 0;
      }
      .field-zone { display: flex; flex-direction: column; gap: 6px; min-width: 140px; }
      .zone-label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: $text-muted; }
      .drop-zone {
        min-height: 36px; min-width: 120px; padding: 4px; border: 1px dashed $border;
        display: flex; flex-wrap: wrap; gap: 4px; align-items: center; border-radius: 0;
        transition: border-color .15s;
        &:hover, &.cdk-drop-list-dragging { border-color: $accent; }
      }
      .drag-chip {
        cursor: grab; border-radius: 0 !important; user-select: none;
        &.cdk-drag-dragging { cursor: grabbing; opacity: .6; }
        .remove-btn { margin-left: 4px; cursor: pointer; opacity: .5; &:hover { opacity: 1; } }
      }
      .empty-hint { font-size: 10px; color: $text-muted; font-style: italic; padding: 2px 6px; }
      
      .renderer-toolbar {
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 0; border-bottom: 1px solid $border;
      }
      .renderer-buttons { display: flex; gap: 2px; }
      .renderer-btn {
        display: flex; align-items: center; gap: 4px; padding: 4px 10px;
        font-size: 11px; font-family: inherit; background: transparent;
        color: $text-muted; border: 1px solid transparent; border-radius: 0; cursor: pointer;
        transition: all .1s;
        &:hover { color: $text-primary; border-color: $border; }
        &.active { color: $accent; border-color: $accent; background: rgba(99,102,241,.08); }
      }
      
      .pivot-scroll {
        overflow: auto; max-height: 600px;
        &::-webkit-scrollbar { width: 6px; height: 6px; }
        &::-webkit-scrollbar-track { background: $bg-primary; }
        &::-webkit-scrollbar-thumb { background: $border; &:hover { background: $accent; } }
      }
      
      table.pivot-table {
        border-collapse: collapse; width: 100%;
        th, td { border: 1px solid $border; padding: 5px 10px; white-space: nowrap; }
        thead th {
          background: $bg-elevated; color: $text-primary; font-weight: 500;
          position: sticky; top: 0; z-index: 2;
          &.col-header-cell { text-align: right; }
          &.total-cell { text-align: right; color: $text-muted; }
        }
        .row-label { background: $bg-elevated; font-weight: 500; position: sticky; left: 0; z-index: 1; }
        .value-cell { text-align: right; transition: background .1s; &:hover { background: $bg-elevated !important; } }
        .null-cell { color: $text-muted; text-align: center; }
        .total-cell { background: $total-bg; font-weight: 600; text-align: right; }
        .grand-total { background: $grand-bg; font-weight: 700; color: $accent; text-align: right; }
        tfoot td { background: $total-bg; font-weight: 600; position: sticky; bottom: 0; }
      }
      
      ::ng-deep .apexcharts-canvas { background: $bg-primary !important; }
      ::ng-deep .apexcharts-tooltip {
        background: #1a1a1a !important; border: 1px solid $border !important;
        border-radius: 0 !important;
      }
      ```

      ---

      ## 11. `pivot-table.module.ts`
      ```typescript
      import { NgModule } from '@angular/core';
      import { CommonModule } from '@angular/common';
      import { FormsModule } from '@angular/forms';
      import { DragDropModule } from '@angular/cdk/drag-drop';
      import { NgApexchartsModule } from 'ng-apexcharts';
      import { NzTagModule }    from 'ng-zorro-antd/tag';
      import { NzSelectModule } from 'ng-zorro-antd/select';
      import { NzEmptyModule }  from 'ng-zorro-antd/empty';
      import { NzButtonModule } from 'ng-zorro-antd/button';
      import { NzIconModule }   from 'ng-zorro-antd/icon';
      
      import { PivotTableComponent }        from './pivot-table.component';
      import { PivotChartBarComponent }     from './renderers/pivot-chart-bar.component';
      import { PivotChartLineComponent }    from './renderers/pivot-chart-line.component';
      import { PivotChartScatterComponent } from './renderers/pivot-chart-scatter.component';
      import { PivotChartHeatmapComponent } from './renderers/pivot-chart-heatmap.component';
      import { PivotService }               from './pivot.service';
      
      @NgModule({
        declarations: [
          PivotTableComponent,
          PivotChartBarComponent,
          PivotChartLineComponent,
          PivotChartScatterComponent,
          PivotChartHeatmapComponent,
        ],
        imports: [
          CommonModule, FormsModule, DragDropModule, NgApexchartsModule,
          NzTagModule, NzSelectModule, NzEmptyModule, NzButtonModule, NzIconModule,
        ],
        exports: [PivotTableComponent],
        providers: [PivotService],
      })
      export class PivotTableModule {}
      ```

      ---

      ## 12. Usage Examples
      ```html
      <!-- ACM: SoD violations — default bar chart -->
      <app-pivot-table
        [data]="sodViolations" value="riskScore" aggregator="sum"
        [initialRows]="['user','role']" [initialCols]="['riskLevel']"
        defaultRenderer="bar" [enableHeatmap]="true" [showTotals]="true">
      </app-pivot-table>
      
      <!-- ICM: Controls — heatmap -->
      <app-pivot-table
        [data]="controlData" value="violationCount" aggregator="count"
        [initialRows]="['controlCategory']" [initialCols]="['system']"
        defaultRenderer="heatmap">
      </app-pivot-table>
      
      <!-- CSS: Vulnerability trend — line -->
      <app-pivot-table
        [data]="vulnerabilities" value="cvssScore" aggregator="avg"
        [initialRows]="['programName']" [initialCols]="['severity']"
        defaultRenderer="line">
      </app-pivot-table>
      ```

      ---

      ## 13. Edge Cases

      | Scenario                              | Behaviour                                                    |
      | ------------------------------------- | ------------------------------------------------------------ |
      | `data` empty                          | Show `nz-empty`, skip compute                                |
      | `data` `@Input` changes               | Re-derive fields, reset zones, recompute                     |
      | Only rows, no cols                    | Single "Total" column; chart renders one category            |
      | Only cols, no rows                    | Single "Total" row; chart renders one series                 |
      | Field dragged to unused               | Remove from zone, recompute                                  |
      | Non-numeric value for sum/avg/min/max | Skip NaN; null cells show `—` in table, `0` in charts        |
      | All cells null                        | ApexCharts handles gracefully (empty series)                 |
      | Single 1×1 pivot                      | All chart types render without error                         |
      | `heatmap` value range                 | Pass `result.grandTotal` as `maxValue` to heatmap; divide into 4 quartile ranges |
      | Large dataset (10k+)                  | `ChangeDetectionStrategy.OnPush`; consider Web Worker for `compute()` |

      ---

      ## 14. Constraints

      - Do **not** use jQuery, jQueryUI, or the `pivottable` npm package.
      - Do **not** use `nz-table` for pivot output — native `<table>` only.
      - Do **not** add `border-radius` anywhere — override ApexCharts defaults to `0` via `::ng-deep`.
      - Do **not** use `localStorage` or browser storage APIs.
      - All renderer sub-components must be **dumb** — `@Input` only, no service calls.
      - All ApexCharts base config in `apex-theme.ts` — never inline in components.