import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { IcmComponent } from './icm.component';
import { MasterDataManagerComponent } from './master-data/master-data-manager.component';
import { AddControlComponent } from './add-control/add-control.component';
import { ControlListComponent } from './control-list/control-list.component';
import { ViewControlComponent } from './view-control/view-control.component';
import { ControlBookListComponent } from './control-book/control-book-list.component';
import { ControlBookDetailComponent } from './control-book/control-book-detail.component';
import { ControlDeficiencyComponent } from './control-deficiency/control-deficiency.component';
import { ViewControlDefComponent } from './control-deficiency/view-control-def.component';
import { ControlResultsComponent } from './control-results/control-results.component';
import { ControlSchedulerListComponent } from './control-scheduler/control-scheduler-list.component';
import { ControlSchedulerDetailComponent } from './control-scheduler/control-scheduler-detail.component';
import { ManualScriptListComponent } from './master-data/manual-script/manual-script-list.component';
import { ScriptEditorComponent } from './master-data/manual-script/script-editor.component';
import { StepLibraryManagerComponent } from './master-data/manual-script/step-library-manager.component';
import { IcmExecutiveDashboardComponent } from './dashboard/executive-dashboard/executive-dashboard.component';
import { IcmAssessmentDashboardComponent } from './dashboard/assessment-dashboard/assessment-dashboard.component';
import { IcmDeficiencyDashboardComponent } from './dashboard/deficiency-dashboard/deficiency-dashboard.component';
import { IcmMonitoringDashboardComponent } from './dashboard/monitoring-dashboard/monitoring-dashboard.component';
import { ControlTaskListComponent } from './control-task/control-task-list.component';
import { ViewControlTaskComponent } from './control-task/view-control-task.component';
import { AnswerControlTaskComponent } from './control-task/answer-control-task.component';
import { MsStepGridComponent } from './control-task/ms-step-grid/ms-step-grid.component';
import { ControlMonitoringComponent } from './control-monitoring/control-monitoring.component';
import { MonitoringJournalViewComponent } from './control-monitoring/monitoring-journal-view/monitoring-journal-view.component';
import { IcmRuleConditionsTableComponent } from './view-control/icm-rule-conditions-table/icm-rule-conditions-table.component';
import { ControlRuleResultComponent } from './view-control/control-rule-result/control-rule-result.component';

const routes: Routes = [
  { path: '', component: IcmComponent },
  { path: 'dashboard', component: IcmExecutiveDashboardComponent },
  { path: 'dashboard/assessment', component: IcmAssessmentDashboardComponent },
  { path: 'dashboard/deficiency', component: IcmDeficiencyDashboardComponent },
  { path: 'dashboard/monitoring', component: IcmMonitoringDashboardComponent },
  { path: 'master-data', component: MasterDataManagerComponent },
  { path: 'master-data/scripts', component: ManualScriptListComponent },
  { path: 'master-data/scripts/edit/new', component: ScriptEditorComponent },
  { path: 'master-data/scripts/edit/:id', component: ScriptEditorComponent },
  { path: 'master-data/step-library', component: StepLibraryManagerComponent },
  { path: 'controls', component: ControlListComponent },
  { path: 'controls/add', component: AddControlComponent },
  { path: 'controls/:controlId', component: ViewControlComponent },
  { path: 'control-books', component: ControlBookListComponent },
  { path: 'control-books/:id', component: ControlBookDetailComponent },
  { path: 'control-deficiency', component: ControlDeficiencyComponent },
  { path: 'control-deficiency/:dfcId', component: ViewControlDefComponent },
  { path: 'control-results', component: ControlResultsComponent },
  { path: 'schedulers', component: ControlSchedulerListComponent },
  { path: 'schedulers/:id', component: ControlSchedulerDetailComponent },
  { path: 'control-monitoring', component: ControlMonitoringComponent },
  { path: 'control-tasks', component: ControlTaskListComponent },
  { path: 'view-control-task/:controlId', component: ViewControlTaskComponent },
  { path: 'answer-control-task/:id', component: AnswerControlTaskComponent },
  { path: '**', component: IcmComponent },
];

@NgModule({
  declarations: [
    IcmComponent,
    MasterDataManagerComponent,
    AddControlComponent,
    ControlListComponent,
    ViewControlComponent,
    ControlBookListComponent,
    ControlBookDetailComponent,
    ControlDeficiencyComponent,
    ViewControlDefComponent,
    ControlResultsComponent,
    ControlSchedulerListComponent,
    ControlSchedulerDetailComponent,
    ManualScriptListComponent,
    IcmExecutiveDashboardComponent,
    IcmAssessmentDashboardComponent,
    IcmDeficiencyDashboardComponent,
    IcmMonitoringDashboardComponent,
    ControlTaskListComponent,
    ViewControlTaskComponent,
    AnswerControlTaskComponent,
    MsStepGridComponent,
    ControlMonitoringComponent,
    MonitoringJournalViewComponent,
    IcmRuleConditionsTableComponent,
    ControlRuleResultComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class IcmModule {}
