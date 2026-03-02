import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { AuditDashboardComponent } from './audit-dashboard.component';

const routes: Routes = [{ path: '', component: AuditDashboardComponent }, { path: '**', component: AuditDashboardComponent }];

@NgModule({
  declarations: [AuditDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AuditDashboardModule {}
