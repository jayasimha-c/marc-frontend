import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { SharedModule } from '../../../shared/shared.module';
import { CentralUserAdminComponent } from './central-user-admin.component';
import { UserSearchComponent } from './user-search/user-search.component';
import { OperationsConsoleComponent } from './operations-console/operations-console.component';
import { PasswordGeneratorDialogComponent } from './password-generator-dialog/password-generator-dialog.component';
import { SystemLandscapeComponent } from './system-landscape/system-landscape.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { UserRoleComparisonComponent } from './user-role-comparison/user-role-comparison.component';
import { StdControlResultsComponent } from './std-control-results/std-control-results.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: CentralUserAdminComponent },
  { path: 'users', component: UserSearchComponent },
  { path: 'users/:identityId', component: UserDetailComponent },
  { path: 'systems', component: SystemLandscapeComponent },
  { path: 'operations-console', component: OperationsConsoleComponent },
];

@NgModule({
  declarations: [
    CentralUserAdminComponent,
    UserSearchComponent,
    OperationsConsoleComponent,
    PasswordGeneratorDialogComponent,
    SystemLandscapeComponent,
    UserDetailComponent,
    UserRoleComparisonComponent,
    StdControlResultsComponent
  ],
  imports: [SharedModule, NzSliderModule, RouterModule.forChild(routes)],
})
export class CentralUserAdminModule { }
