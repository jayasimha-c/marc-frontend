import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ContentImportComponent } from './content-import.component';

const routes: Routes = [{ path: '', component: ContentImportComponent }, { path: '**', component: ContentImportComponent }];

@NgModule({
  declarations: [ContentImportComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ContentImportModule {}
