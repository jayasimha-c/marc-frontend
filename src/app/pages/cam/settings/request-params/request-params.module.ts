import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { RequestParamsComponent } from './request-params.component';

const routes: Routes = [{ path: '', component: RequestParamsComponent }];

@NgModule({
  declarations: [RequestParamsComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class RequestParamsModule {}
