import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { WorkflowDashboardComponent } from './workflow-dashboard.component';

const routes: Routes = [{ path: '', component: WorkflowDashboardComponent }, { path: '**', component: WorkflowDashboardComponent }];

@NgModule({
  declarations: [WorkflowDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class WorkflowDashboardModule {}
