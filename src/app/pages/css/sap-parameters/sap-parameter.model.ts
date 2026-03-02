import { RuleTag, SapRuleConditionType, SapViolationSeverity } from '../css-shared/css-shared.model';

export interface SapParameter {
  id: number | null;
  parameterName: string;
  parameterType: string;
  description: string;
  minSapVersion: string;
}

export enum SapParameterRuleValueType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
}

export const SapParameterRuleValueTypeNames: Record<SapParameterRuleValueType, string> = {
  [SapParameterRuleValueType.TEXT]: 'Text',
  [SapParameterRuleValueType.NUMBER]: 'Number',
  [SapParameterRuleValueType.BOOLEAN]: 'Boolean',
  [SapParameterRuleValueType.DATE]: 'Date',
};

export enum SapParameterType {
  SAP_PARAMETER = 'SAP_PARAMETER',
  AUDIT_LOG = 'AUDIT_LOG',
  HANA_DATABASE = 'HANA_DATABASE',
  BTP = 'BTP',
  SAP_UME = 'SAP_UME',
  SAP_ABAP = 'SAP_ABAP',
}

export enum AddSapParameterType {
  SAP_PARAMETER = 'SAP_PARAMETER',
  HANA_DATABASE = 'HANA_DATABASE',
  SAP_UME = 'SAP_UME',
}

export const SapParameterTypeNames: Record<SapParameterType, string> = {
  [SapParameterType.SAP_PARAMETER]: 'Sap Parameter',
  [SapParameterType.AUDIT_LOG]: 'Audit Log',
  [SapParameterType.HANA_DATABASE]: 'Hana Database',
  [SapParameterType.SAP_UME]: 'Sap UME',
  [SapParameterType.BTP]: 'BTP',
  [SapParameterType.SAP_ABAP]: 'Sap Abap',
};

export const AddSapParameterTypeNames: Record<AddSapParameterType, string> = {
  [AddSapParameterType.SAP_PARAMETER]: 'Sap Parameter',
  [AddSapParameterType.HANA_DATABASE]: 'Hana Database',
  [AddSapParameterType.SAP_UME]: 'Sap UME',
};

export function getParameterType(ruleType: string): string {
  return SapParameterTypeNames[ruleType as SapParameterType] || ruleType;
}

export function getParameterSubType(ruleType: string): string {
  if (ruleType === null) return 'SAP';
  if (ruleType === '') return '';
  return SapParameterSubTypeNames[ruleType as SapParameterSubType] || ruleType;
}

export function getSapParameterKey(label: string): string | undefined {
  return Object.keys(SapParameterTypeNames).find(
    (key) => SapParameterTypeNames[key as SapParameterType] === label
  );
}

export enum SapParameterSubType {
  INI_FILE = 'INI_FILE',
  AUDIT_RULES = 'AUDIT_RULES',
  ACCESS_RULES = 'ACCESS_RULES',
}

export const SapParameterSubTypeNames: Record<SapParameterSubType, string> = {
  [SapParameterSubType.INI_FILE]: 'INI File',
  [SapParameterSubType.AUDIT_RULES]: 'Audit Rules',
  [SapParameterSubType.ACCESS_RULES]: 'Access Rules',
};

export interface SapParameterRule {
  id: number | null;
  name: string;
  caseSensitive: boolean;
  errorStatus: SapViolationSeverity;
  severity?: SapViolationSeverity;
  valueType: SapParameterRuleValueType;
  tags: RuleTag[];
  parameter: SapParameter;
  parameterSubType?: string;
  parameterType: string;
  conditions: SapParameterRuleCondition[];
  fieldRuleConditions?: any;
  description?: any;
  ruleDefinitionId?: any;
  whiteList?: any;
  blackList?: any;
  tag?: any;
  acmRuleId?: any;
  requirementNodes?: Array<any>;
  ruleVO?: any;
}

export interface SapParameterRuleCondition {
  id: number | null;
  values: string[];
  conditionType: SapRuleConditionType;
}

export enum HanaAuditRulesField {
  AUDIT_POLICY_OID = 'AUDIT_POLICY_OID',
  EVENT_STATUS = 'EVENT_STATUS',
  EVENT_LEVEL = 'EVENT_LEVEL',
  IS_AUDIT_POLICY_ACTIVE = 'IS_AUDIT_POLICY_ACTIVE',
  IS_VALID = 'IS_VALID',
  IS_DATABASE_LOCAL = 'IS_DATABASE_LOCAL',
  EVENT_ACTION = 'EVENT_ACTION',
  USER_NAME = 'USER_NAME',
  EXCEPT_USER_NAME = 'EXCEPT_USER_NAME',
  PRINCIPAL_NAME = 'PRINCIPAL_NAME',
  EXCEPT_PRINCIPAL_NAME = 'EXCEPT_PRINCIPAL_NAME',
  PRINCIPAL_TYPE = 'PRINCIPAL_TYPE',
  OBJECT_TYPE = 'OBJECT_TYPE',
  OBJECT_SCHEMA = 'OBJECT_SCHEMA',
  OBJECT_NAME = 'OBJECT_NAME',
  TRAIL_TYPE = 'TRAIL_TYPE',
  RETENTION_PERIOD = 'RETENTION_PERIOD',
  ROLE_NAME = 'ROLE_NAME',
  PRIVILEGE = 'PRIVILEGE',
  GRANTEE = 'GRANTEE',
  // SAP UME Fields
  FIRST_NAME = 'FIRST_NAME',
  EMAIL = 'EMAIL',
  IS_PASSWORD_DISABLED = 'IS_PASSWORD_DISABLED',
  LAST_NAME = 'LAST_NAME',
  DISPLAY_NAME = 'DISPLAY_NAME',
  LAST_MODIFIED_DATE = 'LAST_MODIFIED_DATE',
  DISABLE_DATE = 'DISABLE_DATE',
  ROLE = 'ROLE',
  PASSWORD_CHANGE_REQUIRED = 'PASSWORD_CHANGE_REQUIRED',
  GROUP = 'GROUP',
  SECURITY_POLICY = 'SECURITY_POLICY',
  LOCK_OUT = 'LOCK_OUT',
}

export const HanaAuditRulesFieldNames: Record<HanaAuditRulesField, string> = {
  [HanaAuditRulesField.AUDIT_POLICY_OID]: 'Audit Policy OID',
  [HanaAuditRulesField.EVENT_STATUS]: 'Event Status',
  [HanaAuditRulesField.EVENT_LEVEL]: 'Event Level',
  [HanaAuditRulesField.IS_AUDIT_POLICY_ACTIVE]: 'Is Audit Policy Active',
  [HanaAuditRulesField.IS_VALID]: 'Is Valid',
  [HanaAuditRulesField.IS_DATABASE_LOCAL]: 'Is Database Local',
  [HanaAuditRulesField.EVENT_ACTION]: 'Event Action',
  [HanaAuditRulesField.USER_NAME]: 'User Name',
  [HanaAuditRulesField.EXCEPT_USER_NAME]: 'Except User Name',
  [HanaAuditRulesField.PRINCIPAL_NAME]: 'Principal Name',
  [HanaAuditRulesField.EXCEPT_PRINCIPAL_NAME]: 'Except Principal Name',
  [HanaAuditRulesField.PRINCIPAL_TYPE]: 'Principal Type',
  [HanaAuditRulesField.OBJECT_TYPE]: 'Object Type',
  [HanaAuditRulesField.OBJECT_SCHEMA]: 'Object Schema',
  [HanaAuditRulesField.OBJECT_NAME]: 'Object Name',
  [HanaAuditRulesField.TRAIL_TYPE]: 'Trail Type',
  [HanaAuditRulesField.RETENTION_PERIOD]: 'Retention Period',
  [HanaAuditRulesField.ROLE_NAME]: 'Role Name',
  [HanaAuditRulesField.PRIVILEGE]: 'Privilege Name',
  [HanaAuditRulesField.GRANTEE]: 'Grantee',
  [HanaAuditRulesField.FIRST_NAME]: 'First Name',
  [HanaAuditRulesField.EMAIL]: 'Email',
  [HanaAuditRulesField.IS_PASSWORD_DISABLED]: 'Is Password Disabled',
  [HanaAuditRulesField.LAST_NAME]: 'Last Name',
  [HanaAuditRulesField.DISPLAY_NAME]: 'Display Name',
  [HanaAuditRulesField.LAST_MODIFIED_DATE]: 'Last Modified Date',
  [HanaAuditRulesField.DISABLE_DATE]: 'Disable Date',
  [HanaAuditRulesField.ROLE]: 'Role',
  [HanaAuditRulesField.PASSWORD_CHANGE_REQUIRED]: 'Password Change Required',
  [HanaAuditRulesField.GROUP]: 'Group',
  [HanaAuditRulesField.SECURITY_POLICY]: 'Security Policy',
  [HanaAuditRulesField.LOCK_OUT]: 'Lock Out',
};

export const HanaAuditRulesFieldSourceMap: {
  [type in SapParameterType]?: { [subType: string]: HanaAuditRulesField[] };
} = {
  [SapParameterType.HANA_DATABASE]: {
    AUDIT_RULES: [
      HanaAuditRulesField.AUDIT_POLICY_OID,
      HanaAuditRulesField.EVENT_STATUS,
      HanaAuditRulesField.EVENT_LEVEL,
      HanaAuditRulesField.IS_AUDIT_POLICY_ACTIVE,
      HanaAuditRulesField.IS_VALID,
      HanaAuditRulesField.IS_DATABASE_LOCAL,
      HanaAuditRulesField.EVENT_ACTION,
      HanaAuditRulesField.USER_NAME,
      HanaAuditRulesField.EXCEPT_USER_NAME,
      HanaAuditRulesField.PRINCIPAL_NAME,
      HanaAuditRulesField.EXCEPT_PRINCIPAL_NAME,
      HanaAuditRulesField.PRINCIPAL_TYPE,
      HanaAuditRulesField.OBJECT_TYPE,
      HanaAuditRulesField.OBJECT_SCHEMA,
      HanaAuditRulesField.OBJECT_NAME,
      HanaAuditRulesField.TRAIL_TYPE,
      HanaAuditRulesField.RETENTION_PERIOD,
    ],
    ACCESS_RULES: [
      HanaAuditRulesField.ROLE_NAME,
      HanaAuditRulesField.PRIVILEGE,
      HanaAuditRulesField.OBJECT_TYPE,
      HanaAuditRulesField.GRANTEE,
    ],
  },
  [SapParameterType.SAP_UME]: {
    DEFAULT: [
      HanaAuditRulesField.FIRST_NAME,
      HanaAuditRulesField.EMAIL,
      HanaAuditRulesField.IS_PASSWORD_DISABLED,
      HanaAuditRulesField.LAST_NAME,
      HanaAuditRulesField.DISPLAY_NAME,
      HanaAuditRulesField.LAST_MODIFIED_DATE,
      HanaAuditRulesField.DISABLE_DATE,
      HanaAuditRulesField.ROLE,
      HanaAuditRulesField.PASSWORD_CHANGE_REQUIRED,
      HanaAuditRulesField.SECURITY_POLICY,
      HanaAuditRulesField.GROUP,
      HanaAuditRulesField.LOCK_OUT,
    ],
  },
};
