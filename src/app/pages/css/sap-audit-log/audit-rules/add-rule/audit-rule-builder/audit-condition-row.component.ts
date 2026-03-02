import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { SapAuditLogField } from "../../../sap-audit-log.model";
import { SapRuleConditionType } from "../../../../css-shared/css-shared.model";
import { AuditCondition } from "./audit-rule-builder.model";
import { LOG_FIELDS, getOperators, getFieldMeta, OperatorOption, LogFieldOption } from "./audit-rule-builder.constants";

@Component({
    standalone: false,
    selector: "audit-condition-row",
    template: `
        <div class="condition-row" [class.show-connector]="showConnector">
            <!-- Connector -->
            <div *ngIf="showConnector" class="connector-line">
                <span class="connector-text">{{ connector }}</span>
            </div>

            <div class="row-content">
                <!-- Field Select -->
                <nz-select class="field-select compact-field"
                           [(ngModel)]="selectedField"
                           (ngModelChange)="onFieldChange($event)">
                    <nz-option *ngFor="let field of fields" [nzValue]="field.value" [nzLabel]="field.label"></nz-option>
                </nz-select>

                <!-- Operator Select -->
                <nz-select class="operator-select compact-field"
                           [(ngModel)]="selectedOperator"
                           (ngModelChange)="onOperatorChange($event)">
                    <nz-option *ngFor="let op of operators" [nzValue]="op.value" [nzLabel]="op.label"></nz-option>
                </nz-select>

                <!-- Values Input -->
                <audit-value-input
                    class="values-input"
                    [values]="condition?.values || []"
                    [field]="condition?.field"
                    [placeholder]="getPlaceholder()"
                    [eventSuggestions]="eventSuggestions"
                    [clientSuggestions]="clientSuggestions"
                    (valuesChange)="onValuesChange($event)">
                </audit-value-input>

                <!-- Delete Button -->
                <button nz-button nzType="text" nzShape="circle" class="delete-btn" (click)="onDelete.emit()">
                    <span nz-icon nzType="delete" nzTheme="outline"></span>
                </button>
            </div>
        </div>
    `,
    styles: [`
        .condition-row {
            position: relative;
        }
        .connector-line {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
        }
        .connector-line::before,
        .connector-line::after {
            content: '';
            flex: 1;
            height: 1px;
            border-top: 1px dashed #f0f0f0;
        }
        .connector-text {
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: rgba(0,0,0,0.25);
        }
        .row-content {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            border-radius: 4px;
        }
        .row-content:hover {
            background-color: #fafafa;
        }
        .compact-field {
            margin: 0;
            font-size: 12px;
        }
        .field-select {
            width: 120px;
            flex-shrink: 0;
        }
        .operator-select {
            width: 140px;
            flex-shrink: 0;
        }
        .values-input {
            flex: 1;
            min-width: 0;
        }
        .delete-btn {
            opacity: 0;
            color: rgba(0,0,0,0.25);
            flex-shrink: 0;
        }
        .delete-btn:hover {
            color: #dc2626;
        }
        .row-content:hover .delete-btn {
            opacity: 1;
        }
        .delete-btn span[nz-icon] {
            font-size: 18px;
        }
    `]
})
export class AuditConditionRowComponent implements OnInit, OnChanges {

    @Input() condition: AuditCondition;
    @Input() connector: 'AND' | 'OR' = 'AND';
    @Input() showConnector: boolean = false;
    @Input() eventSuggestions: string[] = [];
    @Input() clientSuggestions: { name: string; clientNo: string }[] = [];

    @Output() conditionChange = new EventEmitter<AuditCondition>();
    @Output() onDelete = new EventEmitter<void>();

    fields: LogFieldOption[] = LOG_FIELDS;
    operators: OperatorOption[] = [];

    // Current values for display - ensures nz-select has valid values
    selectedField: SapAuditLogField = SapAuditLogField.EVENT;
    selectedOperator: SapRuleConditionType = SapRuleConditionType.IN;

    ngOnInit(): void {
        this.initializeFromCondition();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['condition'] && this.condition) {
            this.initializeFromCondition();
        }
    }

    private initializeFromCondition(): void {
        if (!this.condition) {
            // Default values if no condition
            this.selectedField = SapAuditLogField.EVENT;
            this.selectedOperator = SapRuleConditionType.IN;
            this.operators = getOperators('text');
            return;
        }

        // Set selected values from condition
        this.selectedField = this.condition.field || SapAuditLogField.EVENT;
        this.selectedOperator = this.condition.conditionType || SapRuleConditionType.IN;

        // Update operators based on field type
        const fieldMeta = getFieldMeta(this.selectedField);
        this.operators = getOperators(fieldMeta.type);

        // Ensure selected operator is valid for the field type
        const validOperator = this.operators.find(op => op.value === this.selectedOperator);
        if (!validOperator && this.operators.length > 0) {
            this.selectedOperator = this.operators[0].value;
        }
    }

    onFieldChange(field: SapAuditLogField): void {
        // Update local state
        this.selectedField = field;
        const fieldMeta = getFieldMeta(field);
        this.operators = getOperators(fieldMeta.type);

        // Select first operator for the new field type
        this.selectedOperator = this.operators[0]?.value || SapRuleConditionType.IN;

        // Emit change
        const updated: AuditCondition = {
            ...this.condition,
            field: field,
            conditionType: this.selectedOperator,
            values: []
        };
        this.conditionChange.emit(updated);
    }

    onOperatorChange(operator: SapRuleConditionType): void {
        // Update local state
        this.selectedOperator = operator;

        // Emit change
        const updated: AuditCondition = {
            ...this.condition,
            conditionType: operator
        };
        this.conditionChange.emit(updated);
    }

    onValuesChange(values: string[]): void {
        const updated: AuditCondition = {
            ...this.condition,
            values: values
        };
        this.conditionChange.emit(updated);
    }

    getPlaceholder(): string {
        if (!this.condition) return 'Enter values...';
        const fieldMeta = getFieldMeta(this.condition.field);
        if (fieldMeta.type === 'time') {
            return 'e.g. 08:00, 18:00';
        }
        return `Enter ${fieldMeta.label.toLowerCase()} values...`;
    }
}
