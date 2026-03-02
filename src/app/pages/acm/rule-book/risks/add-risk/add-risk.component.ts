import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { RisksService } from '../risks.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-risk',
  templateUrl: './add-risk.component.html',
})
export class AddRiskComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form!: FormGroup;

  formType = 'Add';
  risk: any = null;
  riskTypes: any[] = [];
  businessProcesses: any[] = [];
  businessSubProcesses: any[] = [];
  systemTypeList: string[] = [];
  riskLevelsList: string[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) public data: any,
    private fb: FormBuilder,
    private risksService: RisksService,
    private notificationService: NotificationService,
    public modalRef: NzModalRef,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      systemType: [null, [Validators.required]],
      riskLevel: [null, [Validators.required]],
      riskDescription: ['', [Validators.required]],
      riskTypeId: [null, [Validators.required]],
      businessProcessId: [null, [Validators.required]],
      crossSystem: [false],
      subProcId: [null, [Validators.required]],
      detailDesc: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.formType = this.data.formType;
    this.risk = this.data.risk;
    this.businessProcesses = this.data.selectedOptions?.businessProcesses || [];
    this.riskTypes = this.data.selectedOptions?.riskTypes || [];
    this.riskLevelsList = this.data.selectedOptions?.riskLevels || [];

    if (this.formType === 'Update' && this.risk) {
      this.updateForm();
    } else {
      this.form.get('subProcId')?.disable();
      this.setDefaults();
    }
    this.loadSystemTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBusinessProcessChange(bpId: number): void {
    this.form.get('subProcId')?.enable();
    const bp = this.businessProcesses.find(b => b.id === bpId);
    this.businessSubProcesses = bp?.subProcesses || [];
  }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    const payload = this.form.getRawValue();

    if (this.formType === 'Update') {
      payload.id = this.risk.id;
      this.risksService.riskEdit(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.notificationService.show(res); this.modalRef.close(true); },
        error: (err: any) => this.notificationService.error(this.formatError(err.error)),
      });
    } else {
      this.risksService.riskSave(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.notificationService.show(res); this.modalRef.close(true); },
        error: (err: any) => this.notificationService.error(this.formatError(err.error)),
      });
    }
  }

  private updateForm(): void {
    this.businessSubProcesses = this.risk.businessProcess?.subProcesses || [];
    this.form.patchValue({
      name: this.risk.name,
      riskDescription: this.risk.riskDescription,
      riskTypeId: this.risk.riskTypeId,
      businessProcessId: this.risk.businessProcessId,
      crossSystem: this.risk.crossSystem,
      subProcId: this.risk.subProcId,
      detailDesc: this.risk.detailDesc,
      systemType: this.risk.systemType,
      riskLevel: this.risk.riskLevel,
    });
  }

  private setDefaults(): void {
    const sensitive = this.riskTypes.find(rt => rt.name?.toLowerCase() === 'sensitive');
    if (sensitive) this.form.get('riskTypeId')?.setValue(sensitive.id);
    this.form.get('systemType')?.setValue('SAP');
    const medium = this.riskLevelsList.find(rl => rl.toLowerCase() === 'medium');
    if (medium) this.form.get('riskLevel')?.setValue(medium);
  }

  private loadSystemTypes(): void {
    this.risksService.getSystemTypes().pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.systemTypeList = res.data || [];
    });
  }

  private formatError(error: any): string {
    let message = error?.message || 'An error occurred';
    if (error?.data && typeof error.data === 'object') {
      const details = Object.entries(error.data).map(([k, v]) => `${k}: ${v}`).join(', ');
      if (details) message += ` — ${details}`;
    }
    return message;
  }
}
