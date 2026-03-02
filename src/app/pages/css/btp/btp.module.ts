import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { BtpComponent } from './btp.component';
import { BtpCommandComponent, TestDataContent } from './btp-command/btp-command.component';
import { ExecutionLogComponent } from './btp-command/execution-log/execution-log.component';
import { SystemMappingComponent } from './btp-command/system-mapping/system-mapping.component';
import { AddBtpSystemMappingComponent } from './btp-command/add-btp-system-mapping/add-btp-system-mapping.component';
import { SystemMappingSettingComponent } from './btp-command/system-mapping-setting/system-mapping-setting.component';

const routes: Routes = [
  { path: '', component: BtpComponent },
  { path: 'command', component: BtpCommandComponent },
];

@NgModule({
  declarations: [
    BtpComponent,
    BtpCommandComponent,
    TestDataContent,
    ExecutionLogComponent,
    SystemMappingComponent,
    AddBtpSystemMappingComponent,
    SystemMappingSettingComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class BtpModule {}
