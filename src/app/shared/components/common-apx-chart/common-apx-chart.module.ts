import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { CommonApxChartComponent } from './common-apx-chart.component';

@NgModule({
  declarations: [CommonApxChartComponent],
  imports: [
    CommonModule,
    NzCardModule, NzButtonModule, NzIconModule,
    NzSpinModule, NzResultModule, NzToolTipModule,
  ],
  exports: [CommonApxChartComponent],
})
export class CommonApxChartModule {}
