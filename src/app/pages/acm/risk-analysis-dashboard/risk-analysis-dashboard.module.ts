import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { RiskAnalysisDashboardComponent } from './risk-analysis-dashboard.component';
import { SodRiskSummaryComponent } from './sod-risk-summary.component';
import { SensitiveAccessOverviewComponent } from './sensitive-access-overview.component';
import { RoleBasedSodComponent } from './role-based-sod.component';
import { UserBasedAnalysisComponent } from './user-based-analysis.component';

const routes: Routes = [
  { path: '', component: RiskAnalysisDashboardComponent },
];

@NgModule({
  declarations: [
    RiskAnalysisDashboardComponent,
    SodRiskSummaryComponent,
    SensitiveAccessOverviewComponent,
    RoleBasedSodComponent,
    UserBasedAnalysisComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class RiskAnalysisDashboardModule {}
