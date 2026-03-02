import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
    OrgComplianceService,
    OrgComplianceRequest,
    OrgComplianceSummaryDTO,
    OrgComplianceResultDTO,
    FieldComplianceDTO,
    OrgTemplateOption,
    RoleConceptTemplateOption
} from './org-compliance.service';

interface FieldValueRow {
    fieldName: string;
    status: string;
    statusClass: string;
    rowClass: string;
    roleValue: string;
    templateValue: string;
}

@Component({
    selector: 'app-org-compliance-wizard',
    templateUrl: './org-compliance-wizard.component.html',
    styleUrls: ['./org-compliance-wizard.component.scss'],
    standalone: false,
})
export class OrgComplianceWizardComponent implements OnInit {

    // SAP System
    sapSystems: any[] = [];
    selectedSystemId: number | null = null;
    loadingSystems = false;

    // Role Concept Templates
    roleConceptTemplates: RoleConceptTemplateOption[] = [];
    selectedRoleConceptTemplateId: number | null = null;
    loadingConceptTemplates = false;

    // Org Templates
    orgTemplates: OrgTemplateOption[] = [];
    selectedTemplateIds: number[] = [];
    loadingOrgTemplates = false;
    orgTemplateSearch = '';

    // Roles
    roles: any[] = [];
    filteredRoles: any[] = [];
    selectedRoleNames: string[] = [];
    loadingRoles = false;
    rolesLoaded = false;
    roleSearch = '';
    roleTotalRecords = 0;
    selectingAllRoles = false;

    // Compliance Results
    complianceResults: OrgComplianceResultDTO[] = [];
    summary: OrgComplianceSummaryDTO | null = null;
    selectedResult: OrgComplianceResultDTO | null = null;
    runningCheck = false;
    resultsLoaded = false;
    loadingResults = false;
    drawerVisible = false;

    // Background job
    backgroundJobId: number | null = null;
    jobPolling = false;
    jobProgress = 0;

    // Store last request for pagination
    private lastComplianceRequest: OrgComplianceRequest | null = null;
    private readonly BACKGROUND_THRESHOLD = 100;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private complianceService: OrgComplianceService,
        private modal: NzModalService,
        private message: NzMessageService,
    ) {}

    ngOnInit(): void {
        this.loadSapSystems();
        this.checkRouteParams();
    }

    private checkRouteParams(): void {
        this.route.queryParams.subscribe(params => {
            if (params['systemId']) {
                const systemId = +params['systemId'];
                this.selectedSystemId = systemId;
                this.onSystemChange(systemId);
            }
        });
    }

    // ─── SAP Systems ─────────────────────────────────
    loadSapSystems(): void {
        this.loadingSystems = true;
        this.complianceService.getSapSystems().subscribe({
            next: res => {
                this.sapSystems = res.data || [];
                this.loadingSystems = false;
            },
            error: () => {
                this.message.error('Failed to load SAP systems');
                this.loadingSystems = false;
            }
        });
    }

    onSystemChange(systemId: number): void {
        if (!systemId) return;
        this.selectedSystemId = systemId;
        this.selectedRoleConceptTemplateId = null;
        this.selectedTemplateIds = [];
        this.selectedRoleNames = [];
        this.complianceResults = [];
        this.summary = null;
        this.resultsLoaded = false;
        this.rolesLoaded = false;
        this.roles = [];
        this.filteredRoles = [];
        this.loadRoleConceptTemplates(systemId);
        this.loadOrgTemplates(systemId);
    }

    // ─── Role Concept Templates ─────────────────────
    loadRoleConceptTemplates(systemId: number): void {
        this.loadingConceptTemplates = true;
        this.complianceService.getRoleConceptTemplates(systemId).subscribe({
            next: res => {
                this.roleConceptTemplates = res.data || [];
                if (this.roleConceptTemplates.length === 1) {
                    this.selectedRoleConceptTemplateId = this.roleConceptTemplates[0].id;
                }
                this.loadingConceptTemplates = false;
            },
            error: () => {
                this.loadingConceptTemplates = false;
                // Fallback: load all templates
                this.complianceService.getAllRoleConceptTemplates().subscribe({
                    next: res => { this.roleConceptTemplates = res.data || []; }
                });
            }
        });
    }

    // ─── Org Templates ──────────────────────────────
    loadOrgTemplates(systemId: number): void {
        this.loadingOrgTemplates = true;
        this.complianceService.getOrgTemplates(systemId).subscribe({
            next: res => {
                this.orgTemplates = res.data || [];
                this.loadingOrgTemplates = false;
            },
            error: () => {
                this.message.error('Failed to load org templates');
                this.loadingOrgTemplates = false;
            }
        });
    }

    get filteredOrgTemplates(): OrgTemplateOption[] {
        if (!this.orgTemplateSearch) return this.orgTemplates;
        const s = this.orgTemplateSearch.toLowerCase();
        return this.orgTemplates.filter(t =>
            t.templateName.toLowerCase().includes(s) ||
            (t.templateCode && t.templateCode.toLowerCase().includes(s))
        );
    }

    get selectedTemplateCodes(): string[] {
        return this.orgTemplates
            .filter(t => this.selectedTemplateIds.includes(t.id))
            .filter(t => t.templateCode)
            .map(t => t.templateCode);
    }

    toggleOrgTemplate(template: OrgTemplateOption): void {
        const idx = this.selectedTemplateIds.indexOf(template.id);
        if (idx >= 0) {
            this.selectedTemplateIds.splice(idx, 1);
        } else {
            this.selectedTemplateIds.push(template.id);
        }
        this.resetRoles();
    }

    selectAllOrgTemplates(): void {
        this.selectedTemplateIds = this.orgTemplates.map(t => t.id);
        this.resetRoles();
    }

    clearOrgTemplateSelection(): void {
        this.selectedTemplateIds = [];
        this.resetRoles();
    }

    isOrgTemplateSelected(id: number): boolean {
        return this.selectedTemplateIds.includes(id);
    }

    private resetRoles(): void {
        this.rolesLoaded = false;
        this.roles = [];
        this.filteredRoles = [];
        this.selectedRoleNames = [];
    }

    // ─── Roles ──────────────────────────────────────
    canLoadRoles(): boolean {
        return this.selectedSystemId !== null &&
               this.selectedRoleConceptTemplateId !== null &&
               this.selectedTemplateIds.length > 0;
    }

    loadRolesForSelectedTemplates(): void {
        if (!this.canLoadRoles()) return;
        this.loadingRoles = true;
        this.rolesLoaded = false;
        this.selectedRoleNames = [];

        const params = {
            page: 0,
            size: 500,
            sortField: 'rolename',
            sortDirection: 'ASC',
            globalFilter: '',
            filters: []
        };

        this.complianceService.getFilteredRoles(
            params,
            this.selectedSystemId!,
            this.selectedRoleConceptTemplateId,
            this.selectedTemplateCodes
        ).subscribe({
            next: res => {
                const data = res.data;
                this.roles = data?.content || data?.rows || data || [];
                this.roleTotalRecords = data?.totalElements || data?.records || this.roles.length;
                this.filteredRoles = [...this.roles];
                this.rolesLoaded = true;
                this.loadingRoles = false;
            },
            error: () => {
                this.loadingRoles = false;
                this.message.error('Failed to load roles');
            }
        });
    }

    onRoleSearchChange(): void {
        if (!this.roleSearch) {
            this.filteredRoles = [...this.roles];
        } else {
            const s = this.roleSearch.toLowerCase();
            this.filteredRoles = this.roles.filter(r =>
                (r.rolename || r.roleName || '').toLowerCase().includes(s)
            );
        }
    }

    getRoleName(role: any): string {
        return role.rolename || role.roleName || '';
    }

    toggleRoleSelection(roleName: string): void {
        const idx = this.selectedRoleNames.indexOf(roleName);
        if (idx >= 0) {
            this.selectedRoleNames.splice(idx, 1);
        } else {
            this.selectedRoleNames.push(roleName);
        }
    }

    isRoleSelected(roleName: string): boolean {
        return this.selectedRoleNames.includes(roleName);
    }

    selectAllRoles(): void {
        if (!this.selectedSystemId || !this.rolesLoaded) return;
        this.selectingAllRoles = true;

        this.complianceService.getAllFilteredRoleNames(
            this.selectedSystemId,
            this.selectedRoleConceptTemplateId,
            this.selectedTemplateCodes
        ).subscribe({
            next: res => {
                if (res.success && res.data) {
                    this.selectedRoleNames = res.data;
                    this.message.success(`Selected all ${this.selectedRoleNames.length} roles`);
                }
                this.selectingAllRoles = false;
            },
            error: () => {
                this.selectingAllRoles = false;
                this.message.error('Failed to select all roles');
            }
        });
    }

    clearRoleSelection(): void {
        this.selectedRoleNames = [];
    }

    // ─── Compliance Check ────────────────────────────
    canRunCheck(): boolean {
        return this.selectedSystemId !== null &&
               this.selectedTemplateIds.length > 0 &&
               this.selectedRoleNames.length > 0;
    }

    onExecuteForeground(): void {
        if (!this.canRunCheck()) return;
        const roleCount = this.selectedRoleNames.length;
        if (roleCount > this.BACKGROUND_THRESHOLD) {
            this.modal.confirm({
                nzTitle: 'Large Dataset Detected',
                nzContent: `You have selected ${roleCount} roles which may take a while to process. ` +
                    `Would you like to run this compliance check in the background?`,
                nzOkText: 'Run in Background',
                nzCancelText: 'Run Now',
                nzOnOk: () => this.executeComplianceCheckBackground(),
                nzOnCancel: () => this.executeComplianceCheckForeground()
            });
        } else {
            this.executeComplianceCheckForeground();
        }
    }

    onExecuteBackground(): void {
        if (!this.canRunCheck()) return;
        this.executeComplianceCheckBackground();
    }

    private buildRequest(): OrgComplianceRequest {
        return {
            sapSystemId: this.selectedSystemId!,
            templateIds: this.selectedTemplateIds,
            roleNames: this.selectedRoleNames,
            roleConceptTemplateId: this.selectedRoleConceptTemplateId || undefined,
            useRoleConceptExtraction: !!this.selectedRoleConceptTemplateId
        };
    }

    private executeComplianceCheckForeground(): void {
        this.runningCheck = true;
        this.resultsLoaded = false;
        this.complianceResults = [];
        this.summary = null;
        const request = this.buildRequest();
        this.lastComplianceRequest = request;

        // Run check and get summary in parallel
        this.complianceService.runComplianceCheck(request, 0, 50).subscribe({
            next: res => {
                if (res.success && res.data) {
                    this.complianceResults = res.data.rows || res.data.content || [];
                    this.resultsLoaded = true;
                }
                this.runningCheck = false;
            },
            error: () => {
                this.runningCheck = false;
                this.message.error('Compliance check failed');
            }
        });

        this.complianceService.getComplianceSummary(request).subscribe({
            next: res => {
                if (res.success && res.data) {
                    this.summary = res.data;
                }
            }
        });
    }

    private executeComplianceCheckBackground(): void {
        this.runningCheck = true;
        const request = this.buildRequest();

        this.complianceService.runBackgroundComplianceCheck(request).subscribe({
            next: res => {
                this.runningCheck = false;
                if (res.success && res.data) {
                    this.backgroundJobId = res.data.jobId;
                    this.message.success(`Background compliance check started (Job #${this.backgroundJobId})`);
                    this.pollJobStatus();
                }
            },
            error: () => {
                this.runningCheck = false;
                this.message.error('Failed to start background job');
            }
        });
    }

    pollJobStatus(): void {
        if (!this.backgroundJobId) return;
        this.jobPolling = true;
        const poll = () => {
            this.complianceService.getJobStatus(this.backgroundJobId!).subscribe({
                next: res => {
                    const status = res.data;
                    this.jobProgress = status?.progress || 0;
                    if (status?.status === 'COMPLETED') {
                        this.jobPolling = false;
                        this.message.success('Compliance check completed');
                    } else if (status?.status === 'FAILED') {
                        this.jobPolling = false;
                        this.message.error('Background job failed');
                    } else {
                        setTimeout(poll, 3000);
                    }
                },
                error: () => { this.jobPolling = false; }
            });
        };
        poll();
    }

    downloadReport(): void {
        if (!this.backgroundJobId) return;
        this.complianceService.downloadJobReport(this.backgroundJobId).subscribe({
            next: blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `compliance-report-${this.backgroundJobId}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => this.message.error('Failed to download report')
        });
    }

    // ─── Results Display ──────────────────────────────
    onResultRowClick(result: OrgComplianceResultDTO): void {
        this.selectedResult = result;
        this.drawerVisible = true;
    }

    closeDrawer(): void {
        this.drawerVisible = false;
        this.selectedResult = null;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'COMPLIANT': return 'status-compliant';
            case 'PARTIAL': return 'status-partial';
            case 'NON_COMPLIANT': return 'status-non-compliant';
            case 'ERROR': return 'status-error';
            default: return '';
        }
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'COMPLIANT': return 'success';
            case 'NON_COMPLIANT': return 'error';
            case 'PARTIAL': return 'warning';
            case 'ERROR': return 'error';
            default: return 'default';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'COMPLIANT': return 'Compliant';
            case 'PARTIAL': return 'Partial';
            case 'NON_COMPLIANT': return 'Non-Compliant';
            case 'ERROR': return 'Error';
            default: return status;
        }
    }

    // ─── Detail Panel: Field Value Rows ──────────────
    getTotalMatchingCount(): number {
        if (!this.selectedResult?.fieldResults) return 0;
        return this.selectedResult.fieldResults.reduce((sum, field) =>
            sum + (field.matchingValues?.length || 0), 0);
    }

    getFieldValueRows(): FieldValueRow[] {
        if (!this.selectedResult?.fieldResults) return [];
        const rows: FieldValueRow[] = [];

        for (const field of this.selectedResult.fieldResults) {
            for (const val of field.matchingValues || []) {
                rows.push({
                    fieldName: field.fieldName,
                    status: 'Match',
                    statusClass: 'status-match',
                    rowClass: 'row-match',
                    roleValue: val,
                    templateValue: val
                });
            }
            for (const val of field.additionalValues || []) {
                rows.push({
                    fieldName: field.fieldName,
                    status: 'Additional',
                    statusClass: 'status-additional',
                    rowClass: 'row-additional',
                    roleValue: val,
                    templateValue: '-'
                });
            }
            for (const val of field.missingValues || []) {
                rows.push({
                    fieldName: field.fieldName,
                    status: 'Missing',
                    statusClass: 'status-missing',
                    rowClass: 'row-missing',
                    roleValue: '-',
                    templateValue: val
                });
            }
        }

        rows.sort((a, b) => {
            const fieldCompare = a.fieldName.localeCompare(b.fieldName);
            if (fieldCompare !== 0) return fieldCompare;
            const statusOrder: Record<string, number> = { 'Match': 0, 'Missing': 1, 'Additional': 2 };
            return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        });

        return rows;
    }

    copyDifferencesToClipboard(): void {
        if (!this.selectedResult) return;
        const lines: string[] = [];
        lines.push(`Role Name\t${this.selectedResult.roleName}`);
        lines.push(`Template\t${this.selectedResult.templateName || this.selectedResult.extractedTemplateCode || ''}`);
        lines.push(`Status\t${this.getStatusLabel(this.selectedResult.overallStatus)}`);
        lines.push('');
        lines.push('Field\tStatus\tRole Value\tTemplate Value');

        for (const row of this.getFieldValueRows()) {
            lines.push(`${row.fieldName}\t${row.status}\t${row.roleValue}\t${row.templateValue}`);
        }

        const text = lines.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            this.message.success('Copied to clipboard');
        }).catch(() => {
            this.message.success('Copied to clipboard');
        });
    }

    // ─── Navigation ──────────────────────────────────
    navigateBack(): void {
        this.location.back();
    }
}
