import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

// List pages
import { WfMyRequestsComponent } from './my-requests/my-requests.component';
import { WfAllRequestsComponent } from './all-requests/all-requests.component';
import { WfToApproveComponent } from './to-approve/to-approve.component';
import { WorkflowsComponent } from './workflows/workflows.component';
import { WorkflowNodesComponent } from './workflow-nodes/workflow-nodes.component';

// Wizards
import { WorkflowWizardComponent } from './workflow-wizard/workflow-wizard.component';
import { NodeWizardComponent } from './node-wizard/node-wizard.component';

// Detail & modals
import { RequestDetailsComponent } from './request-details/request-details.component';
import { ApprovalDetailsComponent } from './approval-details/approval-details.component';
import { AddCommentComponent } from './add-comment/add-comment.component';
import { RolesListComponent } from './roles-list/roles-list.component';

// Audit logs
import { WorkflowAuditLogsComponent } from './audit-logs/workflow-audit-logs.component';
import { NodeAuditLogsComponent } from './audit-logs/node-audit-logs.component';

const routes: Routes = [
  { path: 'my-requests', component: WfMyRequestsComponent },
  { path: 'to-approve', component: WfToApproveComponent },
  { path: 'all-requests', component: WfAllRequestsComponent },
  { path: 'workflows', component: WorkflowsComponent },
  { path: 'workflows/create', component: WorkflowWizardComponent },
  { path: 'workflows/edit/:id', component: WorkflowWizardComponent },
  { path: 'nodes', component: WorkflowNodesComponent },
  { path: 'nodes/create', component: NodeWizardComponent },
  { path: 'nodes/edit/:id', component: NodeWizardComponent },
  { path: 'request-details/:id/:status', component: RequestDetailsComponent },
  { path: 'audit-logs/workflow', component: WorkflowAuditLogsComponent },
  { path: 'audit-logs/node', component: NodeAuditLogsComponent },
  { path: 'audit-logs/delegation', component: NodeAuditLogsComponent },
  { path: '', redirectTo: 'my-requests', pathMatch: 'full' },
];

@NgModule({
  declarations: [
    WfMyRequestsComponent,
    WfAllRequestsComponent,
    WfToApproveComponent,
    WorkflowsComponent,
    WorkflowNodesComponent,
    WorkflowWizardComponent,
    NodeWizardComponent,
    RequestDetailsComponent,
    ApprovalDetailsComponent,
    AddCommentComponent,
    RolesListComponent,
    WorkflowAuditLogsComponent,
    NodeAuditLogsComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ],
})
export class WorkflowModule {}
