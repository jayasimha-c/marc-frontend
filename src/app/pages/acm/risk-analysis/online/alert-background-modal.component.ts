import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  standalone: false,
  selector: 'app-alert-background-modal',
  template: `
    <div style="padding: 16px;">
      <p *ngIf="!dialogData.message" style="margin-bottom: 8px;">
        <nz-tag nzColor="success">Success</nz-tag> Analysis Started Successfully.
      </p>
      <p *ngIf="dialogData.message" style="margin-bottom: 8px;">{{ dialogData.message }}</p>
      <p>Click <a (click)="redirect()">here</a> to see the results page.</p>
    </div>
    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Close</button>
    </div>
  `,
})
export class AlertBackgroundModalComponent {
  constructor(
    private router: Router,
    public modal: NzModalRef,
    @Inject(NZ_MODAL_DATA) public dialogData: any,
  ) {}

  redirect(): void {
    this.router.navigate([this.dialogData.redirect || 'acm/reports/sod-results']);
    this.modal.close();
  }
}
