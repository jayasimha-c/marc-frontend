import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CyberSecurityDashboardComponent } from './cyber-security-dashboard.component';
import { SecurityOverviewComponent } from './overview/security-overview.component';
import { SecurityEventLogsComponent } from './event-logs/security-event-logs.component';

const routes: Routes = [
  {
    path: '',
    component: CyberSecurityDashboardComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: SecurityOverviewComponent },
      { path: 'event-logs', component: SecurityEventLogsComponent },
    ],
  },
];

@NgModule({
  declarations: [
    CyberSecurityDashboardComponent,
    SecurityOverviewComponent,
    SecurityEventLogsComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class CyberSecurityDashboardModule {}
