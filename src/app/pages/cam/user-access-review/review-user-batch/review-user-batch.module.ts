import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { ReviewUserBatchComponent } from './review-user-batch.component';

const routes: Routes = [{ path: '', component: ReviewUserBatchComponent }];

@NgModule({
  declarations: [ReviewUserBatchComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ReviewUserBatchModule {}
