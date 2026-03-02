import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfirmationRequiredComponent } from './confirmation-required.component';

const routes: Routes = [{ path: '', component: ConfirmationRequiredComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ConfirmationRequiredRoutingModule { }
