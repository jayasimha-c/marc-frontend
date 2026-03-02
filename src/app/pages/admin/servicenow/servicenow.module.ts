import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ServiceNowDataExplorerComponent } from './data-explorer/data-explorer.component';
import { SnowAgentComponent } from './snow-agent/snow-agent.component';
import { SnowAgentConfigDialogComponent } from './snow-agent/snow-agent-config-dialog.component';
import { SnowAgentEventDialogComponent } from './snow-agent/snow-agent-event-dialog.component';
import { ServiceNowSyncSettingsComponent } from './sync-settings/sync-settings.component';

const routes: Routes = [
  { path: '', component: ServiceNowDataExplorerComponent },
  { path: 'agent', component: SnowAgentComponent },
  { path: 'sync-settings', component: ServiceNowSyncSettingsComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    ServiceNowDataExplorerComponent,
    SnowAgentComponent,
    SnowAgentConfigDialogComponent,
    SnowAgentEventDialogComponent,
    ServiceNowSyncSettingsComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ServiceNowModule {}
