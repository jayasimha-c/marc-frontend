import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { IcmComponent } from './icm.component';

const routes: Routes = [{ path: '', component: IcmComponent }, { path: '**', component: IcmComponent }];

@NgModule({
  declarations: [IcmComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class IcmModule {}
