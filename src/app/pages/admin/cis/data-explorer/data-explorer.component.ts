import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiResponse } from '../../../../core/models/api-response';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { GridRequestBuilder } from '../../../../core/utils/grid-request.builder';
import { CISService, CISUser, CISGroup } from '../cis.service';

@Component({
  standalone: false,
  selector: 'app-cis-data-explorer',
  templateUrl: './data-explorer.component.html',
  styleUrls: ['./data-explorer.component.scss']
})
export class CISDataExplorerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  systems: any[] = [];
  selectedSystemId: number | null = null;
  activeTab = 0;
  loading = false;

  // Users
  usersData: any[] = [];
  usersTotal = 0;
  usersColumns: TableColumn[] = [
    { field: 'userName', header: 'Username', sortable: true, filterable: true },
    { field: 'displayName', header: 'Display Name', sortable: true, filterable: true },
    { field: 'email', header: 'Email', sortable: true, filterable: true },
    { field: 'userType', header: 'User Type', sortable: true, width: '120px' },
    {
      field: 'active', header: 'Status', sortable: true, width: '100px', type: 'tag',
      tagColors: { 'Active': 'success', 'Inactive': 'default' }
    }
  ];

  // Groups
  groupsData: any[] = [];
  groupsTotal = 0;
  groupsColumns: TableColumn[] = [
    { field: 'displayName', header: 'Group Name', sortable: true, filterable: true },
    { field: 'description', header: 'Description', sortable: true, filterable: true },
    { field: 'groupType', header: 'Type', sortable: true, width: '120px' },
    { field: 'memberCount', header: 'Members', sortable: true, width: '100px', align: 'center' }
  ];

  // Group members side panel
  selectedGroup: CISGroup | null = null;
  groupMembers: any[] = [];
  loadingMembers = false;
  membersColumns: TableColumn[] = [
    { field: 'userName', header: 'Username' },
    { field: 'displayName', header: 'Display Name' },
    { field: 'email', header: 'Email' },
    {
      field: 'active', header: 'Status', width: '90px', type: 'tag',
      tagColors: { 'Active': 'success', 'Inactive': 'default' }
    }
  ];

  constructor(
    private cisService: CISService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSystems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSystems(): void {
    this.loading = true;
    this.cisService.getCISSystems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.systems = resp.data;
            if (this.systems.length > 0 && !this.selectedSystemId) {
              this.selectedSystemId = this.systems[0].id;
              this.onSystemChange();
            }
          }
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load SAP Cloud Identity systems');
          this.loading = false;
        }
      });
  }

  onSystemChange(): void {
    if (!this.selectedSystemId) return;
    this.selectedGroup = null;
    this.loadCurrentTab();
  }

  onTabChange(index: number): void {
    this.activeTab = index;
    this.selectedGroup = null;
    if (this.selectedSystemId) {
      this.loadCurrentTab();
    }
  }

  private loadCurrentTab(): void {
    const defaultParams: TableQueryParams = { pageIndex: 1, pageSize: 20, filters: {}, globalSearch: '' };
    if (this.activeTab === 0) {
      this.loadUsers(defaultParams);
    } else {
      this.loadGroups(defaultParams);
    }
  }

  loadUsers(params: TableQueryParams): void {
    if (!this.selectedSystemId) return;

    const request = GridRequestBuilder.toGridFilter(params);
    this.cisService.getFilteredUsers(this.selectedSystemId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            const pageData = resp.data;
            this.usersData = (pageData.content || []).map((u: CISUser) => ({
              ...u,
              active: u.active ? 'Active' : 'Inactive'
            }));
            this.usersTotal = pageData.totalElements || 0;
          }
        },
        error: () => this.notificationService.error('Failed to load users')
      });
  }

  loadGroups(params: TableQueryParams): void {
    if (!this.selectedSystemId) return;

    const request = GridRequestBuilder.toGridFilter(params);
    this.cisService.getFilteredGroups(this.selectedSystemId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            const pageData = resp.data;
            this.groupsData = pageData.content || [];
            this.groupsTotal = pageData.totalElements || 0;
          }
        },
        error: () => this.notificationService.error('Failed to load groups')
      });
  }

  onGroupClick(group: CISGroup): void {
    if (this.selectedGroup?.id === group.id) {
      this.selectedGroup = null;
      return;
    }
    this.selectedGroup = group;
    this.loadingMembers = true;
    this.groupMembers = [];

    this.cisService.getGroupMembers(group.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.groupMembers = resp.data.map((m: CISUser) => ({
              ...m,
              active: m.active ? 'Active' : 'Inactive'
            }));
          }
          this.loadingMembers = false;
        },
        error: () => { this.loadingMembers = false; }
      });
  }

  closeMembersPanel(): void {
    this.selectedGroup = null;
  }

}
