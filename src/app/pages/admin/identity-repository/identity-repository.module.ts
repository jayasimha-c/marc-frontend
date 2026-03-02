import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { IdentityRepositoryComponent } from './identity-repository.component';
import { IdentityRepositoryListComponent } from './identity-repository-list/identity-repository-list.component';
import { IdentityDetailsComponent } from './identity-details/identity-details.component';
import { IdentityExceptionsComponent } from './identity-exceptions/identity-exceptions.component';

const routes: Routes = [
  {
    path: 'detail/:id',
    component: IdentityDetailsComponent
  },
  {
    path: '',
    component: IdentityRepositoryComponent,
    children: [
      { path: '', component: IdentityRepositoryListComponent },
    ]
  }
];

@NgModule({
  declarations: [
    IdentityRepositoryComponent,
    IdentityRepositoryListComponent,
    IdentityDetailsComponent,
    IdentityExceptionsComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class IdentityRepositoryModule {}
