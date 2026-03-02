import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';
import { RuleBookAssignment, SapRuleBook } from './css-monitoring.model';
import { RuleTag } from '../css-shared/css-shared.model';

@Injectable({ providedIn: 'root' })
export class CssMonitoringService {
  constructor(private http: HttpClient) {}

  // ─── Rule Books ───

  getRuleBooks(ruleType?: string): Observable<ApiResponse> {
    const url = ruleType
      ? `css/getParameterRuleBooks?ruleType=${encodeURIComponent(ruleType)}`
      : 'css/getParameterRuleBooks';
    return this.http.get<ApiResponse>(url);
  }

  saveRuleBook(book: SapRuleBook): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/saveParameterRuleBooks', book);
  }

  deleteRuleBook(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`css/deleteParameterRuleBooks?ruleId=${id}`, null);
  }

  getRuleBookStats(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('css/getRuleBookStats');
  }

  exportRuleBook(): Observable<ArrayBuffer> {
    return this.http.get('css/getRuleBookExport', { responseType: 'arraybuffer' });
  }

  // ─── Rules loading for catalogue ───

  getParameterRules(parameterType?: string, tags: RuleTag[] | null = null, books: SapRuleBook[] | null = null): Observable<ApiResponse> {
    if (tags != null && tags.length !== 0) {
      const params = new HttpParams().set('tags', tags.map(tag => tag.id).join(','));
      return this.http.get<ApiResponse>('css/getParameterRule', { params });
    } else if (books != null && books.length !== 0) {
      const params = new HttpParams().set('books', books.map(book => book.id).join(','));
      return this.http.get<ApiResponse>('css/getParameterRule', { params });
    } else if (parameterType) {
      const params = new HttpParams().set('parameterType', parameterType);
      return this.http.get<ApiResponse>('css/getParameterRule', { params });
    }
    return this.http.get<ApiResponse>('css/getParameterRule');
  }

  getAuditRules(tags: RuleTag[] | null = null, books: SapRuleBook[] | null = null): Observable<ApiResponse> {
    if (tags != null && tags.length !== 0) {
      const params = new HttpParams().set('tags', tags.map(tag => tag.id).join(','));
      return this.http.get<ApiResponse>('css/getAuditRules', { params });
    } else if (books != null && books.length !== 0) {
      const params = new HttpParams().set('books', books.map(book => book.id).join(','));
      return this.http.get<ApiResponse>('css/getAuditRules', { params });
    }
    return this.http.get<ApiResponse>('css/getAuditRules');
  }

  getBtpRulesByRuleBookId(ruleBookId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`css/getBtpRules?ruleBookId=${ruleBookId}`);
  }

  // ─── Systems ───

  getSystemList(type: string): Observable<ApiResponse> {
    if (!type || type === 'AUDIT_LOG' || type === 'SAP_PARAMETER' || type === 'SAP_ABAP') {
      return this.http.get<ApiResponse>('sapsystem/getSystemList');
    }
    const resolvedType = type === 'SAP_UME' ? 'SAPJava' : type;
    return this.http.get<ApiResponse>(`sapsystem/getSystemList?type=${resolvedType}`);
  }

  // ─── Assignments ───

  getAssignmentsByBook(ruleBookId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`css/assignments/byBook?ruleBookId=${ruleBookId}`);
  }

  saveAssignment(assignment: RuleBookAssignment): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/assignments/save', assignment);
  }

  deleteAssignment(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`css/assignments/delete?id=${id}`, null);
  }

  runAssignmentNow(assignmentId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`css/runAssignmentNow?assignmentId=${assignmentId}`, null);
  }

  // ─── Run & Check ───

  runRuleBookNow(ruleBookId: number, sapSystemId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `css/runRuleBookNow?ruleBookId=${ruleBookId}&sapSystemId=${sapSystemId}`, null
    );
  }

  cssRuleConsistencyCheck(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('css/rules/consistencyCheck');
  }

  // ─── Jobs ───

  getAllJobs(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('css/jobs');
  }

  getJobsByScheduler(schedulerId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`css/jobs/scheduler/${schedulerId}`);
  }

  getJobById(jobId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`css/jobs/${jobId}`);
  }

  getJobLogs(jobId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`css/jobs/${jobId}/logs`);
  }

  getJobStats(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('css/jobs/stats');
  }

  // ─── Violations ───

  getAllViolationsV2(first = 0, rows = 500, sortField = 'createdDate', sortOrder = -1, filters: any = {}): Observable<ApiResponse> {
    const params = `first=${first}&rows=${rows}&page=0&sortOrder=${sortOrder}&sortField=${sortField}&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    return this.http.get<ApiResponse>(`css/getAllViolations/v2?${params}`);
  }

  getViolationsCount(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('css/getAllViolationStats');
  }

  getViolationById(violationId: number, type: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`css/getViolationById?violationId=${violationId}&type=${type}`);
  }
}
