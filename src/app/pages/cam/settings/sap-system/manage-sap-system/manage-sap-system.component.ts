import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CamService } from '../../../cam.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ApiResponse } from '../../../../../core/models/api-response';

@Component({
  standalone: false,
  selector: 'app-manage-sap-system',
  templateUrl: './manage-sap-system.component.html',
})
export class ManageSapSystemComponent {
  formType: string;
  form: FormGroup;
  selected: any;
  riskVariantList: any[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modalRef: NzModalRef,
    private fb: FormBuilder,
    private camService: CamService,
    private notificationService: NotificationService,
  ) {
    this.formType = this.dialogData.formType;
    this.selected = this.dialogData.rowData;

    switch (this.formType) {
      case 'Set Password Rule':
        this.form = this.fb.group({
          length: [null, [Validators.required]],
          minLowerChar: [null, [Validators.required]],
          minUpperChar: [null, [Validators.required]],
          minNumber: [null, [Validators.required]],
          minSpecialChar: [null, [Validators.required]],
        });
        this.loadPasswordRule();
        break;

      case 'Set System Order':
        this.form = this.fb.group({
          order: [null, [Validators.required]],
        });
        this.loadOrder();
        break;

      case 'Set Risk Variant':
        this.form = this.fb.group({
          variant: [null, [Validators.required]],
        });
        this.loadRiskVariant();
        break;

      default:
        this.form = this.fb.group({});
    }
  }

  save(): void {
    Object.values(this.form.controls).forEach(c => {
      c.markAsDirty();
      c.updateValueAndValidity();
    });

    if (!this.form.valid) return;

    const sapName = this.selected.description;

    switch (this.formType) {
      case 'Set Password Rule':
        this.camService.savePasswordRule({
          sapName,
          len: this.form.value.length,
          minChar: this.form.value.minLowerChar,
          minUpper: this.form.value.minUpperChar,
          minNum: this.form.value.minNumber,
          minSpecialChar: this.form.value.minSpecialChar,
        }).subscribe({
          next: (resp: ApiResponse) => {
            if (resp.success) this.modalRef.close(resp.message);
          },
          error: ({ error }) => this.notificationService.error(error?.message || 'Save failed'),
        });
        break;

      case 'Set System Order':
        this.camService.saveSystemOrder({
          sapName,
          systemOrder: this.form.value.order,
        }).subscribe({
          next: (resp: ApiResponse) => {
            if (resp.success) this.modalRef.close(resp.message);
          },
          error: ({ error }) => this.notificationService.error(error?.message || 'Save failed'),
        });
        break;

      case 'Set Risk Variant':
        this.camService.saveRiskVariant({
          sapName,
          favRisks: this.form.value.variant,
        }).subscribe({
          next: (resp: ApiResponse) => {
            if (resp.success) this.modalRef.close(resp.message);
          },
          error: ({ error }) => this.notificationService.error(error?.message || 'Save failed'),
        });
        break;
    }
  }

  private loadPasswordRule(): void {
    this.camService.getPasswordRule(this.selected.description).subscribe((resp: ApiResponse) => {
      if (resp.success && resp.data) {
        this.form.patchValue({
          length: resp.data.len,
          minLowerChar: resp.data.minChar,
          minUpperChar: resp.data.minUpper,
          minNumber: resp.data.minNum,
          minSpecialChar: resp.data.minSpecialChar,
        });
      }
    });
  }

  private loadOrder(): void {
    this.camService.getSystemOrder(this.selected.description).subscribe((resp: ApiResponse) => {
      if (resp.success && resp.data) {
        this.form.patchValue({ order: resp.data.systemOrder });
      }
    });
  }

  private loadRiskVariant(): void {
    this.camService.getRiskVariant(this.selected.description).subscribe((resp: ApiResponse) => {
      if (resp.success && resp.data) {
        this.riskVariantList = resp.data.variants || [];
        this.form.patchValue({ variant: resp.data.selectedVariant?.id || null });
      }
    });
  }
}
