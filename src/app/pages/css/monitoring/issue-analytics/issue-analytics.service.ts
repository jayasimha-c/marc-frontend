import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../../../../core/models/api-response';
import { Observable } from 'rxjs';

export interface IssueAnalyticsFilterRequest {
  sapSystemId?: number | null;
  fromDate?: string | null;   // MM/dd/yyyy
  toDate?: string | null;     // MM/dd/yyyy
  category?: string | null;
  assignee?: string | null;
}

export interface IssueAnalyticsStat {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  closedIssues: number;
}

@Injectable({ providedIn: 'root' })
export class IssueAnalyticsService {
  constructor(private http: HttpClient) {}

  getStats(filter: IssueAnalyticsFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/issue-analytics/stats', filter);
  }

  getStatusBreakdown(filter: IssueAnalyticsFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/issue-analytics/status-breakdown', filter);
  }

  getCategoryBreakdown(filter: IssueAnalyticsFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/issue-analytics/category-breakdown', filter);
  }

  getTrend(filter: IssueAnalyticsFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/issue-analytics/trend', filter);
  }

  getBySystem(filter: IssueAnalyticsFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/issue-analytics/by-system', filter);
  }

  getByAssignee(filter: IssueAnalyticsFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/issue-analytics/by-assignee', filter);
  }

  getAssignees(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('css/issue-analytics/assignees');
  }

  getAgingStats(filter: IssueAnalyticsFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/issue-analytics/aging', filter);
  }
}
