import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response';
import { OAuth2Client, OAuth2Scope } from './oauth2.models';

@Injectable({ providedIn: 'root' })
export class OAuth2Service {
  private baseUrl = 'admin/oauth2';

  constructor(private http: HttpClient) {}

  // ── Clients ──

  getAllClients(params?: { page?: number; rows?: number; sortField?: string; sortOrder?: number; globalFilter?: string }): Observable<ApiResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
      if (params.rows != null) httpParams = httpParams.set('rows', params.rows.toString());
      if (params.sortField) {
        httpParams = httpParams.set('sortField', params.sortField);
        httpParams = httpParams.set('sortOrder', (params.sortOrder ?? 1).toString());
      }
      if (params.globalFilter) httpParams = httpParams.set('globalFilter', params.globalFilter);
    }
    return this.http.get<ApiResponse>(`${this.baseUrl}/clients`, { params: httpParams });
  }

  createClient(client: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clients`, client);
  }

  updateClient(id: number, client: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/clients/${id}`, client);
  }

  deleteClient(id: string | number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/clients/${id}`);
  }

  regenerateClientSecret(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clients/${id}/regenerate-secret`, {});
  }

  // ── Scopes ──

  getAllScopes(params?: { page?: number; rows?: number; sortField?: string; sortOrder?: number; globalFilter?: string }): Observable<ApiResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
      if (params.rows != null) httpParams = httpParams.set('rows', params.rows.toString());
      if (params.sortField) {
        httpParams = httpParams.set('sortField', params.sortField);
        httpParams = httpParams.set('sortOrder', (params.sortOrder ?? 1).toString());
      }
      if (params.globalFilter) httpParams = httpParams.set('globalFilter', params.globalFilter);
    }
    return this.http.get<ApiResponse>(`${this.baseUrl}/scopes`, { params: httpParams });
  }

  createScope(scope: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/scopes`, scope);
  }

  updateScope(id: number, scope: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/scopes/${id}`, scope);
  }

  deleteScope(id: string | number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/scopes/${id}`);
  }

  // ── Tokens ──

  getAllTokens(params?: { page?: number; rows?: number; sortField?: string; sortOrder?: number; globalFilter?: string }): Observable<ApiResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
      if (params.rows != null) httpParams = httpParams.set('rows', params.rows.toString());
      if (params.sortField) {
        httpParams = httpParams.set('sortField', params.sortField);
        httpParams = httpParams.set('sortOrder', (params.sortOrder ?? 1).toString());
      }
      if (params.globalFilter) httpParams = httpParams.set('globalFilter', params.globalFilter);
    }
    return this.http.get<ApiResponse>(`${this.baseUrl}/tokens`, { params: httpParams });
  }

  revokeToken(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/tokens/${id}/revoke`, {});
  }

  // ── Audit Logs ──

  getAuditLogs(params?: { page?: number; rows?: number; sortField?: string; sortOrder?: number; globalFilter?: string }): Observable<ApiResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
      if (params.rows != null) httpParams = httpParams.set('rows', params.rows.toString());
      if (params.sortField) {
        httpParams = httpParams.set('sortField', params.sortField);
        httpParams = httpParams.set('sortOrder', (params.sortOrder ?? 1).toString());
      }
      if (params.globalFilter) httpParams = httpParams.set('globalFilter', params.globalFilter);
    }
    return this.http.get<ApiResponse>(`${this.baseUrl}/audit-logs`, { params: httpParams });
  }
}
