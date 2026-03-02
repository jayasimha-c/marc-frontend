import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { GeneralComponent } from './general.component';

import { ExportResultsComponent } from './export-results/export-results.component';
import { AddIssueComponent } from './issues/add/add-issue.component';
import { IssuesComponent } from './issues/issues.component';

const routes: Routes = [
  { path: '', component: GeneralComponent },
  { path: 'issues', component: IssuesComponent },
  { path: 'export-results', component: ExportResultsComponent },
  { path: '**', component: GeneralComponent }
];

@NgModule({
  declarations: [GeneralComponent, IssuesComponent, AddIssueComponent, ExportResultsComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class GeneralModule { }
