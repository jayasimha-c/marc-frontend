import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AdminUnifiedRequestComponent } from './admin-unified-request.component';
import { UserActionsComponent } from './user-actions.component';

const routes: Routes = [
  { path: 'single/create', component: AdminUnifiedRequestComponent },
  { path: 'single/change', component: AdminUnifiedRequestComponent },
  { path: 'user-actions', component: UserActionsComponent },
  { path: '', redirectTo: 'single/create', pathMatch: 'full' },
];

@NgModule({
  declarations: [AdminUnifiedRequestComponent, UserActionsComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class OperationsModule {}
