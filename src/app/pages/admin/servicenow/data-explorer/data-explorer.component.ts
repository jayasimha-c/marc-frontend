import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiResponse } from '../../../../core/models/api-response';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { ServiceNowService, SnowUser, SnowUserRole } from '../servicenow.service';

@Component({
  standalone: false,
  selector: 'app-servicenow-data-explorer',
  templateUrl: './data-explorer.component.html',
  styleUrls: ['./data-explorer.component.scss']
})
export class ServiceNowDataExplorerComponent implements OnInit, OnDestroy {
  @ViewChild('userPanel') userPanel!: SidePanelComponent;
  private destroy$ = new Subject<void>();

  systems: any[] = [];
  selectedSystemId: number | null = null;
  activeTab = 0;
  loading = false;

  // Users
  usersData: any[] = [];
  usersTotal = 0;
  usersLoading = false;
  selectedUser: any = null;
  userRoles: any[] = [];
  userRolesLoading = false;

  usersColumns: TableColumn[] = [
    { field: 'userName', header: 'Username', sortable: true, filterable: true, width: '140px' },
    { field: 'fullName', header: 'Full Name', sortable: true, filterable: true, width: '180px' },
    { field: 'email', header: 'Email', sortable: true, filterable: true, width: '200px' },
    { field: 'department', header: 'Department', sortable: true, filterable: true, width: '140px' },
    { field: 'statusDisplay', header: 'Status', sortable: true, width: '100px' }
  ];

  // Roles
  rolesData: any[] = [];
  rolesTotal = 0;
  rolesLoading = false;

  rolesColumns: TableColumn[] = [
    { field: 'name', header: 'Role Name', sortable: true, filterable: true, width: '200px' },
    { field: 'description', header: 'Description', sortable: true, filterable: true },
    { field: 'elevatedDisplay', header: 'Elevated', sortable: true, width: '100px' }
  ];

  // Groups
  groupsData: any[] = [];
  groupsTotal = 0;
  groupsLoading = false;

  groupsColumns: TableColumn[] = [
    { field: 'name', header: 'Group Name', sortable: true, filterable: true, width: '200px' },
    { field: 'description', header: 'Description', sortable: true, filterable: true },
    { field: 'statusDisplay', header: 'Status', sortable: true, width: '100px' }
  ];

  constructor(
    private servicenowService: ServiceNowService,
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
    this.servicenowService.getServiceNowSystems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.systems = resp.data;
            if (this.systems.length > 0 && !this.selectedSystemId) {
              this.selectedSystemId = this.systems[0].id;
            }
          }
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load ServiceNow systems');
          this.loading = false;
        }
      });
  }

  onSystemChange(): void {
    if (!this.selectedSystemId) return;
    this.refreshCurrentTab();
  }

  onTabChange(index: number): void {
    this.activeTab = index;
  }

  private refreshCurrentTab(): void {
    // Trigger reload by resetting data — the table's queryParamsChange will fire on init
    switch (this.activeTab) {
      case 0: this.usersData = []; break;
      case 1: this.rolesData = []; break;
      case 2: this.groupsData = []; break;
    }
  }

  private buildRequest(params: any): any {
    // Convert filters object { field: 'value' } to ColumnFilter array
    const filtersArray: any[] = [];
    if (params?.filters) {
      for (const field of Object.keys(params.filters)) {
        const value = params.filters[field];
        if (value && typeof value === 'string' && value.trim()) {
          filtersArray.push({ field, operator: 'contains', value: value.trim() });
        }
      }
    }
    return {
      page: (params?.pageIndex ?? 1) - 1,
      size: params?.pageSize ?? 20,
      sortField: params?.sort?.field || '',
      sortDirection: (params?.sort?.direction || 'asc').toUpperCase(),
      filters: filtersArray,
      globalFilter: params?.globalSearch || ''
    };
  }

  // Users
  onUsersQueryChange(params: any): void {
    if (!this.selectedSystemId) return;
    this.usersLoading = true;
    const request = this.buildRequest(params);

    this.servicenowService.getFilteredUsers(this.selectedSystemId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            const users = resp.data.content || [];
            this.usersData = users.map((u: SnowUser) => ({
              ...u,
              fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
              statusDisplay: u.active ? 'Active' : 'Inactive'
            }));
            this.usersTotal = resp.data.totalElements || 0;
          }
          this.usersLoading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load users');
          this.usersLoading = false;
        }
      });
  }

  onUserRowClick(row: any): void {
    this.selectedUser = row;
    this.userRoles = [];
    this.userRolesLoading = true;
    this.userPanel.open();

    this.servicenowService.getUserRoles(this.selectedSystemId!, 0, 100, row.sysId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.userRoles = (resp.data.content || []).map((r: SnowUserRole) => ({
              ...r,
              inheritedDisplay: r.inherited ? 'Yes' : 'No'
            }));
          }
          this.userRolesLoading = false;
        },
        error: () => {
          this.userRolesLoading = false;
        }
      });
  }

  // Roles
  onRolesQueryChange(params: any): void {
    if (!this.selectedSystemId) return;
    this.rolesLoading = true;
    const request = this.buildRequest(params);

    this.servicenowService.getFilteredRoles(this.selectedSystemId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.rolesData = (resp.data.content || []).map((r: any) => ({
              ...r,
              elevatedDisplay: r.elevatedPrivilege ? 'Yes' : 'No'
            }));
            this.rolesTotal = resp.data.totalElements || 0;
          }
          this.rolesLoading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load roles');
          this.rolesLoading = false;
        }
      });
  }

  // Groups
  onGroupsQueryChange(params: any): void {
    if (!this.selectedSystemId) return;
    this.groupsLoading = true;
    const request = this.buildRequest(params);

    this.servicenowService.getFilteredGroups(this.selectedSystemId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.groupsData = (resp.data.content || []).map((g: any) => ({
              ...g,
              statusDisplay: g.active ? 'Active' : 'Inactive'
            }));
            this.groupsTotal = resp.data.totalElements || 0;
          }
          this.groupsLoading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load groups');
          this.groupsLoading = false;
        }
      });
  }
}
