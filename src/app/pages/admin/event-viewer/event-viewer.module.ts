import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { EventViewerComponent } from './event-viewer.component';

const routes: Routes = [{ path: '', component: EventViewerComponent }, { path: '**', component: EventViewerComponent }];

@NgModule({
  declarations: [EventViewerComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class EventViewerModule {}
