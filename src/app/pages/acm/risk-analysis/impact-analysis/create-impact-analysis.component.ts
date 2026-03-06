import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { RiskAnalysisOnlineService } from '../risk-analysis-online.service';

@Component({
  standalone: false,
  selector: 'app-create-impact-analysis',
  template: `
    <form nz-form [formGroup]="form" nzLayout="vertical">
      <nz-row [nzGutter]="16">
        <div nz-col nzSpan="12">
          <nz-form-item>
            <nz-form-label nzRequired>Roles Source</nz-form-label>
            <nz-form-control nzErrorTip="Roles source is required">
              <nz-select formControlName="rolesSource" nzPlaceHolder="Select Roles Source"
                         nzShowSearch (ngModelChange)="onRolesSourceChange($event)">
                <nz-option *ngFor="let s of sapSystems" [nzValue]="s.id" [nzLabel]="s.destinationName"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>
        <div nz-col nzSpan="12">
          <nz-form-item>
            <nz-form-label nzRequired>Users Source</nz-form-label>
            <nz-form-control nzErrorTip="Users source is required">
              <nz-select formControlName="usersSource" nzPlaceHolder="Select Users Source" nzShowSearch>
                <nz-option *ngFor="let s of sapSystems" [nzValue]="s.id" [nzLabel]="s.destinationName"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>
      </nz-row>

      <nz-form-item>
        <nz-form-label nzRequired>Profile Name</nz-form-label>
        <nz-form-control nzErrorTip="Name is required">
          <input nz-input formControlName="name" placeholder="Enter profile name" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label nzRequired>Description</nz-form-label>
        <nz-form-control nzErrorTip="Description is required">
          <textarea nz-input formControlName="description" placeholder="Enter description" [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label nzRequired>Analysis Type</nz-form-label>
        <nz-form-control nzErrorTip="Analysis type is required">
          <nz-select formControlName="analysisType" nzPlaceHolder="Select Analysis Type">
            <nz-option nzValue="risk" nzLabel="Risk"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label nzRequired>Variants</nz-form-label>
        <nz-form-control nzErrorTip="Variant is required">
          <nz-select formControlName="variants" nzPlaceHolder="Select variant" nzShowSearch>
            <nz-option *ngFor="let v of variantsList" [nzValue]="v.id" [nzLabel]="v.description"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-control>
          <label nz-checkbox formControlName="excludeMitigatedUsers">Exclude Mitigated Users</label>
        </nz-form-control>
      </nz-form-item>

      <div style="text-align: right; margin-top: 16px">
        <button nz-button nzType="default" (click)="modalRef.close()" style="margin-right: 8px">Cancel</button>
        <button nz-button nzType="primary" [nzLoading]="submitting" (click)="submit()">Save And Next</button>
      </div>
    </form>
  `,
})
export class CreateImpactAnalysisComponent implements OnInit {
  form!: FormGroup;
  sapSystems: any[] = [];
  variantsList: any[] = [];
  submitting = false;

  constructor(
    public modalRef: NzModalRef,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private riskAnalysisService: RiskAnalysisOnlineService,
  ) {
    this.form = this.fb.group({
      rolesSource: [null, [Validators.required]],
      usersSource: [null, [Validators.required]],
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      analysisType: [null, [Validators.required]],
      variants: [null, [Validators.required]],
      excludeMitigatedUsers: [true],
    });
  }

  ngOnInit(): void {
    this.riskAnalysisService.offlineSystems().subscribe({
      next: (resp) => { this.sapSystems = resp.data || []; },
    });
  }

  onRolesSourceChange(systemId: number): void {
    if (!systemId) return;
    this.form.get('variants')!.setValue(null);
    this.riskAnalysisService.findFavorites(systemId, true).subscribe({
      next: (resp) => { this.variantsList = resp.data || []; },
    });
  }

  submit(): void {
    Object.values(this.form.controls).forEach((c) => { c.markAsDirty(); c.updateValueAndValidity(); });
    if (!this.form.valid) {
      this.notificationService.error('Please fill all required fields');
      return;
    }

    this.submitting = true;
    const v = this.form.getRawValue();
    this.riskAnalysisService.impactAnalysisStep1Submit({
      sapSystemId: v.rolesSource,
      secondarySystemId: v.usersSource,
      name: v.name,
      description: v.description,
      analysisType: (v.analysisType as string).toUpperCase(),
      favorites: String(v.variants),
      mitigationIncluded: v.excludeMitigatedUsers,
    }).subscribe({
      next: (resp) => {
        this.submitting = false;
        this.notificationService.show(resp);
        if (resp.success) {
          this.modalRef.close({ created: true, profile: resp.data });
        }
      },
      error: (err) => {
        this.submitting = false;
        this.notificationService.show(err.error);
      },
    });
  }
}
