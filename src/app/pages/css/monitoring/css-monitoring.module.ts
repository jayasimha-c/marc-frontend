import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CssMonitoringComponent } from './css-monitoring.component';
import { SapRuleBookComponent } from './sap-rule-book/sap-rule-book.component';
import { AddRuleBookComponent } from './sap-rule-book/add-rule-book/add-rule-book.component';
import { AddAssignmentDialogComponent } from './sap-rule-book/add-assignment-dialog/add-assignment-dialog.component';
import { RunNowDialogComponent } from './sap-rule-book/run-now-dialog/run-now-dialog.component';
import { CssConsistencyCheckComponent } from './sap-rule-book/consistency-check/consistency-check.component';
import { JobHistoryComponent } from './job-history/job-history.component';
import { JobLogsDialogComponent } from './job-history/job-logs-dialog/job-logs-dialog.component';
import { RuleViolationsComponent } from './rule-violations/rule-violations.component';
import { ViolationDetailPanelComponent } from './rule-violations/detail-panel/violation-detail-panel.component';
import { IssueAnalyticsComponent } from './issue-analytics/issue-analytics.component';

// RFC Monitoring
import { RfcMonitoringDashboardComponent } from './rfc-monitoring/rfc-monitoring-dashboard.component';
import { RfcConnectionListComponent } from './rfc-monitoring/rfc-connection-list.component';
import { RfcConnectionDetailComponent } from './rfc-monitoring/rfc-connection-detail.component';
import { RfcRulesConfigComponent } from './rfc-monitoring/rfc-rules-config.component';

// RFC Schedulers
import { RfcSchedulersComponent } from './rfc-schedulers/rfc-schedulers.component';
import { AddRfcSchedulerModalComponent } from './rfc-schedulers/add-rfc-scheduler-modal.component';
import { RfcSchedulerJobsModalComponent } from './rfc-schedulers/rfc-scheduler-jobs-modal.component';

const routes: Routes = [
  { path: '', component: CssMonitoringComponent },
  { path: 'sap-rule-book', component: SapRuleBookComponent },
  { path: 'add-sap-parameter-rule-book', component: AddRuleBookComponent },
  { path: 'job-history', component: JobHistoryComponent },
  { path: 'parameter-violations', component: RuleViolationsComponent },
  { path: 'issue-analytics', component: IssueAnalyticsComponent },
  // RFC Monitoring
  { path: 'rfc-monitoring', component: RfcMonitoringDashboardComponent },
  { path: 'rfc-monitoring/connections', component: RfcConnectionListComponent },
  { path: 'rfc-monitoring/rules', component: RfcRulesConfigComponent },
  // RFC Schedulers
  { path: 'rfc-schedulers', component: RfcSchedulersComponent },
];

@NgModule({
  declarations: [
    CssMonitoringComponent,
    SapRuleBookComponent,
    AddRuleBookComponent,
    AddAssignmentDialogComponent,
    RunNowDialogComponent,
    CssConsistencyCheckComponent,
    JobHistoryComponent,
    JobLogsDialogComponent,
    RuleViolationsComponent,
    ViolationDetailPanelComponent,
    IssueAnalyticsComponent,
    // RFC Monitoring
    RfcMonitoringDashboardComponent,
    RfcConnectionListComponent,
    RfcConnectionDetailComponent,
    RfcRulesConfigComponent,
    // RFC Schedulers
    RfcSchedulersComponent,
    AddRfcSchedulerModalComponent,
    RfcSchedulerJobsModalComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class CssMonitoringModule {}
