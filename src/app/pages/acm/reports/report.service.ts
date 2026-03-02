import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

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
}
