import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UnlockSessionRoutingModule } from './unlock-session-routing.module';
import { UnlockSessionComponent } from './unlock-session.component';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
    declarations: [UnlockSessionComponent],
    imports: [
        CommonModule,
        UnlockSessionRoutingModule,
        NzCardModule,
        NzFormModule,
        NzInputModule,
        NzButtonModule,
        NzIconModule,
        ReactiveFormsModule
    ]
})
export class UnlockSessionModule { }
