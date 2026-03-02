import { Component, EventEmitter, Input, Output } from "@angular/core";
import { SapAuditLogField, SapAuditLogFieldNames } from "../../../sap-audit-log.model";

@Component({
    standalone: false,
    selector: "audit-group-selector",
    template: `
        <div class="group-selector">
            <button
                *ngFor="let field of fields"
                class="group-chip"
                [class.selected]="isSelected(field)"
                (click)="toggleField(field)">
                {{ getFieldLabel(field) }}
            </button>
        </div>
    `,
    styles: [`
        .group-selector {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .group-chip {
            padding: 5px 10px;
            border-radius: 4px;
            border: 1px solid #f0f0f0;
            background: #fff;
            color: rgba(0,0,0,0.45);
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
        }
        .group-chip:hover {
            border-color: rgba(0,0,0,0.25);
            color: rgba(0,0,0,0.85);
        }
        .group-chip.selected {
            background: rgba(0,0,0,0.85);
            color: #fff;
            border-color: rgba(0,0,0,0.85);
        }
    `]
})
export class AuditGroupSelectorComponent {

    @Input() selected: string[] = [];
    @Output() selectedChange = new EventEmitter<string[]>();

    fields = Object.values(SapAuditLogField);
    fieldNames = SapAuditLogFieldNames;

    isSelected(field: SapAuditLogField): boolean {
        return this.selected.includes(field);
    }

    getFieldLabel(field: SapAuditLogField): string {
        return this.fieldNames[field] || field;
    }

    toggleField(field: SapAuditLogField): void {
        let newSelected: string[];
        if (this.isSelected(field)) {
            newSelected = this.selected.filter(f => f !== field);
        } else {
            newSelected = [...this.selected, field];
        }
        this.selectedChange.emit(newSelected);
    }
}
