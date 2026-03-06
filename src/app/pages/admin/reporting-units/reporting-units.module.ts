import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

import { ReportingUnitsComponent } from './reporting-units.component';
import { SystemsComponent } from './systems/systems.component';
import { AddSystemComponent } from './systems/add-system/add-system.component';

const routes: Routes = [
  {
    path: '',
    component: ReportingUnitsComponent,
    children: [
      { path: '', redirectTo: 'systems', pathMatch: 'full' },
      { path: 'systems', component: SystemsComponent },
      { path: 'systems/add', component: AddSystemComponent },
      { path: 'systems/edit/:id/:systemType', component: AddSystemComponent },
    ],
  },
];

@NgModule({
  declarations: [
    ReportingUnitsComponent,
    SystemsComponent,
    AddSystemComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ReportingUnitsModule {}
