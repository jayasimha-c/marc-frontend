import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class CssDashboardService {
  constructor(private http: HttpClient) {}

  getAllSystems(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('multi-system-security-monitoring/sap-systems');
  }

  getDashboardDataCount(sapSystemId: string, fromDate: string, toDate: string, severity: string): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('sapSystemId', sapSystemId)
      .set('date', fromDate)
      .set('toDate', toDate)
      .set('severity', severity);
    return this.http.get<ApiResponse>('multi-system-security-monitoring/get-dashboard-count', { params });
  }

  getAlertStatus(sapSystemId: string, fromDate: string, toDate: string, severity: string): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('sapSystemId', sapSystemId)
      .set('date', fromDate)
      .set('toDate', toDate)
      .set('severity', severity);
    return this.http.get<ApiResponse>('multi-system-security-monitoring/get-alert-status', { params });
  }

  getSystemWiseSeverityCount(fromDate: string, toDate: string, sapSystemId: string, severity: string): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('sapSystemId', sapSystemId)
      .set('date', fromDate)
      .set('toDate', toDate)
      .set('severity', severity);
    return this.http.get<ApiResponse>('multi-system-security-monitoring/get-system-wise-severity-count', { params });
  }

  getSecurityEventCategories(fromDate: string, toDate: string, sapSystemId: string, severity: string): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('sapSystemId', sapSystemId)
      .set('date', fromDate)
      .set('toDate', toDate)
      .set('severity', severity);
    return this.http.get<ApiResponse>('multi-system-security-monitoring/get-system-event-categories', { params });
  }

  getSecurityEventLogs(
    fromDate: string, toDate: string, sapSystemId: string, severity: string,
    first: number, rows: number, search?: string
  ): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('sapSystemId', sapSystemId)
      .set('date', fromDate)
      .set('toDate', toDate)
      .set('severity', severity)
      .set('first', first.toString())
      .set('row', rows.toString());
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<ApiResponse>('multi-system-security-monitoring/get-security-event-logs', { params });
  }

  getSecurityTimeLine(fromDate: string, toDate: string, sapSystemId: string, severity: string, timeRange: string): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('sapSystemId', sapSystemId)
      .set('date', fromDate)
      .set('toDate', toDate)
      .set('severity', severity)
      .set('timelineType', timeRange);
    return this.http.get<ApiResponse>('multi-system-security-monitoring/get-event-timeline', { params });
  }

  getRecentCriticalEvents(fromDate: string, toDate: string, sapSystemId: string): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('sapSystemId', sapSystemId)
      .set('date', fromDate)
      .set('toDate', toDate);
    return this.http.get<ApiResponse>('multi-system-security-monitoring/recent-critical-events', { params });
  }

  getViolationTrends(fromDate: string, toDate: string, sapSystemId: string, violationType: string, ruleId: string): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('fromDate', fromDate)
      .set('toDate', toDate)
      .set('sapSystemId', sapSystemId)
      .set('violationType', violationType)
      .set('ruleId', ruleId);
    return this.http.get<ApiResponse>('multi-system-security-monitoring/get-violation-trends', { params });
  }
}
