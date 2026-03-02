import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { NzModalService, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Clipboard } from '@angular/cdk/clipboard';
import {
    OrgTemplatesService,
    OrgTemplateMatrix,
    OrgFieldInfo,
    OrgValueTemplate,
    OrgTemplateFieldValue,
    OrgTemplateRequest,
    OrgTemplateImportRequest,
    EntityVersion
} from './org-templates.service';

interface SapSystem { id: number; sid?: string; destinationName: string; }

@Component({
    selector: 'app-org-templates',
    templateUrl: './org-templates.component.html',
    styleUrls: ['./org-templates.component.scss'],
    standalone: false,
})
export class OrgTemplatesComponent implements OnInit {
    @ViewChild('importFileInput') importFileInput!: ElementRef<HTMLInputElement>;

    // SAP System
    sapSystems: SapSystem[] = [];
    selectedSystemId: number | null = null;
    loadingSystems = false;

    // Matrix data
    matrixData: OrgTemplateMatrix | null = null;
    loadingMatrix = false;

    // Field filter
    allFields: OrgFieldInfo[] = [];
    visibleFields: string[] = [];
    fieldSearch = '';

    // Cell lookup map: `${templateId}_${fieldName}` -> fieldValue
    cellMap: { [key: string]: string } = {};

    // Selection
    selectedTemplateIds: number[] = [];

    // Search
    templateSearch = '';

    // Version history
    versionHistory: EntityVersion[] = [];
    showVersionDrawer = false;
    selectedVersionTemplateId: number | null = null;

    // Editing
    editingCell: { templateId: number; fieldName: string } | null = null;
    editingValue = '';

    constructor(
        private orgTemplatesService: OrgTemplatesService,
        private modal: NzModalService,
        private message: NzMessageService,
        private clipboard: Clipboard,
    ) {}

    ngOnInit(): void {
        this.loadSapSystems();
    }

    // ─── SAP Systems ─────────────────────────────────
    loadSapSystems(): void {
        this.loadingSystems = true;
        this.orgTemplatesService.getSapSystems().subscribe({
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
        this.selectedSystemId = systemId;
        this.selectedTemplateIds = [];
        this.loadMatrixView();
    }

    // ─── Matrix View ─────────────────────────────────
    loadMatrixView(): void {
        if (!this.selectedSystemId) return;
        this.loadingMatrix = true;
        this.orgTemplatesService.getMatrixView(this.selectedSystemId).subscribe({
            next: res => {
                this.matrixData = res.data;
                this.buildCellMap();
                this.allFields = this.matrixData?.fields || [];
                this.visibleFields = this.allFields.map(f => f.fieldName);
                this.loadingMatrix = false;
            },
            error: () => {
                this.message.error('Failed to load matrix');
                this.loadingMatrix = false;
            }
        });
    }

    private buildCellMap(): void {
        this.cellMap = {};
        if (!this.matrixData?.matrix) return;
        for (const [fieldName, templateCells] of Object.entries(this.matrixData.matrix)) {
            for (const [templateId, cell] of Object.entries(templateCells as any)) {
                this.cellMap[`${templateId}_${fieldName}`] = (cell as any).displayText || '';
            }
        }
    }

    getCellValue(templateId: number, fieldName: string): string {
        return this.cellMap[`${templateId}_${fieldName}`] || '';
    }

    // ─── Filtering ───────────────────────────────────
    get filteredFields(): OrgFieldInfo[] {
        let fields = this.allFields.filter(f => this.visibleFields.includes(f.fieldName));
        if (this.fieldSearch) {
            const s = this.fieldSearch.toLowerCase();
            fields = fields.filter(f =>
                f.fieldName.toLowerCase().includes(s) ||
                (f.description && f.description.toLowerCase().includes(s))
            );
        }
        return fields;
    }

    get filteredTemplates(): OrgValueTemplate[] {
        if (!this.matrixData) return [];
        if (!this.templateSearch) return this.matrixData.templates;
        const s = this.templateSearch.toLowerCase();
        return this.matrixData.templates.filter(t =>
            t.templateName.toLowerCase().includes(s) ||
            (t.templateCode && t.templateCode.toLowerCase().includes(s))
        );
    }

    // ─── Cell Editing ────────────────────────────────
    startEdit(templateId: number, fieldName: string): void {
        this.editingCell = { templateId, fieldName };
        this.editingValue = this.getCellValue(templateId, fieldName);
    }

    saveEdit(): void {
        if (!this.editingCell) return;
        const { templateId, fieldName } = this.editingCell;
        const values: OrgTemplateFieldValue[] = [{ fieldName, value: this.editingValue }];
        this.orgTemplatesService.updateFieldValues(templateId, fieldName, values).subscribe({
            next: () => {
                this.cellMap[`${templateId}_${fieldName}`] = this.editingValue;
                this.editingCell = null;
                this.message.success('Value updated');
            },
            error: () => this.message.error('Failed to update value')
        });
    }

    cancelEdit(): void {
        this.editingCell = null;
    }

    isEditing(templateId: number, fieldName: string): boolean {
        return this.editingCell?.templateId === templateId && this.editingCell?.fieldName === fieldName;
    }

    // ─── Selection ───────────────────────────────────
    toggleTemplateSelection(id: number): void {
        const idx = this.selectedTemplateIds.indexOf(id);
        if (idx >= 0) {
            this.selectedTemplateIds.splice(idx, 1);
        } else {
            this.selectedTemplateIds.push(id);
        }
    }

    isSelected(id: number): boolean {
        return this.selectedTemplateIds.includes(id);
    }

    get allSelected(): boolean {
        return this.matrixData?.templates?.length
            ? this.selectedTemplateIds.length === this.matrixData.templates.length
            : false;
    }

    toggleSelectAll(): void {
        if (this.allSelected) {
            this.selectedTemplateIds = [];
        } else {
            this.selectedTemplateIds = (this.matrixData?.templates || []).map(t => t.id);
        }
    }

    // ─── CRUD Actions ────────────────────────────────
    addTemplate(): void {
        // Navigate to template editor in create mode
        // Handled via routerLink in template
    }

    cloneTemplate(tmpl: any): void {
        this.modal.create({
            nzTitle: 'Clone Template',
            nzContent: CloneTemplateDialogComponent,
            nzData: { templateName: tmpl.templateName },
            nzOnOk: (instance: CloneTemplateDialogComponent) => {
                if (!instance.newName) {
                    this.message.warning('Name is required');
                    return false;
                }
                return new Promise<boolean>((resolve) => {
                    this.orgTemplatesService.cloneTemplate(tmpl.id, instance.newName, instance.newCode).subscribe({
                        next: () => {
                            this.message.success('Template cloned');
                            this.loadMatrixView();
                            resolve(true);
                        },
                        error: () => {
                            this.message.error('Clone failed');
                            resolve(false);
                        }
                    });
                });
            }
        });
    }

    deleteSelected(): void {
        if (this.selectedTemplateIds.length === 0) return;
        this.modal.confirm({
            nzTitle: 'Delete Templates',
            nzContent: `Delete ${this.selectedTemplateIds.length} selected template(s)?`,
            nzOkDanger: true,
            nzOkText: 'Delete',
            nzOnOk: () => {
                this.orgTemplatesService.bulkDeleteTemplates(this.selectedTemplateIds).subscribe({
                    next: () => {
                        this.message.success('Templates deleted');
                        this.selectedTemplateIds = [];
                        this.loadMatrixView();
                    },
                    error: () => this.message.error('Delete failed')
                });
            }
        });
    }

    deleteTemplate(tmpl: any): void {
        this.modal.confirm({
            nzTitle: 'Delete Template',
            nzContent: `Delete "${tmpl.templateName}"?`,
            nzOkDanger: true,
            nzOkText: 'Delete',
            nzOnOk: () => {
                this.orgTemplatesService.deleteTemplate(tmpl.id).subscribe({
                    next: () => {
                        this.message.success('Template deleted');
                        this.loadMatrixView();
                    },
                    error: () => this.message.error('Delete failed')
                });
            }
        });
    }

    // ─── Excel Import/Export ─────────────────────────
    triggerImport(): void {
        this.importFileInput?.nativeElement?.click();
    }

    onImportFile(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input?.files?.[0];
        if (!file || !this.selectedSystemId) return;

        import('xlsx').then(XLSX => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const wb = XLSX.read(e.target.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data: any[] = XLSX.utils.sheet_to_json(ws);

                const importRequest: OrgTemplateImportRequest = {
                    sapSystemId: this.selectedSystemId!,
                    templates: data.map((row: any) => ({
                        templateName: row['Name'] || row.templateName || '',
                        templateCode: row['Code'] || row.templateCode || '',
                        description: row['Description'] || row.description || '',
                        fieldValues: Object.keys(row)
                            .filter(k => !['Name', 'Code', 'Description', 'templateName', 'templateCode', 'description'].includes(k))
                            .map(k => ({ fieldName: k, value: row[k]?.toString() || '' }))
                    }))
                };
                this.orgTemplatesService.importTemplates(importRequest).subscribe({
                    next: res => {
                        const result = res.data;
                        this.message.success(
                            `Import complete: ${result?.created || 0} created, ${result?.updated || 0} updated, ${result?.failed || 0} failed`
                        );
                        this.loadMatrixView();
                    },
                    error: () => this.message.error('Import failed')
                });
            };
            reader.readAsBinaryString(file);
            input.value = '';
        });
    }

    exportExcel(): void {
        if (!this.matrixData) return;

        import('xlsx').then(XLSX => {
            const rows: any[] = [];
            for (const tmpl of this.matrixData!.templates) {
                const row: any = { Name: tmpl.templateName, Code: tmpl.templateCode || '' };
                for (const field of this.allFields) {
                    row[field.fieldName] = this.getCellValue(tmpl.id!, field.fieldName);
                }
                rows.push(row);
            }

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Org Templates');
            XLSX.writeFile(wb, `org-templates-${this.selectedSystemId}.xlsx`);
        });
    }

    // ─── Version History ─────────────────────────────
    viewVersionHistory(tmpl: any): void {
        this.selectedVersionTemplateId = tmpl.id;
        this.showVersionDrawer = true;
        this.versionHistory = [];
        this.orgTemplatesService.getVersionHistory(tmpl.id).subscribe({
            next: res => {
                this.versionHistory = res.data || [];
            },
            error: () => this.message.error('Failed to load history')
        });
    }

    closeVersionDrawer(): void {
        this.showVersionDrawer = false;
        this.selectedVersionTemplateId = null;
    }

    // ─── Copy Cell Value ─────────────────────────────
    copyCellValue(value: string): void {
        this.clipboard.copy(value);
        this.message.success('Copied');
    }
}

// ─── Clone Template Dialog ──────────────────────────
@Component({
    selector: 'app-clone-template-dialog',
    template: `
        <div>
            <nz-form-item>
                <nz-form-label nzRequired>New Template Name</nz-form-label>
                <nz-form-control>
                    <input nz-input [(ngModel)]="newName" placeholder="Enter name" nzSize="small">
                </nz-form-control>
            </nz-form-item>
            <nz-form-item>
                <nz-form-label>New Template Code</nz-form-label>
                <nz-form-control>
                    <input nz-input [(ngModel)]="newCode" placeholder="Optional code" nzSize="small">
                </nz-form-control>
            </nz-form-item>
        </div>
    `,
    standalone: false,
})
export class CloneTemplateDialogComponent {
    newName = '';
    newCode = '';
}

// ─── Field Values Modal ─────────────────────────────
@Component({
    selector: 'app-field-values-modal',
    template: `
        <div class="fvm">
            <div class="fvm__header">
                <strong>{{ data?.templateName }}</strong> — {{ data?.fieldName }}
            </div>
            <nz-table #valuesTable [nzData]="data?.values || []" nzSize="small"
                      [nzShowPagination]="false" nzFrontPagination>
                <thead>
                    <tr>
                        <th>Value</th>
                        <th nzWidth="60px">Copy</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let v of valuesTable.data">
                        <td>{{ v }}</td>
                        <td>
                            <button nz-button nzType="link" nzSize="small" (click)="copy(v)">
                                <span nz-icon nzType="copy" nzTheme="outline"></span>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </nz-table>
        </div>
    `,
    styles: [`.fvm__header { margin-bottom: 12px; font-size: 13px; }`],
    standalone: false,
})
export class FieldValuesModalComponent {
    data: any;

    constructor(
        @Inject(NZ_MODAL_DATA) modalData: any,
        private clipboard: Clipboard,
        private msg: NzMessageService,
    ) {
        this.data = modalData;
    }

    copy(value: string): void {
        this.clipboard.copy(value);
        this.msg.success('Copied');
    }
}
