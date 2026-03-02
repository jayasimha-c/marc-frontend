import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class AiIntegrationService {

  constructor(private httpClient: HttpClient) {}

  getConfiguration(): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>('ai/configuration');
  }

  saveConfiguration(config: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>('ai/configuration', config);
  }

  testConnection(config: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>('ai/test-connection', config);
  }

  getAuditLogs(params: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>('ai/audit-log/getFiltered', params);
  }
}
