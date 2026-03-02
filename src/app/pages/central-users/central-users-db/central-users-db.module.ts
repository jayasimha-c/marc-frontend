import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { LockParametersComponent } from './lock-parameters/lock-parameters.component';
import { InactiveUsersJobsComponent } from './inactive-users-jobs/inactive-users-jobs.component';
import { InactiveUsersJobsViewDetailsComponent } from './inactive-users-jobs/view-details/view-details.component';
import { CentralUserPivotReportComponent } from './pivot-report/pivot-report.component';

const routes: Routes = [
    { path: '', redirectTo: 'lock-parameters', pathMatch: 'full' },
    { path: 'lock-parameters', component: LockParametersComponent },
    { path: 'jobs', component: InactiveUsersJobsComponent },
    { path: 'pivot-report', component: CentralUserPivotReportComponent },
];

@NgModule({
    declarations: [
        LockParametersComponent,
        InactiveUsersJobsComponent,
        InactiveUsersJobsViewDetailsComponent,
        CentralUserPivotReportComponent,
    ],
    imports: [SharedModule, RouterModule.forChild(routes)],
})
export class CentralUsersDbModule {}
