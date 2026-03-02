import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../../../../core/models/api-response';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UarDashboardDataService {
  constructor(private http: HttpClient) {}

  getReviewProcessDashboardData(sapSystemId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`arc/dashboard/reviewProcess?sapSystemId=${sapSystemId}`);
  }

  getReviewPerformanceDashboardData(sapSystemId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`arc/dashboard/reviewPerformance?sapSystemId=${sapSystemId}`);
  }

  getReviewTrendsDashboardData(sapSystemId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`arc/dashboard/reviewTrends?sapSystemId=${sapSystemId}`);
  }

  getRiskAnalysisDashboardData(sapSystemId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`arc/dashboard/riskAnalysis?sapSystemId=${sapSystemId}`);
  }

  getSystemWiseReviewDashboardData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('arc/dashboard/systemWiseReview');
  }
}
