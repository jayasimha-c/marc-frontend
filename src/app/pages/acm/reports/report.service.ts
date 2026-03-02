import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

// ── REM Dashboard Models ──────────────────────────────────

export interface RemDashboardFilterRequest {
  sapDestinationName?: string;
  startDate?: string;   // dd/MM/yyyy
  endDate?: string;     // dd/MM/yyyy
  riskLevels?: string[];
  riskTypes?: string[];
  businessProcesses?: string[];
  userIds?: string[];
  page?: number;
  size?: number;
  sortField?: string;
  sortDirection?: string;
}

export interface ChartDataItem {
  label: string;
  value: number;
  percentage: number;
}

export interface TrendDataItem {
  date: string;
  count: number;
}

export interface TopItem {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface RemDashboardStatsVO {
  totalExecutions: number;
  uniqueRisks: number;
  uniqueUsers: number;
  sodCount: number;
  otherCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  riskTypeDistribution: ChartDataItem[];
  riskLevelDistribution: ChartDataItem[];
  businessProcessDistribution: ChartDataItem[];
  trendData: TrendDataItem[];
  topUsers: TopItem[];
  topRisks: TopItem[];
  availableBusinessProcesses: string[];
  availableUsers: string[];
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  constructor(private http: HttpClient) {}

  // ── Job listings (server-side paginated) ──────────────────

  getAnalysisJobs(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `analysis/getJobs?timeZone=${this.timezone}&first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || {}))}`
    );
  }

  getSimulations(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `simulations/getJobs?timeZone=${this.timezone}&first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || {}))}`
    );
  }

  getAdhocAnalysis(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `adhocAnalysis/getJobs?timeZone=${this.timezone}&first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || {}))}`
    );
  }

  getScheduledJobs(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `analysis/getScheduledJobs?timeZone=${this.timezone}&first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || {}))}`
    );
  }

  getNonAbapJobs(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `sfAnalysis/getJobs?timeZone=${this.timezone}&first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || {}))}`
    );
  }

  // ── Delete ────────────────────────────────────────────────

  deleteResults(jobIds: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`analysis/deleteResults?selectedIds=${jobIds}`);
  }

  deleteNonAbapResults(jobIds: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sfAnalysis/deleteResults?selectedIds=${jobIds}`);
  }

  // ── Violation / Summary / Detail results for ViewResults ──

  getViolationResults(payload: any): Observable<ApiResponse> {
    const prefix = payload.analysisType === 'NON-ABAP' ? 'sfAnalysis' : 'analysis';
    return this.http.get<ApiResponse>(
      `${prefix}/violationResults?jobId=${payload.jobId}&first=${payload.first}&rows=${payload.rows}&sortOrder=${payload.sortOrder}&sortField=${payload.sortField || ''}&filters=${encodeURI(JSON.stringify(payload.filters || {}))}`
    );
  }

  resultSummary(payload: any): Observable<ApiResponse> {
    const prefix = payload.analysisType === 'NON-ABAP' ? 'sfAnalysis' : 'analysis';
    const bpmnParam = payload.bpmnRules ? `&bpmnRules=${payload.bpmnRules}` : '';
    return this.http.get<ApiResponse>(
      `${prefix}/resultSummary?jobId=${payload.jobId}&first=${payload.first}&rows=${payload.rows}&sortOrder=${payload.sortOrder}&sortField=${payload.sortField || ''}&filters=${encodeURI(JSON.stringify(payload.filters || {}))}${bpmnParam}`
    );
  }

  riskViolationGrid(payload: any): Observable<ApiResponse> {
    const bpmnParam = payload.bpmnRules ? `&bpmnRules=${payload.bpmnRules}` : '';
    return this.http.get<ApiResponse>(
      `analysis/riskViolaitonGrid?jobId=${payload.jobId}&first=${payload.first}&rows=${10000}&sortOrder=${payload.sortOrder}&sortField=${payload.sortField || ''}&filters=${encodeURI(JSON.stringify(payload.filters || {}))}${bpmnParam}`
    );
  }

  ruleViolationGrid(payload: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `analysis/violaitonGrid?jobId=${payload.jobId}&first=${payload.first}&rows=${payload.rows}&sortOrder=${payload.sortOrder}&sortField=${payload.sortField || ''}&filters=${encodeURI(JSON.stringify(payload.filters || {}))}`
    );
  }

  // ── Statistics ────────────────────────────────────────────

  sodAnalysisStats(jobId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sodAnalysisStats/?jobId=${jobId}`);
  }

  getSodJobMetrics(jobId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`analysis/jobInfo?jobId=${jobId}`);
  }

  // ── Org checks ────────────────────────────────────────────

  checkFieldExistance(jobId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`analysis/checkFieldExistance?jobId=${jobId}`);
  }

  startOrgChecks(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('analysis/startOrgChecks', payload);
  }

  // ── Mitigations ───────────────────────────────────────────

  getMitigations(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `mitigations/get?first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || {}))}`
    );
  }

  addMitigationUser(payload: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`mitigations/addMitigationUser?mitigationId=${payload.mitigationId}&userId=${payload.userId}`);
  }

  addMitigation(payload: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('mitigations/addMitigation');
  }

  // ── Charts ────────────────────────────────────────────────

  getSankeyChartData(payload: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `analysis/getSankeyChartData?jobId=${payload.jobId}&bname=${payload.name}&simulation=${payload.simulation || false}`
    );
  }

  // ── Export / Validation ───────────────────────────────────

  validateRiskReportCount(jobId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`analysis/validateRiskReportCount?jobId=${jobId}`);
  }

  validateRecordCount(jobId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`analysis/validateRuleReportCount?jobId=${jobId}`);
  }

  generateMatrixReport(jobId: string): Observable<any> {
    return this.http.get(`roleMatrix/generateMatrixReport?jobId=${jobId}`, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  // ── SOD Compare ───────────────────────────────────────────

  sodCompare(selectedJobs: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sodCompare/selectJobs?jobIds=${selectedJobs}`);
  }

  // ── Pivot ─────────────────────────────────────────────────

  findRiskUsers(jobId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`analysis/findRiskUsers/${jobId}`);
  }

  findNonAbapRiskUsers(jobId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`systemAnalysis/findRiskUsers/${jobId}`);
  }

  // ── REM Dashboard ─────────────────────────────────────────

  getRemSysNames(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('riskExecution/getSysNames');
  }

  getRemDashboardStats(request: RemDashboardFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('riskExecution/dashboard/stats', request);
  }

  getRemDashboardExecutions(request: RemDashboardFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('riskExecution/dashboard/executions', request);
  }

  // ── Tcode Execution ─────────────────────────────────────

  getTransactionExecution(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `transactionExecution/getTransactions?first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || []))}`
    );
  }

  getTCodeExeToExport(event: any): Observable<ArrayBuffer> {
    return this.http.get(
      `transactionExecution/exportTransactionSummary?first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || []))}`,
      { responseType: 'arraybuffer' }
    );
  }

  autoCompleteSapSystem(search: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapSystem/autoComplete?search=${search}`);
  }

  transactionExecutionFindByUser(key: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`transactionExecution/findByUser/${key}`);
  }

  transactionExecutionFindBySystemName(key: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`transactionExecution/findBySystemName/${key}`);
  }

  // ── Risk Execution ──────────────────────────────────────

  getRisks(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `riskExecution/getRisks?first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || []))}`
    );
  }

  getRiskExeToExport(event: any): Observable<ArrayBuffer> {
    return this.http.get(
      `riskExecution/exportRiskSummary?first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || []))}`,
      { responseType: 'arraybuffer' }
    );
  }

  riskExecutionFindByUser(key: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`riskExecution/findByUser/${key}`);
  }

  riskExecutionFindByRisk(key: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`riskExecution/findByRisk/${key}`);
  }

  riskExecutionFindBySystemName(key: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`riskExecution/findBySystemName/${key}`);
  }

  // ── Rule Execution ──────────────────────────────────────

  getExecutionRules(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `ruleExecution/getRules?first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || []))}`
    );
  }

  getRuleExeToExport(event: any): Observable<ArrayBuffer> {
    return this.http.get(
      `ruleExecution/exportRuleSummary?first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || []))}`,
      { responseType: 'arraybuffer' }
    );
  }

  ruleExecutionFindByUser(key: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`ruleExecution/findByUser/${key}`);
  }

  ruleExecutionFindBySystemName(key: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`ruleExecution/findBySystemName/${key}`);
  }

  // ── Risk Analysis Dashboard ─────────────────────────────

  getSapSystems(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('util/getSAPSystems');
  }

  getDashboardSodRiskSummary(sapSystemId: number, startDate: string, endDate: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `riskAnalysisDashboard/sodRiskSummary?sapSystemId=${sapSystemId}&startDate=${startDate}&endDate=${endDate}`
    );
  }

  getDashboardSensitiveAccess(sapSystemId: number, startDate: string, endDate: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `riskAnalysisDashboard/sensitiveRiskSummary?sapSystemId=${sapSystemId}&startDate=${startDate}&endDate=${endDate}`
    );
  }

  getDashboardRoleBasedSod(sapSystemId: number, startDate: string, endDate: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `riskAnalysisDashboard/roleBasedSOD?sapSystemId=${sapSystemId}&startDate=${startDate}&endDate=${endDate}`
    );
  }

  getDashboardUserBasedSod(sapSystemId: number, startDate: string, endDate: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `riskAnalysisDashboard/userBasedSOD?sapSystemId=${sapSystemId}&startDate=${startDate}&endDate=${endDate}`
    );
  }

  getDashboardRisksTable(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `riskAnalysisDashboard/getRisks?first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || []))}&timeZone=${this.timezone}`
    );
  }

  getDashboardRoleDetails(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `riskAnalysisDashboard/roleDetails?first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&sapSystemId=${event.sapSystemId || ''}&startDate=${event.startDate || ''}&endDate=${event.endDate || ''}&filters=${encodeURI(JSON.stringify(event.filters || []))}&timeZone=${this.timezone}`
    );
  }

  getDashboardUserDetails(event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `riskAnalysisDashboard/userAnalysisDetails?first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&sapSystemId=${event.sapSystemId || ''}&startDate=${event.startDate || ''}&endDate=${event.endDate || ''}&filters=${encodeURI(JSON.stringify(event.filters || []))}&timeZone=${this.timezone}`
    );
  }

  getDashboardViolationDetails(payload: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `riskAnalysisDashboard/violationDetails?jobId=${payload.jobId || ''}&bname=${payload.bname || ''}&roleName=${payload.roleName || ''}&riskLevel=${payload.riskLevel || ''}`
    );
  }

  addDashboardUserReviewJob(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('arc/job/addFromSOD', payload);
  }
}
