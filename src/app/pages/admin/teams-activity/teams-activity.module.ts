import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { TeamsActivityComponent } from './teams-activity.component';

const routes: Routes = [
  { path: '', component: TeamsActivityComponent }
];

@NgModule({
  declarations: [TeamsActivityComponent],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class TeamsActivityModule {}
