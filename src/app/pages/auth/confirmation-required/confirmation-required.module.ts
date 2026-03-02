import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConfirmationRequiredRoutingModule } from './confirmation-required-routing.module';
import { ConfirmationRequiredComponent } from './confirmation-required.component';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';

@NgModule({
    declarations: [ConfirmationRequiredComponent],
    imports: [
        CommonModule,
        ConfirmationRequiredRoutingModule,
        NzCardModule,
        NzButtonModule,
        NzResultModule
    ]
})
export class ConfirmationRequiredModule { }
