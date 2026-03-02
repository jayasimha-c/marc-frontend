import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../../../core/models/api-response';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthenticationMgmtService {
  constructor(private http: HttpClient) {}

  // ── Users ──

  list(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('admin/getUsers');
  }

  save(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('admin/userOperations?oper=add', data);
  }

  delete(userId: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`admin/deleteUser?userId=${userId}`, null);
  }

  update(oper: string, userId: string, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`admin/userOperations?oper=${oper}&id=${userId}`, data);
  }

  updatePassword(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('admin/changePassword', data);
  }

  userRoles(userId: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`admin/addUserRoles?id=${userId}`);
  }

  saveUserRoles(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('admin/userRoles', data);
  }

  // ── Login History ──

  getLoginEvents(params: {
    first: number; rows: number; sortOrder: number;
    sortField: string; filters: any;
  }): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `admin/getLoginEvents?first=${params.first}&rows=${params.rows}` +
      `&sortOrder=${params.sortOrder}&sortField=${params.sortField}` +
      `&filters=${encodeURI(JSON.stringify(params.filters))}` +
      `&timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`
    );
  }

  // ── Blocked IPs ──

  getBlockIpList(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('admin/blockedips/list');
  }

  unblockIp(ip: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`admin/blockedips/unlist?ip=${ip}`, {});
  }

  // ── Operations ──

  getOperations(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('admin/getOperations');
  }

  addOperations(action: string, payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`admin/authorityOperations?oper=${action}`, payload);
  }
}
