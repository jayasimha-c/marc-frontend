import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { QuillModule } from 'ngx-quill';

import { CommunicationComponent } from './communication.component';
import { SettingsSectionComponent } from './email/settings/settings-section.component';
import { LogSectionComponent } from './email/logs/log-section.component';
import { TemplateSectionComponent } from './template/template-section.component';
import { LogoSectionComponent } from './logo/logo-section.component';

const routes: Routes = [
  { path: '', component: CommunicationComponent },
  { path: 'email/settings', component: SettingsSectionComponent },
  { path: 'email/logs', component: LogSectionComponent },
  { path: 'template', component: TemplateSectionComponent },
  { path: 'logo', component: LogoSectionComponent },
];

@NgModule({
  declarations: [
    CommunicationComponent,
    SettingsSectionComponent,
    LogSectionComponent,
    TemplateSectionComponent,
    LogoSectionComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    QuillModule.forRoot(),
  ],
})
export class CommunicationModule {}
