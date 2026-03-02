import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class ReadinessCheckService {
  private baseUrl = 'readiness';

  constructor(private httpClient: HttpClient) {}

  getAvailableModules(): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/modules`);
  }

  checkModule(moduleCode: string): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/check/${moduleCode}`);
  }

  runSingleCheck(checkId: string): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/check/single/${checkId}`);
  }
}
