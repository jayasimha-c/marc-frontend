import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CentralUserAdminService, AggregatedUser, ScenarioUser, UserScenario } from "../central-user-admin.service";
import { UserRoleComparisonComponent } from "../user-role-comparison/user-role-comparison.component";
import { NzModalService } from "ng-zorro-antd/modal";
import { NzTableQueryParams } from "ng-zorro-antd/table";
import { NotificationService } from "../../../../core/services/notification.service";
// Adjust NotificationService import if necessary

interface SystemUser {
    id: number;
    bname: string;
    userName: string;
    system: string;
    locked: boolean;
    userType: string;
    lastLogin: string;
    validFrom: string;
    validTo: string;
    hasRoles: boolean;
}

@Component({
    standalone: false,
    selector: "user-search",
    templateUrl: "./user-search.component.html",
    styleUrls: ["./user-search.component.scss"]
})
export class UserSearchComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();

    users: AggregatedUser[] = [];
    systemUsers: SystemUser[] = [];
    totalRecords = 0;
    loading = false;

    // Server-side pagination
    pageIndex = 1;
    pageSize = 10;
    sortField: string | null = null;
    sortOrder: string | null = null;

    // Selection
    selectedUser: AggregatedUser | null = null;
    selectedUsers: AggregatedUser[] = [];
    setOfCheckedId = new Set<number>();
    allChecked = false;
    indeterminate = false;
    listOfCurrentPageData: readonly AggregatedUser[] = [];

    // System filter from query params
    systemId: number | null = null;
    systemName: string | null = null;

    // Quick search
    quickSearchTerm: string = '';
    isQuickSearchActive: boolean = false;

    // Scenario filter
    scenarios: UserScenario[] = [];
    selectedScenario: string = '';
    scenarioUsers: ScenarioUser[] = [];
    isScenarioActive: boolean = false;
    scenarioDescription: string = '';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private adminService: CentralUserAdminService,
        private nzModal: NzModalService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadScenarios();

        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.systemId = params['systemId'] ? parseInt(params['systemId'], 10) : null;
            this.systemName = params['systemName'] || null;

            if (this.systemName) {
                this.loadSystemUsers();
            } else {
                this.loadDataFromServer();
            }
        });
    }

    loadScenarios(): void {
        this.adminService.getAvailableScenarios()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    if (response.success && response.data) {
                        this.scenarios = response.data;
                    }
                },
                error: () => {
                    this.scenarios = [];
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadSystemUsers(): void {
        if (!this.systemName) return;

        this.loading = true;
        this.adminService.getUsersBySystem(this.systemName)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    if (response.success && response.data) {
                        this.systemUsers = response.data;
                        this.totalRecords = this.systemUsers.length;
                    }
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    loadDataFromServer(): void {
        if (this.systemName || this.isScenarioActive || this.isQuickSearchActive) return;

        this.loading = true;
        const request = {
            page: this.pageIndex,
            size: this.pageSize,
            sortField: this.sortField || '',
            sortDirection: this.sortOrder === 'ascend' ? 'ASC' : (this.sortOrder === 'descend' ? 'DESC' : 'ASC'),
            filters: [],
            globalFilter: ''
        };

        this.adminService.searchUsers(request)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    if (response.success && response.data) {
                        this.users = response.data.rows || response.data.content || response.data || [];
                        this.totalRecords = response.data.records || response.data.totalElements || this.users.length;
                    }
                    this.refreshSelectionState();
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    onQueryParamsChange(params: NzTableQueryParams): void {
        this.pageIndex = params.pageIndex;
        this.pageSize = params.pageSize;
        const currentSort = params.sort.find(item => item.value !== null);
        this.sortField = (currentSort && currentSort.key) || null;
        this.sortOrder = (currentSort && currentSort.value) || null;
        this.loadDataFromServer();
    }

    onRowClicked(user: AggregatedUser): void {
        this.selectedUser = user;
    }

    viewUserDetails(user: AggregatedUser | ScenarioUser): void {
        if (user && user.identityId) {
            this.router.navigate(['/central-users/user-admin/users', user.identityId]);
        }
    }

    refreshGrid(): void {
        if (this.systemName) {
            this.loadSystemUsers();
        } else if (this.isQuickSearchActive) {
            this.onQuickSearch();
        } else if (this.isScenarioActive) {
            this.loadScenarioUsers();
        } else {
            this.loadDataFromServer();
        }
    }

    clearSystemFilter(): void {
        this.systemId = null;
        this.systemName = null;
        this.systemUsers = [];
        this.router.navigate(['/central-users/user-admin/users']);
    }

    goBack(): void {
        if (this.systemName) {
            this.router.navigate(['/central-users/user-admin/systems']);
        } else {
            this.router.navigate(['/central-users/user-admin/dashboard']);
        }
    }

    // Quick Search
    onQuickSearch(): void {
        if (!this.quickSearchTerm || this.quickSearchTerm.length < 2) {
            return;
        }

        this.isQuickSearchActive = true;
        this.isScenarioActive = false;
        this.selectedScenario = '';
        this.loading = true;

        this.adminService.quickSearchUsers(this.quickSearchTerm)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    if (response.success && response.data) {
                        this.users = response.data;
                        this.totalRecords = response.data.length;
                    } else {
                        this.users = [];
                        this.totalRecords = 0;
                    }
                    this.loading = false;
                    this.refreshSelectionState();
                },
                error: () => {
                    this.users = [];
                    this.totalRecords = 0;
                    this.loading = false;
                }
            });
    }

    clearQuickSearch(): void {
        this.quickSearchTerm = '';
        this.isQuickSearchActive = false;
        this.pageIndex = 1;
        this.loadDataFromServer();
    }

    // Scenario Filter
    onScenarioChange(scenario: string): void {
        this.selectedScenario = scenario;
        if (scenario) {
            const scenarioItem = this.scenarios.find(s => s.value === scenario);
            this.scenarioDescription = scenarioItem?.description || '';
            this.loadScenarioUsers();
        } else {
            this.clearScenario();
        }
    }

    loadScenarioUsers(): void {
        if (!this.selectedScenario) return;

        this.loading = true;
        this.isScenarioActive = true;
        this.isQuickSearchActive = false;
        this.quickSearchTerm = '';

        this.adminService.getUsersByScenario(this.selectedScenario)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    if (response.success && response.data) {
                        this.scenarioUsers = response.data;
                        this.totalRecords = response.data.length;
                    } else {
                        this.scenarioUsers = [];
                        this.totalRecords = 0;
                    }
                    this.loading = false;
                },
                error: () => {
                    this.scenarioUsers = [];
                    this.totalRecords = 0;
                    this.loading = false;
                }
            });
    }

    clearScenario(): void {
        this.selectedScenario = '';
        this.scenarioDescription = '';
        this.isScenarioActive = false;
        this.scenarioUsers = [];
        this.pageIndex = 1;
        this.loadDataFromServer();
    }

    onScenarioRowClick(user: ScenarioUser): void {
        if (user && user.identityId) {
            this.router.navigate(['/central-users/user-admin/users', user.identityId]);
        }
    }

    // Selection
    updateCheckedSet(id: number, checked: boolean): void {
        if (checked) {
            this.setOfCheckedId.add(id);
        } else {
            this.setOfCheckedId.delete(id);
        }
    }

    onCurrentPageDataChange($event: readonly AggregatedUser[]): void {
        this.listOfCurrentPageData = $event;
        this.refreshSelectionState();
    }

    refreshSelectionState(): void {
        const validData = this.listOfCurrentPageData.filter(item => item && item.identityId != null);
        this.allChecked = validData.length > 0 && validData.every(({ identityId }) => this.setOfCheckedId.has(identityId));
        this.indeterminate = validData.some(({ identityId }) => this.setOfCheckedId.has(identityId)) && !this.allChecked;
        this.selectedUsers = this.users.filter(u => this.setOfCheckedId.has(u.identityId));
    }

    onItemChecked(id: number, checked: boolean): void {
        this.updateCheckedSet(id, checked);
        this.refreshSelectionState();
    }

    onAllChecked(checked: boolean): void {
        this.listOfCurrentPageData.forEach(({ identityId }) => this.updateCheckedSet(identityId, checked));
        this.refreshSelectionState();
    }

    clearUserSelection(): void {
        this.setOfCheckedId.clear();
        this.refreshSelectionState();
    }

    compareSelectedUsers(): void {
        if (this.selectedUsers.length < 2) {
            this.notificationService.error('Please select at least 2 users to compare roles');
            return;
        }

        this.nzModal.create({
            nzTitle: 'Compare Roles',
            nzContent: UserRoleComparisonComponent,
            nzData: { selectedUsers: [...this.selectedUsers] },
            nzWidth: 900,
            nzFooter: null,
            nzClassName: 'updated-modal'
        });
    }
}
