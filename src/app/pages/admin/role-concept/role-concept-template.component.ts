import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RoleConceptService, RoleConceptTemplate, SapSystemInfo } from './role-concept.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';
import { AdvancedTableComponent } from '../../../shared/components/advanced-table/advanced-table.component';

@Component({
    selector: 'app-role-concept-template',
    templateUrl: './role-concept-template.component.html',
    styleUrls: ['./role-concept-template.component.scss'],
    standalone: false
})
export class RoleConceptTemplateComponent implements OnInit {

    @ViewChild('agTable') agTable: AdvancedTableComponent;

    templates: RoleConceptTemplate[] = [];
    totalRecords = 0;
    loading = false;
    selectedTemplate: RoleConceptTemplate;

    // Duplication Dialog
    showDuplicateDialog = false;
    duplicateName = '';

    // System Assignment Dialog
    showAssignDialog = false;
    availableSystems: SapSystemInfo[] = [];
    selectedSystemIds = new Set<number>();
    originalAssignedIds = new Set<number>();
    loadingSystems = false;
    savingAssignment = false;
    systemSearchTerm = '';

    columns: TableColumn[] = [
        { field: 'name', header: 'Template Name', type: 'text', width: '200px', sortable: true, filterable: true, searchable: true },
        { field: 'roleType', header: 'Role Type', type: 'text', width: '120px', sortable: true, filterable: true },
        { field: 'formatType', header: 'Format Type', type: 'text', width: '150px', sortable: true, filterable: true },
        { field: 'totalLength', header: 'Total Length', type: 'number', width: '100px' },
        { field: 'systemCount', header: 'Systems', type: 'number', width: '80px' },
        { field: 'description', header: 'Description', type: 'text', width: '250px', sortable: true, filterable: true },
        { field: 'isActive', header: 'Active', type: 'boolean', width: '80px' }
    ];

    tableActions: TableAction[] = [
        { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.addTemplate() },
        { label: 'Edit', icon: 'edit', command: () => this.editTemplate(), disabled: true },
        { label: 'Assign to Systems', icon: 'database', command: () => this.openAssignDialog(), disabled: true },
        { label: 'Duplicate', icon: 'copy', command: () => this.openDuplicateDialog(), disabled: true },
        { label: 'Toggle Active', icon: 'poweroff', command: () => this.toggleActive(), disabled: true },
        { label: 'Delete', icon: 'delete', danger: true, command: () => this.deleteTemplate(), disabled: true }
    ];

    constructor(
        private roleConceptService: RoleConceptService,
        private router: Router,
        private notification: NotificationService,
        private confirmation: ConfirmDialogService
    ) { }

    ngOnInit(): void {
    }

    private updateActionState(): void {
        const hasSelection = !!this.selectedTemplate;
        this.tableActions[1].disabled = !hasSelection;
        this.tableActions[2].disabled = !hasSelection;
        this.tableActions[3].disabled = !hasSelection;
        this.tableActions[4].disabled = !hasSelection;
        this.tableActions[5].disabled = !hasSelection;
    }

    loadTemplates(params: TableQueryParams): void {
        this.loading = true;
        this.selectedTemplate = null;
        this.updateActionState();
        this.roleConceptService.searchTemplates(params).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const data = res.data;
                    if (Array.isArray(data)) {
                        this.templates = data;
                        this.totalRecords = data.length;
                    } else {
                        this.templates = data.rows || data.content || [];
                        this.totalRecords = data.records ?? data.totalElements ?? 0;
                    }
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    onRowClick(event: any): void {
        this.selectedTemplate = event;
        this.updateActionState();
    }

    addTemplate(): void {
        this.router.navigate(['/admin/role-concept/templates/new']);
    }

    editTemplate(): void {
        if (!this.selectedTemplate) return;
        this.router.navigate(['/admin/role-concept/templates', this.selectedTemplate.id]);
    }

    toggleActive(): void {
        if (!this.selectedTemplate) return;

        this.roleConceptService.toggleTemplateActive(this.selectedTemplate.id).subscribe(res => {
            if (res.success) {
                this.notification.success('Template status updated');
                this.agTable?.onRefresh();
            } else {
                this.notification.error(res?.message || 'Failed to toggle status');
            }
        });
    }

    deleteTemplate(): void {
        if (!this.selectedTemplate) return;

        this.confirmation.confirm({
            title: 'Delete Template',
            message: `Are you sure you want to delete "${this.selectedTemplate.name}"?`,
        }).subscribe((result: boolean) => {
            if (result) {
                this.roleConceptService.deleteTemplate(this.selectedTemplate.id).subscribe(res => {
                    if (res.success) {
                        this.notification.success('Template deleted');
                        this.selectedTemplate = null;
                        this.updateActionState();
                        this.agTable?.onRefresh();
                    } else {
                        this.notification.error(res?.message || 'Failed to delete template');
                    }
                });
            }
        });
    }

    openDuplicateDialog(): void {
        if (!this.selectedTemplate) return;
        this.duplicateName = `${this.selectedTemplate.name} (Copy)`;
        this.showDuplicateDialog = true;
    }

    closeDuplicateDialog(): void {
        this.showDuplicateDialog = false;
        this.duplicateName = '';
    }

    confirmDuplicate(): void {
        if (!this.duplicateName.trim()) {
            this.notification.error('Please enter a name for the new template');
            return;
        }

        this.roleConceptService.duplicateTemplate(this.selectedTemplate.id, this.duplicateName.trim()).subscribe(res => {
            if (res.success) {
                this.notification.success('Template duplicated');
                this.closeDuplicateDialog();
                this.agTable?.onRefresh();
            } else {
                this.notification.error(res?.message || 'Failed to duplicate template');
            }
        });
    }

    // ========== Assign to Systems ==========

    openAssignDialog(): void {
        if (!this.selectedTemplate) return;

        this.showAssignDialog = true;
        this.loadingSystems = true;
        this.systemSearchTerm = '';
        this.selectedSystemIds.clear();
        this.originalAssignedIds.clear();

        forkJoin({
            systems: this.roleConceptService.getSapSystems(),
            assigned: this.roleConceptService.getAssignedSystems(this.selectedTemplate.id)
        }).subscribe({
            next: ({ systems, assigned }) => {
                if (systems.success) {
                    this.availableSystems = systems.data || [];
                }
                if (assigned.success) {
                    const assignedIds: number[] = assigned.data || [];
                    assignedIds.forEach(id => {
                        this.selectedSystemIds.add(id);
                        this.originalAssignedIds.add(id);
                    });
                }
                this.loadingSystems = false;
            },
            error: () => {
                this.notification.error('Failed to load systems');
                this.loadingSystems = false;
            }
        });
    }

    closeAssignDialog(): void {
        this.showAssignDialog = false;
        this.availableSystems = [];
        this.selectedSystemIds.clear();
        this.originalAssignedIds.clear();
        this.systemSearchTerm = '';
    }

    get filteredSystems(): SapSystemInfo[] {
        if (!this.systemSearchTerm.trim()) {
            return this.availableSystems;
        }
        const term = this.systemSearchTerm.toLowerCase();
        return this.availableSystems.filter(s =>
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

    isAllSelected(): boolean {
        return this.filteredSystems.length > 0 &&
            this.filteredSystems.every(s => this.selectedSystemIds.has(s.id));
    }

    isSomeSelected(): boolean {
        const selectedCount = this.filteredSystems.filter(s => this.selectedSystemIds.has(s.id)).length;
        return selectedCount > 0 && selectedCount < this.filteredSystems.length;
    }

    toggleSelectAll(checked: boolean): void {
        if (checked) {
            this.filteredSystems.forEach(s => this.selectedSystemIds.add(s.id));
        } else {
            this.filteredSystems.forEach(s => this.selectedSystemIds.delete(s.id));
        }
    }

    confirmAssignment(): void {
        if (!this.selectedTemplate) return;

        const currentIds = Array.from(this.selectedSystemIds);
        const originalIds = Array.from(this.originalAssignedIds);

        const toAssign = currentIds.filter(id => !this.originalAssignedIds.has(id));
        const toUnassign = originalIds.filter(id => !this.selectedSystemIds.has(id));

        if (toAssign.length === 0 && toUnassign.length === 0) {
            this.notification.success('No changes to save');
            this.closeAssignDialog();
            return;
        }

        this.savingAssignment = true;

        const operations = [];
        if (toAssign.length > 0) {
            operations.push(this.roleConceptService.assignTemplateToSystems(this.selectedTemplate.id, toAssign));
        }
        if (toUnassign.length > 0) {
            operations.push(this.roleConceptService.unassignTemplateFromSystems(this.selectedTemplate.id, toUnassign));
        }

        forkJoin(operations).subscribe({
            next: (results) => {
                const allSuccess = results.every(r => r.success);
                if (allSuccess) {
                    this.notification.success('System assignments updated');
                    this.closeAssignDialog();
                    this.agTable?.onRefresh();
                } else {
                    const failedResult = results.find(r => !r.success);
                    this.notification.error(failedResult?.message || 'Failed to update assignments');
                }
                this.savingAssignment = false;
            },
            error: () => {
                this.notification.error('Failed to update assignments');
                this.savingAssignment = false;
            }
        });
    }
}
