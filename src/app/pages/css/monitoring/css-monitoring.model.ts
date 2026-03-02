import { SapAuditRule } from '../sap-audit-log/sap-audit-log.model';
import { SapParameterRule } from '../sap-parameters/sap-parameter.model';
import { RuleTag } from '../css-shared/css-shared.model';
import { BtpRule } from '../btp/btp.model';

export interface SapRuleBook {
  id: number | null;
  name: string;
  description: string;
  securityLevel: string;
  ruleType: string;
  tags?: RuleTag[];
  parameterRules?: SapParameterRule[];
  auditRules?: SapAuditRule[];
  btpRules?: BtpRule[];
  assignments?: RuleBookAssignment[];
}

export interface RuleBookAssignment {
  id: number | null;
  ruleBookId: number;
  ruleBookName?: string;
  sapSystemId: number;
  sapSystemName?: string;
  ruleType: string;
  enabled: boolean;
  startDate: string | null;
  endDate: string | null;
  repeatPeriodically: boolean;
  repeatAfterDays: number;
  repeatAfterHours: number;
  repeatAfterMinutes: number;
  lastExecutionTime: number | null;
  nextExecutionTime: number | null;
  createdBy?: string;
  status?: string;
}

export interface CssRuleInconsistency {
  ruleId: number;
  ruleCode: string;
  ruleName: string;
  ruleType: string;
  parameterType: string;
  severity: string;
  checkSeverity: string;
  inconsistencies: string[];
}
