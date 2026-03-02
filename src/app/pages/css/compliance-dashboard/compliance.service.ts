import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

export interface ComplianceDashboardPayload {
  fromDate?: string | null;
  toDate?: string | null;
  sapSystemId?: number | null;
  frameworkId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ComplianceService {
  constructor(private http: HttpClient) {}

  private buildPayload(fromDate: any, toDate: any, sapSystemId: any, frameworkId: any): ComplianceDashboardPayload {
    const payload: ComplianceDashboardPayload = { fromDate, toDate };
    if (sapSystemId != null && sapSystemId !== 'ALL') {
      payload.sapSystemId = typeof sapSystemId === 'object' ? sapSystemId.id : sapSystemId;
    }
    payload.frameworkId = frameworkId;
    return payload;
  }

  getDashboardStat(fromDate: any, toDate: any, sapSystemId: any, frameworkId: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/compliance-dashboard/dashboard-stat', this.buildPayload(fromDate, toDate, sapSystemId, frameworkId));
  }

  getAssessableControlStat(fromDate: any, toDate: any, sapSystemId: any, frameworkId: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/compliance-dashboard/assessable-controls-stats', this.buildPayload(fromDate, toDate, sapSystemId, frameworkId));
  }

  getComplianceTrend(fromDate: any, toDate: any, sapSystemId: any, frameworkId: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/compliance-dashboard/compliance-trend', this.buildPayload(fromDate, toDate, sapSystemId, frameworkId));
  }

  getSeverityViolationsByFramework(fromDate: any, toDate: any, sapSystemId: any, frameworkId: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/compliance-dashboard/severity-violations-by-framework', this.buildPayload(fromDate, toDate, sapSystemId, frameworkId));
  }

  getFrameworkDetails(fromDate: any, toDate: any, sapSystemId: any, frameworkId: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/compliance-dashboard/framework-details', this.buildPayload(fromDate, toDate, sapSystemId, frameworkId));
  }

  getReqNodeViolations(fromDate: any, toDate: any, sapSystemId: any, frameworkId: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/compliance-dashboard/requirement-node-violations', this.buildPayload(fromDate, toDate, sapSystemId, frameworkId));
  }

  getReqNodeDetails(fromDate: any, toDate: any, sapSystemId: any, frameworkId: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/compliance-dashboard/requirement-node-details', this.buildPayload(fromDate, toDate, sapSystemId, frameworkId));
  }

  getFrameworkComparison(fromDate: any, toDate: any, sapSystemId: any, frameworkId: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/compliance-dashboard/framework-comparison', this.buildPayload(fromDate, toDate, sapSystemId, frameworkId));
  }

  getComplianceFrameworks(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('control-frameworks');
  }

  // Control detail endpoints
  getControlDetails(controlId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`css/controls/${controlId}`);
  }

  getControlMetrics(controlId: string, sapSystemId: any, fromDate: string, toDate: string): Observable<ApiResponse> {
    const payload: any = { fromDate, toDate };
    if (sapSystemId != null && sapSystemId !== 'ALL') {
      payload.sapSystemId = typeof sapSystemId === 'object' ? sapSystemId.id : sapSystemId;
    }
    return this.http.post<ApiResponse>(`css/controls/${controlId}/metrics`, payload);
  }

  getViolationTrend(controlId: string, sapSystemId: any, fromDate: string, toDate: string): Observable<ApiResponse> {
    const payload: any = { fromDate, toDate };
    if (sapSystemId != null && sapSystemId !== 'ALL') {
      payload.sapSystemId = typeof sapSystemId === 'object' ? sapSystemId.id : sapSystemId;
    }
    return this.http.post<ApiResponse>(`css/controls/${controlId}/violation-trend`, payload);
  }

  getViolationsBySystem(controlId: string, sapSystemId: any, fromDate: string, toDate: string): Observable<ApiResponse> {
    const payload: any = { fromDate, toDate };
    if (sapSystemId != null && sapSystemId !== 'ALL') {
      payload.sapSystemId = typeof sapSystemId === 'object' ? sapSystemId.id : sapSystemId;
    }
    return this.http.post<ApiResponse>(`css/controls/${controlId}/violations-by-system`, payload);
  }

  getViolatedRules(controlId: string, sapSystemId: any, fromDate: string, toDate: string, page: number, size: number, sortField?: string, sortOrder?: number, search?: string): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('first', ((page - 1) * size).toString())
      .set('rows', size.toString());
    if (sapSystemId != null && sapSystemId !== 'ALL') {
      params = params.set('systemId', typeof sapSystemId === 'object' ? sapSystemId.id : sapSystemId);
    }
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (sortField) {
      params = params.set('sortField', sortField).set('sortOrder', (sortOrder || 1).toString());
    }
    if (search) params = params.set('filters', search);
    return this.http.get<ApiResponse>(`css/controls/${controlId}/violated-rules`, { params });
  }

  getControlSapSystems(controlId: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`css/controls/${controlId}/systems`, {});
  }
}
