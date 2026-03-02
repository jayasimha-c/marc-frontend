import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private httpClient: HttpClient) {}

  getGlobalSettings(): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`admin/settings?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`, {
      rows: 27, page: 1, sidx: '', sord: 'asc',
    });
  }

  getReportingUnitSettings(): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`ruSettings/get?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`, {
      _search: false, rows: 27, page: 1, sidx: '', sord: 'asc',
    });
  }

  saveGlobalSettings(payload: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>('admin/settings_save', payload);
  }

  saveReportingUnitSettings(payload: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>('ruSettings/settings_save', payload);
  }
}
