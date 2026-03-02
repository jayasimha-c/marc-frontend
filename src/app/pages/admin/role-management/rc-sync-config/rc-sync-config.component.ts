import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

import {
    RcSyncConfigService,
    SapSystemInfo,
    UserInfo,
    RcSyncConfig,
    RcConceptSummary,
    RcSyncJob,
} from './rc-sync-config.service';
import { PatternTestDialogComponent } from './pattern-test-dialog/pattern-test-dialog.component';

export interface NamingRule {
    pattern: string;
    patternType: string;
    businessProcess?: string;
    subBusinessProcess?: string;
    department?: string;
    division?: string;
    criticality?: string;
    roleType?: string;
    approver?: string;
    backupApprover?: string;
    selected?: boolean;
}

export interface MasterDataItem {
    code: string;
    name: string;
    selected?: boolean;
}

export type MasterDataCategory = 'businessProcesses' | 'subBusinessProcesses' | 'departments' | 'divisions' | 'criticalities' | 'roleTypes';

@Component({
    selector: 'app-rc-sync-config',
    templateUrl: './rc-sync-config.component.html',
    styleUrls: ['./rc-sync-config.component.scss'],
    standalone: false,
})
export class RcSyncConfigComponent implements OnInit, OnDestroy {
    @ViewChild('excelFileInput') excelFileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('masterDataFileInput') masterDataFileInput!: ElementRef<HTMLInputElement>;

    private destroy$ = new Subject<void>();

    sapSystems: SapSystemInfo[] = [];
    users: UserInfo[] = [];
    concepts: RcConceptSummary[] = [];
    selectedTabIndex = 0;

    // System for testing patterns
    testSystemId: number | null = null;

    // Sync Jobs Tab
    selectedConceptId: number | null = null;
    selectedConcept: RcConceptSummary | null = null;
    runningSync = false;
    loadingJobs = false;
    jobs: RcSyncJob[] = [];
    jobsTotal = 0;
    jobsPage = 1;
    jobsPageSize = 10;

    loading = false;
    savingConfig = false;

    // Assign to Systems Dialog
    showAssignDialog = false;
    selectedSystemIds = new Set<number>();
    originalAssignedIds = new Set<number>();
    loadingSystems = false;
    savingAssignment = false;
    systemSearchTerm = '';

    // Master Data Config
    masterDataConfig: RcSyncConfig | null = null;
    masterDataYaml = '';
    masterDataParsed: any = null;

    // Selected category for master data
    selectedCategory: MasterDataCategory = 'businessProcesses';
    categoryOptions: { value: MasterDataCategory; label: string }[] = [
        { value: 'businessProcesses', label: 'Business Process' },
        { value: 'subBusinessProcesses', label: 'Sub-Process' },
        { value: 'departments', label: 'Department' },
        { value: 'divisions', label: 'Division' },
        { value: 'criticalities', label: 'Criticality' },
        { value: 'roleTypes', label: 'Role Type' }
    ];

    // Naming Conventions Config
    namingConfig: RcSyncConfig | null = null;
    namingYaml = '';

    // Rules table data
    rules: NamingRule[] = [];
    rulesAllChecked = false;
    rulesIndeterminate = false;

    // Master data table data
    masterDataItems: MasterDataItem[] = [];
    masterDataAllChecked = false;
    masterDataIndeterminate = false;

    // Dropdown values for rules
    patternTypes = ['PREFIX', 'SUFFIX', 'CONTAINS', 'REGEX'];
    businessProcesses: string[] = [];
    subBusinessProcesses: string[] = [];
    departments: string[] = [];
    divisions: string[] = [];
    criticalities: string[] = [];
    roleTypes: string[] = ['Single Role', 'Composite Role', 'Group'];
    userOptions: string[] = [];

    constructor(
        private rcSyncService: RcSyncConfigService,
        private message: NzMessageService,
        private nzModal: NzModalService
    ) {}

    ngOnInit(): void {
        this.loadInfo();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ─── Initial Load ───────────────────────────────────
    private loadInfo(): void {
        this.loading = true;
        this.rcSyncService.getInfo()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.sapSystems = res.data.sapSystems || [];
                        this.users = res.data.users || [];
                        this.concepts = res.data.concepts || [];
                        this.userOptions = this.users.map(u => u.username);
                        this.loadConfigs();
                        this.loadJobs();
                    }
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                    this.message.error('Failed to load initial data');
                }
            });
    }

    private loadConfigs(): void {
        this.loadMasterDataConfig();
        this.loadNamingConfig();
    }

    // ─── Master Data Config ─────────────────────────────
    private loadMasterDataConfig(): void {
        this.rcSyncService.getConfig('MASTER_DATA')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.masterDataConfig = res.data;
                        this.masterDataYaml = res.data.yamlContent || '';
                        this.parseMasterDataYaml();
                        this.updateDropdownValuesFromMasterData();
                        this.loadMasterDataForCategory();
                    }
                },
                error: () => this.message.error('Failed to load master data config')
            });
    }

    private parseMasterDataYaml(): void {
        if (this.masterDataConfig?.data) {
            this.masterDataParsed = this.masterDataConfig.data;
        } else {
            this.masterDataParsed = null;
        }
    }

    private updateDropdownValuesFromMasterData(): void {
        if (!this.masterDataParsed) return;
        this.businessProcesses = this.extractValues(this.masterDataParsed.businessProcesses);
        this.subBusinessProcesses = this.extractValues(this.masterDataParsed.subBusinessProcesses);
        this.departments = this.extractValues(this.masterDataParsed.departments);
        this.divisions = this.extractValues(this.masterDataParsed.divisions);
        this.criticalities = this.extractValues(this.masterDataParsed.criticalities);
    }

    private extractValues(items: any[]): string[] {
        if (!items || !Array.isArray(items)) return [];
        return items.map(item => {
            if (typeof item === 'string') return item;
            return item.code || item.name || item.value || '';
        }).filter(v => v);
    }

    onCategoryChange(): void {
        this.loadMasterDataForCategory();
    }

    private loadMasterDataForCategory(): void {
        if (!this.masterDataParsed) {
            this.masterDataItems = [];
            return;
        }
        const items = this.masterDataParsed[this.selectedCategory] || [];
        this.masterDataItems = items.map((item: any) => {
            if (typeof item === 'string') {
                return { code: item, name: item, selected: false };
            }
            return {
                code: item.code || item.value || item.name || '',
                name: item.name || item.label || item.code || '',
                selected: false
            };
        });
        this.masterDataAllChecked = false;
        this.masterDataIndeterminate = false;
    }

    // ─── Naming Config ──────────────────────────────────
    private loadNamingConfig(): void {
        this.rcSyncService.getConfig('NAMING_CONVENTIONS')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.namingConfig = res.data;
                        this.namingYaml = res.data.yamlContent || '';
                        this.parseNamingYaml();
                    }
                },
                error: () => this.message.error('Failed to load naming conventions config')
            });
    }

    private parseNamingYaml(): void {
        this.rules = [];
        if (this.namingConfig?.data?.mappings && Array.isArray(this.namingConfig.data.mappings)) {
            for (const rule of this.namingConfig.data.mappings) {
                let approver = '';
                if (Array.isArray(rule.approver)) {
                    approver = rule.approver.join('\n');
                } else if (rule.approver) {
                    approver = rule.approver;
                }

                let backupApprover = '';
                if (Array.isArray(rule.backupApprover)) {
                    backupApprover = rule.backupApprover.join('\n');
                } else if (rule.backupApprover) {
                    backupApprover = rule.backupApprover;
                }

                this.rules.push({
                    pattern: rule.pattern || '',
                    patternType: rule.patternType || 'PREFIX',
                    businessProcess: rule.businessProcess || '',
                    subBusinessProcess: rule.subBusinessProcess || '',
                    department: rule.department || '',
                    division: rule.division || '',
                    criticality: rule.criticality || '',
                    roleType: rule.roleType || '',
                    approver,
                    backupApprover,
                    selected: false
                });
            }
        }
        this.rulesAllChecked = false;
        this.rulesIndeterminate = false;
    }

    // ─── Rules Table Actions ────────────────────────────
    addRule(): void {
        this.rules = [...this.rules, {
            pattern: '',
            patternType: 'PREFIX',
            businessProcess: '',
            subBusinessProcess: '',
            department: '',
            division: '',
            criticality: '',
            roleType: '',
            approver: '',
            backupApprover: '',
            selected: false
        }];
    }

    deleteSelectedRules(): void {
        this.rules = this.rules.filter(r => !r.selected);
        this.rulesAllChecked = false;
        this.rulesIndeterminate = false;
    }

    cancelRulesEdit(): void {
        this.parseNamingYaml();
    }

    onRulesAllChecked(checked: boolean): void {
        this.rules.forEach(r => r.selected = checked);
        this.rulesAllChecked = checked;
        this.rulesIndeterminate = false;
    }

    onRulesItemChecked(): void {
        const allChecked = this.rules.length > 0 && this.rules.every(r => r.selected);
        const noneChecked = this.rules.every(r => !r.selected);
        this.rulesAllChecked = allChecked;
        this.rulesIndeterminate = !allChecked && !noneChecked;
    }

    testPattern(rule: NamingRule): void {
        if (!rule.pattern) {
            this.message.error('Please enter a pattern first');
            return;
        }
        if (!this.testSystemId) {
            this.message.error('Please select a Test System first');
            return;
        }

        this.nzModal.create({
            nzTitle: 'Test Pattern',
            nzContent: PatternTestDialogComponent,
            nzWidth: 600,
            nzBodyStyle: { maxHeight: '80vh', overflow: 'auto' },
            nzData: {
                sapSystemId: this.testSystemId,
                pattern: rule.pattern,
                patternType: rule.patternType
            },
            nzFooter: null
        });
    }

    // ─── Master Data Table Actions ──────────────────────
    addMasterDataRow(): void {
        this.masterDataItems = [...this.masterDataItems, { code: '', name: '', selected: false }];
    }

    deleteSelectedMasterData(): void {
        this.masterDataItems = this.masterDataItems.filter(i => !i.selected);
        this.masterDataAllChecked = false;
        this.masterDataIndeterminate = false;
    }

    cancelMasterDataEdit(): void {
        this.loadMasterDataForCategory();
    }

    onMasterDataAllChecked(checked: boolean): void {
        this.masterDataItems.forEach(i => i.selected = checked);
        this.masterDataAllChecked = checked;
        this.masterDataIndeterminate = false;
    }

    onMasterDataItemChecked(): void {
        const allChecked = this.masterDataItems.length > 0 && this.masterDataItems.every(i => i.selected);
        const noneChecked = this.masterDataItems.every(i => !i.selected);
        this.masterDataAllChecked = allChecked;
        this.masterDataIndeterminate = !allChecked && !noneChecked;
    }

    // ─── Save Configs ───────────────────────────────────
    saveNamingConfig(): void {
        this.namingYaml = this.buildNamingYaml(this.rules);
        this.savingConfig = true;

        this.rcSyncService.saveConfig('NAMING_CONVENTIONS', this.namingYaml)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.savingConfig = false;
                    if (res.success) {
                        this.message.success('Auto-categorization rules saved');
                        this.loadNamingConfig();
                    } else {
                        this.message.error(res.message || 'Failed to save configuration');
                    }
                },
                error: () => {
                    this.savingConfig = false;
                    this.message.error('Failed to save configuration');
                }
            });
    }

    private buildNamingYaml(rules: NamingRule[]): string {
        const lines: string[] = ['defaults:', '  criticality: MEDIUM', '', 'mappings:'];
        for (const rule of rules) {
            if (!rule.pattern) continue;
            lines.push(`  - pattern: "${rule.pattern}"`);
            lines.push(`    patternType: ${rule.patternType || 'PREFIX'}`);
            if (rule.businessProcess) lines.push(`    businessProcess: "${rule.businessProcess}"`);
            if (rule.subBusinessProcess) lines.push(`    subBusinessProcess: "${rule.subBusinessProcess}"`);
            if (rule.department) lines.push(`    department: "${rule.department}"`);
            if (rule.division) lines.push(`    division: "${rule.division}"`);
            if (rule.criticality) lines.push(`    criticality: ${rule.criticality}`);
            if (rule.roleType) lines.push(`    roleType: "${rule.roleType}"`);

            if (rule.approver) {
                const approvers = this.parseMultipleValues(rule.approver);
                if (approvers.length === 1) {
                    lines.push(`    approver: "${approvers[0]}"`);
                } else if (approvers.length > 1) {
                    lines.push(`    approver:`);
                    for (const a of approvers) {
                        lines.push(`      - "${a}"`);
                    }
                }
            }

            if (rule.backupApprover) {
                const backupApprovers = this.parseMultipleValues(rule.backupApprover);
                if (backupApprovers.length === 1) {
                    lines.push(`    backupApprover: "${backupApprovers[0]}"`);
                } else if (backupApprovers.length > 1) {
                    lines.push(`    backupApprover:`);
                    for (const ba of backupApprovers) {
                        lines.push(`      - "${ba}"`);
                    }
                }
            }
            lines.push('');
        }
        return lines.join('\n');
    }

    saveMasterDataConfig(): void {
        if (!this.masterDataParsed) {
            this.masterDataParsed = {};
        }

        const items = this.masterDataItems
            .filter(item => item.code || item.name)
            .map(item => ({
                code: item.code || item.name,
                name: item.name || item.code
            }));

        this.masterDataParsed[this.selectedCategory] = items;
        this.masterDataYaml = this.buildMasterDataYaml();
        this.savingConfig = true;

        this.rcSyncService.saveConfig('MASTER_DATA', this.masterDataYaml)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.savingConfig = false;
                    if (res.success) {
                        this.message.success('Master data configuration saved');
                        this.loadMasterDataConfig();
                    } else {
                        this.message.error(res.message || 'Failed to save configuration');
                    }
                },
                error: () => {
                    this.savingConfig = false;
                    this.message.error('Failed to save configuration');
                }
            });
    }

    private buildMasterDataYaml(): string {
        if (!this.masterDataParsed) return '';
        const lines: string[] = [];
        for (const category of this.categoryOptions) {
            const items = this.masterDataParsed[category.value] || [];
            if (items.length > 0) {
                lines.push(`${category.value}:`);
                for (const item of items) {
                    if (typeof item === 'string') {
                        lines.push(`  - ${item}`);
                    } else {
                        lines.push(`  - code: "${item.code || item.name || ''}"`);
                        lines.push(`    name: "${item.name || item.code || ''}"`);
                    }
                }
                lines.push('');
            }
        }
        return lines.join('\n');
    }

    private parseMultipleValues(input: string): string[] {
        if (!input) return [];
        return input
            .split(/[,\n]+/)
            .map(v => v.trim())
            .filter(v => v.length > 0);
    }

    // ─── Excel Import/Export ────────────────────────────
    triggerRulesImport(): void {
        this.excelFileInput?.nativeElement?.click();
    }

    triggerMasterDataImport(): void {
        this.masterDataFileInput?.nativeElement?.click();
    }

    onRulesFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                const importedRules: NamingRule[] = jsonData.map(row => {
                    const approverRaw = row['Approver(s)'] || row['Approver'] || row['approver'] || '';
                    const backupApproverRaw = row['Backup Approver(s)'] || row['Backup Approver'] || row['backupApprover'] || '';

                    return {
                        pattern: row['Pattern'] || row['pattern'] || '',
                        patternType: row['Match Type'] || row['patternType'] || 'PREFIX',
                        businessProcess: row['Business Process'] || row['businessProcess'] || '',
                        subBusinessProcess: row['Sub-Process'] || row['subBusinessProcess'] || '',
                        department: row['Department'] || row['department'] || '',
                        division: row['Division'] || row['division'] || '',
                        criticality: row['Criticality'] || row['criticality'] || '',
                        roleType: row['Role Type'] || row['roleType'] || '',
                        approver: approverRaw.toString().replace(/,\s*/g, '\n'),
                        backupApprover: backupApproverRaw.toString().replace(/,\s*/g, '\n'),
                        selected: false
                    };
                });

                this.rules = [...this.rules, ...importedRules];
                this.message.success(`Imported ${importedRules.length} rules`);
            } catch {
                this.message.error('Failed to parse Excel file');
            }
            input.value = '';
        };

        reader.readAsBinaryString(file);
    }

    onMasterDataFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                const importedItems: MasterDataItem[] = jsonData.map(row => ({
                    code: row['Code'] || row['code'] || '',
                    name: row['Name'] || row['name'] || '',
                    selected: false
                }));

                this.masterDataItems = [...this.masterDataItems, ...importedItems];
                this.message.success(`Imported ${importedItems.length} items`);
            } catch {
                this.message.error('Failed to parse Excel file');
            }
            input.value = '';
        };

        reader.readAsBinaryString(file);
    }

    exportRulesToExcel(): void {
        const exportData = this.rules.map(rule => ({
            'Pattern': rule.pattern || '',
            'Match Type': rule.patternType || '',
            'Business Process': rule.businessProcess || '',
            'Sub-Process': rule.subBusinessProcess || '',
            'Department': rule.department || '',
            'Division': rule.division || '',
            'Criticality': rule.criticality || '',
            'Role Type': rule.roleType || '',
            'Approver(s)': (rule.approver || '').replace(/\n/g, ', '),
            'Backup Approver(s)': (rule.backupApprover || '').replace(/\n/g, ', ')
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Auto-Categorization Rules');

        worksheet['!cols'] = [
            { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 15 },
            { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
            { wch: 30 }, { wch: 30 }
        ];

        XLSX.writeFile(workbook, 'auto_categorization_rules.xlsx');
    }

    exportMasterDataToExcel(): void {
        const exportData = this.masterDataItems.map(item => ({
            'Code': item.code || '',
            'Name': item.name || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        const categoryLabel = this.categoryOptions.find(c => c.value === this.selectedCategory)?.label || 'Master Data';
        XLSX.utils.book_append_sheet(workbook, worksheet, categoryLabel);

        worksheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
        XLSX.writeFile(workbook, `${categoryLabel.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
    }

    // ─── Sync Jobs ──────────────────────────────────────
    onConceptChange(): void {
        this.selectedConcept = this.concepts.find(c => c.id === this.selectedConceptId) || null;
    }

    runConceptSync(): void {
        if (!this.selectedConceptId) {
            this.message.error('Please select a concept to sync');
            return;
        }

        this.runningSync = true;
        this.rcSyncService.runConceptSync(this.selectedConceptId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.runningSync = false;
                    if (res.success) {
                        this.message.success(res.data.message || `Sync started for ${res.data.systemCount} system(s)`);
                        setTimeout(() => this.loadJobs(), 1000);
                    } else {
                        this.message.error(res.message || 'Failed to start sync');
                    }
                },
                error: (err) => {
                    this.runningSync = false;
                    this.message.error(err.error?.message || 'Failed to start sync');
                }
            });
    }

    loadJobs(): void {
        this.loadingJobs = true;
        this.rcSyncService.getJobs(undefined, this.jobsPage - 1, this.jobsPageSize)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.loadingJobs = false;
                    if (res.success && res.data) {
                        this.jobs = res.data.content || [];
                        this.jobsTotal = res.data.totalElements || 0;
                    }
                },
                error: () => {
                    this.loadingJobs = false;
                    this.message.error('Failed to load sync jobs');
                }
            });
    }

    onJobsPageChange(page: number): void {
        this.jobsPage = page;
        this.loadJobs();
    }

    onJobsPageSizeChange(size: number): void {
        this.jobsPageSize = size;
        this.jobsPage = 1;
        this.loadJobs();
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'IN_PROGRESS': return 'processing';
            case 'FAILED': return 'error';
            default: return 'default';
        }
    }

    formatDate(timestamp: number | undefined): string {
        if (!timestamp) return '-';
        return new Date(timestamp).toLocaleString();
    }

    // ─── Assign to Systems Dialog ───────────────────────
    openAssignDialog(): void {
        this.showAssignDialog = true;
        this.loadingSystems = true;
        this.systemSearchTerm = '';
        this.selectedSystemIds.clear();
        this.originalAssignedIds.clear();

        this.rcSyncService.getAssignedSystems()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        const assignedIds: number[] = res.data || [];
                        assignedIds.forEach(id => {
                            this.selectedSystemIds.add(id);
                            this.originalAssignedIds.add(id);
                        });
                    }
                    this.loadingSystems = false;
                },
                error: () => {
                    this.message.error('Failed to load assigned systems');
                    this.loadingSystems = false;
                }
            });
    }

    closeAssignDialog(): void {
        this.showAssignDialog = false;
        this.selectedSystemIds.clear();
        this.originalAssignedIds.clear();
        this.systemSearchTerm = '';
    }

    get filteredSystems(): SapSystemInfo[] {
        if (!this.systemSearchTerm.trim()) {
            return this.sapSystems;
        }
        const term = this.systemSearchTerm.toLowerCase();
        return this.sapSystems.filter(s =>
            s.destinationName?.toLowerCase().includes(term) ||
            s.sid?.toLowerCase().includes(term)
        );
    }

    toggleSystem(systemId: number): void {
        if (this.selectedSystemIds.has(systemId)) {
            this.selectedSystemIds.delete(systemId);
        } else {
            this.selectedSystemIds.add(systemId);
        }
    }

    isAllSystemsSelected(): boolean {
        return this.filteredSystems.length > 0 &&
            this.filteredSystems.every(s => this.selectedSystemIds.has(s.id));
    }

    isSomeSystemsSelected(): boolean {
        const selectedCount = this.filteredSystems.filter(s => this.selectedSystemIds.has(s.id)).length;
        return selectedCount > 0 && selectedCount < this.filteredSystems.length;
    }

    toggleSelectAllSystems(checked: boolean): void {
        if (checked) {
            this.filteredSystems.forEach(s => this.selectedSystemIds.add(s.id));
        } else {
            this.filteredSystems.forEach(s => this.selectedSystemIds.delete(s.id));
        }
    }

    confirmAssignment(): void {
        const currentIds = Array.from(this.selectedSystemIds);
        const originalIds = Array.from(this.originalAssignedIds);

        const toAssign = currentIds.filter(id => !this.originalAssignedIds.has(id));
        const toUnassign = originalIds.filter(id => !this.selectedSystemIds.has(id));

        if (toAssign.length === 0 && toUnassign.length === 0) {
            this.message.success('No changes to save');
            this.closeAssignDialog();
            return;
        }

        this.savingAssignment = true;

        this.rcSyncService.updateAssignedSystems(currentIds)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.message.success('System assignments updated');
                        this.closeAssignDialog();
                    } else {
                        this.message.error(res.message || 'Failed to update assignments');
                    }
                    this.savingAssignment = false;
                },
                error: () => {
                    this.message.error('Failed to update assignments');
                    this.savingAssignment = false;
                }
            });
    }

    get assignedSystemCount(): number {
        return this.selectedSystemIds.size;
    }
}
