import { Component, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  standalone: false,
  selector: 'app-confirm-dialog',
  template: `
    <div class="confirm-dialog">
      <div class="confirm-dialog__header">
        <div class="confirm-dialog__icon">
          <span nz-icon nzType="warning" nzTheme="outline"></span>
        </div>
        <h3 class="confirm-dialog__title">{{ data.title }}</h3>
      </div>

      <div class="confirm-dialog__body">
        <label *ngIf="data.checkbox" nz-checkbox [(ngModel)]="checkboxValue">
          {{ data.message }}
        </label>
        <p *ngIf="!data.checkbox" class="confirm-dialog__message">{{ data.message }}</p>
      </div>

      <div class="confirm-dialog__footer">
        <button nz-button nzType="default" (click)="onCancel()">
          {{ cancelBtnText }}
        </button>
        <button nz-button nzType="primary" [nzDanger]="true" (click)="onConfirm()">
          {{ confirmBtnText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog__header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .confirm-dialog__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #fff2f0;
      color: #ff4d4f;
      font-size: 20px;
      flex-shrink: 0;
    }
    .confirm-dialog__title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    .confirm-dialog__message {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.65);
      margin: 0;
    }
    .confirm-dialog__footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }
  `]
})
export class ConfirmDialogComponent {
  confirmBtnText = 'Save';
  cancelBtnText = 'Cancel';
  checkboxValue = false;

  constructor(
    private modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) public data: any
  ) {
    if (this.data.confirmBtnText) this.confirmBtnText = this.data.confirmBtnText;
    if (this.data.cancelBtnText) this.cancelBtnText = this.data.cancelBtnText;
  }

  onConfirm(): void {
    if (this.data.checkbox) {
      this.modalRef.close({ checkboxValue: this.checkboxValue });
    } else {
      this.modalRef.close(true);
    }
  }

  onCancel(): void {
    this.modalRef.close(false);
  }
}
