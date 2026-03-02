export enum ReadinessCheckStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARNING = 'WARNING',
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

export interface ModuleInfo {
  code: string;
  name: string;
  description: string;
}

export interface ReadinessCheckVO {
  checkId: string;
  name: string;
  description: string;
  helpText: string;
  status: ReadinessCheckStatus;
  statusMessage: string;
  navigationRoute: string;
  category: string;
  required: string;
  order: number;
}

export interface ReadinessCheckCategoryVO {
  categoryId: string;
  name: string;
  description?: string;
  order: number;
  checks: ReadinessCheckVO[];
  passedCount: number;
  failedCount: number;
  warningCount: number;
  notApplicableCount: number;
}

export interface ModuleReadinessVO {
  moduleType: string;
  moduleName: string;
  moduleDescription: string;
  categories: ReadinessCheckCategoryVO[];
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  notApplicableChecks: number;
  readinessPercentage: number;
  overallStatus: string;
  checkTimestamp: number;
}
