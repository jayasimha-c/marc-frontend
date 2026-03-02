import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RulesService } from '../rules.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-rule',
  templateUrl: './add-rule.component.html',
})
export class AddRuleComponent implements OnInit {
  form!: FormGroup;
  formType = '';
  selectedRow: any;
  ruleTypes: any[] = [];
  businessProcess: any[] = [];
  businessSubProcess: any[] = [];
  systemTypes: string[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) private dialogData: any,
    private fb: FormBuilder,
    private rulesService: RulesService,
    private notificationService: NotificationService,
    private modalRef: NzModalRef,
  ) {}

  ngOnInit(): void {
    this.formType = this.dialogData?.formType;
    this.ruleTypes = this.dialogData?.selectedOptions?.ruleTypes || [];
    this.businessProcess = this.dialogData?.selectedOptions?.businessProcesses || [];
    this.systemTypes = this.dialogData?.systemTypes || [];
    this.selectedRow = this.dialogData?.selectedRow;

    if (this.formType === 'Update' || this.formType === 'Copy') {
      this.initEditForm();
    } else {
      this.initAddForm();
    }
  }

  onBusinessProcessChange(processId: any): void {
    const bp = this.businessProcess.find(p => p.id === processId);
    this.businessSubProcess = bp?.subProcesses || [];
    this.form.get('subProcId')?.enable();
  }

  save(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => { c.markAsTouched(); c.updateValueAndValidity(); });
      return;
    }
    if (this.formType === 'Update') {
      this.rulesService.ruleEdit({ id: this.selectedRow.id, ...this.form.value }).subscribe({
        next: (res: any) => { this.notificationService.show(res); this.modalRef.close(true); },
        error: (err: any) => { this.notificationService.error(this.formatError(err.error)); },
      });
    } else if (this.formType === 'Copy') {
      this.rulesService.ruleSave(this.form.value, true, this.selectedRow.id).subscribe({
        next: (res: any) => {
          if (res.success) { this.notificationService.success(res.message); this.modalRef.close(true); }
        },
        error: (err: any) => { this.notificationService.error(this.formatError(err.error)); },
      });
    } else {
      this.rulesService.ruleSave(this.form.value).subscribe({
        next: (res: any) => { this.notificationService.show(res); this.modalRef.close(true); },
        error: (err: any) => { this.notificationService.error(this.formatError(err.error)); },
      });
    }
  }

  close(): void {
    this.modalRef.close();
  }

  private initAddForm(): void {
    this.form = this.fb.group({
      ruleName: ['', Validators.required],
      ruleDescription: ['', Validators.required],
      ruleTypeId: ['', Validators.required],
      businessProcessId: ['', Validators.required],
      subProcId: [{ value: '', disabled: true }, Validators.required],
      systemType: ['', Validators.required],
      gdpr: [false],
    });
  }

  private initEditForm(): void {
    this.form = this.fb.group({
      ruleName: [this.selectedRow?.ruleName, Validators.required],
      ruleDescription: [this.selectedRow?.ruleDescription, Validators.required],
      ruleTypeId: [this.selectedRow?.ruleType?.id, Validators.required],
      businessProcessId: [this.selectedRow?.businessProcess?.id, Validators.required],
      subProcId: [this.selectedRow?.subProc?.id, Validators.required],
      systemType: [this.selectedRow?.systemType],
      gdpr: [this.selectedRow?.gdpr],
    });
    if (this.selectedRow?.businessProcess?.id) {
      this.onBusinessProcessChange(this.selectedRow.businessProcess.id);
    }
  }

  private formatError(error: any): string {
    let message = error?.message || 'An error occurred';
    if (error?.data && typeof error.data === 'object') {
      const details = Object.entries(error.data).map(([k, v]) => `${k}: ${v}`).join(', ');
      if (details) message += ` - ${details}`;
    }
    return message;
  }
}
