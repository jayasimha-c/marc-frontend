import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
    standalone: true,
    selector: 'app-license-job-chooser',
    imports: [CommonModule, NzButtonModule, NzIconModule],
    template: `
        <div style="display: flex; flex-direction: column; gap: 12px; padding: 8px 0;">
            <button nz-button nzType="default" nzBlock nzSize="large" (click)="choose('fue')">
                <span nz-icon nzType="bar-chart" nzTheme="outline"></span>
                FUE Measurement
            </button>
            <button nz-button nzType="default" nzBlock nzSize="large" (click)="choose('legacy')">
                <span nz-icon nzType="idcard" nzTheme="outline"></span>
                Legacy License Measurement
            </button>
        </div>
        <div class="modal-footer">
            <button nz-button nzType="default" (click)="modal.close()">Cancel</button>
        </div>
    `
})
export class LicenseJobChooserComponent {
    constructor(public modal: NzModalRef) {}

    choose(type: 'fue' | 'legacy'): void {
        this.modal.close(type);
    }
}
