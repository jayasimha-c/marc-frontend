import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

// Org Compliance
import { OrgComplianceWizardComponent } from './org-compliance/org-compliance-wizard.component';

// Org Templates
import { OrgTemplatesComponent, CloneTemplateDialogComponent, FieldValuesModalComponent } from './org-templates/org-templates.component';
import { TemplateEditorComponent } from './org-templates/template-editor/template-editor.component';

// Role Org Values
import { RoleOrgValuesComponent, ValuesDetailContent } from './role-org-values/role-org-values.component';

// RC Concepts
import { RcConceptListComponent } from './rc-concepts/rc-concept-list.component';
import { RcConceptEditorComponent } from './rc-concepts/rc-concept-editor.component';
import { RcPatternSimulatorComponent } from './rc-concepts/rc-pattern-simulator/rc-pattern-simulator.component';

// RC Sync Config
import { RcSyncConfigComponent } from './rc-sync-config/rc-sync-config.component';
import { PatternTestDialogComponent } from './rc-sync-config/pattern-test-dialog/pattern-test-dialog.component';

const routes: Routes = [
    { path: '', redirectTo: 'org-compliance', pathMatch: 'full' },
    { path: 'org-compliance', component: OrgComplianceWizardComponent },
    { path: 'org-templates', component: OrgTemplatesComponent },
    { path: 'org-templates/new', component: TemplateEditorComponent },
    { path: 'org-templates/edit/:id', component: TemplateEditorComponent },
    { path: 'role-org-values', component: RoleOrgValuesComponent },
    { path: 'rc-concepts', component: RcConceptListComponent },
    { path: 'rc-concepts/new', component: RcConceptEditorComponent },
    { path: 'rc-concepts/:id', component: RcConceptEditorComponent },
    { path: 'rc-concepts/:id/simulate', component: RcPatternSimulatorComponent },
    { path: 'rc-sync-config', component: RcSyncConfigComponent },
];

@NgModule({
    declarations: [
        OrgComplianceWizardComponent,
        OrgTemplatesComponent,
        CloneTemplateDialogComponent,
        FieldValuesModalComponent,
        TemplateEditorComponent,
        RoleOrgValuesComponent,
        ValuesDetailContent,
        RcConceptListComponent,
        RcConceptEditorComponent,
        RcPatternSimulatorComponent,
        RcSyncConfigComponent,
        PatternTestDialogComponent,
    ],
    imports: [
        SharedModule,
        RouterModule.forChild(routes),
    ],
})
export class RoleManagementModule {}
