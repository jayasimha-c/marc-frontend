import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ComplianceDashboardComponent } from './compliance-dashboard.component';
import { ControlDetailsComponent } from './control-details/control-details.component';

const routes: Routes = [
  { path: '', component: ComplianceDashboardComponent },
  { path: 'control-drilldown/:controlId', component: ControlDetailsComponent },
];

@NgModule({
  declarations: [ComplianceDashboardComponent, ControlDetailsComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ComplianceDashboardModule {}
