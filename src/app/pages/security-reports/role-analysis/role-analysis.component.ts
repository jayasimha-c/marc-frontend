import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { SecurityReportsService, RoleAnalysis, SapSystemOption, RoleFilterType, RoleAnalysisRequest } from "../security-reports.service";

// Replace legacy AG-Grid types with target Application Types
import { TableColumn, TableQueryParams } from "../../../shared/components/advanced-table/advanced-table.models";

interface FilterChip {
    type: RoleFilterType;
    label: string;
    description: string;
    selected: boolean;
    icon: string;
}

@Component({
    standalone: false,
    selector: "app-role-analysis",
    templateUrl: "./role-analysis.component.html",
    styleUrls: ["./role-analysis.component.css"]
})
export class RoleAnalysisComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();

    loading = false;
    loadingSystems = true;

    systems: SapSystemOption[] = [];
    selectedSystemId: number | null = null;

    rows: any[] = [];
    totalRecords = 0;

    filterChips: FilterChip[] = [
        { type: 'NON_COMPLIANT_NAMING', label: 'Non-Compliant Naming', description: 'Customer roles violating naming convention', selected: false, icon: 'audit' },
        { type: 'COMPOSITE', label: 'Composite', description: 'Roles with child roles', selected: false, icon: 'cluster' },
        { type: 'SINGLE', label: 'Single', description: 'Non-composite roles', selected: false, icon: 'user' },
        { type: 'EMPTY', label: 'Empty', description: 'No tcodes or child roles', selected: false, icon: 'stop' },
        { type: 'WITHOUT_DESCRIPTION', label: 'No Description', description: 'Missing description', selected: false, icon: 'question-circle' },
        { type: 'EXCESSIVE_TCODES', label: 'Excessive Tcodes', description: 'Above threshold', selected: false, icon: 'warning' },
        { type: 'RECENTLY_MODIFIED', label: 'Recently Modified', description: 'Changed recently', selected: false, icon: 'sync' },
        { type: 'RECENTLY_CREATED', label: 'Recently Created', description: 'Created recently', selected: false, icon: 'plus-circle' },
        { type: 'NO_USERS', label: 'No Users', description: 'Not assigned to users', selected: false, icon: 'user-delete' },
        { type: 'NAME_PATTERN', label: 'Name Pattern', description: 'Match pattern', selected: false, icon: 'search' }
    ];

    private standaloneFilters: RoleFilterType[] = ['NON_COMPLIANT_NAMING'];

    tcodeThreshold = 50;
    daysThreshold = 30;
    roleNamePattern = '';

    // Advanced Table States
    tableColumns: TableColumn[] = [];
    private lastQueryParams: any = null;

    @ViewChild('childRolesPanel') childRolesPanel: any;
    @ViewChild('violationsPanel') violationsPanel: any;

    // Panel states mapped cleanly
    selectedRole: any | null = null;
    childRolesTableData: any[] = [];
    childRolesColumns: TableColumn[] = [
        { field: 'roleName', header: 'Child Role Name', type: 'text', sortable: true }
    ];

    selectedViolationRole: any | null = null;
    violationsTableData: any[] = [];
    violationsColumns: TableColumn[] = [
        { field: 'segmentName', header: 'Segment', type: 'text', sortable: true },
        { field: 'violation', header: 'Violation', type: 'text', sortable: true }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private securityReportsService: SecurityReportsService
    ) { }

    ngOnInit(): void {
        this.buildBaseColumns();
        this.loadSystems();
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            if (params['systemId']) {
                this.selectedSystemId = +params['systemId'];
            }
            if (params['filter']) {
                const filterTypes = params['filter'].split(',') as RoleFilterType[];
                this.filterChips.forEach(chip => {
                    chip.selected = filterTypes.includes(chip.type);
                });
                setTimeout(() => this.triggerSearch(), 100);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadSystems(): void {
        this.loadingSystems = true;
        this.securityReportsService.getSapSystems()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.systems = (response.data as any[])
                            .map(s => ({
                                id: s.id,
                                sid: s.sid,
                                destinationName: s.destinationName,
                                description: s.description
                            }));
                    }
                    this.loadingSystems = false;
                },
                error: () => this.loadingSystems = false
            });
    }

    private buildBaseColumns(): void {
        if (this.isNonCompliantNamingSelected) {
            this.tableColumns = [
                { field: 'roleName', header: 'Role Name', type: 'text' },
                { field: 'roleDesc', header: 'Description', type: 'text' },
                { field: 'isComposite', header: 'Composite', type: 'tag', tagColors: { 'true': 'blue', 'false': 'default' } },
                { field: 'createdBy', header: 'Created By', type: 'text' },
                { field: 'matchedTemplateName', header: 'Template', type: 'text' },
                { field: 'hasViolations', header: 'Violations (Click to View)', type: 'tag', tagColors: { 'Yes': 'red', 'No': 'green' } }
            ];
        } else {
            this.tableColumns = [
                { field: 'roleName', header: 'Role Name', type: 'text' },
                { field: 'roleDesc', header: 'Description', type: 'text' },
                { field: 'isComposite', header: 'Composite', type: 'tag', tagColors: { 'true': 'blue', 'false': 'default' } },
                { field: 'tcodeCount', header: 'Tcodes', type: 'text' },
                { field: 'childRoleCount', header: 'Children (Click)', type: 'link' },
                { field: 'createdBy', header: 'Created By', type: 'text' },
                { field: 'creationDate', header: 'Created', type: 'date' },
                { field: 'changedBy', header: 'Changed By', type: 'text' },
                { field: 'changeDate', header: 'Changed', type: 'date' },
                { field: 'issueType', header: 'Issue', type: 'tag', tagColors: { default: 'orange' } }
            ];
        }
    }

    get selectedFilters(): RoleFilterType[] {
        return this.filterChips.filter(c => c.selected).map(c => c.type);
    }

    get hasSelectedFilters(): boolean {
        return this.selectedFilters.length > 0;
    }

    get showTcodeThreshold(): boolean {
        return this.filterChips.find(c => c.type === 'EXCESSIVE_TCODES')?.selected ?? false;
    }

    get showDaysThreshold(): boolean {
        const recentFilters: RoleFilterType[] = ['RECENTLY_MODIFIED', 'RECENTLY_CREATED'];
        return this.filterChips.some(c => recentFilters.includes(c.type) && c.selected);
    }

    get showPatternInput(): boolean {
        return this.filterChips.find(c => c.type === 'NAME_PATTERN')?.selected ?? false;
    }

    get isNonCompliantNamingSelected(): boolean {
        return this.filterChips.find(c => c.type === 'NON_COMPLIANT_NAMING')?.selected ?? false;
    }

    toggleFilter(chip: FilterChip): void {
        const isStandaloneFilter = this.standaloneFilters.includes(chip.type);
        const wasSelected = chip.selected;

        if (isStandaloneFilter && !wasSelected) {
            this.filterChips.forEach(c => c.selected = false);
            chip.selected = true;
        } else if (!isStandaloneFilter && !wasSelected && this.isNonCompliantNamingSelected) {
            this.filterChips.forEach(c => {
                if (this.standaloneFilters.includes(c.type)) c.selected = false;
            });
            chip.selected = true;
        } else {
            chip.selected = !wasSelected;
        }

        this.buildBaseColumns();
        this.rows = [];
        this.totalRecords = 0;
    }

    clearFilters(): void {
        this.filterChips.forEach(c => c.selected = false);
        this.rows = [];
        this.totalRecords = 0;
        this.buildBaseColumns();
    }

    triggerSearch(): void {
        if (!this.selectedSystemId || !this.hasSelectedFilters) return;
        this.onTableChange(this.lastQueryParams || { pageIndex: 1, pageSize: 20 });
    }

    onTableChange(event: TableQueryParams): void {
        if (!this.selectedSystemId || !this.hasSelectedFilters) return;

        this.lastQueryParams = event;
        this.loading = true;

        const request: RoleAnalysisRequest = {
            page: (event.pageIndex - 1),
            size: event.pageSize,
            sortField: event.sort?.field || undefined,
            sortDirection: event.sort?.direction === 'descend' ? 'DESC' : 'ASC',
            systemId: this.selectedSystemId,
            filterTypes: this.selectedFilters,
            tcodeThreshold: this.tcodeThreshold,
            daysThreshold: this.daysThreshold,
            roleNamePattern: this.roleNamePattern || undefined,
            includeChildRoles: true
        };

        this.securityReportsService.analyzeRoles(request)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        let dataRows = response.data.rows || [];
                        if (this.isNonCompliantNamingSelected) {
                            dataRows = dataRows.map((row: any) => ({
                                ...row,
                                hasViolations: !row.namingCompliant ? 'Yes' : 'No'
                            }));
                        }
                        this.rows = dataRows;
                        this.totalRecords = response.data.records || 0;
                    }
                    this.loading = false;
                },
                error: () => this.loading = false
            });
    }

    onRowClick(row: any): void {
        if (this.isNonCompliantNamingSelected && row.violationDetails && row.violationDetails.length > 0) {
            this.openViolationsPanel(row);
            return;
        }

        if (row.childRoles && row.childRoles.length > 0) {
            this.openChildRolesPanel(row);
        }
    }

    onSystemChange(): void {
        this.rows = [];
        this.totalRecords = 0;
        this.triggerSearch();
    }

    goBack(): void {
        this.router.navigate(['/security-reports/dashboard']);
    }

    // Panels

    openChildRolesPanel(role: any): void {
        this.selectedRole = role;
        this.childRolesTableData = role.childRoles.map((roleName: string) => ({ roleName: roleName }));
        if (this.childRolesPanel) this.childRolesPanel.open();
    }

    closeChildRolesPanel(): void {
        if (this.childRolesPanel) this.childRolesPanel.close();
        this.selectedRole = null;
        this.childRolesTableData = [];
    }

    openViolationsPanel(role: any): void {
        this.selectedViolationRole = role;
        this.violationsTableData = (role.violationDetails || []).map((detail: any) => ({
            segmentName: detail.segmentName,
            violation: detail.violation
        }));
        if (this.violationsPanel) this.violationsPanel.open();
    }

    closeViolationsPanel(): void {
        if (this.violationsPanel) this.violationsPanel.close();
        this.selectedViolationRole = null;
        this.violationsTableData = [];
    }

    copyViolationsToClipboard(): void {
        if (!this.selectedViolationRole || this.violationsTableData.length === 0) return;

        const role = this.selectedViolationRole;
        const lines: string[] = [
            `Role: ${role.roleName}`,
            `Template: ${role.matchedTemplateName || 'N/A'}`,
            `Type: ${role.isComposite ? 'Composite' : 'Single'}`,
            '',
            'Violations:',
            ...this.violationsTableData.map((v, idx) => `  ${idx + 1}. [${v.segmentName}] ${v.violation}`)
        ];

        navigator.clipboard.writeText(lines.join('\n'));
    }
}
