import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RoleConceptService, RoleConcept, RoleConceptSegment, RoleConceptTemplate, RoleConceptEnumSet } from './role-concept.service';

import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';
import { AdvancedTableComponent } from '../../../shared/components/advanced-table/advanced-table.component';

@Component({
    selector: 'app-role-concept',
    templateUrl: './role-concept.component.html',
    standalone: false
})
export class RoleConceptComponent implements OnInit {

    @Input() sapSystemId: number;
    @Input() sapSystemName: string;

    @ViewChild('agTable') agTable: AdvancedTableComponent;

    concepts: RoleConcept[] = [];
    totalRecords = 0;
    loading = false;
    selectedConcept: RoleConcept;

    // Dialog state
    showDialog = false;
    dialogMode: 'Add' | 'Edit' | 'FromTemplate' = 'Add';
    conceptForm: FormGroup;

    // Reference data
    formatTypes: any[] = [];
    segmentTypes: any[] = [];
    enumSets: RoleConceptEnumSet[] = [];
    templates: RoleConceptTemplate[] = [];

    // Test validation
    testRoleName = '';
    testResult: any = null;

    columns: TableColumn[] = [
        { field: 'name', header: 'Concept Name', type: 'text', width: '200px', sortable: true, filterable: true },
        { field: 'templateName', header: 'Based On Template', type: 'text', width: '180px', sortable: true, filterable: true },
        { field: 'formatType', header: 'Format Type', type: 'text', width: '130px', sortable: true, filterable: true },
        { field: 'description', header: 'Description', type: 'text', width: '250px', sortable: true, filterable: true },
        { field: 'isActive', header: 'Active', type: 'boolean', width: '80px' }
    ];

    tableActions: TableAction[] = [
        { label: 'Add Custom', icon: 'plus-circle', type: 'primary', command: () => this.openDialog('Add') },
        { label: 'Add from Template', icon: 'download', command: () => this.openDialog('FromTemplate') },
        { label: 'Edit', icon: 'edit', command: () => this.openDialog('Edit'), disabled: true },
        { label: 'Test Validation', icon: 'check-circle', command: () => this.showTestDialog(), disabled: true },
        { label: 'Toggle Active', icon: 'poweroff', command: () => this.toggleActive(), disabled: true },
        { label: 'Delete', icon: 'delete', danger: true, command: () => this.deleteConcept(), disabled: true }
    ];

    constructor(
        private roleConceptService: RoleConceptService,
        private fb: FormBuilder,
        private notification: NotificationService,
        private confirmation: ConfirmDialogService,
        private route: ActivatedRoute
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            if (params['systemId']) {
                this.sapSystemId = +params['systemId'];
                this.loadSystemInfo();
            }
        });

        this.loadReferenceData();
    }

    private updateActionState(): void {
        const hasSelection = !!this.selectedConcept;
        this.tableActions[2].disabled = !hasSelection;
        this.tableActions[3].disabled = !hasSelection;
        this.tableActions[4].disabled = !hasSelection;
        this.tableActions[5].disabled = !hasSelection;
    }

    private loadSystemInfo(): void {
        if (this.sapSystemId && !this.sapSystemName) {
            this.roleConceptService.getSapSystems().subscribe(res => {
                if (res.success && res.data) {
                    const sys = res.data.find((s: any) => s.id === this.sapSystemId);
                    if (sys) {
                        this.sapSystemName = sys.destinationName || sys.sid || 'System ' + this.sapSystemId;
                    } else {
                        this.sapSystemName = 'System ' + this.sapSystemId;
                    }
                }
            });
        }
    }

    initForm(): void {
        this.conceptForm = this.fb.group({
            id: [null],
            sapSystemId: [this.sapSystemId],
            templateId: [null],
            name: ['', [Validators.required, Validators.maxLength(100)]],
            description: ['', Validators.maxLength(500)],
            formatType: ['POSITION_BASED', Validators.required],
            delimiter: ['_'],
            totalLength: [null],
            isActive: [true],
            segments: this.fb.array([])
        });
    }

    get segmentsArray(): FormArray {
        return this.conceptForm.get('segments') as FormArray;
    }

    loadReferenceData(): void {
        this.roleConceptService.getFormatTypes().subscribe(res => {
            if (res.success) {
                this.formatTypes = res.data;
            }
        });
        this.roleConceptService.getSegmentTypes().subscribe(res => {
            if (res.success) {
                this.segmentTypes = res.data;
            }
        });
        this.roleConceptService.getEnumSets().subscribe(res => {
            if (res.success) {
                this.enumSets = res.data;
            }
        });
        this.roleConceptService.getTemplatesList(true).subscribe(res => {
            if (res.success) {
                this.templates = res.data;
            }
        });
    }

    loadConcepts(params: TableQueryParams): void {
        if (!this.sapSystemId) return;

        this.loading = true;
        this.selectedConcept = null;
        this.updateActionState();
        this.roleConceptService.searchConcepts(this.sapSystemId, params).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const data = res.data;
                    if (Array.isArray(data)) {
                        this.concepts = data;
                        this.totalRecords = data.length;
                    } else {
                        this.concepts = data.rows || data.content || [];
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
        this.selectedConcept = event;
        this.updateActionState();
    }

    openDialog(mode: 'Add' | 'Edit' | 'FromTemplate'): void {
        this.dialogMode = mode;
        this.initForm();
        this.conceptForm.patchValue({ sapSystemId: this.sapSystemId });

        if (mode === 'Edit' && this.selectedConcept) {
            this.roleConceptService.getConceptById(this.selectedConcept.id).subscribe(res => {
                if (res.success) {
                    const concept = res.data as RoleConcept;
                    this.conceptForm.patchValue({
                        id: concept.id,
                        sapSystemId: concept.sapSystemId,
                        templateId: concept.templateId,
                        name: concept.name,
                        description: concept.description,
                        formatType: concept.formatType,
                        delimiter: concept.delimiter,
                        totalLength: concept.totalLength,
                        isActive: concept.isActive
                    });

                    this.segmentsArray.clear();
                    if (concept.segments) {
                        concept.segments.forEach(seg => this.addSegment(seg));
                    }
                }
            });
        }

        this.showDialog = true;
    }

    closeDialog(): void {
        this.showDialog = false;
        this.testResult = null;
        this.testRoleName = '';
    }

    addSegment(segment?: RoleConceptSegment): void {
        const segmentForm = this.fb.group({
            id: [segment?.id || null],
            segmentName: [segment?.segmentName || '', Validators.required],
            segmentOrder: [segment?.segmentOrder || this.segmentsArray.length + 1, Validators.required],
            segmentType: [segment?.segmentType || 'ENUM', Validators.required],
            startPosition: [segment?.startPosition || null],
            length: [segment?.length || null],
            allowedValues: [segment?.allowedValues || ''],
            enumSetId: [segment?.enumSetId || null],
            minLength: [segment?.minLength || null],
            maxLength: [segment?.maxLength || null],
            regexPattern: [segment?.regexPattern || ''],
            isRequired: [segment?.isRequired !== false],
            errorMessage: [segment?.errorMessage || '']
        });
        this.segmentsArray.push(segmentForm);
    }

    removeSegment(index: number): void {
        this.segmentsArray.removeAt(index);
        this.segmentsArray.controls.forEach((ctrl, i) => {
            ctrl.patchValue({ segmentOrder: i + 1 });
        });
    }

    moveSegmentUp(index: number): void {
        if (index > 0) {
            const segments = this.segmentsArray;
            const current = segments.at(index);
            const previous = segments.at(index - 1);
            segments.setControl(index, previous);
            segments.setControl(index - 1, current);
            segments.controls.forEach((ctrl, i) => {
                ctrl.patchValue({ segmentOrder: i + 1 });
            });
        }
    }

    moveSegmentDown(index: number): void {
        if (index < this.segmentsArray.length - 1) {
            const segments = this.segmentsArray;
            const current = segments.at(index);
            const next = segments.at(index + 1);
            segments.setControl(index, next);
            segments.setControl(index + 1, current);
            segments.controls.forEach((ctrl, i) => {
                ctrl.patchValue({ segmentOrder: i + 1 });
            });
        }
    }

    saveConcept(): void {
        if (this.dialogMode === 'FromTemplate') {
            this.createFromTemplate();
            return;
        }

        if (this.conceptForm.invalid) {
            this.notification.error('Please fill all required fields');
            return;
        }

        const concept: RoleConcept = this.conceptForm.value;
        this.roleConceptService.saveConcept(concept).subscribe(res => {
            if (res?.success) {
                this.notification.success(this.dialogMode === 'Add' ? 'Concept created' : 'Concept updated');
                this.closeDialog();
                this.agTable?.onRefresh();
            } else {
                this.notification.error(res?.message || 'Failed to save concept');
            }
        });
    }

    createFromTemplate(): void {
        const templateId = this.conceptForm.get('templateId').value;
        const name = this.conceptForm.get('name').value;

        if (!templateId || !name) {
            this.notification.error('Please select a template and enter a name');
            return;
        }

        this.roleConceptService.createConceptFromTemplate(templateId, this.sapSystemId, name).subscribe(res => {
            if (res?.success) {
                this.notification.success('Concept created from template');
                this.closeDialog();
                this.agTable?.onRefresh();
            } else {
                this.notification.error(res?.message || 'Failed to create concept');
            }
        });
    }

    toggleActive(): void {
        if (!this.selectedConcept) return;

        this.roleConceptService.toggleConceptActive(this.selectedConcept.id).subscribe(res => {
            if (res?.success) {
                this.notification.success('Concept status updated');
                this.agTable?.onRefresh();
            } else {
                this.notification.error(res?.message || 'Failed to toggle status');
            }
        });
    }

    deleteConcept(): void {
        if (!this.selectedConcept) return;

        const dialogRef = this.confirmation.confirm({
            title: 'Delete Concept',
            message: `Are you sure you want to delete "${this.selectedConcept.name}"?`,
        });

        dialogRef.subscribe((result: boolean) => {
            if (result) {
                this.roleConceptService.deleteConcept(this.selectedConcept.id).subscribe(res => {
                    if (res?.success) {
                        this.notification.success('Concept deleted');
                        this.selectedConcept = null;
                        this.updateActionState();
                        this.agTable?.onRefresh();
                    } else {
                        this.notification.error(res?.message || 'Failed to delete concept');
                    }
                });
            }
        });
    }

    showTestDialog(): void {
        this.testRoleName = '';
        this.testResult = null;
    }

    testValidation(): void {
        if (!this.testRoleName || !this.selectedConcept) return;

        this.roleConceptService.testValidation(this.selectedConcept.id, this.testRoleName).subscribe(res => {
            if (res?.success) {
                this.testResult = res.data;
            } else {
                this.notification.error(res?.message || 'Validation failed');
            }
        });
    }
}
