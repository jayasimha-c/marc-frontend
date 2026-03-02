import { SapAuditLogField, SapAuditLogFieldNames, SapAuditMatchMode } from "../../../sap-audit-log.model";
import { SapRuleConditionType, SapRuleConditionTypeNames } from "../../../../css-shared/css-shared.model";

export interface LogFieldOption {
    value: SapAuditLogField;
    label: string;
    type: 'text' | 'time';
}

export interface OperatorOption {
    value: SapRuleConditionType;
    label: string;
}

export interface PurposeConfig {
    key: string;
    matchMode: SapAuditMatchMode;
    label: string;
    desc: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    connector: 'AND' | 'OR';
}

export const LOG_FIELDS: LogFieldOption[] = [
    { value: SapAuditLogField.EVENT, label: "Event", type: "text" },
    { value: SapAuditLogField.USER, label: "User", type: "text" },
    { value: SapAuditLogField.TIME, label: "Time", type: "time" },
    { value: SapAuditLogField.TERMINAL, label: "Terminal", type: "text" },
    { value: SapAuditLogField.TYPE, label: "Type", type: "text" },
    { value: SapAuditLogField.MESSAGE, label: "Message", type: "text" },
    { value: SapAuditLogField.SEVERITY, label: "Severity", type: "text" },
    { value: SapAuditLogField.CLIENT_NO, label: "Client No", type: "text" },
    { value: SapAuditLogField.SAP_ID, label: "SAP ID", type: "text" },
    { value: SapAuditLogField.IP, label: "IP Address", type: "text" },
    { value: SapAuditLogField.HOST, label: "Host", type: "text" },
    { value: SapAuditLogField.PARAM_1, label: "Parameter 1", type: "text" },
    { value: SapAuditLogField.PARAM_2, label: "Parameter 2", type: "text" },
    { value: SapAuditLogField.PARAM_3, label: "Parameter 3", type: "text" },
];

export const TEXT_OPERATORS: OperatorOption[] = [
    { value: SapRuleConditionType.IN, label: "is in" },
    { value: SapRuleConditionType.NOT_IN, label: "is not in" },
    { value: SapRuleConditionType.EQUALS, label: "equals" },
    { value: SapRuleConditionType.NOT_EQUALS, label: "does not equal" },
    { value: SapRuleConditionType.CONTAINS, label: "contains" },
    { value: SapRuleConditionType.NOT_CONTAINS, label: "does not contain" },
    { value: SapRuleConditionType.STARTS_WITH, label: "starts with" },
    { value: SapRuleConditionType.ENDS_WITH, label: "ends with" },
];

export const TIME_OPERATORS: OperatorOption[] = [
    { value: SapRuleConditionType.BETWEEN, label: "between" },
    { value: SapRuleConditionType.NOT_BETWEEN, label: "not between" },
];

export const PURPOSE_CONFIG: PurposeConfig[] = [
    {
        key: "detect",
        matchMode: SapAuditMatchMode.NORMAL,
        label: "Detect",
        desc: "Core detection conditions. ALL must be true (AND logic).",
        color: "#2563eb",
        bgColor: "#eff6ff",
        borderColor: "#bfdbfe",
        icon: "filter",
        connector: "AND",
    },
    {
        key: "whitelist",
        matchMode: SapAuditMatchMode.WHITELIST,
        label: "Whitelist",
        desc: "Logs matching ANY whitelist condition are skipped entirely.",
        color: "#059669",
        bgColor: "#ecfdf5",
        borderColor: "#a7f3d0",
        icon: "eye-invisible",
        connector: "OR",
    },
    {
        key: "blacklist",
        matchMode: SapAuditMatchMode.BLACKLIST,
        label: "Blacklist",
        desc: "Logs matching ANY blacklist condition trigger an immediate alert.",
        color: "#dc2626",
        bgColor: "#fef2f2",
        borderColor: "#fecaca",
        icon: "exclamation-circle",
        connector: "OR",
    },
    {
        key: "reset",
        matchMode: SapAuditMatchMode.RESET,
        label: "Reset",
        desc: "Resets the occurrence counter back to zero when matched.",
        color: "#d97706",
        bgColor: "#fffbeb",
        borderColor: "#fde68a",
        icon: "undo",
        connector: "OR",
    },
];

export const GROUP_FIELDS: string[] = [
    "User", "Event", "Terminal", "Severity", "Type", "Time",
    "Client No", "Sap Id", "Message", "Ip", "Host",
    "Parameter 1", "Parameter 2", "Parameter 3"
];

export const TIME_UNITS = [
    { value: 60000, label: "Minutes" },
    { value: 3600000, label: "Hours" },
    { value: 86400000, label: "Days" },
    { value: 604800000, label: "Weeks" },
];

export const SAMPLE_VALUES: { [key: string]: string[] } = {
    EVENT: ["AU1", "AU2", "AU3", "AU4", "AU5", "AU6", "AU7", "AU8", "AU9", "AUA", "AUB", "AUC", "AUD", "AUE", "AUF", "AUK", "AUM", "AUW", "AUY", "CUZ", "DU9", "EU1", "EU2"],
    USER: ["DDIC", "SAP*", "ADMIN", "BASIS", "FIREFIGHTER", "EARLYWATCH", "TMSADM", "SAPCPIC"],
    SEVERITY: ["0", "1", "2", "3"],
    TYPE: ["0", "1", "2", "3"],
};

export function getOperators(fieldType: 'text' | 'time'): OperatorOption[] {
    return fieldType === 'time' ? TIME_OPERATORS : TEXT_OPERATORS;
}

export function getFieldMeta(fieldValue: SapAuditLogField): LogFieldOption {
    return LOG_FIELDS.find(f => f.value === fieldValue) || LOG_FIELDS[0];
}

export function getPurposeConfig(key: string): PurposeConfig {
    return PURPOSE_CONFIG.find(p => p.key === key) || PURPOSE_CONFIG[0];
}

export function getPurposeByMatchMode(matchMode: SapAuditMatchMode): PurposeConfig {
    return PURPOSE_CONFIG.find(p => p.matchMode === matchMode) || PURPOSE_CONFIG[0];
}
