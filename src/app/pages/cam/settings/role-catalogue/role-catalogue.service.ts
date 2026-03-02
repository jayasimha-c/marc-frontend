import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoleCatalogueService {
  constructor(private http: HttpClient) {}

  getRoleCatalogueList(page: number, size: number, sortField: string, sortDirection: string, filters: any, globalFilter?: string): Observable<any> {
    return this.http.post('roleCatalogue/get', {
      page, size, sortField, sortDirection,
      filters: filters || [],
      globalFilter: globalFilter || '',
    });
  }

  getRoleCatalogueInfo(): Observable<any> {
    return this.http.get('roleCatalogue/info');
  }

  addRoleCatalogue(payload: any): Observable<any> {
    return this.http.post('roleCatalogue/addRoleSave', payload);
  }

  editRoleCatalogue(payload: any): Observable<any> {
    return this.http.post('roleCatalogue/edit', payload);
  }

  deleteRoleCatalogues(ids: string): Observable<any> {
    return this.http.get(`roleCatalogue/deleteRoles?selectedIds=${ids}`);
  }

  getRoleCatalogueRoles(rcId: number): Observable<any> {
    if (!rcId) return of({ success: true, data: [] });
    return this.http.get(`roleCatalogue/getRCRoles?rcId=${rcId}`);
  }

  getRoleCatalogueMultiRoles(rcId: number): Observable<any> {
    if (!rcId) return of({ success: true, data: [] });
    return this.http.get(`roleCatalogue/getRCMultiRoles?rcId=${rcId}`);
  }

  getRoleCatalogueRoleRisks(rcId: number): Observable<any> {
    if (!rcId) return of({ success: true, data: { rows: [], records: 0 } });
    return this.http.get(`roleCatalogue/getRoleRisks?rcId=${rcId}`);
  }

  getRoleCatalogueOwners(rcId: number): Observable<any> {
    if (!rcId) return of({ success: true, data: { rows: [], records: 0 } });
    return this.http.get(`roleCatalogue/getOwners?rcId=${rcId}`);
  }

  saveOwners(payload: any): Observable<any> {
    return this.http.post('roleCatalogue/saveOwners', payload);
  }

  getRoleCatalogueRoleNames(rcId: number): Observable<any> {
    if (!rcId) return of({ success: true, data: [] });
    return this.http.get(`roleCatalogue/getRCRoleNames?rcId=${rcId}`);
  }

  getFilteredRoleCatalogue(page: number, size: number, sortField: string, sortDirection: string,
    rcId: number, sapId: number, selectedRoles: string[], sysName?: string): Observable<any> {
    if (!rcId) return of({ success: true, data: { rows: [], records: 0 } });
    let url = `roleCatalogue/getFilteredRoles?rcId=${rcId}&selectedRoles=${selectedRoles.join(',')}`;
    if (sysName) url += `&sysName=${encodeURIComponent(sysName)}`;
    else if (sapId) url += `&sapId=${sapId}`;
    return this.http.post(url, { page, size, sortField, sortDirection, filters: [], globalFilter: '' });
  }

  getSelectedRoleCatalogue(page: number, size: number, sortField: string, sortDirection: string,
    rcId: number, sapId: number, selectedRoles: string[], sysName?: string): Observable<any> {
    if (!rcId) return of({ success: true, data: { rows: [], records: 0 } });
    let url = `roleCatalogue/getSelectedRoles?rcId=${rcId}&selectedRoles=${selectedRoles.join(',')}`;
    if (sysName) url += `&sysName=${encodeURIComponent(sysName)}`;
    else if (sapId) url += `&sapId=${sapId}`;
    return this.http.post(url, { page, size, sortField, sortDirection, filters: [], globalFilter: '' });
  }

  addRolesSubmit(rcId: number, selectedRoles: string[]): Observable<any> {
    return this.http.get(`roleCatalogue/addRolesSubmit?rcId=${rcId}&selectedRoles=${selectedRoles.join(',')}`);
  }

  roleCataloguesValidateRules(rcId: number): Observable<any> {
    return this.http.get(`roleCatalogue/validateRules?rcId=${rcId}`);
  }

  roleCataloguesStartAnalysis(rcId: number): Observable<any> {
    return this.http.get(`roleCatalogue/startAnalysis?rcId=${rcId}`);
  }

  getSodJobInfo(jobId: number): Observable<any> {
    return this.http.get(`analysis/jobInfo?jobId=${jobId}`);
  }

  exportRoleCatalogues(page: number, size: number, sortField: string, sortDirection: string): Observable<any> {
    return this.http.post('roleCatalogue/exportRoleCatlogues', {
      page, size, sortField, sortDirection, filters: [], globalFilter: '',
    }, { responseType: 'arraybuffer' });
  }

  getUtilSystems(): Observable<any> {
    return this.http.get('util/getSystems?offline=false');
  }

  // Upload wizard
  createUploadSession(config: any): Observable<any> {
    return this.http.post('roleCatalogue/upload/createSession', config);
  }

  uploadFile(sessionId: number, formData: FormData): Observable<any> {
    return this.http.post(`roleCatalogue/upload/uploadFile?sessionId=${sessionId}`, formData);
  }

  getUploadStaging(sessionId: number, first: number, rows: number): Observable<any> {
    return this.http.get(`roleCatalogue/upload/staging/${sessionId}?first=${first}&rows=${rows}`);
  }

  processUpload(sessionId: number): Observable<any> {
    return this.http.post(`roleCatalogue/upload/process/${sessionId}`, {});
  }

  deleteUploadSession(sessionId: number): Observable<any> {
    return this.http.delete(`roleCatalogue/upload/session/${sessionId}`);
  }
}
