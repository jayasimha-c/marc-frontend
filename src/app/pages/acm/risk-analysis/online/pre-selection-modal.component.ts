import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Subscription } from 'rxjs';
import { RiskAnalysisOnlineService } from '../risk-analysis-online.service';

@Component({
  standalone: false,
  selector: 'app-pre-selection-modal',
  templateUrl: './pre-selection-modal.component.html',
})
export class PreSelectionModalComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  form!: FormGroup;

  sapSystemList: [string, string][] = [];
  analysisTargetList: [string, string][] = [];
  analysisTypeList: [string, string][] = [];
  variantsList: any[] = [{ id: 0, description: 'No Data' }];

  constructor(
    private apiService: RiskAnalysisOnlineService,
    private fb: FormBuilder,
    public modal: NzModalRef,
  ) {
    this.form = this.fb.group({
      sapSystemId: [null, Validators.required],
      analysisTarget: ['User', Validators.required],
      analysisType: ['Rules', Validators.required],
      variants: [[], Validators.required],
      excludeInactive: [true],
      excludeUnassigned: [true],
      includeMitigations: [true],
      orgFieldCheck: [true],
    });
  }

  ngOnInit(): void {
    this.getDropDownData();
    this.form.get('variants')!.disable();

    this.subscriptions.add(
      this.form.get('sapSystemId')!.valueChanges.subscribe(() => this.getVariantsList())
    );
    this.subscriptions.add(
      this.form.get('analysisType')!.valueChanges.subscribe(() => this.getVariantsList())
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getDropDownData(): void {
    this.apiService.loadSelection().subscribe((resp) => {
      if (resp.success && resp.data) {
        this.sapSystemList = Object.entries(resp.data.sapSystems) as [string, string][];
        this.analysisTargetList = Object.entries(resp.data.targetTypes) as [string, string][];
        this.analysisTypeList = Object.entries(resp.data.analysisTypes) as [string, string][];
      }
    });
  }

  next(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const data = this.form.getRawValue();
    if (data.variants?.length > 0) {
      data['favorites'] = data.variants.join();
    } else {
      data['favorites'] = '';
    }
    delete data['variants'];

    this.apiService.savePreselection(data).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.modal.close({ preSelection: resp.data });
        }
      },
    });
  }

  getVariantsList(): void {
    let analysisType = this.form.get('analysisType')!.value;
    const isRisk = analysisType === 'Risks';

    if (this.form.get('sapSystemId')!.value) {
      this.apiService.findFavorites(this.form.get('sapSystemId')!.value, isRisk).subscribe((resp) => {
        if (resp.success) {
          this.variantsList = resp.data || [];
          this.form.get('variants')!.enable();
        }
      });
    }
  }
}
