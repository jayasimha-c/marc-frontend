import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { NistDashboardComponent } from './nist-dashboard.component';

const routes: Routes = [{ path: '', component: NistDashboardComponent }, { path: '**', component: NistDashboardComponent }];

@NgModule({
  declarations: [NistDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class NistDashboardModule {}
