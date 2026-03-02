import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { RiskAnalysisDashboardComponent } from './risk-analysis-dashboard.component';

const routes: Routes = [{ path: '', component: RiskAnalysisDashboardComponent }, { path: '**', component: RiskAnalysisDashboardComponent }];

@NgModule({
  declarations: [RiskAnalysisDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class RiskAnalysisDashboardModule {}
