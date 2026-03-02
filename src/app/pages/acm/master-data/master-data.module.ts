import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { MasterDataComponent } from './master-data.component';

// Mitigations
import { MCControlComponent } from './mitigations/mc-control/mc-control.component';
import { AddMitigationComponent } from './mitigations/mc-control/add-mitigation/add-mitigation.component';
import { AddRemoveUsersComponent } from './mitigations/mc-control/add-remove-users/add-remove-users.component';
import { AddRemoveOwnersComponent } from './mitigations/mc-control/add-remove-owners/add-remove-owners.component';
import { AddRemoveIcmControlsComponent } from './mitigations/mc-control/add-remove-icm-controls/add-remove-icm-controls.component';
import { MitigationUploadComponent } from './mitigations/upload/upload.component';

// Business Processes
import { BusinessProcessTreeComponent } from './business-processes/business-process-tree/business-process-tree.component';
import { AddNodeDialogComponent } from './business-processes/business-process-tree/add-node-dialog/add-node-dialog.component';

// ACM Owners
import { AcmOwnersComponent } from './acm-owners/acm-owners.component';

// Rule Type
import { RuleTypeComponent } from './rule-type/rule-type.component';
import { AddRuleTypeComponent } from './rule-type/add-rule-type/add-rule-type.component';

// Org Fields
import { OrgFieldsComponent } from './org-field/org-fields/org-fields.component';
import { AddOrgFieldComponent } from './org-field/org-fields/add-org-field/add-org-field.component';
import { InitializeDialogComponent } from './org-field/org-fields/initialize-dialog/initialize-dialog.component';
import { DownloadDialogComponent } from './org-field/org-fields/download-dialog/download-dialog.component';
import { OrgUploadComponent } from './org-field/org-upload/org-upload.component';
import { OrgNamesComponent } from './org-field/org-names/org-names.component';
import { AddOrgNameComponent } from './org-field/org-names/add-org-name/add-org-name.component';
import { OrgNamesVariantComponent } from './org-field/org-names-variant/org-names-variant.component';
import { VariantWizardComponent } from './org-field/org-names-variant/variant-wizard/variant-wizard.component';

const routes: Routes = [
  { path: '', component: MasterDataComponent },
  { path: 'mitigations/mc-control', component: MCControlComponent },
  { path: 'mitigations/upload', component: MitigationUploadComponent },
  { path: 'business-processes', component: BusinessProcessTreeComponent },
  { path: 'acm-owners', component: AcmOwnersComponent },
  { path: 'rule-type', component: RuleTypeComponent },
  // Org Fields
  { path: 'org-field/org-fields', component: OrgFieldsComponent },
  { path: 'org-field/upload', component: OrgUploadComponent },
  { path: 'org-field/org-names', component: OrgNamesComponent },
  { path: 'org-field/org-names-variant', component: OrgNamesVariantComponent },
  { path: 'org-field/org-names-variant/create', component: VariantWizardComponent },
  { path: 'org-field/org-names-variant/edit/:id', component: VariantWizardComponent },
  { path: '**', component: MasterDataComponent },
];

@NgModule({
  declarations: [
    MasterDataComponent,
    MCControlComponent,
    AddMitigationComponent,
    AddRemoveUsersComponent,
    AddRemoveOwnersComponent,
    AddRemoveIcmControlsComponent,
    MitigationUploadComponent,
    BusinessProcessTreeComponent,
    AddNodeDialogComponent,
    // ACM Owners
    AcmOwnersComponent,
    // Rule Type
    RuleTypeComponent,
    AddRuleTypeComponent,
    // Org Fields
    OrgFieldsComponent,
    AddOrgFieldComponent,
    InitializeDialogComponent,
    DownloadDialogComponent,
    OrgUploadComponent,
    OrgNamesComponent,
    AddOrgNameComponent,
    OrgNamesVariantComponent,
    VariantWizardComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class MasterDataModule {}
