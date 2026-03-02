import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

import { AuditLogsComponent } from './audit-logs.component';
import { ExportComponent } from './export/export.component';
import { ExcelDownloadComponent } from './excel-download/excel-download.component';

const routes: Routes = [
  { path: '', component: AuditLogsComponent },
  { path: 'excel-download', component: ExcelDownloadComponent },
];

@NgModule({
  declarations: [
    AuditLogsComponent,
    ExportComponent,
    ExcelDownloadComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
  ],
})
export class AuditLogsModule {}
