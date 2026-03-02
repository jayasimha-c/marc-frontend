import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';

import { OAuth2Component } from './oauth2.component';
import { AddEditClientComponent } from './clients/add-edit-client/add-edit-client.component';
import { RegenerateSecretDialogComponent } from './clients/regenerate-secret-dialog/regenerate-secret-dialog.component';
import { AddEditScopeComponent } from './scopes/add-edit-scope/add-edit-scope.component';

const routes: Routes = [
  { path: '', component: OAuth2Component },
];

@NgModule({
  declarations: [
    OAuth2Component,
    AddEditClientComponent,
    RegenerateSecretDialogComponent,
    AddEditScopeComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ],
})
export class OAuth2Module {}
