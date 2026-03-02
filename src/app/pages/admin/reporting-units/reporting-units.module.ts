import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ReportingUnitsComponent } from './reporting-units.component';

const routes: Routes = [{ path: '', component: ReportingUnitsComponent }, { path: '**', component: ReportingUnitsComponent }];

@NgModule({
  declarations: [ReportingUnitsComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ReportingUnitsModule {}
