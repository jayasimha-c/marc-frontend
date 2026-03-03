import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { MyApprovalComponent } from './my-approval/my-approval.component';
import { ApproveModalComponent } from './my-approval/approve-modal.component';
import { CreateRequestModalComponent } from './my-request/create-request-modal/create-request-modal.component';
import { MyRequestComponent } from './my-request/my-request.component';
import { MyReviewsComponent } from './my-reviews/my-reviews.component';
import { ViewTxnLogComponent } from '../reports/all-request/view-txn-log/view-txn-log.component';

const routes: Routes = [
  { path: 'my-approval', component: MyApprovalComponent },
  { path: 'my-reviews', component: MyReviewsComponent },
  { path: 'my-requests', component: MyRequestComponent },
  { path: 'create-request', component: CreateRequestModalComponent },
  { path: 'edit-request/:id', component: CreateRequestModalComponent },
  { path: 'view-request/:id', component: CreateRequestModalComponent },
  { path: 'approval-view/:id', component: CreateRequestModalComponent }
];

@NgModule({
  declarations: [
    MyApprovalComponent,
    ApproveModalComponent,
    CreateRequestModalComponent,
    MyRequestComponent,
    MyReviewsComponent,
    ViewTxnLogComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class RequestsModule { }
