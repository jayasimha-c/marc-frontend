export enum SapViolationSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export const SapViolationSeverityCodeMap: Record<number, SapViolationSeverity> = {
  4: SapViolationSeverity.CRITICAL,
  3: SapViolationSeverity.HIGH,
  2: SapViolationSeverity.MEDIUM,
  1: SapViolationSeverity.LOW,
};

export const SapViolationSeverityNames: Record<SapViolationSeverity, string> = {
  [SapViolationSeverity.CRITICAL]: 'Critical',
  [SapViolationSeverity.HIGH]: 'High',
  [SapViolationSeverity.MEDIUM]: 'Medium',
  [SapViolationSeverity.LOW]: 'Low',
};

export function getSeverityLabel(raw: string | number | null | undefined): string {
  if (raw == null) return '';

  const num = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
  if (!isNaN(num)) {
    const mapped = SapViolationSeverityCodeMap[num];
    return mapped ? SapViolationSeverityNames[mapped] : String(num);
  }

  if (typeof raw === 'number') {
    const mapped = SapViolationSeverityCodeMap[raw];
    return mapped ? SapViolationSeverityNames[mapped] : String(raw);
  }

  if (typeof raw === 'string') {
    const upper = raw.toUpperCase().trim();
    const enumValue = SapViolationSeverity[upper as keyof typeof SapViolationSeverity];
    if (enumValue) {
      return SapViolationSeverityNames[enumValue];
    }
    return raw;
  }

  return String(raw);
}

export enum SapRuleConditionType {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  NOT_STARTS_WITH = 'NOT_STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  NOT_ENDS_WITH = 'NOT_ENDS_WITH',
  GREATER = 'GREATER',
  GREATER_EQUALS = 'GREATER_EQUALS',
  LESSER = 'LESSER',
  LESSER_EQUALS = 'LESSER_EQUALS',
  BETWEEN = 'BETWEEN',
  NOT_BETWEEN = 'NOT_BETWEEN',
  EMPTY = 'EMPTY',
  IS_SET = 'IS_SET',
}

export const SapRuleConditionTypeNames: Record<SapRuleConditionType, string> = {
  [SapRuleConditionType.EQUALS]: 'Equals',
  [SapRuleConditionType.NOT_EQUALS]: 'Not Equals',
  [SapRuleConditionType.IN]: 'In',
  [SapRuleConditionType.NOT_IN]: 'Not In',
  [SapRuleConditionType.CONTAINS]: 'Contains',
  [SapRuleConditionType.NOT_CONTAINS]: 'Not Contains',
  [SapRuleConditionType.STARTS_WITH]: 'Starts With',
  [SapRuleConditionType.NOT_STARTS_WITH]: 'Not Starts With',
  [SapRuleConditionType.ENDS_WITH]: 'Ends With',
  [SapRuleConditionType.NOT_ENDS_WITH]: 'Not Ends With',
  [SapRuleConditionType.GREATER]: 'Greater',
  [SapRuleConditionType.GREATER_EQUALS]: 'Greater or Equals',
  [SapRuleConditionType.LESSER]: 'Lesser',
  [SapRuleConditionType.LESSER_EQUALS]: 'Lesser or Equals',
  [SapRuleConditionType.BETWEEN]: 'Between',
  [SapRuleConditionType.NOT_BETWEEN]: 'Not Between',
  [SapRuleConditionType.EMPTY]: 'Empty',
  [SapRuleConditionType.IS_SET]: 'Is set',
};

export enum CssImportLogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  ABORT = 'ABORT',
}

export interface CssImportLog {
  level: CssImportLogLevel;
  object: string;
  objectId: string;
  message: string;
}

export interface RuleTag {
  id: number | null;
  name: string;
}

export interface RequirementNode {
  id: number;
  name: string;
  description?: string;
  frameworkName?: string;
}

export function conditionValuesToString(
  condition: { conditionType: SapRuleConditionType; values: string[] },
  valueType: string
): string {
  if (valueType === 'DATE') {
    const str: string[] = [];
    if (
      condition.conditionType === SapRuleConditionType.BETWEEN ||
      condition.conditionType === SapRuleConditionType.NOT_BETWEEN
    ) {
      for (let i = 0; i < condition.values.length; i += 2) {
        str.push(
          new Date(condition.values[i]).toLocaleDateString() +
            ' - ' +
            new Date(condition.values[i + 1]).toLocaleDateString()
        );
      }
    } else {
      return condition.values.map((v) => new Date(v).toLocaleDateString()).join(' or ');
    }
    return str.join(' or ');
  } else {
    return condition.values.map((c) => '"' + c + '"').join(' or ');
  }
}

export function conditionToString(
  condition: { conditionType: SapRuleConditionType; values: string[] },
  valueType: string
): string {
  let text = SapRuleConditionTypeNames[condition.conditionType];
  text += '(';
  text += conditionValuesToString(condition, valueType);
  text += ')';
  return text;
}
