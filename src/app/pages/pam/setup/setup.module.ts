import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { PamSetupComponent } from './setup.component';
import { ReviewRuleComponent } from './review-rule/review-rule.component';
import { PamReasonComponent } from './reason/reason.component';
import { PamJobsComponent } from './synchronize/jobs/jobs.component';
import { StartJobComponent } from './synchronize/jobs/start-job/start-job.component';
import { ViewTransactionLogsComponent } from './synchronize/jobs/view-transaction-logs/view-transaction-logs.component';
import { PamSchedulersComponent } from './synchronize/schedulers/schedulers.component';
import { CreateSchedulersComponent } from './synchronize/schedulers/create-schedulers/create-schedulers.component';

const routes: Routes = [
  { path: '', component: PamSetupComponent },
  { path: 'review-rule', component: ReviewRuleComponent },
  { path: 'reason', component: PamReasonComponent },
  { path: 'synchronize/jobs', component: PamJobsComponent },
  { path: 'synchronize/schedulers', component: PamSchedulersComponent }
];

@NgModule({
  declarations: [
    PamSetupComponent,
    ReviewRuleComponent,
    PamReasonComponent,
    PamJobsComponent,
    StartJobComponent,
    ViewTransactionLogsComponent,
    PamSchedulersComponent,
    CreateSchedulersComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SetupModule { }

