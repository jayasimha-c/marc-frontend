import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';
import { GridRequestBuilder } from '../../../core/utils/grid-request.builder';

@Injectable({ providedIn: 'root' })
export class ReportingUnitService {

  constructor(private http: HttpClient) { }

  // ==================== SAP Systems ====================

  sapList(request: any): Observable<ApiResponse> {
    const body = GridRequestBuilder.toLegacy(request);
    const url =
      `sapsystem/getSapConfig?first=${body.first}&rows=${body.rows}` +
      `&sortOrder=${body.sortOrder}&sortField=${body.sortField}` +
      `&filters=${encodeURI(JSON.stringify(body.filters))}`;
    return this.http.get<ApiResponse>(url);
  }

  save(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('sapsystem/operations?oper=add', data);
  }

  sapDelete(sapSystemId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/deleteSapConn?id=${sapSystemId}`);
  }

  sapUpdate(sapSystemId: string, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`sapsystem/operations?oper=edit&id=${sapSystemId}`, data);
  }

  sapInitForm(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('sapsystem/loadAdd?edit=false');
  }

  sapInitFormForUpdate(systemId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/loadAdd?edit=true&id=${systemId}`);
  }

  testSapSystem(systemId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sapsystem/testConn?id=${systemId}`);
  }

  // ==================== Integration Systems ====================

  getIntegrationSystems(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('admin/getIntegrationSystems');
  }

  getIntegrationSystemById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`admin/getIntegrationSystem/id/${id}`);
  }

  saveJiraRepository(repo: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('admin/saveJiraBackend', repo);
  }

  deleteIntegrationSystems(system: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`admin/deleteIntegrationSystem?systemId=${system.id}`);
  }

  testIntegrationSystems(system: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`admin/testIntegrationSystem?systemId=${system.id}`);
  }

  testIntegrationSystemsBeforeSave(system: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('admin/testIntegrationSystemBeforeSave', system);
  }
}
