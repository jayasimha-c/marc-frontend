import { Injectable } from '@angular/core';
import { RFC_RULE_FIELDS, RFC_RULE_OPERATORS, RFC_RULE_SEVERITIES, RfcRuleAIOutput, RfcRuleCondition } from './rfc-rule-ai-schema';

export interface RfcRuleValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  parsedRule: RfcRuleAIOutput | null;
}

export interface ValidationError {
  message: string;
  field?: string;
}

@Injectable({ providedIn: 'root' })
export class RfcRuleValidatorService {
  private readonly validFields = Object.keys(RFC_RULE_FIELDS);
  private readonly validOperators = Object.keys(RFC_RULE_OPERATORS);
  private readonly validSeverities = RFC_RULE_SEVERITIES;

  validate(jsonInput: string): RfcRuleValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    let parsedRule: RfcRuleAIOutput | null = null;

    let parsed: any;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (e) {
      errors.push({ message: `Invalid JSON: ${(e as SyntaxError).message}` });
      return { valid: false, errors, warnings, parsedRule: null };
    }

    if (!parsed.ruleName || typeof parsed.ruleName !== 'string') {
      errors.push({ message: 'Missing or invalid "ruleName"', field: 'ruleName' });
    }
    if (!parsed.ruleDescription || typeof parsed.ruleDescription !== 'string') {
      errors.push({ message: 'Missing or invalid "ruleDescription"', field: 'ruleDescription' });
    }
    if (!parsed.severity || !this.validSeverities.includes(String(parsed.severity).toUpperCase())) {
      errors.push({ message: `Invalid severity. Must be: ${this.validSeverities.join(', ')}`, field: 'severity' });
    }

    if (!parsed.conditions || !Array.isArray(parsed.conditions)) {
      errors.push({ message: 'Missing or invalid "conditions" array', field: 'conditions' });
    } else if (parsed.conditions.length === 0) {
      errors.push({ message: '"conditions" cannot be empty', field: 'conditions' });
    } else {
      parsed.conditions.forEach((cond: any, i: number) => {
        if (!cond.field || !this.validFields.includes(cond.field)) {
          errors.push({ message: `conditions[${i}]: Invalid field "${cond.field}"`, field: `conditions[${i}].field` });
        }
        if (!cond.operator || !this.validOperators.includes(String(cond.operator).toUpperCase())) {
          errors.push({ message: `conditions[${i}]: Invalid operator "${cond.operator}"`, field: `conditions[${i}].operator` });
        }
        if (cond.value === undefined) {
          errors.push({ message: `conditions[${i}]: Missing "value"`, field: `conditions[${i}].value` });
        }
      });
    }

    if (errors.length === 0) {
      parsedRule = {
        ruleName: parsed.ruleName.trim(),
        ruleDescription: parsed.ruleDescription.trim(),
        severity: parsed.severity.toUpperCase() as RfcRuleAIOutput['severity'],
        conditions: parsed.conditions.map((c: any): RfcRuleCondition => ({
          field: c.field,
          operator: c.operator.toUpperCase() as RfcRuleCondition['operator'],
          value: c.value,
        })),
      };
    }

    return { valid: errors.length === 0, errors, warnings, parsedRule };
  }

  getFieldDescription(fieldName: string): string {
    const field = RFC_RULE_FIELDS[fieldName as keyof typeof RFC_RULE_FIELDS];
    return field ? field.description : fieldName;
  }

  getOperatorDescription(operatorName: string): string {
    const op = RFC_RULE_OPERATORS[operatorName as keyof typeof RFC_RULE_OPERATORS];
    return op ? op.description : operatorName;
  }

  formatValue(value: any): string {
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ');
    if (typeof value === 'string') return `"${value}"`;
    return String(value);
  }
}
