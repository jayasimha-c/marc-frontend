import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CamService } from '../cam.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';

@Component({
  standalone: false,
  selector: 'app-user-actions',
  templateUrl: './user-actions.component.html',
  styleUrls: ['./user-actions.component.scss'],
})
export class UserActionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  sapSysList: any[] = [];
  userList: any[] = [];
  dropDownList: any[] = [];

  isSearching = false;
  isPerformingAction = false;
  hasSearched = false;

  // Checkbox selection
  setOfCheckedId = new Set<string>();
  allChecked = false;
  indeterminate = false;

  actionForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private camService: CamService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.actionForm = this.fb.group({
      sapSystem: [null, Validators.required],
      userSearch: ['', Validators.required],
    });

    // Auto-uppercase user search input
    this.actionForm.get('userSearch')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value) {
          const upper = value.toUpperCase();
          if (value !== upper) {
            this.actionForm.get('userSearch')!.patchValue(upper, { emitEvent: false });
          }
        }
      });

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.camService.getLockUnlockRequiredInfo().subscribe(resp => {
      this.sapSysList = resp.data?.saps || [];
    });
  }

  searchUsers(): void {
    if (!this.actionForm.valid) {
      this.actionForm.markAllAsTouched();
      return;
    }

    this.isSearching = true;
    this.hasSearched = false;
    this.userList = [];
    this.dropDownList = [];
    this.setOfCheckedId.clear();
    this.refreshCheckedStatus();

    const sapSystemIds = [this.actionForm.get('sapSystem')!.value];
    const searchTerm = this.actionForm.get('userSearch')!.value;

    this.camService.searchLockUnlock(sapSystemIds, searchTerm).subscribe({
      next: resp => {
        this.isSearching = false;
        this.hasSearched = true;
        if (resp.success && resp.data) {
          this.userList = resp.data.list || [];
          if (resp.data.nodes) this.processDropdown(resp.data.nodes);
          if (this.userList.length === 0) {
            this.notificationService.error('No users found matching the search criteria.');
          }
        } else {
          this.notificationService.error(resp.message || 'Search failed. Please try again.');
        }
      },
      error: () => {
        this.isSearching = false;
        this.hasSearched = true;
        this.notificationService.error('An error occurred while searching. Please try again.');
      },
    });
  }

  private processDropdown(input: any): void {
    const output: any[] = [];
    for (const val of Object.values(input) as any[]) {
      if (val?.length > 0) {
        output.push({ value: val, name: val[0].node?.name, selected: val[0].id });
      }
    }
    this.dropDownList = output;
  }

  private getNodeTypeId(): string {
    return this.dropDownList.map(i => i.selected).join(',');
  }

  // ─── Checkbox Selection ──────────────────────────────

  onItemChecked(id: string, checked: boolean): void {
    if (checked) this.setOfCheckedId.add(id);
    else this.setOfCheckedId.delete(id);
    this.refreshCheckedStatus();
  }

  onAllChecked(checked: boolean): void {
    this.userList.forEach(row => {
      if (checked) this.setOfCheckedId.add(this.getRowKey(row));
      else this.setOfCheckedId.delete(this.getRowKey(row));
    });
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    const listOfCurrentIds = this.userList.map(r => this.getRowKey(r));
    this.allChecked = listOfCurrentIds.length > 0 && listOfCurrentIds.every(id => this.setOfCheckedId.has(id));
    this.indeterminate = listOfCurrentIds.some(id => this.setOfCheckedId.has(id)) && !this.allChecked;
  }

  private getRowKey(row: any): string {
    return `${row.sapId}_${row.userId}`;
  }

  getSelectedCount(): number {
    return this.setOfCheckedId.size;
  }

  private getSelectedUsers(): any[] {
    return this.userList.filter(r => this.setOfCheckedId.has(this.getRowKey(r)));
  }

  // ─── Actions ──────────────────────────────────────────

  performAction(action: 'lock' | 'unlock' | 'reset-password' | 'delete'): void {
    const selected = this.getSelectedUsers();
    if (selected.length === 0) {
      this.notificationService.error('Please select at least one user row first.');
      return;
    }

    const nodeTypeId = this.getNodeTypeId();

    switch (action) {
      case 'lock':
        this.lockUnlockUser('Do you confirm to lock the selected user(s)?', 'Lock', nodeTypeId, true);
        break;
      case 'unlock':
        this.lockUnlockUser('Do you confirm to unlock the selected user(s)?', 'Unlock', nodeTypeId, false);
        break;
      case 'reset-password':
        this.resetUserPassword(nodeTypeId);
        break;
      case 'delete':
        this.deleteUser(nodeTypeId);
        break;
    }
  }

  private lockUnlockUser(message: string, label: string, nodeTypeId: string, isLock: boolean): void {
    this.confirmDialog.confirm({ title: 'Confirm Action', message, confirmBtnText: label })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.isPerformingAction = true;
        const user = this.getSelectedUsers()[0];
        this.camService.lockUnlockUser(user.userId, user.sapId, isLock, nodeTypeId).subscribe({
          next: resp => {
            this.isPerformingAction = false;
            this.handleSuccessResponse(resp);
          },
          error: () => {
            this.isPerformingAction = false;
            this.notificationService.error('Action failed. Please try again.');
          },
        });
      });
  }

  private resetUserPassword(nodeTypeId: string): void {
    this.confirmDialog.confirm({
      title: 'Confirm Action',
      message: 'Do you confirm to reset password for the selected user(s)?',
      confirmBtnText: 'Reset',
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.isPerformingAction = true;
      const user = this.getSelectedUsers()[0];
      this.camService.resetUserPassword(user.userId, user.sapId, nodeTypeId).subscribe({
        next: resp => {
          this.isPerformingAction = false;
          this.handleSuccessResponse(resp);
        },
        error: () => {
          this.isPerformingAction = false;
          this.notificationService.error('Password reset failed. Please try again.');
        },
      });
    });
  }

  private deleteUser(nodeTypeId: string): void {
    this.confirmDialog.confirm({
      title: 'Confirm Action',
      message: 'Are you sure you want to delete the selected user(s)? This action cannot be undone.',
      confirmBtnText: 'Delete',
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.isPerformingAction = true;
      const user = this.getSelectedUsers()[0];
      this.camService.deleteUser(user.userId, user.sapId, nodeTypeId).subscribe({
        next: resp => {
          this.isPerformingAction = false;
          this.handleSuccessResponse(resp);
        },
        error: () => {
          this.isPerformingAction = false;
          this.notificationService.error('User deletion failed. Please try again.');
        },
      });
    });
  }

  private handleSuccessResponse(resp: any): void {
    if (resp.success) {
      this.notificationService.success(resp.data || 'Action completed successfully!');
      this.searchUsers(); // Refresh results after successful action
    } else {
      this.notificationService.error(resp.message || 'Action failed. Please try again.');
    }
  }

  resetForm(): void {
    this.actionForm.reset();
    this.userList = [];
    this.dropDownList = [];
    this.setOfCheckedId.clear();
    this.refreshCheckedStatus();
    this.hasSearched = false;
    this.isSearching = false;
    this.isPerformingAction = false;
  }
}
