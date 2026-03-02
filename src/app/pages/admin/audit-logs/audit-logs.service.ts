import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {

  constructor(private httpClient: HttpClient) {}

  getAuditLog(params: any): Observable<ApiResponse> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.httpClient.get<ApiResponse>(
      `admin/getAuditLog?timeZone=${tz}&first=${params.first}&rows=${params.rows}&sortOrder=${params.sortOrder}&sortField=${params.sortField}&filters=${encodeURI(JSON.stringify(params.filters))}`
    );
  }

  exportAuditLog(startDate: string, endDate: string): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`admin/prepareAuditReport?startDate=${startDate}&endDate=${endDate}`);
  }

  getExportList(): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>('batch/getJobs?_search=false&nd=1694596768185&rows=25&page=1&sidx=&sord=desc');
  }
}
