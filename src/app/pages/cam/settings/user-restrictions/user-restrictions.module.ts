import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { UserRestrictionsComponent } from './user-restrictions.component';
import { AddUserRestrictionsComponent } from './add-user-restrictions/add-user-restrictions.component';

const routes: Routes = [{ path: '', component: UserRestrictionsComponent }];

@NgModule({
  declarations: [UserRestrictionsComponent, AddUserRestrictionsComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class UserRestrictionsModule {}
