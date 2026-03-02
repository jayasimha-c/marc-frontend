import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { ReviewJobsComponent } from './review-jobs.component';
import { UserListComponent } from './user-list/user-list.component';

const routes: Routes = [{ path: '', component: ReviewJobsComponent }];

@NgModule({
  declarations: [ReviewJobsComponent, UserListComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ReviewJobsModule {}
