import { SapAuditLogField, SapAuditMatchMode, SapAuditRuleCondition } from "../../../sap-audit-log.model";
import { SapRuleConditionType } from "../../../../css-shared/css-shared.model";

export interface AuditCondition {
    id: number | null;
    tempId?: number; // For tracking in UI before save
    field: SapAuditLogField;
    conditionType: SapRuleConditionType;
    values: string[];
    whiteList?: { id: number; valueList: string };
}

export interface ConditionGroups {
    detect: AuditCondition[];
    whitelist: AuditCondition[];
    blacklist: AuditCondition[];
    reset: AuditCondition[];
}

export interface AuditRuleScope {
    events: string;
    client: string;
    message: string;
    hoursFrom: string;
    hoursTo: string;
    // Preserve condition IDs when editing existing rules (Issue #4)
    eventConditionId?: number | null;
    clientConditionId?: number | null;
    messageConditionId?: number | null;
    timeConditionId?: number | null;
}

export interface AuditRuleThreshold {
    amount: number;
    interval: number;
    unit: number; // milliseconds multiplier
}

export interface CollapsedState {
    detect: boolean;
    whitelist: boolean;
    blacklist: boolean;
    reset: boolean;
}

// Helper functions
let _tempIdCounter = 1000;

export function generateTempId(): number {
    return _tempIdCounter++;
}

export function createEmptyCondition(field: SapAuditLogField = SapAuditLogField.EVENT): AuditCondition {
    return {
        id: null,
        tempId: generateTempId(),
        field: field,
        conditionType: SapRuleConditionType.IN,
        values: []
    };
}

export function createEmptyGroups(): ConditionGroups {
    return {
        detect: [],
        whitelist: [],
        blacklist: [],
        reset: []
    };
}

export function createDefaultScope(): AuditRuleScope {
    return {
        events: '',
        client: '',
        message: '',
        hoursFrom: '',
        hoursTo: ''
    };
}

export function createDefaultThreshold(): AuditRuleThreshold {
    return {
        amount: 1,
        interval: 1,
        unit: 86400000 // Days
    };
}

export function createDefaultCollapsed(): CollapsedState {
    return {
        detect: false,
        whitelist: false,
        blacklist: false,
        reset: true
    };
}

// Convert grouped conditions to flat array with matchMode (for saving)
export function flattenConditions(groups: ConditionGroups, scope?: AuditRuleScope): SapAuditRuleCondition[] {
    const conditions: SapAuditRuleCondition[] = [];

    const mapToCondition = (cond: AuditCondition, matchMode: SapAuditMatchMode): SapAuditRuleCondition => ({
        id: cond.id,
        field: cond.field,
        conditionType: cond.conditionType,
        values: cond.values,
        matchMode: matchMode,
        whiteList: cond.whiteList
    });

    // Convert scope to conditions (NORMAL matchMode)
    // Matches the old add-sap-audit-rule-filter output exactly
    if (scope) {
        // Event Codes → EVENT + EQUALS (single) or IN (multiple)
        if (scope.events && scope.events.trim()) {
            const eventValues = scope.events.split(',').map(v => v.trim()).filter(v => v);
            if (eventValues.length > 0) {
                conditions.push({
                    id: scope.eventConditionId ?? null,
                    field: SapAuditLogField.EVENT,
                    conditionType: eventValues.length === 1 ? SapRuleConditionType.EQUALS : SapRuleConditionType.IN,
                    values: eventValues,
                    matchMode: SapAuditMatchMode.NORMAL
                });
            }
        }

        // Client → CLIENT_NO + EQUALS
        if (scope.client && scope.client.trim()) {
            conditions.push({
                id: scope.clientConditionId ?? null,
                field: SapAuditLogField.CLIENT_NO,
                conditionType: SapRuleConditionType.EQUALS,
                values: [scope.client.trim()],
                matchMode: SapAuditMatchMode.NORMAL
            });
        }

        // Message Contains → MESSAGE + CONTAINS
        if (scope.message && scope.message.trim()) {
            conditions.push({
                id: scope.messageConditionId ?? null,
                field: SapAuditLogField.MESSAGE,
                conditionType: SapRuleConditionType.CONTAINS,
                values: [scope.message.trim()],
                matchMode: SapAuditMatchMode.NORMAL
            });
        }

        // Business Hours → TIME + BETWEEN (values as plain number strings to match old format)
        if (scope.hoursFrom && scope.hoursTo) {
            conditions.push({
                id: scope.timeConditionId ?? null,
                field: SapAuditLogField.TIME,
                conditionType: SapRuleConditionType.BETWEEN,
                values: [scope.hoursFrom, scope.hoursTo],
                matchMode: SapAuditMatchMode.NORMAL
            });
        }
    }

    groups.detect.forEach(c => conditions.push(mapToCondition(c, SapAuditMatchMode.NORMAL)));
    groups.whitelist.forEach(c => conditions.push(mapToCondition(c, SapAuditMatchMode.WHITELIST)));
    groups.blacklist.forEach(c => conditions.push(mapToCondition(c, SapAuditMatchMode.BLACKLIST)));
    groups.reset.forEach(c => conditions.push(mapToCondition(c, SapAuditMatchMode.RESET)));

    return conditions;
}

// Check if a NORMAL condition matches a scope pattern
// Only conditions with actual values are treated as scope — empty conditions are user-created detect conditions
function isScopeCondition(cond: SapAuditRuleCondition): boolean {
    if (cond.matchMode !== SapAuditMatchMode.NORMAL && cond.matchMode !== undefined) {
        return false;
    }

    // Empty values means this is a freshly added condition, not a scope condition
    if (!cond.values || cond.values.length === 0 || cond.values.every(v => !v)) {
        return false;
    }

    // EVENT + IN or EQUALS → scope.events
    if (cond.field === SapAuditLogField.EVENT &&
        (cond.conditionType === SapRuleConditionType.IN || cond.conditionType === SapRuleConditionType.EQUALS)) {
        return true;
    }

    // CLIENT_NO + EQUALS → scope.client
    if (cond.field === SapAuditLogField.CLIENT_NO && cond.conditionType === SapRuleConditionType.EQUALS) {
        return true;
    }

    // MESSAGE + CONTAINS → scope.message
    if (cond.field === SapAuditLogField.MESSAGE && cond.conditionType === SapRuleConditionType.CONTAINS) {
        return true;
    }

    // TIME + BETWEEN → scope.hoursFrom/hoursTo
    if (cond.field === SapAuditLogField.TIME && cond.conditionType === SapRuleConditionType.BETWEEN) {
        return true;
    }

    return false;
}

// Extract scope from a condition, preserving the condition ID for edits
function extractToScope(cond: SapAuditRuleCondition, scope: AuditRuleScope): void {
    const values = cond.values || [];

    if (cond.field === SapAuditLogField.EVENT) {
        scope.events = values.join(', ');
        scope.eventConditionId = cond.id;
    } else if (cond.field === SapAuditLogField.CLIENT_NO) {
        scope.client = values[0] || '';
        scope.clientConditionId = cond.id;
    } else if (cond.field === SapAuditLogField.MESSAGE) {
        scope.message = values[0] || '';
        scope.messageConditionId = cond.id;
    } else if (cond.field === SapAuditLogField.TIME && values.length >= 2) {
        scope.hoursFrom = values[0] || '';
        scope.hoursTo = values[1] || '';
        scope.timeConditionId = cond.id;
    }
}

// Result type for groupConditions with scope extraction
export interface GroupedConditionsResult {
    groups: ConditionGroups;
    scope: AuditRuleScope;
}

// Convert flat conditions array to grouped structure (for editing)
// Also extracts scope conditions from NORMAL conditions
export function groupConditions(conditions: SapAuditRuleCondition[]): ConditionGroups {
    return groupConditionsWithScope(conditions).groups;
}

// Convert flat conditions array to grouped structure with scope extraction
export function groupConditionsWithScope(conditions: SapAuditRuleCondition[]): GroupedConditionsResult {
    const groups = createEmptyGroups();
    const scope = createDefaultScope();

    conditions.forEach(cond => {
        // Check if this is a scope condition (NORMAL matchMode with specific field/type combo)
        if (isScopeCondition(cond)) {
            extractToScope(cond, scope);
            return; // Don't add to detect group
        }

        const auditCond: AuditCondition = {
            id: cond.id,
            tempId: generateTempId(),
            field: cond.field,
            conditionType: cond.conditionType,
            values: cond.values || [],
            whiteList: cond.whiteList
        };

        switch (cond.matchMode) {
            case SapAuditMatchMode.WHITELIST:
                groups.whitelist.push(auditCond);
                break;
            case SapAuditMatchMode.BLACKLIST:
                groups.blacklist.push(auditCond);
                break;
            case SapAuditMatchMode.RESET:
                groups.reset.push(auditCond);
                break;
            default:
                groups.detect.push(auditCond);
                break;
        }
    });

    return { groups, scope };
}
