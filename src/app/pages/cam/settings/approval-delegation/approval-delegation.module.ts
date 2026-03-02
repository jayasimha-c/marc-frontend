import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { ApprovalDelegationComponent } from './approval-delegation.component';
import { AddApprovalDelegationComponent } from './add-approval-delegation/add-approval-delegation.component';

const routes: Routes = [{ path: '', component: ApprovalDelegationComponent }];

@NgModule({
  declarations: [ApprovalDelegationComponent, AddApprovalDelegationComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ApprovalDelegationModule {}
