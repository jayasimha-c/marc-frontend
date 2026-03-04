import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response';
import { TableQueryParams } from '../../shared/components/advanced-table/advanced-table.models';
import { GridRequestBuilder } from '../../core/utils/grid-request.builder';

@Injectable({
  providedIn: 'root',
})
export class AbapService {
  constructor(private http: HttpClient) {}

  // ==================== Detection Pattern API ====================

  getDetectionPatternList(params: TableQueryParams): Observable<ApiResponse> {
    const body = GridRequestBuilder.toLegacy(params);
    const url =
      `abap/pattern/list?first=${body.first}&rows=${body.rows}` +
      `&sortOrder=${body.sortOrder}&sortField=${body.sortField}` +
      `&filters=${encodeURI(JSON.stringify(body.filters))}` +
      (body.globalFilter ? `&globalFilter=${encodeURIComponent(body.globalFilter)}` : '');
    return this.http.get<ApiResponse>(url);
  }

  getDetectionPatternById(patternId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`abap/pattern/${patternId}`);
  }

  saveDetectionPattern(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('abap/pattern/save-or-update', payload);
  }

  deleteDetectionPattern(patternId: any): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`abap/pattern?patternId=${patternId}`);
  }

  exportDetectionPatternsJsonBackground(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('abap/pattern/export-json-background', {});
  }

  importDetectionPatternsJson(file: File, importMode: string = 'OVERWRITE'): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse>(`abap/pattern/import-json?importMode=${importMode}`, formData);
  }

  exportExcel(entityType: string): Observable<Blob> {
    return this.http.get(`abap/excel/export/${entityType}`, { responseType: 'blob' });
  }

  // ==================== Rule API ====================

  getAllRules(params: TableQueryParams): Observable<ApiResponse> {
    const body = GridRequestBuilder.toLegacy(params);
    const url =
      `abap/rule/list?first=${body.first}&rows=${body.rows}` +
      `&sortOrder=${body.sortOrder}&sortField=${body.sortField}` +
      `&filters=${encodeURI(JSON.stringify(body.filters))}` +
      (body.globalFilter ? `&globalFilter=${encodeURIComponent(body.globalFilter)}` : '');
    return this.http.get<ApiResponse>(url);
  }

  getAllRulesNoPagination(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/rule/list/all');
  }

  getAbapRuleCount(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/rule/count');
  }

  saveRule(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('abap/rule/save-or-update', payload);
  }

  deleteRule(ruleId: any): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`abap/rule/delete?ruleId=${ruleId}`);
  }

  deactivateRule(ruleId: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`abap/rule/change-status?ruleId=${ruleId}`);
  }

  exportRulesReport(): Observable<Blob> {
    return this.http.get('abap/excel/export-rules-report', { responseType: 'blob' });
  }

  // ==================== Reference Data ====================

  getOwaspCategories(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/owasp-category');
  }

  getAbapCategories(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/categories');
  }

  getAbapTags(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/tags');
  }

  getDetectionPatternListAll(): Observable<ApiResponse> {
    const url =
      `abap/pattern/list?first=0&rows=9999` +
      `&sortOrder=1&sortField=name` +
      `&filters=${encodeURI(JSON.stringify({}))}`;
    return this.http.get<ApiResponse>(url);
  }

  // ==================== Rule Import API ====================

  downloadImportTemplate(): Observable<Blob> {
    return this.http.get('abap/excel/import-rules/template', { responseType: 'blob' });
  }

  previewRuleImport(file: File): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse>('abap/excel/import-rules/preview', formData);
  }

  simulateRuleImport(file: File, importMode: string): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('importMode', importMode);
    return this.http.post<ApiResponse>(`abap/excel/import-rules/simulate`, formData);
  }

  executeRuleImport(file: File, importMode: string): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('importMode', importMode);
    return this.http.post<ApiResponse>(`abap/excel/import-rules/execute`, formData);
  }

  // ==================== Code Scan API ====================

  getCodeScanList(params: TableQueryParams): Observable<ApiResponse> {
    const body = GridRequestBuilder.toLegacy(params);
    const url =
      `abap/code-scan/list?first=${body.first}&rows=${body.rows}` +
      `&sortOrder=${body.sortOrder}&sortField=${body.sortField}` +
      `&filters=${encodeURI(JSON.stringify(body.filters))}` +
      (body.globalFilter ? `&globalFilter=${encodeURIComponent(body.globalFilter)}` : '');
    return this.http.get<ApiResponse>(url);
  }

  deleteCodeScan(scanId: any): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`abap/code-scan/delete?scanId=${scanId}`);
  }

  runOnDemandCodeScan(scanRequest: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('abap/code-scan/on-demand-scan', scanRequest);
  }

  getScanProgress(executionId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`abap/code-scan/progress/${executionId}`);
  }

  cancelScan(executionId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`abap/code-scan/cancel/${executionId}`, {});
  }

  resolveTransportObjects(sapSystemId: any, transportNumbers: string[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`abap/code-scan/resolve-transport-objects`, { sapSystemId, transportNumbers });
  }

  browsePrograms(params: TableQueryParams, sapSystemId: any): Observable<ApiResponse> {
    const body = GridRequestBuilder.toLegacy(params);
    const url =
      `abap/code-scan/browse-programs?sapSystemId=${sapSystemId}` +
      `&first=${body.first}&rows=${body.rows}` +
      `&sortOrder=${body.sortOrder}&sortField=${body.sortField}` +
      `&filters=${encodeURI(JSON.stringify(body.filters))}` +
      (body.globalFilter ? `&globalFilter=${encodeURIComponent(body.globalFilter)}` : '');
    return this.http.get<ApiResponse>(url);
  }

  // ==================== Scheduled Scan API ====================

  getScheduledScanList(params: TableQueryParams): Observable<ApiResponse> {
    const body = GridRequestBuilder.toLegacy(params);
    const url =
      `abap/scheduled-scan/list?first=${body.first}&rows=${body.rows}` +
      `&sortOrder=${body.sortOrder}&sortField=${body.sortField}` +
      `&filters=${encodeURI(JSON.stringify(body.filters))}` +
      (body.globalFilter ? `&globalFilter=${encodeURIComponent(body.globalFilter)}` : '');
    return this.http.get<ApiResponse>(url);
  }

  getScheduledScanCount(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/scheduled-scan/count');
  }

  saveScheduledScan(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('abap/scheduled-scan/save-or-update', payload);
  }

  deleteScheduledScan(scanId: any): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`abap/scheduled-scan/delete?scanId=${scanId}`);
  }

  runSchedulerNow(schedulerId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`abap/scheduled-scan/run-now/${schedulerId}`, {});
  }

  // ==================== Scan Results API ====================

  getProgramViolationSummary(
    executionId: number,
    systemId: number,
    params: TableQueryParams,
    status?: string
  ): Observable<ApiResponse> {
    const body = GridRequestBuilder.toLegacy(params);
    let url =
      `abap/scan-execution/program-violations?first=${body.first}&rows=${body.rows}` +
      `&sortOrder=${body.sortOrder}&sortField=${body.sortField}` +
      `&executionId=${executionId}&systemId=${systemId}`;
    if (body.filters) {
      url += `&filters=${encodeURI(JSON.stringify(body.filters))}`;
    }
    if (body.globalFilter) {
      url += `&globalFilter=${encodeURIComponent(body.globalFilter)}`;
    }
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get<ApiResponse>(url);
  }

  getProgramViolationSummaryCount(executionId: number, systemId: number): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('executionId', executionId.toString())
      .set('systemId', systemId.toString());
    return this.http.get<ApiResponse>('abap/scan-execution/program-violations-count', { params });
  }

  getScanHistoryList(queryParams: TableQueryParams): Observable<ApiResponse> {
    const body = GridRequestBuilder.toLegacy(queryParams);
    const url =
      `abap/scan-execution/list?first=${body.first}&rows=${body.rows}` +
      `&sortOrder=${body.sortOrder}&sortField=${body.sortField}` +
      `&filters=${encodeURI(JSON.stringify(body.filters))}` +
      (body.globalFilter ? `&globalFilter=${encodeURIComponent(body.globalFilter)}` : '');
    return this.http.get<ApiResponse>(url);
  }

  getScanHistoryCount(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/scan-execution/count');
  }

  // ==================== Job History API ====================

  getJobList(params: TableQueryParams): Observable<ApiResponse> {
    const body = GridRequestBuilder.toLegacy(params);
    const url =
      `abap/jobs?first=${body.first}&rows=${body.rows}` +
      `&sortOrder=${body.sortOrder}&sortField=${body.sortField}` +
      `&filters=${encodeURI(JSON.stringify(body.filters))}` +
      (body.globalFilter ? `&globalFilter=${encodeURIComponent(body.globalFilter)}` : '');
    return this.http.get<ApiResponse>(url);
  }

  getJobsByScheduler(schedulerId: number, params: TableQueryParams): Observable<ApiResponse> {
    const body = GridRequestBuilder.toLegacy(params);
    const url =
      `abap/jobs/scheduler/${schedulerId}?first=${body.first}&rows=${body.rows}` +
      `&sortOrder=${body.sortOrder}&sortField=${body.sortField}` +
      `&filters=${encodeURI(JSON.stringify(body.filters))}` +
      (body.globalFilter ? `&globalFilter=${encodeURIComponent(body.globalFilter)}` : '');
    return this.http.get<ApiResponse>(url);
  }

  getJobStats(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/jobs/stats');
  }

  getJobLogs(jobId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`abap/jobs/${jobId}/logs`);
  }

  // ==================== Program Violation Detail API ====================

  getProgramViolationSummaryDetails(
    executionId: number, systemId: number, programId: number
  ): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `abap/program-violations/${executionId}/${systemId}/${programId}/summary`
    );
  }

  getProgramViolationsPaginated(
    executionId: number, systemId: number, programId: number,
    page = 0, size = 10, sort = 'severity', direction = 'ASC', severityFilter?: string
  ): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);
    if (severityFilter && severityFilter !== 'ALL') {
      params = params.set('severity', severityFilter);
    }
    return this.http.get<ApiResponse>(
      `abap/program-violations/${executionId}/${systemId}/${programId}/violations`, { params }
    );
  }

  getProgramRuleFindingsPaginated(
    executionId: number, systemId: number, programId: number, ruleId: number,
    page = 0, size = 10, sort = 'lineNumber', direction = 'ASC'
  ): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);
    return this.http.get<ApiResponse>(
      `abap/program-violations/${executionId}/${systemId}/${programId}/rules/${ruleId}/findings`, { params }
    );
  }

  getProgramRuleFindingsCount(
    executionId: number, systemId: number, programId: number, ruleId: number
  ): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `abap/program-violations/${executionId}/${systemId}/${programId}/rules/${ruleId}/findings/count`
    );
  }

  getProgramViolationHistoryPaginated(
    executionId: number, systemId: number, programId: number,
    page = 0, size = 10, historyDays = 30
  ): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('historyDays', historyDays.toString());
    return this.http.get<ApiResponse>(
      `abap/program-violations/${executionId}/${systemId}/${programId}/history`, { params }
    );
  }

  whitelistAllRules(programId: number, systemId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('program-rule-whitelist/whitelist-all', { programId, systemId });
  }

  whitelistSelectedRules(programId: number, systemId: number, ruleIds: number[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('program-rule-whitelist/whitelist-selected', { programId, systemId, ruleIds });
  }

  whitelistSingleRule(programId: number, systemId: number, ruleId: number): Observable<ApiResponse> {
    return this.whitelistSelectedRules(programId, systemId, [ruleId]);
  }

  getAbapProgram(programName: string, sapSystemId: number): Observable<ApiResponse> {
    const encoded = encodeURIComponent(programName);
    return this.http.get<ApiResponse>(`abap-program/read/${encoded}/${sapSystemId}`);
  }

  getIssueDescription(programId: number, executionId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `abap/program-violations/${executionId}/${programId}/issue-desc`
    );
  }

  // ==================== Dashboard API ====================

  getDashboardOverview(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/dashboard/overview');
  }

  getDashboardOverviewFiltered(startDate?: string, endDate?: string, sapSystemId?: number): Observable<ApiResponse> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (sapSystemId) params = params.set('sapSystemId', sapSystemId.toString());
    return this.http.get<ApiResponse>('abap/dashboard/overview/filtered', { params });
  }

  getSeverityChartData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/dashboard/chart/severity');
  }

  getSeverityChartDataFiltered(startDate?: string, endDate?: string, sapSystemId?: number): Observable<ApiResponse> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (sapSystemId) params = params.set('sapSystemId', sapSystemId.toString());
    return this.http.get<ApiResponse>('abap/dashboard/chart/severity/filtered', { params });
  }

  getTrendsChartData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/dashboard/chart/trends');
  }

  getTrendsChartDataFiltered(startDate?: string, endDate?: string, sapSystemId?: number): Observable<ApiResponse> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (sapSystemId) params = params.set('sapSystemId', sapSystemId.toString());
    return this.http.get<ApiResponse>('abap/dashboard/chart/trends/filtered', { params });
  }

  getRecentScans(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/scan-execution/recent');
  }

  getExecutedSapSystems(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('abap/dashboard/sap-systems');
  }

  // ==================== Import/Export API ====================

  importWorkbook(file: File, isDryRun: boolean, isDelete: boolean): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('fileUpload', file);
    formData.append('dryRun', `${isDryRun}`);
    formData.append('delete', `${isDelete}`);
    return this.http.post<ApiResponse>('abap/excel/import', formData);
  }

  exportAllData(): Observable<Blob> {
    return this.http.get('abap/excel/export-all', { responseType: 'blob' });
  }

  downloadImportTemplateExcel(): Observable<Blob> {
    return this.http.get('abap/excel/import-rules/template', { responseType: 'blob' });
  }

  getProgramTrendsChartDataFiltered(
    startDate: string, endDate: string, sapSystemId: number
  ): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('sapSystemId', sapSystemId.toString());
    return this.http.get<ApiResponse>('abap/dashboard/chart/program-trends/filtered', { params });
  }

  // ==================== Whitelist Management API ====================

  listWhitelist(filters?: any): Observable<ApiResponse> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('filter', filters.search.trim());
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.isActive !== null && filters?.isActive !== undefined && filters?.isActive !== '') {
      params = params.set('status', filters.isActive.toString());
    }
    return this.http.get<ApiResponse>('white-list/list', { params });
  }

  getWhitelistCount(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('white-list/count');
  }

  saveWhitelist(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('white-list/save-or-update', payload);
  }

  deleteWhitelist(id: any): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`white-list/delete?id=${id}`);
  }

  listViolationWhitelist(params: TableQueryParams): Observable<ApiResponse> {
    const body = GridRequestBuilder.toLegacy(params);
    const url =
      `unified-whitelist/list?first=${body.first}&rows=${body.rows}` +
      `&sortOrder=${body.sortOrder}&sortField=${body.sortField}`;
    return this.http.get<ApiResponse>(url);
  }
}
