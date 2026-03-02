/**
 * Utility functions to convert Visual Query Builder format to ICM-compatible format.
 * Inline SAP type map (no external dependency on operator-config).
 */

// SAP field type → QB type mapping (inlined from operator-config)
export const qbSAPTypesMap: Record<string, string> = {
  ACCP: 'string', CHAR: 'string', CLNT: 'integer', CUKY: 'string', CURR: 'string',
  DF16_DEC: 'double', DF16_RAW: 'double', DF16_SCL: 'double',
  DF34_DEC: 'double', DF34_RAW: 'double', DF34_SCL: 'double',
  DATS: 'date', DEC: 'double', FLTP: 'double',
  INT1: 'integer', INT2: 'integer', INT4: 'integer',
  LANG: 'string', LCHR: 'string', LRAW: 'string',
  NUMC: 'integer', PREC: 'integer', QUAN: 'double',
  RAW: 'string', RAWSTRING: 'string', SSTRING: 'string', STRING: 'string',
  TIMS: 'time', UNIT: 'string', STRU: 'string',
};

// ---------- Operator Mappings ----------

export const visualQBToICMOperatorMap: Record<string, string> = {
  'Equal': 'equal', 'Not Equal': 'not_equal', 'In': 'in', 'Not In': 'not_in',
  'Less': 'less', 'Less or Equal': 'less_or_equal', 'Greater': 'greater', 'Greater or Equal': 'greater_or_equal',
  'Between': 'between', 'Not Between': 'not_between',
  'Begins With': 'begins_with', 'Not Begins With': 'not_begins_with',
  'Contains': 'contains', 'Not Contains': 'not_contains',
  'Ends With': 'ends_with', 'Not Ends With': 'not_ends_with',
  'Is Empty': 'is_empty', 'Is Not Empty': 'is_not_empty',
  'Is Null': 'is_null', 'Is Not Null': 'is_not_null',
  // Legacy symbol operators
  '=': 'equal', '!=': 'not_equal', '>': 'greater', '<': 'less',
  '>=': 'greater_or_equal', '<=': 'less_or_equal',
  'LIKE': 'contains', 'NOT LIKE': 'not_contains',
  'IN': 'in', 'NOT IN': 'not_in', 'BETWEEN': 'between', 'NOT BETWEEN': 'not_between',
  'IS NULL': 'is_null', 'IS NOT NULL': 'is_not_null',
  'IS EMPTY': 'is_empty', 'IS NOT EMPTY': 'is_not_empty',
};

export const icmToVisualQBOperatorMap: Record<string, string> = {
  'equal': 'Equal', 'not_equal': 'Not Equal', 'greater': 'Greater', 'less': 'Less',
  'greater_or_equal': 'Greater or Equal', 'less_or_equal': 'Less or Equal',
  'contains': 'Contains', 'not_contains': 'Not Contains',
  'begins_with': 'Begins With', 'not_begins_with': 'Not Begins With',
  'ends_with': 'Ends With', 'not_ends_with': 'Not Ends With',
  'in': 'In', 'not_in': 'Not In', 'between': 'Between', 'not_between': 'Not Between',
  'is_null': 'Is Null', 'is_not_null': 'Is Not Null',
  'is_empty': 'Is Empty', 'is_not_empty': 'Is Not Empty',
};

// ---------- Interfaces ----------

export interface VisualQBFilterRule {
  field: string; operator: string; value: any; value2?: any; type?: string;
  function?: string; param1?: any; param2?: any;
  condition?: 'AND' | 'OR'; rules?: VisualQBFilterRule[];
}

export interface VisualQBFilterQuery { condition: 'AND' | 'OR'; rules: VisualQBFilterRule[]; }

export interface ICMExtendedRule {
  id: string; field: string; operator: string; value: any;
  value1?: any; value2?: any; type: string; function?: string | null;
  param1?: any; param2?: any; param3?: any; dateOffsetN?: number;
  condition?: 'AND' | 'OR'; rules?: ICMExtendedRule[];
}

export interface ICMExtendedRuleSet { condition: 'AND' | 'OR'; rules: ICMExtendedRule[]; }

export interface ICMJoin {
  srcTable: { id: number }; srcField: { id: number };
  targetTable: { id: number }; targetField: { id: number };
  fields: Array<{ id: number }>;
}

export interface VisualQBJoin {
  sourceTable: string; sourceField: string; targetTable: string; targetField: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'; selectedFields?: string[];
}

// ---------- Helper Functions ----------

export function mapVisualQBOperatorToICM(operator: string, value?: any): string {
  const mapped = visualQBToICMOperatorMap[operator];
  if (mapped) return mapped;
  if (operator === 'LIKE' && typeof value === 'string') {
    if (value.startsWith('%') && value.endsWith('%')) return 'contains';
    if (value.startsWith('%')) return 'ends_with';
    if (value.endsWith('%')) return 'begins_with';
    return 'contains';
  }
  if (operator === 'NOT LIKE' && typeof value === 'string') {
    if (value.startsWith('%') && value.endsWith('%')) return 'not_contains';
    if (value.startsWith('%')) return 'not_ends_with';
    if (value.endsWith('%')) return 'not_begins_with';
    return 'not_contains';
  }
  return 'equal';
}

export function mapICMOperatorToVisualQB(icmOperator: string): string {
  return icmToVisualQBOperatorMap[icmOperator] || 'Equal';
}

export function mapSAPTypeToICMType(sapType: string): string {
  return qbSAPTypesMap[sapType?.toUpperCase()] || 'string';
}

export function formatDateToString(date: any): string {
  if (!date) return '';
  if (date._isAMomentObject || (typeof date === 'object' && typeof date.format === 'function')) {
    return date.format('YYYY-MM-DD');
  }
  if (date instanceof Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    try {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    } catch { return date; }
    return date;
  }
  return String(date);
}

export function buildICMFunctionString(rule: VisualQBFilterRule): string | null {
  const fn = rule.function;
  if (!fn) return null;
  if (fn === 'current_date' || fn === 'current_date-1' || fn === 'current_date-n') return '';
  const params: any[] = [];
  if (rule.param1 !== undefined && rule.param1 !== '') params.push(rule.param1);
  if (rule.param2 !== undefined && rule.param2 !== '') params.push(rule.param2);
  return params.length > 0 ? `${fn}(${params.join(',')})` : fn;
}

// ---------- Conversion Functions ----------

export function convertVisualQBRuleToICM(visualQBRule: VisualQBFilterRule, tableName: string, sapFieldType: string): ICMExtendedRule {
  let icmRule: ICMExtendedRule = {
    id: visualQBRule.field, field: visualQBRule.field,
    operator: mapVisualQBOperatorToICM(visualQBRule.operator, visualQBRule.value),
    value: visualQBRule.value, type: mapSAPTypeToICMType(sapFieldType),
    function: buildICMFunctionString(visualQBRule),
  };
  if (typeof icmRule.value === 'number') icmRule.value = icmRule.value.toString();
  if ((icmRule.type === 'date' || visualQBRule.type === 'date') && icmRule.value) {
    icmRule.value = formatDateToString(icmRule.value);
  }
  if (visualQBRule.operator === 'BETWEEN' && visualQBRule.value2) {
    icmRule.value1 = icmRule.value;
    icmRule.value2 = visualQBRule.value2;
    if (icmRule.type === 'date' || visualQBRule.type === 'date') {
      if (icmRule.value2) icmRule.value2 = formatDateToString(icmRule.value2);
    }
  }
  if (visualQBRule.param1 !== undefined) icmRule.param1 = visualQBRule.param1;
  if (visualQBRule.param2 !== undefined) icmRule.param2 = visualQBRule.param2;
  if (visualQBRule.type === 'date' || mapSAPTypeToICMType(sapFieldType) === 'date') {
    if (visualQBRule.function === 'current_date') { icmRule.value = 'current_date'; icmRule.function = ''; }
    else if (visualQBRule.function === 'current_date-1') { icmRule.value = 'current_date-1'; icmRule.function = ''; }
    else if (visualQBRule.function === 'current_date-n' && visualQBRule.param1) {
      icmRule.dateOffsetN = parseInt(String(visualQBRule.param1), 10);
      icmRule.value = `current_date-${icmRule.dateOffsetN}`; icmRule.function = '';
    }
  }
  if (visualQBRule.rules && visualQBRule.rules.length > 0) {
    icmRule.condition = (visualQBRule.condition || 'AND').toUpperCase() as 'AND' | 'OR';
    icmRule.rules = visualQBRule.rules.map(r => convertVisualQBRuleToICM(r, tableName, sapFieldType));
  }
  if (icmRule.type === 'date') {
    const { function: _f, dateOffsetN, ...rest } = icmRule;
    icmRule = rest as ICMExtendedRule;
  }
  return icmRule;
}

export function convertVisualQBQueryToICM(
  query: VisualQBFilterQuery, tableName: string, fieldsMap: Map<string, string>
): ICMExtendedRuleSet {
  return {
    condition: query.condition.toUpperCase() as 'AND' | 'OR',
    rules: query.rules.map(rule => {
      const fieldType = fieldsMap.get(rule.field) || 'CHAR';
      return convertVisualQBRuleToICM(rule, tableName, fieldType);
    }),
  };
}

export function generateSQLFromICMRuleSet(ruleSet: ICMExtendedRuleSet, tableName: string): string {
  if (!ruleSet || !ruleSet.rules || ruleSet.rules.length === 0) return '';
  const conditions = ruleSet.rules.map(rule => {
    if (rule.rules && rule.rules.length > 0) {
      const nested: ICMExtendedRuleSet = { condition: rule.condition || 'AND', rules: rule.rules };
      return `(${generateSQLFromICMRuleSet(nested, tableName)})`;
    }
    let field = rule.id;
    if (rule.function) field = `${rule.function.toUpperCase()}(${field})`;
    let value: any = rule.value;
    if (rule.type === 'date') {
      if (value && value !== 'current_date' && value !== 'current_date-1' && !(typeof value === 'string' && value.startsWith('current_date-'))) {
        value = formatDateToString(value);
      }
      if (value === 'current_date') value = 'CURRENT_DATE';
      else if (value === 'current_date-1') value = 'CURRENT_DATE - INTERVAL 1 DAY';
      else if (value && typeof value === 'string' && value.startsWith('current_date-')) { value = `CURRENT_DATE - INTERVAL ${rule.dateOffsetN || 0} DAY`; }
      else value = `'${value}'`;
    } else if (rule.operator !== 'is_null' && rule.operator !== 'is_not_null') {
      value = typeof value === 'string' ? `'${value}'` : value;
    }
    switch (rule.operator) {
      case 'equal': return `${field} = ${value}`;
      case 'not_equal': return `${field} <> ${value}`;
      case 'greater': return `${field} > ${value}`;
      case 'less': return `${field} < ${value}`;
      case 'greater_or_equal': return `${field} >= ${value}`;
      case 'less_or_equal': return `${field} <= ${value}`;
      case 'between': {
        let v1 = rule.value1, v2 = rule.value2;
        if (rule.type === 'date') { v1 = formatDateToString(v1); v2 = formatDateToString(v2); }
        return `${field} BETWEEN '${v1}' AND '${v2}'`;
      }
      case 'not_between': {
        let v1 = rule.value1, v2 = rule.value2;
        if (rule.type === 'date') { v1 = formatDateToString(v1); v2 = formatDateToString(v2); }
        return `${field} NOT BETWEEN '${v1}' AND '${v2}'`;
      }
      case 'in': {
        const vals = Array.isArray(rule.value)
          ? rule.value.map(v => v instanceof Date ? `'${formatDateToString(v)}'` : `'${v}'`).join(', ')
          : `'${rule.value}'`;
        return `${field} IN (${vals})`;
      }
      case 'not_in': {
        const vals = Array.isArray(rule.value)
          ? rule.value.map(v => v instanceof Date ? `'${formatDateToString(v)}'` : `'${v}'`).join(', ')
          : `'${rule.value}'`;
        return `${field} NOT IN (${vals})`;
      }
      case 'contains': return `${field} LIKE '%${rule.value}%'`;
      case 'not_contains': return `${field} NOT LIKE '%${rule.value}%'`;
      case 'begins_with': return `${field} LIKE '${rule.value}%'`;
      case 'not_begins_with': return `${field} NOT LIKE '${rule.value}%'`;
      case 'ends_with': return `${field} LIKE '%${rule.value}'`;
      case 'not_ends_with': return `${field} NOT LIKE '%${rule.value}'`;
      case 'is_empty': return `${field} = ''`;
      case 'is_not_empty': return `${field} <> ''`;
      case 'is_null': return `${field} IS NULL`;
      case 'is_not_null': return `${field} IS NOT NULL`;
      default: return `${field} = ${value}`;
    }
  });
  return conditions.join(` ${ruleSet.condition} `);
}

export function convertICMRuleSetToJSON(ruleSet: ICMExtendedRuleSet): string {
  return JSON.stringify(ruleSet, null, 2);
}

export function convertICMRuleToVisualQB(icmRule: ICMExtendedRule): VisualQBFilterRule {
  const rule: VisualQBFilterRule = {
    field: icmRule.field || icmRule.id,
    operator: mapICMOperatorToVisualQB(icmRule.operator),
    value: icmRule.value, type: icmRule.type,
  };
  if (icmRule.operator === 'between' && icmRule.value1 && icmRule.value2) {
    rule.value = icmRule.value1; rule.value2 = icmRule.value2;
  }
  if (icmRule.function) rule.function = icmRule.function;
  if (icmRule.param1 !== undefined) rule.param1 = icmRule.param1;
  if (icmRule.param2 !== undefined) rule.param2 = icmRule.param2;
  if (icmRule.rules && icmRule.rules.length > 0) {
    rule.condition = icmRule.condition;
    rule.rules = icmRule.rules.map(r => convertICMRuleToVisualQB(r));
  }
  return rule;
}

export function convertICMRuleSetToVisualQB(ruleSet: ICMExtendedRuleSet): VisualQBFilterQuery {
  return { condition: ruleSet.condition, rules: ruleSet.rules.map(r => convertICMRuleToVisualQB(r)) };
}

export function convertVisualQBJoinToICM(
  _join: VisualQBJoin, sourceTableId: number, targetTableId: number,
  sourceFieldId: number, targetFieldId: number,
  _sourceSelectedFieldIds: number[], targetSelectedFieldIds: number[]
): ICMJoin {
  return {
    srcTable: { id: sourceTableId }, srcField: { id: sourceFieldId },
    targetTable: { id: targetTableId }, targetField: { id: targetFieldId },
    fields: targetSelectedFieldIds.map(id => ({ id })),
  };
}

export function convertVisualQBJoinsToICM(
  visualJoins: VisualQBJoin[],
  tableNodeMap: Map<string, { tableId: number; fields: Map<string, number>; selectedFields: string[] }>
): ICMJoin[] {
  return visualJoins.map(join => {
    const src = tableNodeMap.get(join.sourceTable);
    const tgt = tableNodeMap.get(join.targetTable);
    if (!src || !tgt) return null;
    const srcFieldId = src.fields.get(join.sourceField);
    const tgtFieldId = tgt.fields.get(join.targetField);
    if (srcFieldId === undefined || tgtFieldId === undefined) return null;
    const srcSelectedIds = (src.selectedFields || []).map(n => src.fields.get(n)).filter((id): id is number => id !== undefined);
    const tgtSelectedIds = (join.selectedFields || []).map(n => tgt.fields.get(n)).filter((id): id is number => id !== undefined);
    return convertVisualQBJoinToICM(join, src.tableId, tgt.tableId, srcFieldId, tgtFieldId, srcSelectedIds, tgtSelectedIds);
  }).filter((j): j is ICMJoin => j !== null);
}
