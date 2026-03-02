import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AiIntegrationComponent } from './ai-integration.component';

const routes: Routes = [
  { path: '', component: AiIntegrationComponent },
];

@NgModule({
  declarations: [AiIntegrationComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AiIntegrationModule {}
