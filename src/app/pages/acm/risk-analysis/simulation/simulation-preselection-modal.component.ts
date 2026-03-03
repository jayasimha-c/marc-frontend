import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RiskAnalysisOnlineService } from '../risk-analysis-online.service';
import { FormValidationService } from '../../../../core/services/form-validation.service';

@Component({
  standalone: false,
  selector: 'app-simulation-pre-selection',
  templateUrl: './simulation-preselection-modal.component.html',
})
export class SimulationPreSelectionComponent implements OnInit {
  sapSystemList: any[] = [];
  variants: any[] = [{ id: 0, description: 'No Data' }];
  checkboxOptions = [1, 2, 3, 4, 5, 6];

  form!: FormGroup;

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
    private apiService: RiskAnalysisOnlineService,
    private fb: FormBuilder,
    private formValidation: FormValidationService,
    public modal: NzModalRef,
  ) {
    this.form = this.fb.group({
      sapSystemId: [null, Validators.required],
      variants: [[], Validators.required],
      excludeInactive: [true],
      excludeUsersWithoutAnyRoles: [true],
      excludeMitigatedUsers: [true],
      performAnalysisonOrgFields: [true],
      addRemoveUserExistingRolesSelection: [false],
      includeReferenceUser: [false],
    });
  }

  ngOnInit(): void {
    this.getDropDownData();
    this.form.get('variants')?.disable();
  }

  getDropDownData(): void {
    this.apiService.simulationsLoadSelection('online').subscribe((resp: any) => {
      if (resp.data) {
        this.sapSystemList = Object.entries(resp.data.sapSystems || {});
      }
    });
  }

  getVariantsList(): void {
    const sapSystemId = this.form.get('sapSystemId')?.value;
    if (!sapSystemId) return;
    this.apiService.findFavorites(sapSystemId, true).subscribe((resp: any) => {
      this.variants = resp.data || [];
      this.form.get('variants')?.enable();
    });
  }

  next(): void {
    this.formValidation.markGroupDirty(this.form);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const data = this.form.getRawValue();
    const favorites = data.variants ? data.variants.join() : '';

    this.apiService.saveSimulationsPreSelection({
      sapSystemId: data.sapSystemId,
      favorites,
      excludeInactive: data.excludeInactive,
      excludeUnassigned: data.excludeUsersWithoutAnyRoles,
      includeMitigations: data.excludeMitigatedUsers,
      orgFieldCheck: data.performAnalysisonOrgFields,
      rolesStep: data.addRemoveUserExistingRolesSelection,
      referenceUser: data.includeReferenceUser,
    }, 'online').subscribe({
      next: (apiResponse) => {
        this.modal.close({ preSelection: apiResponse.data });
      },
      error: (err) => {
        this.formValidation.validateAllFields(this.form, err);
      },
    });
  }
}
