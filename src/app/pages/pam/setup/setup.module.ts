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

// Privileges
import { PrivilegesComponent } from './privileges/privileges.component';
import { AddPrivilegeComponent } from './privileges/add-privilege/add-privilege.component';
import { PrivilegeWizardComponent } from './privileges/privilege-wizard/privilege-wizard.component';
import { PrivilegeSettingComponent } from './privileges/setting/setting.component';
import { SapMappingComponent } from './privileges/sap-mapping/sap-mapping.component';
import { AddSapMappingComponent } from './privileges/sap-mapping/add-sap-mapping/add-sap-mapping.component';
import { SapReviewerComponent } from './privileges/sap-reviewer/sap-reviewer.component';
import { AddSapReviewerComponent } from './privileges/sap-reviewer/add-sap-reviewer/add-sap-reviewer.component';

const routes: Routes = [
  { path: '', component: PamSetupComponent },
  { path: 'privileges', component: PrivilegesComponent },
  { path: 'privileges/wizard/new', component: PrivilegeWizardComponent },
  { path: 'privileges/wizard/edit/:id', component: PrivilegeWizardComponent },
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
    CreateSchedulersComponent,
    // Privileges
    PrivilegesComponent,
    AddPrivilegeComponent,
    PrivilegeWizardComponent,
    PrivilegeSettingComponent,
    SapMappingComponent,
    AddSapMappingComponent,
    SapReviewerComponent,
    AddSapReviewerComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SetupModule { }
