import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrgFieldService } from '../../org-field.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-variant-wizard',
  templateUrl: './variant-wizard.component.html',
  styleUrls: ['./variant-wizard.component.scss'],
})
export class VariantWizardComponent implements OnInit {
  formType: 'add' | 'edit' = 'add';
  variantId: number | null = null;
  loading = false;
  saving = false;
  currentStep = 0;

  sapSystemList: any[] = [];
  selectedSystemId: number | null = null;

  form!: FormGroup;

  // Org names for selection
  orgNamesData: any[] = [];
  orgNamesLoading = false;
  selectedOrgNames: any[] = [];
  checkedIds = new Set<number>();
  allChecked = false;
  indeterminate = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orgFieldService: OrgFieldService,
    private notificationService: NotificationService,
  ) {
    const state = history.state;
    if (state?.formType) {
      this.formType = state.formType;
    }

    this.form = new FormGroup({
      variantName: new FormControl('', [Validators.required, Validators.minLength(2)]),
      sapSystem: new FormControl('', Validators.required),
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.variantId = +params['id'];
        this.formType = 'edit';
      }
    });

    this.loadSapSystems();

    if (this.formType === 'edit' && this.variantId) {
      this.loadVariantForEdit();
    }
  }

  get pageTitle(): string {
    return this.formType === 'edit' ? 'Edit Org Names Variant' : 'Add Org Names Variant';
  }

  private loadSapSystems(): void {
    this.orgFieldService.getSAPSystems().subscribe({
      next: (res) => { this.sapSystemList = res.data || []; },
      error: () => { this.sapSystemList = []; },
    });
  }

  private loadVariantForEdit(): void {
    this.loading = true;
    this.orgFieldService.getOrgVariant(this.variantId!).subscribe({
      next: (res) => {
        this.form.patchValue({
          variantName: res.data.name,
          sapSystem: res.data.systemId,
        });
        this.selectedSystemId = res.data.systemId;
        this.selectedOrgNames = res.data.orgNames || [];
        this.checkedIds = new Set(this.selectedOrgNames.map((o: any) => o.id));

        this.form.get('variantName')?.disable();
        this.form.get('sapSystem')?.disable();

        this.loadOrgNames();
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load variant');
        this.loading = false;
        this.navigateBack();
      },
    });
  }

  onSystemChange(): void {
    this.selectedSystemId = this.form.get('sapSystem')?.value;
    this.checkedIds.clear();
    this.selectedOrgNames = [];
    this.orgNamesData = [];
    this.updateCheckAllState();
    if (this.selectedSystemId) {
      this.loadOrgNames();
    }
  }

  private loadOrgNames(): void {
    if (!this.selectedSystemId) return;
    this.orgNamesLoading = true;
    this.orgFieldService.getOrgNamesBySystem(this.selectedSystemId).subscribe({
      next: (res) => {
        this.orgNamesData = res.data?.rows || [];
        this.orgNamesLoading = false;
        this.updateCheckAllState();
      },
      error: () => {
        this.orgNamesData = [];
        this.orgNamesLoading = false;
        this.notificationService.error('Failed to load organization names');
      },
    });
  }

  onItemChecked(id: number, checked: boolean): void {
    if (checked) {
      this.checkedIds.add(id);
    } else {
      this.checkedIds.delete(id);
    }
    this.selectedOrgNames = this.orgNamesData.filter(r => this.checkedIds.has(r.id));
    this.updateCheckAllState();
  }

  onAllChecked(checked: boolean): void {
    this.orgNamesData.forEach(r => {
      if (checked) { this.checkedIds.add(r.id); } else { this.checkedIds.delete(r.id); }
    });
    this.selectedOrgNames = checked ? [...this.orgNamesData] : [];
    this.updateCheckAllState();
  }

  private updateCheckAllState(): void {
    const total = this.orgNamesData.length;
    const checked = this.orgNamesData.filter(r => this.checkedIds.has(r.id)).length;
    this.allChecked = total > 0 && checked === total;
    this.indeterminate = checked > 0 && checked < total;
  }

  canGoNext(): boolean {
    return !this.form.get('variantName')?.invalid && !this.form.get('sapSystem')?.invalid;
  }

  canSave(): boolean {
    return this.checkedIds.size > 0 && !this.saving;
  }

  onSave(): void {
    if (!this.canSave()) {
      if (this.checkedIds.size === 0) {
        this.notificationService.error('Please select at least one organization');
      }
      return;
    }

    this.saving = true;
    const payload = {
      systemId: this.selectedSystemId || this.form.get('sapSystem')?.value,
      description: this.form.getRawValue().variantName,
      orgNameIds: Array.from(this.checkedIds),
      favorateId: this.formType === 'edit' ? this.variantId : null,
    };

    this.orgFieldService.saveOrgVariant(payload).subscribe({
      next: () => {
        const msg = this.formType === 'add' ? 'Variant created successfully' : 'Variant updated successfully';
        this.notificationService.success(msg);
        this.navigateBack();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Failed to save variant');
        this.saving = false;
      },
    });
  }

  navigateBack(): void {
    this.router.navigate(['/acm/master-data/org-field/org-names-variant']);
  }
}
