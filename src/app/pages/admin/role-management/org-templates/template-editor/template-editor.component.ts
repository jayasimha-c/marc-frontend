import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
    OrgTemplatesService,
    OrgValueTemplate,
    OrgFieldInfo,
    OrgTemplateFieldValue,
    OrgTemplateRequest
} from '../org-templates.service';

interface FieldValueRow {
    fieldName: string;
    values: string; // Comma or newline separated
    selected: boolean;
}

@Component({
    selector: 'app-template-editor',
    templateUrl: './template-editor.component.html',
    styleUrls: ['./template-editor.component.scss'],
    standalone: false,
})
export class TemplateEditorComponent implements OnInit {

    isEdit = false;
    templateId: number | null = null;
    loading = false;
    saving = false;

    // Form
    name = '';
    code = '';
    description = '';
    sapSystemId: number | null = null;

    // Field values — each row is one field with multi-value textarea
    fieldRows: FieldValueRow[] = [];

    // Available fields from system
    availableFields: OrgFieldInfo[] = [];
    fieldNames: string[] = [];
    loadingFields = false;

    // SAP Systems
    sapSystems: { id: number; destinationName: string }[] = [];
    loadingSystems = false;

    // Selection
    allSelected = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private orgTemplatesService: OrgTemplatesService,
        private message: NzMessageService,
    ) {}

    ngOnInit(): void {
        this.loadSapSystems();
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.isEdit = true;
            this.templateId = +idParam;
            this.loadTemplate();
        }

        const systemId = this.route.snapshot.queryParamMap.get('systemId');
        if (systemId) {
            this.sapSystemId = +systemId;
            this.loadAvailableFields();
        }
    }

    loadSapSystems(): void {
        this.loadingSystems = true;
        this.orgTemplatesService.getSapSystems().subscribe({
            next: res => {
                this.sapSystems = res.data || [];
                this.loadingSystems = false;
            },
            error: () => {
                this.loadingSystems = false;
            }
        });
    }

    loadTemplate(): void {
        if (!this.templateId) return;
        this.loading = true;
        this.orgTemplatesService.getTemplate(this.templateId).subscribe({
            next: res => {
                const tmpl = res.data as OrgValueTemplate;
                this.name = tmpl.templateName;
                this.code = tmpl.templateCode || '';
                this.description = tmpl.description || '';
                this.sapSystemId = tmpl.sapSystemId;
                this.convertFieldValuesToRows(tmpl.fieldValues || []);
                this.loading = false;
                if (this.sapSystemId) this.loadAvailableFields();
            },
            error: () => {
                this.message.error('Failed to load template');
                this.loading = false;
            }
        });
    }

    private convertFieldValuesToRows(fieldValues: OrgTemplateFieldValue[]): void {
        const groupMap = new Map<string, string[]>();
        for (const fv of fieldValues) {
            if (!groupMap.has(fv.fieldName)) {
                groupMap.set(fv.fieldName, []);
            }
            if (fv.value) {
                groupMap.get(fv.fieldName)!.push(fv.value);
            }
        }
        this.fieldRows = Array.from(groupMap.entries()).map(([fieldName, values]) => ({
            fieldName,
            values: values.join(', '),
            selected: false
        }));
    }

    onSystemChange(): void {
        this.loadAvailableFields();
    }

    loadAvailableFields(): void {
        if (!this.sapSystemId) return;
        this.loadingFields = true;
        this.orgTemplatesService.getAvailableFields(this.sapSystemId).subscribe({
            next: res => {
                this.availableFields = res.data || [];
                this.fieldNames = this.availableFields.map(f => f.fieldName);
                this.loadingFields = false;
            },
            error: () => {
                this.loadingFields = false;
            }
        });
    }

    getFieldDescription(fieldName: string): string {
        return this.availableFields.find(f => f.fieldName === fieldName)?.description || '';
    }

    // ─── Row Management ──────────────────────────────
    addRow(): void {
        this.fieldRows = [...this.fieldRows, { fieldName: '', values: '', selected: false }];
    }

    removeSelectedRows(): void {
        const selected = this.fieldRows.filter(r => r.selected);
        if (selected.length === 0) {
            this.message.warning('Select rows to remove');
            return;
        }
        this.fieldRows = this.fieldRows.filter(r => !r.selected);
        this.allSelected = false;
    }

    toggleSelectAll(): void {
        this.allSelected = !this.allSelected;
        this.fieldRows.forEach(r => r.selected = this.allSelected);
    }

    onRowSelectChange(): void {
        this.allSelected = this.fieldRows.length > 0 && this.fieldRows.every(r => r.selected);
    }

    get indeterminate(): boolean {
        const selectedCount = this.fieldRows.filter(r => r.selected).length;
        return selectedCount > 0 && selectedCount < this.fieldRows.length;
    }

    // Get available field names not already used (except current row's field)
    getAvailableFieldsForRow(currentFieldName: string): string[] {
        const usedFields = new Set(this.fieldRows.map(r => r.fieldName).filter(f => f && f !== currentFieldName));
        return this.fieldNames.filter(f => !usedFields.has(f));
    }

    // ─── Paste Support ───────────────────────────────
    onPasteValues(event: ClipboardEvent, row: FieldValueRow): void {
        const pastedText = event.clipboardData?.getData('text') || '';
        // If pasted text contains tabs or newlines (Excel paste), convert to commas
        if (pastedText.includes('\t') || pastedText.includes('\n')) {
            event.preventDefault();
            const values = pastedText
                .split(/[\t\n\r]+/)
                .map(v => v.trim())
                .filter(v => v.length > 0);
            // Append to existing values
            if (row.values.trim()) {
                row.values = row.values.trim().replace(/,\s*$/, '') + ', ' + values.join(', ');
            } else {
                row.values = values.join(', ');
            }
        }
    }

    // ─── Save ────────────────────────────────────────
    save(): void {
        if (!this.name || !this.sapSystemId) {
            this.message.warning('Name and SAP System are required');
            return;
        }

        // Validate: rows with values must have a field selected
        const invalidRows = this.fieldRows.filter(r => r.values?.trim() && !r.fieldName);
        if (invalidRows.length > 0) {
            this.message.error('Please select an org field for all rows with values');
            return;
        }

        // Check for duplicate field names
        const fieldCounts = new Map<string, number>();
        for (const row of this.fieldRows) {
            if (row.fieldName) {
                fieldCounts.set(row.fieldName, (fieldCounts.get(row.fieldName) || 0) + 1);
            }
        }
        const duplicates = Array.from(fieldCounts.entries()).filter(([_, count]) => count > 1);
        if (duplicates.length > 0) {
            this.message.error(`Duplicate fields: ${duplicates.map(d => d[0]).join(', ')}`);
            return;
        }

        this.saving = true;

        // Convert rows to flat field values array
        const fieldValues: OrgTemplateFieldValue[] = [];
        for (const row of this.fieldRows) {
            if (!row.fieldName || !row.values?.trim()) continue;
            const values = row.values
                .split(/[,\n]+/)
                .map(v => v.trim())
                .filter(v => v.length > 0);
            for (const value of values) {
                fieldValues.push({
                    fieldName: row.fieldName,
                    fieldDescription: this.getFieldDescription(row.fieldName),
                    value
                });
            }
        }

        const request: OrgTemplateRequest = {
            templateName: this.name,
            templateCode: this.code || undefined,
            description: this.description || undefined,
            sapSystemId: this.sapSystemId,
            active: true,
            fieldValues
        };

        const obs = this.isEdit
            ? this.orgTemplatesService.updateTemplate(this.templateId!, request)
            : this.orgTemplatesService.createTemplate(request);

        obs.subscribe({
            next: () => {
                this.message.success(this.isEdit ? 'Template updated' : 'Template created');
                this.saving = false;
                this.navigateBack();
            },
            error: () => {
                this.message.error('Save failed');
                this.saving = false;
            }
        });
    }

    cancel(): void {
        this.navigateBack();
    }

    private navigateBack(): void {
        this.router.navigate(['org-templates'], { relativeTo: this.route.parent });
    }
}
