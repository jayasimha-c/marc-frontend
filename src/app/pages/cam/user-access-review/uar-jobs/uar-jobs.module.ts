import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { UarJobsComponent } from './uar-jobs.component';
import { AddUarJobComponent } from './add-uar-job/add-uar-job.component';
import { ViewJobConfigComponent } from './view-job-config/view-job-config.component';

const routes: Routes = [
  { path: '', component: UarJobsComponent },
  { path: 'add', component: AddUarJobComponent },
  { path: 'view/:id', component: AddUarJobComponent },
];

@NgModule({
  declarations: [UarJobsComponent, AddUarJobComponent, ViewJobConfigComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class UarJobsModule {}
