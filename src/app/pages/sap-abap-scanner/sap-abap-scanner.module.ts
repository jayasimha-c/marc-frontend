import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SapAbapScannerComponent } from './sap-abap-scanner.component';

const routes: Routes = [{ path: '', component: SapAbapScannerComponent }, { path: '**', component: SapAbapScannerComponent }];

@NgModule({
  declarations: [SapAbapScannerComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SapAbapScannerModule {}
