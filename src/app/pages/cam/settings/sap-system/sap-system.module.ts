import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { SapSystemComponent } from './sap-system.component';
import { ManageSapSystemComponent } from './manage-sap-system/manage-sap-system.component';

const routes: Routes = [{ path: '', component: SapSystemComponent }];

@NgModule({
  declarations: [SapSystemComponent, ManageSapSystemComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SapSystemModule {}
