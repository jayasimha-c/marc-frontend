import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

import { SsAccessRequestComponent } from './access-request/access-request.component';
import { SsRequestsComponent } from './requests/requests.component';
import { SsUserActionsComponent } from './user-actions/user-actions.component';

const routes: Routes = [
  { path: 'request-access', component: SsAccessRequestComponent },
  { path: 'requests', component: SsRequestsComponent },
  { path: 'user-actions', component: SsUserActionsComponent },
  { path: '', redirectTo: 'request-access', pathMatch: 'full' },
];

@NgModule({
  declarations: [
    SsAccessRequestComponent,
    SsRequestsComponent,
    SsUserActionsComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ],
})
export class SelfServiceModule {}
