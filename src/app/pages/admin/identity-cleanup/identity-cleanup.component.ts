import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
    IdentityRepositoryService,
    CleanupScope,
    CleanupOptions,
    CleanupResult,
    CleanupPreview,
    SourceType
} from '../identity-repository/identity-repository.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';

interface TableCount {
    name: string;
    displayName: string;
    count: number;
    category: 'source' | 'identity' | 'cascading' | 'job';
}

interface ScopeOption {
    value: CleanupScope;
    label: string;
    description: string;
}

interface SourceOption {
    code: SourceType;
    displayName: string;
    selected: boolean;
}

@Component({
    standalone: false,
    selector: 'app-identity-cleanup',
    templateUrl: './identity-cleanup.component.html',
    styleUrls: ['./identity-cleanup.component.scss']
})
export class IdentityCleanupComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();

    loading = false;
    executing = false;
    previewLoaded = false;

    selectedScope: CleanupScope = 'FULL_RESET';
    includeJobHistory = false;
    resetAutoIncrement = false;
    cleanOrphanedIdentities = false;

    sourceOptions: SourceOption[] = [
        { code: 'AD', displayName: 'Active Directory', selected: false },
        { code: 'AZURE', displayName: 'Azure AD', selected: false },
        { code: 'CIS', displayName: 'SAP Cloud Identity', selected: false },
        { code: 'SNOW', displayName: 'ServiceNow', selected: false },
        { code: 'SAP', displayName: 'SAP ECC', selected: false }
    ];

    tableCounts: TableCount[] = [];
    totalRecords = 0;
    warnings: string[] = [];
    expandedCategories: Set<string> = new Set(['source', 'identity', 'cascading', 'job']);

    lastResult: CleanupResult | null = null;
    showResult = false;

    scopeOptions: ScopeOption[] = [
        { value: 'FULL_RESET', label: 'Full Reset', description: 'Delete all source and identity data for a clean slate' },
        { value: 'IDENTITY_ONLY', label: 'Identity Only', description: 'Delete identity correlations only, keep source data for re-correlation' },
        { value: 'SOURCE_ONLY', label: 'All Sources', description: 'Delete all source data (NOT recommended - may leave orphaned links)' },
        { value: 'SPECIFIC_SOURCES', label: 'Specific Sources', description: 'Select specific sources to delete with automatic cascading link cleanup' }
    ];

    tableDisplayNames: { [key: string]: { name: string; category: 'source' | 'identity' | 'cascading' | 'job' } } = {
        'cis_group_membership': { name: 'CIS Group Memberships', category: 'source' },
        'cis_user': { name: 'CIS Users', category: 'source' },
        'cis_group': { name: 'CIS Groups', category: 'source' },
        'ad_user': { name: 'AD Users', category: 'source' },
        'azure_users': { name: 'Azure AD Users', category: 'source' },
        'snow_user': { name: 'ServiceNow Users', category: 'source' },
        'central_user': { name: 'SAP Users', category: 'source' },
        'marc_identity_link': { name: 'Identity Links', category: 'identity' },
        'marc_identity_exceptions': { name: 'Correlation Exceptions', category: 'identity' },
        'marc_identity': { name: 'Identities', category: 'identity' },
        'cis_sync_job_log': { name: 'CIS Sync Logs', category: 'job' },
        'cis_sync_job': { name: 'CIS Sync Jobs', category: 'job' },
        'sync_job (identity related)': { name: 'Identity Sync Jobs', category: 'job' }
    };

    constructor(
        private identityService: IdentityRepositoryService,
        private notification: NotificationService,
        private confirmation: ConfirmDialogService
    ) { }

    ngOnInit(): void {
        this.loadPreview();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadPreview(): void {
        this.loading = true;
        this.previewLoaded = false;

        const options = this.buildCleanupOptions();

        this.identityService.getCleanupPreview(options)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (resp) => {
                    this.loading = false;
                    if (resp.success && resp.data) {
                        this.processPreviewData(resp.data as CleanupPreview);
                        this.previewLoaded = true;
                    } else {
                        this.notification.error(resp.message || 'Failed to load preview');
                    }
                },
                error: () => {
                    this.loading = false;
                    this.notification.error('Failed to load cleanup preview');
                }
            });
    }

    private buildCleanupOptions(): Partial<CleanupOptions> {
        const options: Partial<CleanupOptions> = {
            scope: this.selectedScope,
            includeJobHistory: this.includeJobHistory,
            cleanOrphanedIdentities: this.cleanOrphanedIdentities
        };

        if (this.selectedScope === 'SPECIFIC_SOURCES') {
            options.selectedSources = this.sourceOptions
                .filter(s => s.selected)
                .map(s => s.code);
        }

        return options;
    }

    private processPreviewData(data: CleanupPreview): void {
        this.tableCounts = [];
        this.totalRecords = data.totalRecords || 0;
        this.warnings = data.warnings || [];

        if (data.sourceCounts) {
            for (const [tableName, count] of Object.entries(data.sourceCounts)) {
                const tableInfo = this.tableDisplayNames[tableName];
                this.tableCounts.push({
                    name: tableName,
                    displayName: tableInfo?.name || tableName,
                    count: count,
                    category: 'source'
                });
            }
        }

        if (data.identityCounts) {
            for (const [tableName, count] of Object.entries(data.identityCounts)) {
                const tableInfo = this.tableDisplayNames[tableName];
                this.tableCounts.push({
                    name: tableName,
                    displayName: tableInfo?.name || tableName,
                    count: count,
                    category: 'identity'
                });
            }
        }

        if (data.cascadingCounts) {
            for (const [description, count] of Object.entries(data.cascadingCounts)) {
                this.tableCounts.push({
                    name: description,
                    displayName: this.formatCascadingLabel(description),
                    count: count,
                    category: 'cascading'
                });
            }
        }

        if (data.jobCounts) {
            for (const [tableName, count] of Object.entries(data.jobCounts)) {
                const tableInfo = this.tableDisplayNames[tableName];
                this.tableCounts.push({
                    name: tableName,
                    displayName: tableInfo?.name || tableName,
                    count: count,
                    category: 'job'
                });
            }
        }

        const categoryOrder = ['source', 'identity', 'cascading', 'job'];
        this.tableCounts.sort((a, b) =>
            categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
        );
    }

    private formatCascadingLabel(key: string): string {
        if (key.startsWith('identity_links')) {
            const match = key.match(/\(([^)]+)\)/);
            return match ? `${match[1]} Links` : 'Identity Links';
        }
        if (key === 'orphaned_identities') {
            return 'Orphaned Identities';
        }
        return key;
    }

    getSelectedSources(): SourceType[] {
        return this.sourceOptions.filter(s => s.selected).map(s => s.code);
    }

    toggleSource(): void {
        this.loadPreview();
    }

    selectAllSources(): void {
        this.sourceOptions.forEach(s => s.selected = true);
        this.loadPreview();
    }

    clearAllSources(): void {
        this.sourceOptions.forEach(s => s.selected = false);
        this.loadPreview();
    }

    allSourcesSelected(): boolean {
        return this.sourceOptions.every(s => s.selected);
    }

    anySourceSelected(): boolean {
        return this.sourceOptions.some(s => s.selected);
    }

    isExecuteDisabled(): boolean {
        if (this.executing || this.loading) return true;
        if (this.selectedScope === 'SPECIFIC_SOURCES' && !this.anySourceSelected()) return true;
        return this.totalRecords === 0;
    }

    onScopeChange(): void {
        this.loadPreview();
    }

    onJobHistoryChange(): void {
        this.loadPreview();
    }

    executeDryRun(): void {
        this.executeCleanup(true);
    }

    executeCleanupWithConfirmation(): void {
        let message = `This will permanently delete ${this.totalRecords.toLocaleString()} records.`;

        if (this.selectedScope === 'SPECIFIC_SOURCES') {
            const selectedNames = this.sourceOptions
                .filter(s => s.selected)
                .map(s => s.displayName)
                .join(', ');
            message = `This will permanently delete ${this.totalRecords.toLocaleString()} records from: ${selectedNames}.`;
        }

        this.confirmation.confirm({
            title: 'Confirm Data Cleanup',
            message,
            confirmBtnText: 'Delete',
        }).subscribe((result: boolean) => {
            if (result) {
                this.executeCleanup(false);
            }
        });
    }

    private executeCleanup(dryRun: boolean): void {
        this.executing = true;
        this.showResult = false;

        const options: CleanupOptions = {
            scope: this.selectedScope,
            dryRun,
            includeJobHistory: this.includeJobHistory,
            resetAutoIncrement: this.resetAutoIncrement,
            cleanOrphanedIdentities: this.cleanOrphanedIdentities
        };

        if (this.selectedScope === 'SPECIFIC_SOURCES') {
            options.selectedSources = this.sourceOptions
                .filter(s => s.selected)
                .map(s => s.code);
        }

        this.identityService.executeCleanup(options)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (resp) => {
                    this.executing = false;
                    if (resp.success && resp.data) {
                        this.lastResult = resp.data;
                        this.showResult = true;

                        if (dryRun) {
                            this.notification.success('Dry run completed. No data was deleted.');
                        } else {
                            this.notification.success(`Cleanup completed. ${resp.data.totalDeleted.toLocaleString()} records deleted.`);
                            this.loadPreview();
                        }
                    } else {
                        this.notification.error(resp.message || 'Cleanup failed');
                    }
                },
                error: () => {
                    this.executing = false;
                    this.notification.error('Cleanup operation failed');
                }
            });
    }

    getCategoryLabel(category: string): string {
        switch (category) {
            case 'source': return 'Source Data';
            case 'identity': return 'Identity Data';
            case 'cascading': return 'Cascading Deletes';
            case 'job': return 'Job History';
            default: return category;
        }
    }

    getCategoryIcon(category: string): string {
        switch (category) {
            case 'source': return 'database';
            case 'identity': return 'user';
            case 'cascading': return 'disconnect';
            case 'job': return 'history';
            default: return 'folder';
        }
    }

    getRecordsByCategory(category: string): TableCount[] {
        return this.tableCounts.filter(t => t.category === category);
    }

    getCategories(): string[] {
        const categories = [...new Set(this.tableCounts.map(t => t.category))];
        const order = ['source', 'identity', 'cascading', 'job'];
        return categories.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }

    getCategoryTotal(category: string): number {
        return this.tableCounts
            .filter(t => t.category === category)
            .reduce((sum, t) => sum + t.count, 0);
    }

    toggleCategory(category: string): void {
        if (this.expandedCategories.has(category)) {
            this.expandedCategories.delete(category);
        } else {
            this.expandedCategories.add(category);
        }
    }

    isCategoryExpanded(category: string): boolean {
        return this.expandedCategories.has(category);
    }

    getScopeDescription(): string {
        return this.scopeOptions.find(s => s.value === this.selectedScope)?.description || '';
    }

    formatExecutionTime(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }

    formatTimestamp(timestamp: number): string {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString();
    }
}
