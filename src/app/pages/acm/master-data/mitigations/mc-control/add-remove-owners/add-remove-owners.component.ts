import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { Subject, forkJoin, of, takeUntil, catchError } from 'rxjs';
import { MitigationsService } from '../../mitigations.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-remove-owners',
  templateUrl: './add-remove-owners.component.html',
})
export class AddRemoveOwnersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  mitigationId = 0;
  loading = true;

  availableOwners: any[] = [];
  selectedOwners: any[] = [];

  checkedAvailable = new Set<string>();
  availableCheckAll = false;
  availableIndeterminate = false;

  checkedSelected = new Set<string>();
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
    forkJoin([
      this.mitigationsService.getAvailableOwners({ mitigationId: this.mitigationId, selectedIds: [] }).pipe(catchError(() => of({ data: [] }))),
      this.mitigationsService.getSelectedOwners({ mitigationId: this.mitigationId, selectedIds: [] }).pipe(catchError(() => of({ data: [] }))),
    ]).pipe(takeUntil(this.destroy$)).subscribe(([avail, selected]) => {
      this.availableOwners = avail.data || [];
      this.selectedOwners = selected.data || [];
      this.loading = false;
    });
  }

  // ── Checkbox ─────────────────────────────────────────────

  onAvailableItemChecked(username: string, checked: boolean): void {
    checked ? this.checkedAvailable.add(username) : this.checkedAvailable.delete(username);
    this.updateAvailableCheckState();
  }

  onAvailableAllChecked(checked: boolean): void {
    this.availableOwners.forEach(o => checked ? this.checkedAvailable.add(o.username) : this.checkedAvailable.delete(o.username));
    this.updateAvailableCheckState();
  }

  private updateAvailableCheckState(): void {
    const total = this.availableOwners.length;
    const count = this.availableOwners.filter(o => this.checkedAvailable.has(o.username)).length;
    this.availableCheckAll = total > 0 && count === total;
    this.availableIndeterminate = count > 0 && count < total;
  }

  onSelectedItemChecked(username: string, checked: boolean): void {
    checked ? this.checkedSelected.add(username) : this.checkedSelected.delete(username);
    this.updateSelectedCheckState();
  }

  onSelectedAllChecked(checked: boolean): void {
    this.selectedOwners.forEach(o => checked ? this.checkedSelected.add(o.username) : this.checkedSelected.delete(o.username));
    this.updateSelectedCheckState();
  }

  private updateSelectedCheckState(): void {
    const total = this.selectedOwners.length;
    const count = this.selectedOwners.filter(o => this.checkedSelected.has(o.username)).length;
    this.selectedCheckAll = total > 0 && count === total;
    this.selectedIndeterminate = count > 0 && count < total;
  }

  // ── Transfer ─────────────────────────────────────────────

  addSelected(): void {
    const toAdd = this.availableOwners.filter(o => this.checkedAvailable.has(o.username));
    this.selectedOwners = [...this.selectedOwners, ...toAdd];
    const selectedUsernames = new Set(this.selectedOwners.map(o => o.username));
    this.availableOwners = this.availableOwners.filter(o => !selectedUsernames.has(o.username));
    this.checkedAvailable.clear();
    this.updateAvailableCheckState();
  }

  removeSelected(): void {
    const toRemove = this.selectedOwners.filter(o => this.checkedSelected.has(o.username));
    this.selectedOwners = this.selectedOwners.filter(o => !this.checkedSelected.has(o.username));
    this.availableOwners = [...this.availableOwners, ...toRemove];
    this.checkedSelected.clear();
    this.updateSelectedCheckState();
  }

  // ── Save ─────────────────────────────────────────────────

  save(): void {
    this.mitigationsService.saveSelectedOwners({
      mitigationId: this.mitigationId,
      selectedIds: this.selectedOwners.map(o => o.username),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.notificationService.success(res.message || 'Owners saved');
        this.modalRef.close(true);
      },
      error: (err: any) => this.notificationService.error(err?.error?.message || 'Save failed'),
    });
  }
}
