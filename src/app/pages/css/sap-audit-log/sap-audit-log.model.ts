import { RuleTag, SapRuleConditionType, SapViolationSeverity, RequirementNode } from '../css-shared/css-shared.model';

export interface SapAuditRule {
  id: number | null;
  name: string;
  description: string;
  severity: SapViolationSeverity;
  groupedBy: string[];
  threshhold: number;
  interval: number;
  conditions: SapAuditRuleCondition[];
  tags: RuleTag[];
  events?: SapAuditEvent[];
  requirementNodes?: RequirementNode[];
  source?: string;
  code?: string;
}

export interface SapAuditRuleCondition {
  id: number | null;
  conditionType: SapRuleConditionType;
  values: string[];
  field: SapAuditLogField;
  matchMode: SapAuditMatchMode;
  whiteList?: { id: number; valueList: any };
}

export interface SapAuditEvent {
  id: number;
  key: string;
  category: string;
  criticality: string;
  eventText: string;
  risk: string;
  detection: string;
  mitigation: string;
}

export enum SapAuditMatchMode {
  NORMAL = 'NORMAL',
  WHITELIST = 'WHITELIST',
  BLACKLIST = 'BLACKLIST',
  RESET = 'RESET',
}

export enum SapAuditLogField {
  SAP_ID = 'SAP_ID',
  EVENT = 'EVENT',
  MESSAGE = 'MESSAGE',
  USER = 'USER',
  TERMINAL = 'TERMINAL',
  SEVERITY = 'SEVERITY',
  TYPE = 'TYPE',
  TIME = 'TIME',
  CLIENT_NO = 'CLIENT_NO',
  PARAM_1 = 'PARAM_1',
  PARAM_2 = 'PARAM_2',
  PARAM_3 = 'PARAM_3',
  IP = 'IP',
  HOST = 'HOST',
}

export const SapAuditLogFieldNames: Record<SapAuditLogField, string> = {
  [SapAuditLogField.SAP_ID]: 'Sap Id',
  [SapAuditLogField.EVENT]: 'Event',
  [SapAuditLogField.MESSAGE]: 'Message',
  [SapAuditLogField.USER]: 'User',
  [SapAuditLogField.TERMINAL]: 'Terminal',
  [SapAuditLogField.SEVERITY]: 'Severity',
  [SapAuditLogField.TYPE]: 'Type',
  [SapAuditLogField.TIME]: 'Time',
  [SapAuditLogField.CLIENT_NO]: 'Client No',
  [SapAuditLogField.PARAM_1]: 'Parameter 1',
  [SapAuditLogField.PARAM_2]: 'Parameter 2',
  [SapAuditLogField.PARAM_3]: 'Parameter 3',
  [SapAuditLogField.IP]: 'Ip',
  [SapAuditLogField.HOST]: 'Host',
};

export function intervalConverter(interval: number): { value: number; unit: string } {
  const MINUTE = 60000;
  const HOUR = 3600000;
  const DAY = 86400000;

  const ret = { value: 0, unit: '' };
  if (interval >= DAY && interval % DAY === 0) {
    ret.unit = 'days';
    ret.value = Math.round(interval / DAY);
  } else if (interval >= HOUR && interval % HOUR === 0) {
    ret.unit = 'hours';
    ret.value = Math.round(interval / HOUR);
  } else {
    ret.unit = 'minutes';
    ret.value = Math.round(interval / MINUTE);
  }
  return ret;
}
