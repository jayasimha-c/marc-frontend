import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { CommonApxChartModule } from '../common-apx-chart/common-apx-chart.module';
import { PivotTableComponent } from './pivot-table.component';
import { PivotChartBarComponent } from './renderers/pivot-chart-bar.component';
import { PivotChartLineComponent } from './renderers/pivot-chart-line.component';
import { PivotChartScatterComponent } from './renderers/pivot-chart-scatter.component';
import { PivotChartHeatmapComponent } from './renderers/pivot-chart-heatmap.component';

@NgModule({
  declarations: [
    PivotTableComponent,
    PivotChartBarComponent,
    PivotChartLineComponent,
    PivotChartScatterComponent,
    PivotChartHeatmapComponent,
  ],
  imports: [
    CommonModule, FormsModule, DragDropModule,
    NzTagModule, NzSelectModule, NzEmptyModule,
    NzButtonModule, NzIconModule,
    CommonApxChartModule,
  ],
  exports: [PivotTableComponent],
})
export class PivotTableModule {}
