import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UnlockSessionComponent } from './unlock-session.component';

const routes: Routes = [{ path: '', component: UnlockSessionComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UnlockSessionRoutingModule { }
