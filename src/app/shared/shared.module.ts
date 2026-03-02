import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// NG-ZORRO modules
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzTransferModule } from 'ng-zorro-antd/transfer';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzPipesModule } from 'ng-zorro-antd/pipes';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

import { DragDropModule } from '@angular/cdk/drag-drop';

import { ModulePlaceholderComponent } from './components/module-placeholder/module-placeholder.component';
import { AdvancedTableComponent } from './components/advanced-table/advanced-table.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { PagePanelComponent } from './components/page-panel/page-panel.component';
import { SidePanelComponent } from './components/side-panel/side-panel.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { TitlePanelComponent } from './components/title-panel/title-panel.component';
import { StatisticsCardComponent } from './components/statistics-card/statistics-card.component';
import { RequestMessageModalComponent } from './components/request-message-modal/request-message-modal.component';
import { CommonApxChartComponent } from './components/common-apx-chart/common-apx-chart.component';
import { InlineTableComponent } from './components/inline-table/inline-table.component';

const NZ_MODULES = [
  NzLayoutModule,
  NzMenuModule,
  NzBreadCrumbModule,
  NzButtonModule,
  NzIconModule,
  NzTableModule,
  NzFormModule,
  NzInputModule,
  NzSelectModule,
  NzCheckboxModule,
  NzRadioModule,
  NzDatePickerModule,
  NzTimePickerModule,
  NzSwitchModule,
  NzUploadModule,
  NzCardModule,
  NzGridModule,
  NzTagModule,
  NzBadgeModule,
  NzAvatarModule,
  NzAlertModule,
  NzMessageModule,
  NzNotificationModule,
  NzModalModule,
  NzDrawerModule,
  NzPopconfirmModule,
  NzToolTipModule,
  NzPopoverModule,
  NzDropDownModule,
  NzTabsModule,
  NzStepsModule,
  NzCollapseModule,
  NzDividerModule,
  NzSpinModule,
  NzSkeletonModule,
  NzResultModule,
  NzEmptyModule,
  NzDescriptionsModule,
  NzStatisticModule,
  NzListModule,
  NzTreeModule,
  NzTransferModule,
  NzProgressModule,
  NzPageHeaderModule,
  NzSpaceModule,
  NzTypographyModule,
  NzTimelineModule,
  NzPipesModule,
  NzAutocompleteModule,
  NzInputNumberModule,
];

@NgModule({
  declarations: [
    ModulePlaceholderComponent,
    AdvancedTableComponent,
    ConfirmDialogComponent,
    PagePanelComponent,
    SidePanelComponent,
    StatusBadgeComponent,
    TitlePanelComponent,
    StatisticsCardComponent,
    RequestMessageModalComponent,
    CommonApxChartComponent,
    InlineTableComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    DragDropModule,
    ...NZ_MODULES,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    DragDropModule,
    ModulePlaceholderComponent,
    AdvancedTableComponent,
    ConfirmDialogComponent,
    PagePanelComponent,
    SidePanelComponent,
    StatusBadgeComponent,
    TitlePanelComponent,
    StatisticsCardComponent,
    RequestMessageModalComponent,
    CommonApxChartComponent,
    InlineTableComponent,
    ...NZ_MODULES,
  ],
})
export class SharedModule { }
