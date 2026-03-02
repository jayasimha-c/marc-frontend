import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { RemComponent } from './rem.component';

const routes: Routes = [{ path: '', component: RemComponent }, { path: '**', component: RemComponent }];

@NgModule({
  declarations: [RemComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class RemModule {}
