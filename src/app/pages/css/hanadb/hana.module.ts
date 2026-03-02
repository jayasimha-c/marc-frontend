import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { HanaComponent } from './hana.component';

const routes: Routes = [{ path: '', component: HanaComponent }, { path: '**', component: HanaComponent }];

@NgModule({
  declarations: [HanaComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class HanaModule {}
