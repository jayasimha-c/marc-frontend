import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private http: HttpClient) {}

  list(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('admin/getRoles');
  }

  store(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('admin/addRoleOperations?oper=add', data);
  }

  update(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('admin/addRoleOperations?oper=edit', data);
  }

  delete(id: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`admin/deleteRole?id=${id}`, {});
  }

  initDataForEdit(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`admin/editRole?id=${id}`);
  }

  initEditRoleOperationForm(id: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`admin/manageRoleOperations?id=${id}`);
  }

  updateRoleOperations(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('admin/roleOperations', data);
  }

  // ── LDAP Titles ──

  ldapTitles(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('admin/ldapTitles', {});
  }

  initNewLdapTitleForm(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('admin/addLdapTitle');
  }

  initEditLdapTitleForm(title: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`admin/editLdapTitle?title=${title}`);
  }

  storeLdapTitle(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('admin/addLdapTitle', data);
  }

  updateLdapTitle(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('admin/editLdapTitle', data);
  }

  deleteLdapTitle(title: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`admin/deleteLdapTitle?title=${title}`, {});
  }
}
