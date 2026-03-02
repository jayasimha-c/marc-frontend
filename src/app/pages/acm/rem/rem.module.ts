import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { RemComponent } from './rem.component';
import { AddRisksConfigComponent } from './add-risks-config.component';
import { CreateNewDurationComponent } from './create-new-duration.component';

const routes: Routes = [
  { path: '', redirectTo: 'rem-config', pathMatch: 'full' },
  { path: 'rem-config', component: RemComponent },
];

@NgModule({
  declarations: [RemComponent, AddRisksConfigComponent, CreateNewDurationComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class RemModule {}
