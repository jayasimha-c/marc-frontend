import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { VariantService } from '../variant.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';

const DEFAULT_SYSTYPE = 'SAP';
const SYSTYPE_DATA_FIELD: Record<string, string> = {
  SAP: 'saps',
  SUCCESS_FACTORS: 'sfSys',
  BOBJ: 'bobjSys',
  HANA_DATABASE: 'hanaSys',
};

@Component({
  standalone: false,
  selector: 'app-variant-rules',
  templateUrl: './variant-rules.component.html',
  styleUrls: ['./variant-rules.component.scss'],
})
export class VariantRulesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = true;
  showEditor = false;
  searchTerm = '';

  form!: FormGroup;

  systemTypes: string[] = [];
  systemsList: any[] = [];
  favorites: any[] = [];
  selectedFavoriteId: number | null = null;
  selectedFavoriteName = '';
  favouriteApiRespData: any = {};

  // All rules from API (unfiltered)
  private allCatalogueRules: any[] = [];
  // Rules currently selected for this variant
  selectedRules: any[] = [];
  // Checkbox selection in catalogue
  checkedCatalogue = new Set<number>();
  catalogueCheckAll = false;
  catalogueIndeterminate = false;

  // Display data
  catalogueData: any[] = [];
  selectedRow: any = null;

  // Listing table
  listingColumns = [
    { field: 'description', header: 'Name' },
    { field: 'systemType', header: 'System Type', width: '140px' },
  ];
  selectedVariant: any = null;

  constructor(
    private fb: FormBuilder,
    private variantService: VariantService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {
    this.form = this.fb.group({
      description: [''],
      systemType: [DEFAULT_SYSTYPE],
      systemId: [''],
    });
  }

  ngOnInit(): void {
    this.variantService.variantRuleRequiredInfo().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.favouriteApiRespData = res.data;
        this.systemTypes = res.data.sysTypes || [];
        this.favorites = res.data.favorites || [];
        this.systemsList = this.favouriteApiRespData[SYSTYPE_DATA_FIELD[DEFAULT_SYSTYPE]] || [];
        this.loading = false;
      },
      error: (err: any) => {
        this.notificationService.error(err?.error?.message || 'Failed to load data');
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Listing Actions ──────────────────────────────────────

  onAdd(): void {
    this.form.reset();
    this.form.get('description')?.enable();
    this.form.get('systemType')?.enable();
    this.form.get('systemId')?.enable();
    this.form.patchValue({ systemType: DEFAULT_SYSTYPE, systemId: '', description: '' });
    this.selectedRules = [];
    this.checkedCatalogue.clear();
    this.searchTerm = '';
    this.selectedFavoriteId = null;
    this.selectedFavoriteName = '';
    this.showEditor = true;
    this.loadCatalogueRules();
  }

  onEdit(): void {
    if (!this.selectedVariant) {
      this.notificationService.error('Please select a row');
      return;
    }
    this.editVariant(this.selectedVariant);
  }

  onDelete(): void {
    if (!this.selectedVariant) {
      this.notificationService.error('Please select a row');
      return;
    }
    this.deleteFavorite(this.selectedVariant);
  }

  onRowClick(row: any): void {
    this.selectedVariant = row;
  }

  // ── Editor ───────────────────────────────────────────────

  editVariant(variant: any): void {
    this.selectedFavoriteId = variant.id;
    this.selectedFavoriteName = variant.description;
    this.showEditor = true;
    this.checkedCatalogue.clear();
    this.searchTerm = '';
    this.loading = true;

    this.variantService.getVariantRules(variant.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.systemsList = this.favouriteApiRespData[SYSTYPE_DATA_FIELD[res.data.systemType]] || [];
        this.form.patchValue({
          description: res.data.description,
          systemType: res.data.systemType,
          systemId: res.data.systemId,
        });
        this.form.get('description')?.disable();
        this.form.get('systemType')?.disable();
        this.form.get('systemId')?.disable();

        this.selectedRules = res.data.rules || [];
        this.loadCatalogueRules();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  navigateBack(): void {
    this.showEditor = false;
    this.selectedFavoriteId = null;
    this.selectedFavoriteName = '';
    this.form.reset();
    this.selectedRules = [];
    this.checkedCatalogue.clear();
    this.searchTerm = '';
  }

  isEditMode(): boolean {
    return this.selectedFavoriteId != null;
  }

  // ── Catalogue ────────────────────────────────────────────

  private loadCatalogueRules(): void {
    const systemType = this.form.get('systemType')?.value || DEFAULT_SYSTYPE;
    this.variantService.variantGetRules(systemType).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const apiRules = res.data?.rows || [];
        const apiIds = new Set(apiRules.map((r: any) => r.id));
        const missingSelected = this.selectedRules.filter(r => !apiIds.has(r.id));
        this.allCatalogueRules = [...apiRules, ...missingSelected];
        this.refreshCatalogueData();
      },
      error: (err: any) => {
        this.notificationService.error(err?.error?.message || 'Failed to load rules');
      },
    });
  }

  onSearchInput(): void {
    this.refreshCatalogueData();
  }

  private refreshCatalogueData(): void {
    const selectedIds = new Set(this.selectedRules.map(r => r.id));
    let filtered = this.allCatalogueRules.filter(r => !selectedIds.has(r.id));

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        (r.ruleName || '').toLowerCase().includes(term) ||
        (r.ruleDescription || '').toLowerCase().includes(term)
      );
    }

    this.catalogueData = filtered;
    this.checkedCatalogue.clear();
    this.catalogueCheckAll = false;
    this.catalogueIndeterminate = false;
  }

  // ── Catalogue Checkbox ───────────────────────────────────

  onCatalogueItemChecked(id: number, checked: boolean): void {
    if (checked) {
      this.checkedCatalogue.add(id);
    } else {
      this.checkedCatalogue.delete(id);
    }
    this.updateCatalogueCheckState();
  }

  onCatalogueAllChecked(checked: boolean): void {
    this.catalogueData.forEach(r => {
      if (checked) this.checkedCatalogue.add(r.id);
      else this.checkedCatalogue.delete(r.id);
    });
    this.updateCatalogueCheckState();
  }

  private updateCatalogueCheckState(): void {
    const total = this.catalogueData.length;
    const checked = this.catalogueData.filter(r => this.checkedCatalogue.has(r.id)).length;
    this.catalogueCheckAll = total > 0 && checked === total;
    this.catalogueIndeterminate = checked > 0 && checked < total;
  }

  // ── Transfer Actions ─────────────────────────────────────

  onAddSelected(): void {
    const toAdd = this.catalogueData.filter(r => this.checkedCatalogue.has(r.id));
    if (!toAdd.length) return;
    this.selectedRules = [...this.selectedRules, ...toAdd];
    this.refreshCatalogueData();
  }

  onRemoveSelected(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a rule to remove.');
      return;
    }
    this.selectedRules = this.selectedRules.filter(r => r.id !== this.selectedRow.id);
    this.selectedRow = null;
    this.refreshCatalogueData();
  }

  onSelectedRowClick(row: any): void {
    this.selectedRow = row;
  }

  // ── System Type / System ─────────────────────────────────

  onSelectSystemType(type: string): void {
    this.systemsList = this.favouriteApiRespData[SYSTYPE_DATA_FIELD[type]] || [];
    this.form.patchValue({ systemId: '' });
    this.selectedRules = [];
    this.loadCatalogueRules();
  }

  onSystemSelected(): void {
    this.loadCatalogueRules();
  }

  // ── Save ─────────────────────────────────────────────────

  onSave(): void {
    const rawValue = this.form.getRawValue();
    const payload: any = {
      systemId: rawValue.systemId,
      description: rawValue.description,
      sysType: rawValue.systemType,
      rulesId: this.selectedRules.filter(o => o.id != null).map(o => o.id),
    };

    if (this.selectedFavoriteId) {
      payload.favorateId = this.selectedFavoriteId;
    }

    this.variantService.saveOrUpdateVariantRule(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.success || res.data) {
          this.favorites = res.data.favorates || res.data;
          this.notificationService.success(
            this.selectedFavoriteId ? 'Successfully Updated Variant!' : 'Successfully Created Variant!'
          );
          this.showEditor = false;
          this.selectedFavoriteId = null;
          this.selectedFavoriteName = '';
        }
      },
      error: (err: any) => {
        this.notificationService.error(err?.error?.message || 'Save failed');
      },
    });
  }

  // ── Delete ───────────────────────────────────────────────

  deleteFavorite(item: any): void {
    this.confirmDialog.confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this variant?',
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.variantService.deleteVariantRules(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.favorites = res.data;
            this.notificationService.success('Successfully deleted Variant!');
            this.selectedVariant = null;
          }
        },
        error: (err: any) => {
          this.notificationService.error(err?.error?.message || 'Delete failed');
        },
      });
    });
  }
}
