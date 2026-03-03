import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ForgotPasswordComponent } from './forgot-password.component';
import { ForgotPasswordApplyComponent } from './forgot-password-apply.component';

const routes: Routes = [
  { path: '', component: ForgotPasswordComponent },
  { path: 'apply', component: ForgotPasswordApplyComponent },
];

@NgModule({
  declarations: [ForgotPasswordComponent, ForgotPasswordApplyComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ForgotPasswordModule {}
