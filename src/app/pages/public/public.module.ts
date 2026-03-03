import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SelfServiceComponent } from './self-service/self-service.component';
import { NzResultModule } from 'ng-zorro-antd/result';

const routes: Routes = [
  { path: 'selfservice/:id', component: SelfServiceComponent },
];

@NgModule({
  declarations: [SelfServiceComponent],
  imports: [SharedModule, RouterModule.forChild(routes), NzResultModule],
})
export class PublicModule {}
