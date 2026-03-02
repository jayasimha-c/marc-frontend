import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { UsageDashboardComponent } from './usage-dashboard.component';

const routes: Routes = [{ path: '', component: UsageDashboardComponent }, { path: '**', component: UsageDashboardComponent }];

@NgModule({
  declarations: [UsageDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class UsageDashboardModule {}
