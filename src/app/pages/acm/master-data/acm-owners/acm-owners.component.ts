import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of, debounceTime, switchMap, forkJoin } from 'rxjs';
import { AcmOwnersService } from './acm-owners.service';
import { NotificationService } from '../../../../core/services/notification.service';

const OWNER_TYPE_MAP: Record<number, string> = {
  1: 'riskOwner',
  2: 'riskNotifier',
  3: 'mitigationOwner',
  4: 'mitigationNotifier',
};

@Component({
  standalone: false,
  selector: 'app-acm-owners',
  templateUrl: './acm-owners.component.html',
  styleUrls: ['./acm-owners.component.scss'],
})
export class AcmOwnersComponent implements OnInit {
  data: any[] = [];
  loading = false;
  ownerRoleList: any[] = [];
  dirtyUsers = new Set<string>();

  // Pagination
  pageIndex = 1;
  pageSize = 20;
  total = 0;

  // Add user autocomplete
  userSearchCtrl = new FormControl('');
  filteredUsers$: Observable<string[]> = of([]);

  constructor(
    private acmOwnersService: AcmOwnersService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.acmOwnersService.getOwnerRoles().subscribe({
      next: (res) => {
        this.ownerRoleList = res?.data?.types || [];
        this.loadData();
      },
      error: () => { this.loadData(); },
    });

    this.filteredUsers$ = this.userSearchCtrl.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => {
        if (!value || value.length < 2) return of([]);
        return this.acmOwnersService.autoCompleteUsers(value).pipe(
          switchMap(res => of(res.data || [])),
        );
      }),
    );
  }

  loadData(): void {
    this.loading = true;
    const first = (this.pageIndex - 1) * this.pageSize;
    const allCriteria = this.ownerRoleList.map(r => r.ownerId);

    this.acmOwnersService.getOwnerUsers(first, this.pageSize, '', 1, {}, allCriteria).subscribe({
      next: (res) => {
        if (res?.data?.rows) {
          this.data = res.data.rows.map((u: any) => this.transformToFlat(u));
          this.total = res.data.records || this.data.length;
        }
        this.loading = false;
        this.dirtyUsers.clear();
      },
      error: () => {
        this.data = [];
        this.loading = false;
      },
    });
  }

  onPageChange(index: number): void {
    this.pageIndex = index;
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadData();
  }

  // ── Transform ──

  private transformToFlat(user: any): any {
    const row: any = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      riskOwner: false,
      riskNotifier: false,
      mitigationOwner: false,
      mitigationNotifier: false,
    };
    if (user.type) {
      user.type.forEach((t: any) => {
        const field = OWNER_TYPE_MAP[t.ownerId];
        if (field) row[field] = true;
      });
    }
    return row;
  }

  private transformToPayload(row: any): { username: string; type: any[] } {
    const type: any[] = [];
    for (const [ownerId, field] of Object.entries(OWNER_TYPE_MAP)) {
      if (row[field]) {
        const role = this.ownerRoleList.find(r => r.ownerId === Number(ownerId));
        type.push({ ownerId: Number(ownerId), role: role?.role || '' });
      }
    }
    return { username: row.username, type };
  }

  // ── Checkbox ──

  onCheckboxChange(row: any): void {
    this.dirtyUsers.add(row.username);
  }

  // ── Add User ──

  onUserSelected(username: string): void {
    this.addUser(username);
    this.userSearchCtrl.setValue('');
  }

  onUserSubmit(): void {
    const value = this.userSearchCtrl.value?.trim();
    if (!value) return;
    this.addUser(value);
    this.userSearchCtrl.setValue('');
  }

  private addUser(username: string): void {
    if (this.data.find(r => r.username === username)) {
      this.notificationService.error('User already exists in the table');
      return;
    }

    this.acmOwnersService.findByUsername(username).subscribe({
      next: (res) => {
        if (!res?.data?.username) {
          this.notificationService.error('User not found: ' + username);
          return;
        }
        const row = this.transformToFlat(res.data);
        this.data = [row, ...this.data];
        this.total = this.data.length;
        this.dirtyUsers.add(username);
      },
      error: () => this.notificationService.error('User not found: ' + username),
    });
  }

  // ── Save ──

  saveAll(): void {
    if (this.dirtyUsers.size === 0) {
      this.notificationService.error('No changes to save');
      return;
    }

    const calls: Observable<any>[] = [];
    this.dirtyUsers.forEach(username => {
      const row = this.data.find(r => r.username === username);
      if (row) {
        calls.push(this.acmOwnersService.saveOwnerUser(this.transformToPayload(row)));
      }
    });

    forkJoin(calls).subscribe({
      next: () => {
        this.notificationService.success('Owner assignments saved successfully');
        this.dirtyUsers.clear();
        this.loadData();
      },
      error: () => this.notificationService.error('Failed to save owner assignments'),
    });
  }

  // ── Helpers ──

  getDisplayDetail(row: any): string {
    const name = [row.firstName, row.lastName].filter(Boolean).join(' ');
    return name + (row.email ? ` | ${row.email}` : '');
  }
}
