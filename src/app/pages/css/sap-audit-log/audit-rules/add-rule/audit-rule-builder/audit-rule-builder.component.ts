import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { SapAuditEvent, SapAuditRuleCondition } from "../../../sap-audit-log.model";
import {
    ConditionGroups,
    AuditRuleThreshold,
    AuditRuleScope,
    CollapsedState,
    createEmptyGroups,
    createDefaultThreshold,
    createDefaultCollapsed,
    createDefaultScope,
    flattenConditions,
    groupConditionsWithScope
} from "./audit-rule-builder.model";
import { PURPOSE_CONFIG, TIME_UNITS, PurposeConfig } from "./audit-rule-builder.constants";

@Component({
    standalone: false,
    selector: "audit-rule-builder",
    template: `
        <div class="audit-rule-builder">
            <!-- Rule Preview -->
            <audit-rule-preview
                [groups]="conditionGroups"
                [groupBy]="groupBy"
                [threshold]="threshold">
            </audit-rule-preview>

            <!-- Section: Scope -->
            <div class="builder-section">
                <div class="section-header" (click)="scopeExpanded = !scopeExpanded">
                    <div class="section-title-row">
                        <span class="section-title">Scope</span>
                        <span class="section-subtitle">Pre-filter which audit logs to evaluate</span>
                    </div>
                    <span nz-icon [nzType]="scopeExpanded ? 'up' : 'down'" nzTheme="outline" class="section-toggle"></span>
                </div>

                <div class="section-body" *ngIf="scopeExpanded">
                    <audit-rule-scope
                        [scope]="scope"
                        (scopeChange)="onScopeChange($event)">
                    </audit-rule-scope>
                </div>
            </div>

            <!-- Section: Conditions -->
            <div class="builder-section">
                <div class="section-header" (click)="conditionsExpanded = !conditionsExpanded">
                    <div class="section-title-row">
                        <span class="section-title">Conditions</span>
                        <span class="section-subtitle">Detection logic, exceptions, and overrides</span>
                    </div>
                    <span nz-icon [nzType]="conditionsExpanded ? 'up' : 'down'" nzTheme="outline" class="section-toggle"></span>
                </div>

                <div class="section-body" *ngIf="conditionsExpanded">
                    <!-- Evaluation Order Flow -->
                    <div class="eval-order">
                        <span class="eval-label">Evaluation order:</span>
                        <span class="eval-badge eval-blacklist">Blacklist</span>
                        <span class="eval-separator">></span>
                        <span class="eval-badge eval-whitelist">Whitelist</span>
                        <span class="eval-separator">></span>
                        <span class="eval-badge eval-detect">Detect</span>
                        <span class="eval-separator">></span>
                        <span class="eval-badge eval-reset">Threshold / Reset</span>
                    </div>

                    <div class="purpose-groups">
                        <audit-purpose-group
                            *ngFor="let cfg of purposeConfigs; trackBy: trackByKey"
                            [config]="cfg"
                            [conditions]="getConditionsForKey(cfg.key)"
                            [collapsed]="collapsed[cfg.key]"
                            [eventSuggestions]="eventSuggestions"
                            [clientSuggestions]="clientSuggestions"
                            (conditionsChange)="onConditionsChange(cfg.key, $event)"
                            (collapsedChange)="onCollapsedChange(cfg.key, $event)">
                        </audit-purpose-group>
                    </div>
                </div>
            </div>

            <!-- Section: Detection -->
            <div class="builder-section">
                <div class="section-header" (click)="detectionExpanded = !detectionExpanded">
                    <div class="section-title-row">
                        <span class="section-title">Detection</span>
                        <span class="section-subtitle">Grouping and alert threshold</span>
                    </div>
                    <span nz-icon [nzType]="detectionExpanded ? 'up' : 'down'" nzTheme="outline" class="section-toggle"></span>
                </div>

                <div class="section-body" *ngIf="detectionExpanded">
                    <div class="detection-field">
                        <label class="field-label">
                            <span nz-icon nzType="team" nzTheme="outline" class="label-icon"></span>
                            Group By
                            <span class="label-hint">Aggregate matching logs by these fields</span>
                        </label>
                        <audit-group-selector
                            [selected]="groupBy"
                            (selectedChange)="onGroupByChange($event)">
                        </audit-group-selector>
                    </div>

                    <div class="detection-field">
                        <label class="field-label">
                            <span nz-icon nzType="clock-circle" nzTheme="outline" class="label-icon"></span>
                            Alert Threshold
                            <span class="label-hint">When to fire the alert</span>
                        </label>
                        <div class="threshold-row">
                            <span class="threshold-text">Alert after</span>
                            <input type="number" min="1"
                                   class="threshold-input"
                                   [value]="threshold.amount"
                                   (input)="onThresholdAmountChange($event)">
                            <span class="threshold-text">{{ threshold.amount === 1 ? 'occurrence' : 'occurrences' }} within</span>
                            <input type="number" min="1"
                                   class="threshold-input"
                                   [value]="threshold.interval"
                                   (input)="onThresholdIntervalChange($event)">
                            <select class="threshold-select" [value]="threshold.unit" (change)="onThresholdUnitChange($event)">
                                <option *ngFor="let unit of timeUnits" [value]="unit.value">{{ unit.label }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .audit-rule-builder {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .builder-section {
            border: 1px solid #f0f0f0;
            border-radius: 4px;
            background: #fff;
            overflow: hidden;
        }
        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: rgba(0, 0, 0, 0.02);
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            user-select: none;
        }
        .section-title-row {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .section-title {
            font-size: 13px;
            font-weight: 600;
            color: rgba(0,0,0,0.85);
        }
        .section-subtitle {
            font-size: 12px;
            color: rgba(0,0,0,0.45);
        }
        .section-toggle {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: rgba(0,0,0,0.25);
        }
        .section-body {
            padding: 14px;
        }
        /* Evaluation Order Flow */
        .eval-order {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            margin-bottom: 12px;
            background: #fafafa;
            border-radius: 4px;
            flex-wrap: wrap;
        }
        .eval-label {
            font-size: 10px;
            font-weight: 500;
            color: rgba(0,0,0,0.45);
            margin-right: 4px;
        }
        .eval-badge {
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
        }
        .eval-blacklist {
            background: rgba(220, 38, 38, 0.1);
            color: #dc2626;
        }
        .eval-whitelist {
            background: rgba(5, 150, 105, 0.1);
            color: #059669;
        }
        .eval-detect {
            background: rgba(37, 99, 235, 0.1);
            color: #2563eb;
        }
        .eval-reset {
            background: rgba(217, 119, 6, 0.1);
            color: #d97706;
        }
        .eval-separator {
            font-size: 10px;
            color: rgba(0,0,0,0.25);
        }
        .purpose-groups {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .detection-field {
            margin-bottom: 12px;
        }
        .detection-field:last-child {
            margin-bottom: 0;
        }
        .field-label {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            font-weight: 500;
            color: rgba(0,0,0,0.45);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .label-icon {
            font-size: 11px;
            width: 11px;
            height: 11px;
        }
        .label-hint {
            font-weight: 400;
            text-transform: none;
            letter-spacing: normal;
            color: rgba(0,0,0,0.25);
            margin-left: 4px;
        }
        .threshold-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .threshold-text {
            font-size: 12px;
            color: rgba(0,0,0,0.45);
        }
        .threshold-input {
            width: 56px;
            height: 28px;
            padding: 0 6px;
            border: 1px solid #f0f0f0;
            border-radius: 3px;
            background: #fff;
            color: rgba(0,0,0,0.85);
            font-family: var(--font-code);
            font-size: 12px;
            text-align: center;
        }
        .threshold-input:focus {
            outline: none;
            border-color: #1890ff;
        }
        .threshold-select {
            height: 28px;
            padding: 0 8px;
            border: 1px solid #f0f0f0;
            border-radius: 3px;
            background: #fff;
            color: rgba(0,0,0,0.85);
            font-size: 12px;
        }
        .threshold-select:focus {
            outline: none;
            border-color: #1890ff;
        }
    `]
})
export class AuditRuleBuilderComponent implements OnInit, OnChanges {

    @Input() conditions: SapAuditRuleCondition[] = [];
    @Input() groupedBy: string[] = [];
    @Input() threshhold: number = 1;
    @Input() interval: number = 86400000;
    @Input() scopeInput: AuditRuleScope;

    @Input() events: SapAuditEvent[] = [];
    @Input() clients: { id: number; name: string; clientNo: string }[] = [];

    @Output() conditionsChange = new EventEmitter<SapAuditRuleCondition[]>();
    @Output() groupedByChange = new EventEmitter<string[]>();
    @Output() threshholdChange = new EventEmitter<number>();
    @Output() intervalChange = new EventEmitter<number>();
    @Output() scopeChange = new EventEmitter<AuditRuleScope>();

    conditionGroups: ConditionGroups = createEmptyGroups();
    groupBy: string[] = [];
    threshold: AuditRuleThreshold = createDefaultThreshold();
    collapsed: CollapsedState = createDefaultCollapsed();
    scope: AuditRuleScope = createDefaultScope();

    scopeExpanded = true;
    conditionsExpanded = true;
    detectionExpanded = true;

    private internalChange = false; // Skip ngOnChanges when we emitted the change

    purposeConfigs = PURPOSE_CONFIG;
    timeUnits = TIME_UNITS;

    eventSuggestions: string[] = [];
    clientSuggestions: { name: string; clientNo: string }[] = [];

    trackByKey(index: number, cfg: PurposeConfig): string {
        return cfg.key;
    }

    getConditionsForKey(key: string): any[] {
        return this.conditionGroups[key] || [];
    }

    ngOnInit(): void {
        this.initFromInputs();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['conditions'] && !changes['conditions'].firstChange) {
            // Skip re-grouping if this change was triggered by our own emit
            if (this.internalChange) {
                this.internalChange = false;
                return;
            }
            // Extract both groups and scope from conditions
            const result = groupConditionsWithScope(this.conditions || []);
            this.conditionGroups = result.groups;
            // Only update scope from conditions if scopeInput wasn't provided
            if (!this.scopeInput) {
                this.scope = result.scope;
            }
        }
        if (changes['groupedBy']) {
            this.groupBy = this.groupedBy || [];
        }
        if (changes['threshhold'] || changes['interval']) {
            this.updateThresholdFromInputs();
        }
        if (changes['scopeInput']) {
            this.scope = this.scopeInput || createDefaultScope();
        }
        if (changes['events']) {
            this.eventSuggestions = (this.events || []).map(e => e.eventText);
        }
        if (changes['clients']) {
            this.clientSuggestions = (this.clients || []).map(c => ({ name: c.name, clientNo: c.clientNo }));
        }
    }

    private initFromInputs(): void {
        // Extract both groups and scope from conditions
        const result = groupConditionsWithScope(this.conditions || []);
        this.conditionGroups = result.groups;
        // Use scopeInput if provided, otherwise use scope extracted from conditions
        this.scope = this.scopeInput || result.scope;
        this.groupBy = this.groupedBy || [];
        this.updateThresholdFromInputs();
        this.eventSuggestions = (this.events || []).map(e => e.eventText);
        this.clientSuggestions = (this.clients || []).map(c => ({ name: c.name, clientNo: c.clientNo }));
    }

    private updateThresholdFromInputs(): void {
        this.threshold.amount = this.threshhold || 1;
        const intervalMs = this.interval || 86400000;
        let bestUnit = TIME_UNITS[2];
        let bestInterval = 1;

        for (const unit of TIME_UNITS) {
            if (intervalMs % unit.value === 0) {
                bestUnit = unit;
                bestInterval = intervalMs / unit.value;
            }
        }

        this.threshold.unit = bestUnit.value;
        this.threshold.interval = bestInterval;
    }

    onScopeChange(newScope: AuditRuleScope): void {
        this.scope = newScope;
        this.scopeChange.emit(newScope);
        // Scope is converted to conditions, so emit conditions when scope changes
        this.emitConditions();
    }

    onConditionsChange(key: string, conditions: any[]): void {
        this.conditionGroups = {
            ...this.conditionGroups,
            [key]: conditions
        };
        this.emitConditions();
    }

    onCollapsedChange(key: string, collapsed: boolean): void {
        this.collapsed[key] = collapsed;
    }

    onGroupByChange(groupBy: string[]): void {
        this.groupBy = groupBy;
        this.groupedByChange.emit(groupBy);
    }

    onThresholdAmountChange(event: Event): void {
        const value = parseInt((event.target as HTMLInputElement).value) || 1;
        this.threshold.amount = value;
        this.threshholdChange.emit(value);
    }

    onThresholdIntervalChange(event: Event): void {
        const value = parseInt((event.target as HTMLInputElement).value) || 1;
        this.threshold.interval = value;
        this.emitInterval();
    }

    onThresholdUnitChange(event: Event): void {
        const value = parseInt((event.target as HTMLSelectElement).value);
        this.threshold.unit = value;
        this.emitInterval();
    }

    private emitConditions(): void {
        // Mark as internal so ngOnChanges skips re-grouping
        this.internalChange = true;
        // Pass scope to flatten - scope fields will be converted to conditions
        const flat = flattenConditions(this.conditionGroups, this.scope);
        this.conditionsChange.emit(flat);
    }

    private emitInterval(): void {
        const intervalMs = this.threshold.interval * this.threshold.unit;
        this.intervalChange.emit(intervalMs);
    }
}
