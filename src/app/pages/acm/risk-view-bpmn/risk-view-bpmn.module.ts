import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { RiskViewBpmnComponent } from './risk-view-bpmn.component';

const routes: Routes = [{ path: '', component: RiskViewBpmnComponent }];

@NgModule({
  declarations: [RiskViewBpmnComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RiskViewBpmnModule {}
