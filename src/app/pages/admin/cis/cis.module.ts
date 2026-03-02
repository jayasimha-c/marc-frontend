import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CISDataExplorerComponent } from './data-explorer/data-explorer.component';

const routes: Routes = [
  { path: '', component: CISDataExplorerComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [CISDataExplorerComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class CISModule {}
