import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { SignOutComponent } from './sign-out.component';

const routes: Routes = [{ path: '', component: SignOutComponent }];

@NgModule({
  declarations: [SignOutComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SignOutModule {}
