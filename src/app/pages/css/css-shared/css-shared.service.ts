import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse, GenericApiResponse } from '../../../core/models/api-response';
import { Observable } from 'rxjs';
import { CssImportLog } from './css-shared.model';

@Injectable({ providedIn: 'root' })
export class CssSharedService {
  constructor(private http: HttpClient) {}

  getAllTags(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('css/getTags');
  }

  saveImport(file: File, isDryRun: boolean, isDelete: boolean): Observable<GenericApiResponse<CssImportLog[]>> {
    const formData = new FormData();
    formData.append('fileUpload', file);
    formData.append('dryRun', `${isDryRun}`);
    formData.append('delete', `${isDelete}`);
    return this.http.post<GenericApiResponse<CssImportLog[]>>('css/cssImport', formData);
  }

  getSecurityNotes(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('css/security-notes');
  }

  saveSecurityNoteSetting(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/security-notes/setting', payload);
  }

  getSecurityNoteSetting(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('css/security-notes/setting');
  }

  getOnlineSystems(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('sapsystem/getOnlineSystemList');
  }

  getOnlineSystemCount(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('sapsystem/getOnlineSystemCount');
  }

  getSystemDetails(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/id/${id}`);
  }

  getRfcSystemInfo(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/system-info/${id}`);
  }

  getRfcClientInfo(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/client-info/${id}`);
  }

  getComponents(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/installed-components/${id}`);
  }

  getInstances(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/instances/${id}`);
  }

  getLocalAllData(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/local/all/${id}`);
  }

  getLocalSystemInfo(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/local/system-info/${id}`);
  }

  getLocalClients(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/local/clients/${id}`);
  }

  getLocalComponents(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/local/components/${id}`);
  }

  getLocalInstances(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/local/instances/${id}`);
  }

  getLocalStats(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/local/stats/${id}`);
  }

  refreshLocalData(id: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`sapsystem/local/refresh/${id}`, {});
  }
}
