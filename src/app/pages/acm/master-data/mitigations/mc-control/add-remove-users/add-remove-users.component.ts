import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { MitigationsService } from '../../mitigations.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-remove-users',
  templateUrl: './add-remove-users.component.html',
})
export class AddRemoveUsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  mitigationId = 0;
  loading = true;

  // Available users (left)
  availableUsers: any[] = [];
  availableTotal = 0;
  checkedAvailable = new Set<string>();
  availableCheckAll = false;
  availableIndeterminate = false;

  // Selected users (right)
  selectedUsers: any[] = [];
  checkedSelected = new Set<string>();
  selectedCheckAll = false;
  selectedIndeterminate = false;

  private userSessionTables: any = null;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private mitigationsService: MitigationsService,
    private notificationService: NotificationService,
    public modalRef: NzModalRef,
  ) {}

  ngOnInit(): void {
    this.mitigationId = this.dialogData.mitigationId;
    this.loadSelectedUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSelectedUsers(): void {
    this.mitigationsService.getSelectedUsers({
      mitigationId: this.mitigationId,
      selectedIds: [],
      userSessionTables: this.userSessionTables,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.selectedUsers = (res.data?.rows || []).map((u: any) => ({
          ...u,
          startDateStr: u.startDateStr || this.todayStr(),
          endDateStr: u.endDateStr || this.monthLaterStr(),
          bname: u.userId,
        }));
        this.loadAvailableUsers();
      },
      error: () => { this.loading = false; },
    });
  }

  private loadAvailableUsers(): void {
    const selectedIds = this.selectedUsers.map(u => u.userId);
    this.mitigationsService.getAvailableUsers(
      { mitigationId: this.mitigationId, selectedIds, userSessionTables: this.userSessionTables },
      0, 100, 1, '', null
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.availableUsers = res.data?.gridData?.rows || [];
        this.availableTotal = res.data?.gridData?.records || 0;
        this.userSessionTables = res.data?.userSessionTables;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  // ── Checkbox logic ───────────────────────────────────────

  onAvailableItemChecked(bname: string, checked: boolean): void {
    checked ? this.checkedAvailable.add(bname) : this.checkedAvailable.delete(bname);
    this.updateAvailableCheckState();
  }

  onAvailableAllChecked(checked: boolean): void {
    this.availableUsers.forEach(u => {
      const key = u.userNameVO?.bname || u.bname;
      checked ? this.checkedAvailable.add(key) : this.checkedAvailable.delete(key);
    });
    this.updateAvailableCheckState();
  }

  private updateAvailableCheckState(): void {
    const total = this.availableUsers.length;
    const count = this.availableUsers.filter(u => this.checkedAvailable.has(u.userNameVO?.bname || u.bname)).length;
    this.availableCheckAll = total > 0 && count === total;
    this.availableIndeterminate = count > 0 && count < total;
  }

  onSelectedItemChecked(userId: string, checked: boolean): void {
    checked ? this.checkedSelected.add(userId) : this.checkedSelected.delete(userId);
    this.updateSelectedCheckState();
  }

  onSelectedAllChecked(checked: boolean): void {
    this.selectedUsers.forEach(u => checked ? this.checkedSelected.add(u.userId) : this.checkedSelected.delete(u.userId));
    this.updateSelectedCheckState();
  }

  private updateSelectedCheckState(): void {
    const total = this.selectedUsers.length;
    const count = this.selectedUsers.filter(u => this.checkedSelected.has(u.userId)).length;
    this.selectedCheckAll = total > 0 && count === total;
    this.selectedIndeterminate = count > 0 && count < total;
  }

  // ── Transfer ─────────────────────────────────────────────

  addSelected(): void {
    const toAdd = this.availableUsers.filter(u => this.checkedAvailable.has(u.userNameVO?.bname || u.bname));
    const mapped = toAdd.map(u => ({
      userId: u.userNameVO?.bname || u.bname,
      firstName: u.userNameVO?.firstName || u.firstName,
      lastName: u.userNameVO?.lastName || u.lastName,
      startDateStr: this.todayStr(),
      endDateStr: this.monthLaterStr(),
      bname: u.userNameVO?.bname || u.bname,
    }));
    this.selectedUsers = [...this.selectedUsers, ...mapped];
    const selectedIds = new Set(this.selectedUsers.map(u => u.userId));
    this.availableUsers = this.availableUsers.filter(u => !selectedIds.has(u.userNameVO?.bname || u.bname));
    this.checkedAvailable.clear();
    this.updateAvailableCheckState();
  }

  removeSelected(): void {
    const toRemove = this.selectedUsers.filter(u => this.checkedSelected.has(u.userId));
    this.selectedUsers = this.selectedUsers.filter(u => !this.checkedSelected.has(u.userId));
    // Re-add to available
    const restored = toRemove.map(u => ({ userNameVO: { bname: u.userId, firstName: u.firstName, lastName: u.lastName } }));
    this.availableUsers = [...this.availableUsers, ...restored];
    this.checkedSelected.clear();
    this.updateSelectedCheckState();
  }

  // ── Save ─────────────────────────────────────────────────

  save(): void {
    const mUsers = this.selectedUsers.map(u => ({
      userId: u.userId,
      startDateStr: u.startDateStr || '',
      endDateStr: u.endDateStr || '',
      firstName: u.firstName,
      lastName: u.lastName,
    }));

    this.mitigationsService.saveSelectedUsers({ mitigationId: this.mitigationId, mUsers })
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.notificationService.success(res.message || 'Users saved');
          this.modalRef.close(true);
        },
        error: (err: any) => this.notificationService.error(err?.error?.message || 'Save failed'),
      });
  }

  private todayStr(): string {
    return new Date().toISOString().substring(0, 10);
  }

  private monthLaterStr(): string {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().substring(0, 10);
  }
}
