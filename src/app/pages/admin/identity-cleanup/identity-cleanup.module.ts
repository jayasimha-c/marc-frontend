import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

import { IdentityCleanupComponent } from './identity-cleanup.component';

const routes: Routes = [
    { path: '', component: IdentityCleanupComponent }
];

@NgModule({
    declarations: [IdentityCleanupComponent],
    imports: [
        SharedModule,
        RouterModule.forChild(routes)
    ]
})
export class IdentityCleanupModule { }
