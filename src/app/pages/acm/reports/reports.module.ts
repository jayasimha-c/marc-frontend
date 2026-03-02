import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AcmReportsComponent } from './reports.component';
import { SodResultsComponent } from './sod-results/sod-results.component';
import { ViewResultsComponent } from './sod-results/view-results/view-results.component';
import { StatisticsModalComponent } from './sod-results/statistics-modal.component';
import { AssignMitigationModalComponent } from './sod-results/assign-mitigation-modal.component';
import { OrgChecksModalComponent } from './sod-results/org-checks-modal.component';
import { ShowChartModalComponent } from './sod-results/show-chart-modal.component';
import { RemDashboardComponent } from './rem-dashboard/rem-dashboard.component';
import { TcodeExecutionComponent } from './tcode-execution/tcode-execution.component';
import { RiskExecutionComponent } from './risk-execution/risk-execution.component';
import { RuleExecutionComponent } from './rule-execution/rule-execution.component';

const routes: Routes = [
  { path: '', redirectTo: 'sod-results', pathMatch: 'full' },
  { path: 'sod-results', component: SodResultsComponent },
  { path: 'sod-results/view', component: ViewResultsComponent },
  { path: 'rem-dashboard', component: RemDashboardComponent },
  { path: 'tcode-execution', component: TcodeExecutionComponent },
  { path: 'risk-execution', component: RiskExecutionComponent },
  { path: 'rule-execution', component: RuleExecutionComponent },
];

@NgModule({
  declarations: [
    AcmReportsComponent,
    SodResultsComponent,
    ViewResultsComponent,
    StatisticsModalComponent,
    AssignMitigationModalComponent,
    OrgChecksModalComponent,
    ShowChartModalComponent,
    RemDashboardComponent,
    TcodeExecutionComponent,
    RiskExecutionComponent,
    RuleExecutionComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ReportsModule {}
