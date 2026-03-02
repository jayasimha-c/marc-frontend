import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

import { RoleComponent } from './role.component';
import { AddRoleComponent } from './add-role/add-role.component';
import { EditRoleComponent } from './edit-role/edit-role.component';
import { EditRoleOperationComponent } from './edit-role-operation/edit-role-operation.component';
import { LdapTitleComponent } from './ldap-title/ldap-title.component';
import { AddLdapTitleComponent } from './ldap-title/add-ldap-title/add-ldap-title.component';
import { EditLdapTitleComponent } from './ldap-title/edit-ldap-title/edit-ldap-title.component';

const routes: Routes = [
  { path: '', component: RoleComponent },
  { path: 'ldap-titles', component: LdapTitleComponent },
];

@NgModule({
  declarations: [
    RoleComponent,
    AddRoleComponent,
    EditRoleComponent,
    EditRoleOperationComponent,
    LdapTitleComponent,
    AddLdapTitleComponent,
    EditLdapTitleComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ],
})
export class RoleModule {}
