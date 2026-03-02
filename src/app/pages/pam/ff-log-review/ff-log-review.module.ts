import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { FfLogReviewComponent } from './ff-log-review.component';

const routes: Routes = [{ path: '', component: FfLogReviewComponent }, { path: '**', component: FfLogReviewComponent }];

@NgModule({
  declarations: [FfLogReviewComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class FfLogReviewModule {}
