import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ReadinessCheckComponent } from './readiness-check.component';

const routes: Routes = [{ path: '', component: ReadinessCheckComponent }, { path: '**', component: ReadinessCheckComponent }];

@NgModule({
  declarations: [ReadinessCheckComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ReadinessCheckModule {}
