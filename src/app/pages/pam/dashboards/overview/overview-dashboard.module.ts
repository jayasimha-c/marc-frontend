import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { OverviewDashboardComponent } from './overview-dashboard.component';

const routes: Routes = [{ path: '', component: OverviewDashboardComponent }, { path: '**', component: OverviewDashboardComponent }];

@NgModule({
  declarations: [OverviewDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class OverviewDashboardModule {}
