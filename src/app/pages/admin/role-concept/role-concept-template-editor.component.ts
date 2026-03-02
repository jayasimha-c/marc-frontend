import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RoleConceptService, RoleConceptTemplate, RoleConceptSegment, RoleConceptEnumSet } from './role-concept.service';

interface CanvasCell {
    position: number;
    char: string;
    segmentIndex: number | null;
    selected: boolean;
}

interface SegmentDisplay {
    id?: number;
    segmentName: string;
    segmentOrder: number;
    segmentType: 'FIXED' | 'ENUM' | 'FREE_TEXT' | 'PATTERN' | 'ORG_TEMPLATE';
    startPosition: number;
    endPosition: number;
    length: number;
    fixedValue?: string;
    allowedValues?: string;
    enumSetId?: number;
    minLength?: number;
    maxLength?: number;
    regexPattern?: string;
    isRequired: boolean;
    errorMessage?: string;
    color: string;
}

@Component({
    selector: 'app-role-concept-template-editor',
    templateUrl: './role-concept-template-editor.component.html',
    styleUrls: ['./role-concept-template-editor.component.scss'],
    standalone: false
})
export class RoleConceptTemplateEditorComponent implements OnInit {

    // Mode
    isEditMode = false;
    templateId: number | null = null;
    loading = false;
    saving = false;
    showVersionHistory = false;

    // Form
    templateForm: FormGroup;

    // Canvas
    totalLength = 20;
    canvasCells: CanvasCell[] = [];

    // Selection
    isSelecting = false;
    selectionStart: number | null = null;
    selectionEnd: number | null = null;

    // Segments
    segments: SegmentDisplay[] = [];
    segmentColors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];

    // Segment Panel
    showSegmentPanel = false;
    editingSegmentIndex: number | null = null;
    segmentForm: FormGroup;

    // Reference data
    enumSets: RoleConceptEnumSet[] = [];

    // Test validation
    testRoleName = '';
    testResult: { valid: boolean; errors: string[] } | null = null;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private roleConceptService: RoleConceptService,
        private notification: NotificationService,
        private confirmation: ConfirmDialogService
    ) {
        this.initForms();
    }

    ngOnInit(): void {
        this.loadEnumSets();

        this.route.params.subscribe(params => {
            if (params['id'] && params['id'] !== 'new') {
                this.templateId = +params['id'];
                this.isEditMode = true;
                this.loadTemplate();
            } else {
                this.generateCanvas();
            }
        });
    }

    private initForms(): void {
        this.templateForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(100)]],
            description: ['', Validators.maxLength(500)],
            roleType: ['SINGLE'],
            totalLength: [20, [Validators.required, Validators.min(1), Validators.max(100)]],
            isActive: [true]
        });

        this.segmentForm = this.fb.group({
            segmentName: ['', [Validators.required, Validators.maxLength(50)]],
            segmentType: ['ENUM', Validators.required],
            fixedValue: [''],
            allowedValues: [''],
            enumSetId: [null],
            minLength: [null],
            maxLength: [null],
            regexPattern: [''],
            isRequired: [true],
            errorMessage: ['']
        });
    }

    private loadEnumSets(): void {
        this.roleConceptService.getEnumSets().subscribe(res => {
            if (res.success) {
                this.enumSets = res.data || [];
            }
        });
    }

    private loadTemplate(): void {
        if (!this.templateId) return;

        this.loading = true;
        this.roleConceptService.getTemplateById(this.templateId).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const template = res.data as RoleConceptTemplate;
                    this.templateForm.patchValue({
                        name: template.name,
                        description: template.description,
                        roleType: template.roleType || 'SINGLE',
                        totalLength: template.totalLength || 20,
                        isActive: template.isActive
                    });
                    this.totalLength = template.totalLength || 20;
                    this.generateCanvas();

                    // Load segments
                    if (template.segments && template.segments.length > 0) {
                        this.segments = template.segments.map((seg, idx) => ({
                            id: seg.id,
                            segmentName: seg.segmentName,
                            segmentOrder: seg.segmentOrder,
                            segmentType: this.mapSegmentType(seg),
                            startPosition: seg.startPosition || 1,
                            endPosition: (seg.startPosition || 1) + (seg.length || 1) - 1,
                            length: seg.length || 1,
                            fixedValue: seg.segmentType === 'ENUM' && seg.allowedValues?.split(',').length === 1 ? seg.allowedValues : undefined,
                            allowedValues: seg.allowedValues,
                            enumSetId: seg.enumSetId,
                            minLength: seg.minLength,
                            maxLength: seg.maxLength,
                            regexPattern: seg.regexPattern,
                            isRequired: seg.isRequired,
                            errorMessage: seg.errorMessage,
                            color: this.segmentColors[idx % this.segmentColors.length]
                        }));
                        this.updateCanvasWithSegments();
                    }
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.notification.error('Failed to load template');
            }
        });
    }

    private mapSegmentType(seg: RoleConceptSegment): 'FIXED' | 'ENUM' | 'FREE_TEXT' | 'PATTERN' | 'ORG_TEMPLATE' {
        if (seg.segmentType === 'PATTERN') return 'PATTERN';
        if (seg.segmentType === 'FREE_TEXT') return 'FREE_TEXT';
        if (seg.segmentType === 'ORG_TEMPLATE') return 'ORG_TEMPLATE';
        if (seg.segmentType === 'ENUM') {
            if (seg.allowedValues && seg.allowedValues.split(',').length === 1) {
                return 'FIXED';
            }
            return 'ENUM';
        }
        return 'ENUM';
    }

    // ==================== Canvas ====================

    generateCanvas(): void {
        this.totalLength = this.templateForm.get('totalLength')?.value || 20;
        this.canvasCells = [];

        for (let i = 0; i < this.totalLength; i++) {
            this.canvasCells.push({
                position: i + 1,
                char: '_',
                segmentIndex: null,
                selected: false
            });
        }

        this.updateCanvasWithSegments();
    }

    updateCanvasWithSegments(): void {
        this.canvasCells.forEach(cell => {
            cell.segmentIndex = null;
            cell.char = '_';
        });

        this.segments.forEach((segment, idx) => {
            const sampleText = this.getSegmentSampleText(segment);

            for (let pos = segment.startPosition; pos <= segment.endPosition; pos++) {
                const cellIndex = pos - 1;
                if (cellIndex >= 0 && cellIndex < this.canvasCells.length) {
                    this.canvasCells[cellIndex].segmentIndex = idx;
                    const charIndex = pos - segment.startPosition;
                    this.canvasCells[cellIndex].char = sampleText[charIndex] || '_';
                }
            }
        });
    }

    private getSegmentSampleText(segment: SegmentDisplay): string {
        const length = segment.length;

        switch (segment.segmentType) {
            case 'FIXED':
                return (segment.fixedValue || '').padEnd(length, '_').substring(0, length);
            case 'ENUM':
                if (segment.allowedValues) {
                    const firstValue = segment.allowedValues.split(',')[0]?.trim() || '';
                    return firstValue.padEnd(length, '_').substring(0, length);
                }
                return 'E'.repeat(length);
            case 'FREE_TEXT':
                return '*'.repeat(length);
            case 'PATTERN':
                return '#'.repeat(length);
            case 'ORG_TEMPLATE':
                return 'O'.repeat(length);
            default:
                return '_'.repeat(length);
        }
    }

    // ==================== Canvas Selection ====================

    onCellMouseDown(cell: CanvasCell, event: MouseEvent): void {
        event.preventDefault();
        if (cell.segmentIndex !== null) return;

        this.isSelecting = true;
        this.selectionStart = cell.position;
        this.selectionEnd = cell.position;
        this.updateSelection();
    }

    onCellMouseEnter(cell: CanvasCell): void {
        if (!this.isSelecting) return;
        if (cell.segmentIndex !== null) return;

        this.selectionEnd = cell.position;
        this.updateSelection();
    }

    onCellMouseUp(): void {
        if (this.isSelecting && this.selectionStart !== null && this.selectionEnd !== null) {
            this.isSelecting = false;
            if (this.getSelectedLength() > 0) {
                this.openSegmentPanel();
            }
        }
    }

    private updateSelection(): void {
        const start = Math.min(this.selectionStart || 0, this.selectionEnd || 0);
        const end = Math.max(this.selectionStart || 0, this.selectionEnd || 0);

        this.canvasCells.forEach(cell => {
            cell.selected = cell.position >= start && cell.position <= end && cell.segmentIndex === null;
        });
    }

    clearSelection(): void {
        this.selectionStart = null;
        this.selectionEnd = null;
        this.canvasCells.forEach(cell => cell.selected = false);
    }

    getSelectedStart(): number {
        return Math.min(this.selectionStart || 0, this.selectionEnd || 0);
    }

    getSelectedEnd(): number {
        return Math.max(this.selectionStart || 0, this.selectionEnd || 0);
    }

    getSelectedLength(): number {
        if (this.selectionStart === null || this.selectionEnd === null) return 0;
        return Math.abs(this.selectionEnd - this.selectionStart) + 1;
    }

    getSelectedPreview(): string {
        const start = this.getSelectedStart() - 1;
        const end = this.getSelectedEnd();
        return this.canvasCells.slice(start, end).map(c => c.char).join('');
    }

    getCellClass(cell: CanvasCell): string {
        const classes = ['canvas-cell'];
        if (cell.selected) {
            classes.push('selected');
        }
        if (cell.segmentIndex !== null) {
            classes.push('assigned');
        }
        return classes.join(' ');
    }

    getCellStyle(cell: CanvasCell): any {
        if (cell.segmentIndex !== null) {
            return { backgroundColor: this.segments[cell.segmentIndex]?.color + '30' };
        }
        return {};
    }

    // ==================== Segment Panel ====================

    openSegmentPanel(editIndex?: number): void {
        this.segmentForm.reset({
            segmentName: '',
            segmentType: 'ENUM',
            fixedValue: '',
            allowedValues: '',
            enumSetId: null,
            minLength: null,
            maxLength: null,
            regexPattern: '',
            isRequired: true,
            errorMessage: ''
        });

        if (editIndex !== undefined) {
            this.editingSegmentIndex = editIndex;
            const segment = this.segments[editIndex];
            this.segmentForm.patchValue({
                segmentName: segment.segmentName,
                segmentType: segment.segmentType,
                fixedValue: segment.fixedValue || '',
                allowedValues: segment.allowedValues || '',
                enumSetId: segment.enumSetId,
                minLength: segment.minLength,
                maxLength: segment.maxLength,
                regexPattern: segment.regexPattern || '',
                isRequired: segment.isRequired,
                errorMessage: segment.errorMessage || ''
            });
            this.selectionStart = segment.startPosition;
            this.selectionEnd = segment.endPosition;
        } else {
            this.editingSegmentIndex = null;
        }

        this.showSegmentPanel = true;
    }

    closeSegmentPanel(): void {
        this.showSegmentPanel = false;
        this.editingSegmentIndex = null;
        this.clearSelection();
    }

    saveSegment(): void {
        if (this.segmentForm.invalid) {
            this.notification.error('Please fill required fields');
            return;
        }

        const formValue = this.segmentForm.value;
        const startPos = this.getSelectedStart();
        const endPos = this.getSelectedEnd();

        const segment: SegmentDisplay = {
            segmentName: formValue.segmentName,
            segmentOrder: this.editingSegmentIndex !== null ? this.segments[this.editingSegmentIndex].segmentOrder : this.segments.length + 1,
            segmentType: formValue.segmentType,
            startPosition: startPos,
            endPosition: endPos,
            length: endPos - startPos + 1,
            fixedValue: formValue.segmentType === 'FIXED' ? formValue.fixedValue : undefined,
            allowedValues: formValue.segmentType === 'ENUM' ? formValue.allowedValues : (formValue.segmentType === 'FIXED' ? formValue.fixedValue : undefined),
            enumSetId: formValue.segmentType === 'ENUM' ? formValue.enumSetId : undefined,
            minLength: formValue.segmentType === 'FREE_TEXT' ? formValue.minLength : undefined,
            maxLength: formValue.segmentType === 'FREE_TEXT' ? formValue.maxLength : undefined,
            regexPattern: formValue.segmentType === 'PATTERN' ? formValue.regexPattern : undefined,
            isRequired: formValue.isRequired,
            errorMessage: formValue.errorMessage,
            color: this.editingSegmentIndex !== null
                ? this.segments[this.editingSegmentIndex].color
                : this.segmentColors[this.segments.length % this.segmentColors.length]
        };

        if (this.editingSegmentIndex !== null) {
            segment.id = this.segments[this.editingSegmentIndex].id;
            this.segments[this.editingSegmentIndex] = segment;
        } else {
            this.segments.push(segment);
        }

        this.segments.sort((a, b) => a.startPosition - b.startPosition);
        this.segments.forEach((seg, idx) => {
            seg.segmentOrder = idx + 1;
        });

        this.updateCanvasWithSegments();
        this.closeSegmentPanel();
    }

    deleteSegment(index: number): void {
        this.confirmation.confirm({
            title: 'Delete Segment',
            message: `Are you sure you want to delete "${this.segments[index].segmentName}"?`,
        }).subscribe((result: boolean) => {
            if (result) {
                this.segments.splice(index, 1);
                this.segments.forEach((seg, idx) => {
                    seg.segmentOrder = idx + 1;
                });
                this.updateCanvasWithSegments();
            }
        });
    }

    getSegmentTypeLabel(type: string): string {
        switch (type) {
            case 'FIXED': return 'Fixed';
            case 'ENUM': return 'List of Values';
            case 'FREE_TEXT': return 'Free Text';
            case 'PATTERN': return 'Pattern';
            case 'ORG_TEMPLATE': return 'Org Template';
            default: return type;
        }
    }

    // ==================== Test Validation ====================

    testValidation(): void {
        if (!this.testRoleName) {
            this.notification.error('Please enter a role name to test');
            return;
        }

        const errors: string[] = [];

        if (this.testRoleName.length !== this.totalLength) {
            errors.push(`Length must be ${this.totalLength} characters (got ${this.testRoleName.length})`);
        }

        for (const segment of this.segments) {
            const value = this.testRoleName.substring(segment.startPosition - 1, segment.endPosition);

            if (segment.isRequired && !value) {
                errors.push(`${segment.segmentName}: Required`);
                continue;
            }

            switch (segment.segmentType) {
                case 'FIXED':
                    if (segment.fixedValue && value !== segment.fixedValue) {
                        errors.push(`${segment.segmentName}: Must be "${segment.fixedValue}" (got "${value}")`);
                    }
                    break;
                case 'ENUM':
                    if (segment.allowedValues) {
                        const allowed = segment.allowedValues.split(',').map(v => v.trim());
                        if (!allowed.includes(value)) {
                            errors.push(`${segment.segmentName}: Must be one of [${segment.allowedValues}] (got "${value}")`);
                        }
                    }
                    break;
                case 'FREE_TEXT':
                    if (segment.minLength && value.length < segment.minLength) {
                        errors.push(`${segment.segmentName}: Min length ${segment.minLength} (got ${value.length})`);
                    }
                    if (segment.maxLength && value.length > segment.maxLength) {
                        errors.push(`${segment.segmentName}: Max length ${segment.maxLength} (got ${value.length})`);
                    }
                    break;
                case 'PATTERN':
                    if (segment.regexPattern) {
                        try {
                            const regex = new RegExp(segment.regexPattern);
                            if (!regex.test(value)) {
                                errors.push(`${segment.segmentName}: Does not match pattern`);
                            }
                        } catch (e) {
                            errors.push(`${segment.segmentName}: Invalid regex pattern`);
                        }
                    }
                    break;
            }
        }

        this.testResult = {
            valid: errors.length === 0,
            errors
        };
    }

    // ==================== Save Template ====================

    saveTemplate(): void {
        if (this.templateForm.invalid) {
            this.notification.error('Please fill all required fields');
            return;
        }

        if (this.segments.length === 0) {
            this.notification.error('Please define at least one segment');
            return;
        }

        const formValue = this.templateForm.value;

        const template: RoleConceptTemplate = {
            id: this.templateId || undefined,
            name: formValue.name,
            description: formValue.description,
            formatType: 'POSITION_BASED',
            roleType: formValue.roleType || 'SINGLE',
            totalLength: formValue.totalLength,
            isActive: formValue.isActive,
            segments: this.segments.map(seg => ({
                id: seg.id,
                segmentName: seg.segmentName,
                segmentOrder: seg.segmentOrder,
                segmentType: seg.segmentType === 'FIXED' ? 'ENUM' : seg.segmentType,
                startPosition: seg.startPosition,
                length: seg.length,
                allowedValues: seg.segmentType === 'FIXED' ? seg.fixedValue : seg.allowedValues,
                enumSetId: seg.enumSetId,
                minLength: seg.minLength,
                maxLength: seg.maxLength,
                regexPattern: seg.regexPattern,
                isRequired: seg.isRequired,
                errorMessage: seg.errorMessage
            }))
        };

        this.saving = true;
        this.roleConceptService.saveTemplate(template).subscribe({
            next: (res) => {
                if (res.success) {
                    this.notification.success(this.isEditMode ? 'Template updated' : 'Template created');
                    this.router.navigate(['/admin/role-concept/templates']);
                } else {
                    this.notification.error(res.message || 'Failed to save template');
                }
                this.saving = false;
            },
            error: (err) => {
                const errorMsg = err?.error?.message || err?.message || 'Failed to save template';
                this.notification.error(errorMsg);
                this.saving = false;
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/admin/role-concept/templates']);
    }
}
