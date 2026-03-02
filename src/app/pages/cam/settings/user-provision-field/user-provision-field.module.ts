import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { UserProvisionFieldComponent } from './user-provision-field.component';
import { AddUserProvisionFieldComponent } from './add-user-provision-field/add-user-provision-field.component';

const routes: Routes = [{ path: '', component: UserProvisionFieldComponent }];

@NgModule({
  declarations: [UserProvisionFieldComponent, AddUserProvisionFieldComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class UserProvisionFieldModule {}
