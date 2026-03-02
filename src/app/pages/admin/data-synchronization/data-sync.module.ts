import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { DataSyncComponent } from './data-sync.component';
import { SchedulerTabComponent } from './scheduler-tab/scheduler-tab.component';
import { SyncJobsComponent } from './sync-jobs/sync-jobs.component';
import { AddSchedulerDialogComponent } from './add-scheduler-dialog/add-scheduler-dialog.component';
import { JobLogsDialogComponent } from './job-logs-dialog/job-logs-dialog.component';

const routes: Routes = [
  {
    path: '',
    component: DataSyncComponent,
    children: [
      { path: '', redirectTo: 'schedulers', pathMatch: 'full' },
      { path: 'schedulers', component: SchedulerTabComponent },
      { path: 'jobs', component: SyncJobsComponent },
    ]
  }
];

@NgModule({
  declarations: [
    DataSyncComponent,
    SchedulerTabComponent,
    SyncJobsComponent,
    AddSchedulerDialogComponent,
    JobLogsDialogComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class DataSyncModule {}
