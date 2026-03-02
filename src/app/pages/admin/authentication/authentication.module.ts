import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

import { UserComponent } from './users/user.component';
import { AddUserComponent } from './users/add-user/add-user.component';
import { PasswordResetComponent } from './users/password-reset/password-reset.component';
import { UserRoleComponent } from './users/user-role/user-role.component';
import { LoginHistoryComponent } from './login-history/login-history.component';
import { BlockedIpsComponent } from './blocked-ips/blocked-ips.component';
import { OperationComponent } from './operation/operation.component';
import { AddEditOperationComponent } from './operation/add-edit-operation/add-edit-operation.component';

const routes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  { path: 'users', component: UserComponent },
  { path: 'loginEvents', component: LoginHistoryComponent },
  { path: 'blockedIps', component: BlockedIpsComponent },
  { path: 'operation', component: OperationComponent },
];

@NgModule({
  declarations: [
    UserComponent,
    AddUserComponent,
    PasswordResetComponent,
    UserRoleComponent,
    LoginHistoryComponent,
    BlockedIpsComponent,
    OperationComponent,
    AddEditOperationComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ],
})
export class AuthenticationModule {}
