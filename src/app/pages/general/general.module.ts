import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { GeneralComponent } from './general.component';

import { ExportResultsComponent } from './export-results/export-results.component';
import { AddIssueComponent } from './issues/add/add-issue.component';
import { IssuesComponent } from './issues/issues.component';

import { ControlFrameworkOverviewComponent } from './control-framework/control-framework-overview.component';
import { ControlFrameworkImportComponent } from './control-framework/control-framework-import.component';
import { ControlsDetailsComponent } from './control-framework/controls-details.component';
import { ControlFrameworkDashboardComponent } from './control-framework/control-framework-dashboard.component';
import { VisualQueryBuilderComponent } from './visual-query-builder/visual-query-builder.component';
import { QueryManagementComponent } from './query-management/query-management.component';
import { QueryFlowVisualizerComponent } from './query-management/query-flow-visualizer/query-flow-visualizer.component';
import { BpmnDiagramComponent } from './bpmn-diagram/bpmn-diagram.component';

const routes: Routes = [
  { path: '', component: GeneralComponent },
  { path: 'issues', component: IssuesComponent },
  { path: 'export-results', component: ExportResultsComponent },
  { path: 'control-framework', redirectTo: 'control-framework/overview', pathMatch: 'full' },
  { path: 'control-framework/overview', component: ControlFrameworkOverviewComponent },
  { path: 'control-framework/controls', component: ControlsDetailsComponent },
  { path: 'control-framework/dashboard', component: ControlFrameworkDashboardComponent },
  { path: 'query-management', component: QueryManagementComponent },
  { path: 'bpmn-diagram', component: BpmnDiagramComponent },
  { path: 'visual-query-builder', component: VisualQueryBuilderComponent },
  { path: 'visual-query-builder/:id', component: VisualQueryBuilderComponent },
  { path: '**', component: GeneralComponent }
];

@NgModule({
  declarations: [
    GeneralComponent,
    IssuesComponent,
    AddIssueComponent,
    ExportResultsComponent,
    ControlFrameworkOverviewComponent,
    ControlFrameworkImportComponent,
    ControlsDetailsComponent,
    ControlFrameworkDashboardComponent,
    VisualQueryBuilderComponent,
    QueryManagementComponent,
    QueryFlowVisualizerComponent,
    BpmnDiagramComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class GeneralModule {}
