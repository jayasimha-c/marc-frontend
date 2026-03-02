import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';

import { RoleCatalogueComponent } from './role-catalogue.component';
import { AddRoleCatalogueComponent } from './add-role-catalogue/add-role-catalogue.component';
import { AddRemoveRolesComponent } from './add-remove-roles/add-remove-roles.component';
import { UploadWizardComponent } from './upload-wizard/upload-wizard.component';

const routes: Routes = [
  { path: '', component: RoleCatalogueComponent },
  { path: 'upload-wizard', component: UploadWizardComponent },
];

@NgModule({
  declarations: [
    RoleCatalogueComponent,
    AddRoleCatalogueComponent,
    AddRemoveRolesComponent,
    UploadWizardComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class RoleCatalogueModule {}
