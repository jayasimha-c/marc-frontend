import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ReviewProgressComponent } from './review-progress/review-progress.component';
import { ReviewTrendsComponent } from './review-trends/review-trends.component';
import { ReviewerPerformanceComponent } from './reviewer-performance/reviewer-performance.component';
import { SystemWiseReviewComponent } from './system-wise-review/system-wise-review.component';

const routes: Routes = [
  { path: '', redirectTo: 'review-progress', pathMatch: 'full' },
  { path: 'review-progress', component: ReviewProgressComponent },
  { path: 'review-trends', component: ReviewTrendsComponent },
  { path: 'reviewer-performance', component: ReviewerPerformanceComponent },
  { path: 'system-wise-review', component: SystemWiseReviewComponent },
];

@NgModule({
  declarations: [
    ReviewProgressComponent,
    ReviewTrendsComponent,
    ReviewerPerformanceComponent,
    SystemWiseReviewComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class UarDashboardsModule {}
