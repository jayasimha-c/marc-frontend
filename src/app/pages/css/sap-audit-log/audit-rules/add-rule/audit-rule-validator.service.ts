import { Injectable } from '@angular/core';
import { SapRuleConditionType } from '../../../css-shared/css-shared.model';
import { SapAuditLogField, SapAuditMatchMode, SapAuditRule, SapAuditRuleCondition } from '../../sap-audit-log.model';
import { AUDIT_RULE_SCHEMA, RULE_TAGS } from './audit-rule-ai-schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  parsedRule?: SapAuditRule;
}

@Injectable({ providedIn: 'root' })
export class AuditRuleValidatorService {
  validate(jsonString: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      return { valid: false, errors: [`Invalid JSON syntax: ${(e as Error).message}`], warnings: [] };
    }

    if (!parsed.name || typeof parsed.name !== 'string' || parsed.name.trim() === '') {
      errors.push('Missing or empty required field: name');
    }

    if (!parsed.severity) {
      errors.push('Missing required field: severity');
    } else if (!AUDIT_RULE_SCHEMA.severities.includes(parsed.severity.toUpperCase())) {
      errors.push(`Invalid severity "${parsed.severity}". Must be one of: ${AUDIT_RULE_SCHEMA.severities.join(', ')}`);
    }

    if (!parsed.tag) {
      errors.push(`Missing required field: tag. Must be one of: ${RULE_TAGS.map((t) => t.name).join(', ')}`);
    } else {
      const validTag = RULE_TAGS.find(
        (t) => t.name.toLowerCase() === parsed.tag.toLowerCase() || t.id === parsed.tag
      );
      if (!validTag) {
        errors.push(`Invalid tag "${parsed.tag}". Must be one of: ${RULE_TAGS.map((t) => t.name).join(', ')}`);
      } else {
        parsed._tagObject = validTag;
      }
    }

    if (parsed.threshhold !== undefined) {
      if (typeof parsed.threshhold !== 'number' || parsed.threshhold < 1) {
        errors.push('threshhold must be a positive number (minimum 1)');
      }
    } else {
      warnings.push('threshhold not specified, defaulting to 1');
      parsed.threshhold = 1;
    }

    if (parsed.interval !== undefined) {
      if (typeof parsed.interval !== 'number' || parsed.interval < 60000) {
        errors.push('interval must be a number in milliseconds (minimum 60000 = 1 minute)');
      }
    } else {
      warnings.push('interval not specified, defaulting to 3600000 (1 hour)');
      parsed.interval = 3600000;
    }

    if (parsed.groupedBy !== undefined) {
      if (!Array.isArray(parsed.groupedBy)) {
        errors.push('groupedBy must be an array of field names');
      } else {
        for (const field of parsed.groupedBy) {
          if (!AUDIT_RULE_SCHEMA.fields.includes(field)) {
            const suggestion = this.suggestField(field);
            errors.push(`Invalid groupedBy field "${field}"${suggestion ? `. Did you mean "${suggestion}"?` : ''}`);
          }
        }
      }
    } else {
      parsed.groupedBy = [];
    }

    if (!parsed.conditions || !Array.isArray(parsed.conditions)) {
      errors.push('Missing or invalid conditions array');
    } else if (parsed.conditions.length === 0) {
      warnings.push('No conditions specified - rule will match all audit events');
    } else {
      parsed.conditions.forEach((condition: any, index: number) => {
        errors.push(...this.validateCondition(condition, index));
      });
    }

    let parsedRule: SapAuditRule | undefined;
    if (errors.length === 0) {
      parsedRule = this.buildRule(parsed);
    }

    return { valid: errors.length === 0, errors, warnings, parsedRule };
  }

  private validateCondition(condition: any, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Condition ${index + 1}`;

    if (!condition.field) {
      errors.push(`${prefix}: Missing required field "field"`);
    } else if (!AUDIT_RULE_SCHEMA.fields.includes(condition.field)) {
      const suggestion = this.suggestField(condition.field);
      errors.push(`${prefix}: Invalid field "${condition.field}"${suggestion ? `. Did you mean "${suggestion}"?` : ''}`);
    }

    if (!condition.conditionType) {
      errors.push(`${prefix}: Missing required field "conditionType"`);
    } else if (!AUDIT_RULE_SCHEMA.conditionTypes.includes(condition.conditionType)) {
      const suggestion = this.suggestConditionType(condition.conditionType);
      errors.push(`${prefix}: Invalid conditionType "${condition.conditionType}"${suggestion ? `. Did you mean "${suggestion}"?` : ''}`);
    }

    if (!condition.values) {
      errors.push(`${prefix}: Missing required field "values"`);
    } else if (!Array.isArray(condition.values)) {
      errors.push(`${prefix}: "values" must be an array`);
    } else {
      const type = condition.conditionType;
      if ((type === 'BETWEEN' || type === 'NOT_BETWEEN') && condition.values.length !== 2) {
        errors.push(`${prefix}: ${type} requires exactly 2 values [start, end]`);
      }
      if ((type === 'EMPTY' || type === 'IS_SET') && condition.values.length !== 0) {
        errors.push(`${prefix}: ${type} should have empty values array`);
      }
    }

    if (condition.matchMode && !AUDIT_RULE_SCHEMA.matchModes.includes(condition.matchMode)) {
      errors.push(`${prefix}: Invalid matchMode "${condition.matchMode}". Must be one of: ${AUDIT_RULE_SCHEMA.matchModes.join(', ')}`);
    }

    return errors;
  }

  private buildRule(parsed: any): SapAuditRule {
    const conditions: SapAuditRuleCondition[] = (parsed.conditions || []).map((c: any) => ({
      id: null,
      field: c.field as SapAuditLogField,
      conditionType: c.conditionType as SapRuleConditionType,
      values: c.values || [],
      matchMode: (c.matchMode as SapAuditMatchMode) || SapAuditMatchMode.NORMAL,
    }));

    const tags = parsed._tagObject ? [{ id: parsed._tagObject.id, name: parsed._tagObject.name }] : [];

    return {
      id: null,
      name: parsed.name.trim(),
      description: parsed.description || '',
      severity: parsed.severity.toUpperCase(),
      groupedBy: parsed.groupedBy || [],
      threshhold: parsed.threshhold || 1,
      interval: parsed.interval || 3600000,
      conditions,
      tags,
    };
  }

  private suggestField(input: string): string | null {
    const upper = input.toUpperCase();
    const fields = AUDIT_RULE_SCHEMA.fields;
    const partial = fields.find((f) => f.includes(upper) || upper.includes(f));
    if (partial) return partial;

    const aliases: Record<string, string> = {
      USERNAME: 'USER', USERID: 'USER', USER_NAME: 'USER',
      IPADDRESS: 'IP', IP_ADDRESS: 'IP', SOURCE_IP: 'IP',
      CLIENT: 'CLIENT_NO', CLIENTNO: 'CLIENT_NO',
      EVENT_CODE: 'EVENT', EVENTCODE: 'EVENT', AUDIT_EVENT: 'EVENT',
      TIMESTAMP: 'TIME', DATETIME: 'TIME',
      HOSTNAME: 'HOST', WORKSTATION: 'TERMINAL',
      PARAMETER1: 'PARAM_1', PARAMETER2: 'PARAM_2', PARAMETER3: 'PARAM_3',
      MSG: 'MESSAGE', TEXT: 'MESSAGE',
      SYSTEM: 'SAP_ID', SYSTEM_ID: 'SAP_ID', SID: 'SAP_ID',
    };
    return aliases[upper] || null;
  }

  private suggestConditionType(input: string): string | null {
    const normalized = input.toUpperCase().replace(/[\s_-]/g, '');
    const types = AUDIT_RULE_SCHEMA.conditionTypes;
    const match = types.find((t) => t.replace(/_/g, '') === normalized);
    if (match) return match;

    const aliases: Record<string, string> = {
      EQ: 'EQUALS', EQUAL: 'EQUALS', NE: 'NOT_EQUALS', NEQ: 'NOT_EQUALS',
      LIKE: 'CONTAINS', INCLUDES: 'CONTAINS', HAS: 'CONTAINS',
      GT: 'GREATER', GTE: 'GREATER_EQUALS', LT: 'LESSER', LTE: 'LESSER_EQUALS',
      RANGE: 'BETWEEN', ONEOF: 'IN', ANYOF: 'IN',
      NULL: 'EMPTY', ISNULL: 'EMPTY', ISEMPTY: 'EMPTY',
      NOTNULL: 'IS_SET', NOTEMPTY: 'IS_SET', EXISTS: 'IS_SET',
    };
    return aliases[normalized] || null;
  }

  formatInterval(ms: number): string {
    if (ms >= 86400000 && ms % 86400000 === 0) {
      const days = ms / 86400000;
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    if (ms >= 3600000 && ms % 3600000 === 0) {
      const hours = ms / 3600000;
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (ms >= 60000 && ms % 60000 === 0) {
      const minutes = ms / 60000;
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${ms} ms`;
  }
}
