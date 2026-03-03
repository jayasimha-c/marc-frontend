import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { SignOutComponent } from './sign-out.component';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzProgressModule } from 'ng-zorro-antd/progress';
const routes: Routes = [{ path: '', component: SignOutComponent }];

@NgModule({
  declarations: [SignOutComponent],
  imports: [SharedModule, RouterModule.forChild(routes), NzDescriptionsModule, NzProgressModule],
})
export class SignOutModule {}
