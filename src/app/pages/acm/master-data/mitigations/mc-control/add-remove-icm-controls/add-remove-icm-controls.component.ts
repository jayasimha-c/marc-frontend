import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { MitigationsService } from '../../mitigations.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-remove-icm-controls',
  templateUrl: './add-remove-icm-controls.component.html',
})
export class AddRemoveIcmControlsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  mitigationId = 0;
  loading = true;

  availableControls: any[] = [];
  selectedControls: any[] = [];

  checkedAvailable = new Set<number>();
  availableCheckAll = false;
  availableIndeterminate = false;

  checkedSelected = new Set<number>();
  selectedCheckAll = false;
  selectedIndeterminate = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private mitigationsService: MitigationsService,
    private notificationService: NotificationService,
    public modalRef: NzModalRef,
  ) {}

  ngOnInit(): void {
    this.mitigationId = this.dialogData.mitigationId;
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    // Load selected first
    this.mitigationsService.getSelectedIcmControls({
      mitigationId: this.mitigationId,
      selectedIcmControlIds: [],
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.selectedControls = (res.data?.rows || []).map((c: any) => ({
          id: c.id,
          name: c.controlName || c.name,
          description: c.controlDesc || c.description,
        }));
        this.loadAvailable();
      },
      error: () => { this.loading = false; },
    });
  }

  private loadAvailable(): void {
    const selectedIds = this.selectedControls.map(c => c.id);
    this.mitigationsService.getAvailableIcmControls(
      { mitigationId: this.mitigationId, selectedIcmControlIds: selectedIds },
      0, 200, 1, '', null
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.availableControls = res.data?.rows || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  // ── Checkbox ─────────────────────────────────────────────

  onAvailableItemChecked(id: number, checked: boolean): void {
    checked ? this.checkedAvailable.add(id) : this.checkedAvailable.delete(id);
    this.updateAvailableCheckState();
  }

  onAvailableAllChecked(checked: boolean): void {
    this.availableControls.forEach(c => checked ? this.checkedAvailable.add(c.id) : this.checkedAvailable.delete(c.id));
    this.updateAvailableCheckState();
  }

  private updateAvailableCheckState(): void {
    const total = this.availableControls.length;
    const count = this.availableControls.filter(c => this.checkedAvailable.has(c.id)).length;
    this.availableCheckAll = total > 0 && count === total;
    this.availableIndeterminate = count > 0 && count < total;
  }

  onSelectedItemChecked(id: number, checked: boolean): void {
    checked ? this.checkedSelected.add(id) : this.checkedSelected.delete(id);
    this.updateSelectedCheckState();
  }

  onSelectedAllChecked(checked: boolean): void {
    this.selectedControls.forEach(c => checked ? this.checkedSelected.add(c.id) : this.checkedSelected.delete(c.id));
    this.updateSelectedCheckState();
  }

  private updateSelectedCheckState(): void {
    const total = this.selectedControls.length;
    const count = this.selectedControls.filter(c => this.checkedSelected.has(c.id)).length;
    this.selectedCheckAll = total > 0 && count === total;
    this.selectedIndeterminate = count > 0 && count < total;
  }

  // ── Transfer ─────────────────────────────────────────────

  addSelected(): void {
    const toAdd = this.availableControls.filter(c => this.checkedAvailable.has(c.id));
    this.selectedControls = [...this.selectedControls, ...toAdd];
    const selectedIds = new Set(this.selectedControls.map(c => c.id));
    this.availableControls = this.availableControls.filter(c => !selectedIds.has(c.id));
    this.checkedAvailable.clear();
    this.updateAvailableCheckState();
  }

  removeSelected(): void {
    const toRemove = this.selectedControls.filter(c => this.checkedSelected.has(c.id));
    this.selectedControls = this.selectedControls.filter(c => !this.checkedSelected.has(c.id));
    this.availableControls = [...this.availableControls, ...toRemove];
    this.checkedSelected.clear();
    this.updateSelectedCheckState();
  }

  // ── Save ─────────────────────────────────────────────────

  save(): void {
    this.mitigationsService.saveSelectedIcmControls({
      mitigationId: this.mitigationId,
      selectedIcmControlIds: this.selectedControls.map(c => c.id),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.notificationService.success(res.message || 'ICM Controls saved');
        this.modalRef.close(true);
      },
      error: (err: any) => this.notificationService.error(err?.error?.message || 'Save failed'),
    });
  }
}
