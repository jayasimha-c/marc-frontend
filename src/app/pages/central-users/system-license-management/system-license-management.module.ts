import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

// Top-level components
import { SystemLicenseInfoComponent } from './system-license-info/system-license-info.component';
import { LicenseRulesComponent } from './license-rules/license-rules.component';
import { LicenseIndirectUsageComponent } from './license-indirect-usage/license-indirect-usage.component';
import { AddLicenseIndirectUsageComponent } from './license-indirect-usage/add-license-indirect-usage/add-license-indirect-usage.component';
import { LicenseManagementComponent } from './license-management/license-management.component';
import { ViewLicenseManagementComponent } from './license-management/view-license-management/view-license-management.component';
import { LicenseJobsComponent } from './jobs/jobs.component';
import { JobsDetailsComponent } from './jobs/jobs-details/jobs-details.component';
import { LicensePivotReportComponent } from './pivot-report/pivot-report.component';

// FUE components
import { FueDashboardComponent } from './fue-jobs/fue-dashboard/fue-dashboard.component';
import { RunFueMeasurementComponent } from './fue-jobs/run-fue-measurement/run-fue-measurement.component';
import { FueTypesComponent } from './fue-jobs/fue-types/fue-types.component';
import { FueResultsComponent } from './fue-jobs/fue-results/fue-results.component';
import { FueSummaryComponent } from './fue-jobs/fue-summary/fue-summary.component';
import { FueSimulatorComponent } from './fue-jobs/fue-simulator/fue-simulator.component';
import { FueJobLogsDialogComponent } from './fue-jobs/fue-job-logs-dialog/fue-job-logs-dialog.component';

const routes: Routes = [
    { path: '', redirectTo: 'system-license-info', pathMatch: 'full' },
    { path: 'system-license-info', component: SystemLicenseInfoComponent },
    { path: 'license-rules', component: LicenseRulesComponent },
    { path: 'license-indirect-usage', component: LicenseIndirectUsageComponent },
    { path: 'license-management', component: LicenseManagementComponent },
    { path: 'jobs', component: LicenseJobsComponent },
    { path: 'pivot-report', component: LicensePivotReportComponent },
    { path: 'fue-dashboard', component: FueDashboardComponent },
    { path: 'fue-types', component: FueTypesComponent },
    { path: 'fue-results/:jobId', component: FueResultsComponent },
    { path: 'fue-summary/:jobId', component: FueSummaryComponent },
    { path: 'fue-simulator', component: FueSimulatorComponent },
];

@NgModule({
    declarations: [
        SystemLicenseInfoComponent,
        LicenseRulesComponent,
        LicenseIndirectUsageComponent,
        AddLicenseIndirectUsageComponent,
        LicenseManagementComponent,
        ViewLicenseManagementComponent,
        LicenseJobsComponent,
        JobsDetailsComponent,
        LicensePivotReportComponent,
        FueDashboardComponent,
        RunFueMeasurementComponent,
        FueTypesComponent,
        FueResultsComponent,
        FueSummaryComponent,
        FueSimulatorComponent,
        FueJobLogsDialogComponent,
    ],
    imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SystemLicenseManagementModule {}
