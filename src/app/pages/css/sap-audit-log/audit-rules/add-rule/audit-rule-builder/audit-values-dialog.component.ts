import { Component, Inject } from "@angular/core";
import { NZ_MODAL_DATA, NzModalRef } from "ng-zorro-antd/modal";

export interface AuditValuesDialogData {
    title: string;
    values: string[];
    placeholder?: string;
}

@Component({
    standalone: false,
    selector: "audit-values-dialog",
    template: `
        <div class="dialog-container">
            <div class="dialog-header">
                <span class="dialog-title">{{ data.title }}</span>
                <button nz-button nzType="text" nzShape="circle" class="close-btn" (click)="onCancel()">
                    <span nz-icon nzType="close" nzTheme="outline"></span>
                </button>
            </div>
            <div class="dialog-body">
                <textarea
                    class="values-textarea"
                    [(ngModel)]="textValue"
                    [placeholder]="data.placeholder || 'Enter values, one per line or comma-separated'">
                </textarea>
                <span class="hint-text">One value per line, or comma-separated</span>
            </div>
            <div class="dialog-footer">
                <button nz-button nzType="default" class="cancel-btn" (click)="onCancel()">Cancel</button>
                <button nz-button nzType="primary" class="apply-btn" (click)="onApply()">Apply</button>
            </div>
        </div>
    `,
    styles: [`
        .dialog-container {
            display: flex;
            flex-direction: column;
            width: 400px;
            max-width: 90vw;
            max-height: 80vh;
        }
        .dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid #f0f0f0;
        }
        .dialog-title {
            font-size: 14px;
            font-weight: 600;
            color: rgba(0,0,0,0.85);
        }
        .close-btn {
            width: 32px;
            height: 32px;
            line-height: 32px;
        }
        .close-btn span[nz-icon] {
            font-size: 18px;
            width: 18px;
            height: 18px;
        }
        .dialog-body {
            padding: 16px;
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .values-textarea {
            width: 100%;
            height: 200px;
            padding: 10px 12px;
            border: 1px solid #f0f0f0;
            border-radius: 4px;
            background: #fff;
            color: rgba(0,0,0,0.85);
            font-family: var(--font-code);
            font-size: 12px;
            line-height: 1.5;
            resize: vertical;
        }
        .values-textarea:focus {
            outline: none;
            border-color: #1890ff;
        }
        .values-textarea::placeholder {
            color: rgba(0,0,0,0.25);
        }
        .hint-text {
            font-size: 11px;
            color: rgba(0,0,0,0.25);
            margin-top: 6px;
        }
        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 12px 16px;
            border-top: 1px solid #f0f0f0;
        }
        .cancel-btn {
            color: rgba(0,0,0,0.45);
        }
    `]
})
export class AuditValuesDialogComponent {

    textValue: string = '';

    constructor(
        public modal: NzModalRef,
        @Inject(NZ_MODAL_DATA) public data: AuditValuesDialogData
    ) {
        // Convert values array to text (one per line)
        this.textValue = (data.values || []).join('\n');
    }

    onCancel(): void {
        this.modal.close();
    }

    onApply(): void {
        // Parse text to values array
        const values = this.parseValues(this.textValue);
        this.modal.close(values);
    }

    private parseValues(text: string): string[] {
        if (!text || !text.trim()) {
            return [];
        }

        // Split by newlines and commas, then clean up
        const values = text
            .split(/[\n,]+/)
            .map(v => v.trim())
            .filter(v => v.length > 0);

        // Remove duplicates while preserving order
        return [...new Set(values)];
    }
}
