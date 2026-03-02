import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AuditCondition, createEmptyCondition } from "./audit-rule-builder.model";
import { PurposeConfig } from "./audit-rule-builder.constants";

@Component({
    standalone: false,
    selector: "audit-purpose-group",
    template: `
        <div class="purpose-group" [class.has-conditions]="conditions.length > 0">
            <!-- Header -->
            <button class="group-header" (click)="toggleCollapsed()">
                <span nz-icon [nzType]="config.icon" nzTheme="outline" class="purpose-icon"></span>
                <span class="purpose-label">{{ config.label }}</span>
                <span class="purpose-desc">{{ config.desc }}</span>
                <span *ngIf="conditions.length > 0" class="condition-count">{{ conditions.length }}</span>
                <span nz-icon [nzType]="collapsed ? 'down' : 'up'" nzTheme="outline" class="toggle-icon"></span>
            </button>

            <!-- Body -->
            <div class="group-body" *ngIf="!collapsed">
                <!-- Empty State -->
                <div *ngIf="conditions.length === 0" class="empty-state">
                    No {{ config.label.toLowerCase() }} conditions yet.
                </div>

                <!-- Condition Rows -->
                <audit-condition-row
                    *ngFor="let cond of conditions; let i = index; trackBy: trackByTempId"
                    [condition]="cond"
                    [connector]="config.connector"
                    [showConnector]="i > 0"
                    [eventSuggestions]="eventSuggestions"
                    [clientSuggestions]="clientSuggestions"
                    (conditionChange)="onConditionUpdate(cond.tempId, $event)"
                    (onDelete)="onConditionDelete(cond.tempId)">
                </audit-condition-row>

                <!-- Add Button -->
                <button class="add-condition-btn" (click)="addCondition()">
                    <span nz-icon nzType="plus" nzTheme="outline"></span>
                    Add {{ config.label }} Condition
                </button>
            </div>
        </div>
    `,
    styles: [`
        .purpose-group {
            border-radius: 4px;
            border: 1px solid #f0f0f0;
            overflow: hidden;
        }
        .purpose-group.has-conditions {
            border-color: #1890ff;
        }
        .group-header {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 10px 12px;
            border: none;
            background: #fafafa;
            cursor: pointer;
            text-align: left;
        }
        .group-header:hover {
            background: #fafafa;
        }
        .purpose-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: rgba(0,0,0,0.45);
            flex-shrink: 0;
        }
        .purpose-label {
            font-size: 12px;
            font-weight: 600;
            color: rgba(0,0,0,0.85);
            flex-shrink: 0;
        }
        .purpose-desc {
            font-size: 10px;
            color: rgba(0,0,0,0.25);
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .condition-count {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            border-radius: 9px;
            background: #1890ff;
            color: #fff;
            font-size: 10px;
            font-weight: 600;
            flex-shrink: 0;
        }
        .toggle-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: rgba(0,0,0,0.25);
            flex-shrink: 0;
        }
        .group-body {
            background: #fff;
            padding: 8px;
        }
        .empty-state {
            text-align: center;
            padding: 16px;
            font-size: 11px;
            color: rgba(0,0,0,0.25);
        }
        .add-condition-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            width: 100%;
            padding: 8px;
            margin-top: 8px;
            border: 1px dashed #f0f0f0;
            border-radius: 4px;
            background: transparent;
            color: rgba(0,0,0,0.45);
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
        }
        .add-condition-btn:hover {
            background: #fafafa;
            color: rgba(0,0,0,0.85);
        }
        .add-condition-btn span[nz-icon] {
            font-size: 14px;
        }
    `]
})
export class AuditPurposeGroupComponent {

    @Input() config: PurposeConfig;
    @Input() conditions: AuditCondition[] = [];
    @Input() collapsed: boolean = false;
    @Input() eventSuggestions: string[] = [];
    @Input() clientSuggestions: { name: string; clientNo: string }[] = [];

    @Output() conditionsChange = new EventEmitter<AuditCondition[]>();
    @Output() collapsedChange = new EventEmitter<boolean>();

    trackByTempId(index: number, cond: AuditCondition): number {
        return cond.tempId;
    }

    toggleCollapsed(): void {
        this.collapsed = !this.collapsed;
        this.collapsedChange.emit(this.collapsed);
    }

    addCondition(): void {
        const newCondition = createEmptyCondition();
        const updated = [...this.conditions, newCondition];
        this.conditionsChange.emit(updated);

        if (this.collapsed) {
            this.collapsed = false;
            this.collapsedChange.emit(false);
        }
    }

    onConditionUpdate(tempId: number, updated: AuditCondition): void {
        const newConditions = this.conditions.map(c =>
            c.tempId === tempId ? { ...updated, tempId } : c
        );
        this.conditionsChange.emit(newConditions);
    }

    onConditionDelete(tempId: number): void {
        const newConditions = this.conditions.filter(c => c.tempId !== tempId);
        this.conditionsChange.emit(newConditions);
    }
}
