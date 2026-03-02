import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { MyApprovalComponent } from './my-approval/my-approval.component';
import { ApproveModalComponent } from './my-approval/approve-modal.component';
import { CreateRequestModalComponent } from './my-request/create-request-modal/create-request-modal.component';
import { MyReviewsComponent } from './my-reviews/my-reviews.component';
import { ViewTxnLogComponent } from '../reports/all-request/view-txn-log/view-txn-log.component';

const routes: Routes = [
  { path: 'my-approval', component: MyApprovalComponent },
  { path: 'my-reviews', component: MyReviewsComponent }
];

@NgModule({
  declarations: [
    MyApprovalComponent,
    ApproveModalComponent,
    CreateRequestModalComponent,
    MyReviewsComponent,
    ViewTxnLogComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class RequestsModule { }
