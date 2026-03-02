import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AdminSettingsComponent } from './settings.component';

const routes: Routes = [{ path: '', component: AdminSettingsComponent }, { path: '**', component: AdminSettingsComponent }];

@NgModule({
  declarations: [AdminSettingsComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SettingsModule {}
