import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CamComponent } from './cam.component';

const routes: Routes = [{ path: '', component: CamComponent }];

@NgModule({
  declarations: [CamComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class CamModule {}
