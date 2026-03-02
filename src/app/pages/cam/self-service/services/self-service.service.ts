import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response';
import { TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Injectable({ providedIn: 'root' })
export class SelfServiceService {
  constructor(private http: HttpClient) {}

  private buildPaginationParams(event: TableQueryParams): string {
    const first = ((event.pageIndex || 1) - 1) * (event.pageSize || 10);
    const rows = event.pageSize || 10;
    const sortField = event.sort?.field || '';
    const sortOrder = event.sort?.direction === 'descend' ? -1 : 1;
    const filters = encodeURIComponent(JSON.stringify(event.filters || {}));
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `first=${first}&rows=${rows}&sortField=${sortField}&sortOrder=${sortOrder}&filters=${filters}&timeZone=${tz}`;
  }

  // ─── Access Request ────────────────────────────

  /** Get user's SAP systems for role selection */
  sapSearch(userId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`s/sapSearch?userId=${userId}&&bb=false`);
  }

  /** Get role catalogue profiles (optionally filtered by system and search term) */
  getRoleCatalogueProfiles(systemId?: string | number, search?: string): Observable<ApiResponse> {
    const params: string[] = [];
    if (systemId) params.push(`systemId=${systemId}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    const query = params.length ? '?' + params.join('&') : '';
    return this.http.get<ApiResponse>(`roleCatalogue/allRoleCatProfiles${query}`);
  }

  /** Get all roles mapped to a role catalogue */
  getRoleCatalogueRoles(rcId: string | number): Observable<ApiResponse> {
    if (rcId == null) return of({ success: true, data: [] } as ApiResponse);
    return this.http.get<ApiResponse>(`roleCatalogue/getRCAllRoles?rcId=${rcId}`);
  }

  /** Submit self-service access request */
  submitAccessRequest(payload: { roleIds: number[] }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('s/addSelf', payload);
  }

  // ─── Self-Service Requests ─────────────────────

  /** Get paginated list of self-service requests */
  getRequests(event: TableQueryParams): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`selfservice/list?${this.buildPaginationParams(event)}`);
  }

  /** Cancel a self-service request */
  cancelRequest(uuid: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`selfservice/cancel?uuid=${uuid}`);
  }

  /** Export self-service requests to Excel */
  exportRequests(): Observable<any> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.get(`selfservice/list/export?timeZone=${tz}`, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  // ─── User Actions (Unlock / Reset Password) ───

  /** Get self-service info (available SAP systems) */
  getSelfServiceInfo(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('s_l/requiredInfo?ss=true');
  }

  /** Get user's system statuses */
  getMySystemStatus(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('s_l/mySystemStatus');
  }

  /** Unlock user in SAP system */
  unlockSelf(userId: string, sapSystemId: number): Observable<ApiResponse> {
    const { protocol, hostname, port } = window.location;
    return this.http.get<ApiResponse>(
      `s_l/lock?saps=${sapSystemId}&userId=${userId}&lock=false&protocol=${protocol}&host=${hostname}&port=${port}&ss=true`
    );
  }

  /** Reset user password in SAP system */
  resetPasswordSelf(userId: string, sapSystemId: number): Observable<ApiResponse> {
    const { protocol, hostname, port } = window.location;
    return this.http.get<ApiResponse>(
      `s_pwd/reset?saps=${sapSystemId}&userId=${userId}&protocol=${protocol}&host=${hostname}&port=${port}&ss=true`
    );
  }
}
