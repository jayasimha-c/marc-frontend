import { SapViolationSeverity } from '../css-shared/css-shared.model';

export interface BtpRule {
  id: number | null;
  name: string;
  description: string;
  severity: SapViolationSeverity;
  ruleDefinitionId: string;
}

export enum RuleType {
  SAP_PARAMETER = 'SAP_PARAMETER',
  AUDIT_LOG = 'AUDIT_LOG',
  HANA_DATABASE = 'HANA_DATABASE',
  BTP = 'BTP',
  SAP_UME = 'SAP_UME',
  SAP_ABAP = 'SAP_ABAP',
}

export const RuleTypeNames: Record<RuleType, string> = {
  [RuleType.SAP_PARAMETER]: 'Sap Parameter',
  [RuleType.AUDIT_LOG]: 'Audit Log',
  [RuleType.HANA_DATABASE]: 'Hana Database',
  [RuleType.BTP]: 'BTP',
  [RuleType.SAP_UME]: 'Sap UME',
  [RuleType.SAP_ABAP]: 'Sap Abap',
};

export function getRuleTypeLabel(ruleType: string): string {
  return RuleTypeNames[ruleType as RuleType] || ruleType;
}

export function getRuleTypeByLabel(label: string): string {
  const entry = Object.entries(RuleTypeNames).find(([, v]) => v === label);
  return entry ? entry[0] : label;
}
