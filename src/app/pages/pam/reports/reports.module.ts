import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { PamReportsComponent } from './reports.component';
import { AllRequestsComponent } from './all-request/all-request.component';
import { ViewRequestLogComponent } from './all-request/view-request-log/view-request-log.component';
import { MasterDataComponent } from './master-data/master-data.component';
import { PAMReportsService } from './reports.service';

const routes: Routes = [
  { path: '', component: PamReportsComponent },
  { path: 'master-data', component: MasterDataComponent },
  { path: 'all-request', component: AllRequestsComponent },
  { path: '**', component: PamReportsComponent }
];

@NgModule({
  declarations: [
    PamReportsComponent,
    AllRequestsComponent,
    ViewRequestLogComponent,
    MasterDataComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
  providers: [PAMReportsService]
})
export class PamReportsModule { }
