import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

import { RoleConceptComponent } from './role-concept.component';
import { RoleConceptTemplateComponent } from './role-concept-template.component';
import { RoleConceptTemplateEditorComponent } from './role-concept-template-editor.component';
import { VersionTimelineComponent } from './version-timeline.component';

const routes: Routes = [
    { path: 'templates', component: RoleConceptTemplateComponent },
    { path: 'templates/new', component: RoleConceptTemplateEditorComponent },
    { path: 'templates/:id', component: RoleConceptTemplateEditorComponent },
    { path: 'system/:systemId', component: RoleConceptComponent },
    { path: '', redirectTo: 'templates', pathMatch: 'full' }
];

@NgModule({
    declarations: [
        RoleConceptComponent,
        RoleConceptTemplateComponent,
        RoleConceptTemplateEditorComponent,
        VersionTimelineComponent
    ],
    imports: [
        SharedModule,
        RouterModule.forChild(routes)
    ],
    exports: [
        RoleConceptComponent,
        RoleConceptTemplateComponent,
        RoleConceptTemplateEditorComponent
    ]
})
export class RoleConceptModule { }
