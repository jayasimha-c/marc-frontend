import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MitigationsService {

  constructor(private http: HttpClient) {}

  // ── Mitigations CRUD ─────────────────────────────────────

  getAllMitigations(first: number, rows: number, sortOrder: number, sortField: string, filters: any): Observable<any> {
    return this.http.get(`mitigations/get?rule&first=${first}&rows=${rows}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${encodeURI(JSON.stringify(filters))}`);
  }

  addMitigation(payload: any): Observable<any> {
    return this.http.post('mitigations/addMitigationSave', payload);
  }

  editMitigation(payload: any): Observable<any> {
    return this.http.post('mitigations/editMitigationSave', payload);
  }

  deleteMitigation(mitigationIds: number): Observable<any> {
    return this.http.get(`mitigations/deleteMitigation?mitigationIds=${mitigationIds}`);
  }

  getRequiredData(): Observable<any> {
    return this.http.get('mitigations/addMitigation');
  }

  searchRisks(term: string): Observable<any> {
    return this.http.get(`risks/searchRisks?term=${term}`);
  }

  // ── Sub-table Data ───────────────────────────────────────

  getMitigationUsers(mitigationId: number): Observable<any> {
    return this.http.get(`mitigations/getUsers?mitigationId=${mitigationId}`);
  }

  getMitigationOwners(mitigationId: number): Observable<any> {
    return this.http.get(`mitigations/getMitOwners?mitigationId=${mitigationId}`);
  }

  getMitigationIcmControls(mitigationId: number, first: number, rows: number, sortOrder: number, sortField: string, filters: any): Observable<any> {
    return this.http.get(`mitigations/getIcmControls?mitigationId=${mitigationId}&first=${first}&rows=${rows}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${encodeURI(JSON.stringify(filters))}`);
  }

  // ── Users Management ─────────────────────────────────────

  getAvailableUsers(payload: any, first: number, rows: number, sortOrder: number, sortField: string, filters: any): Observable<any> {
    return this.http.post(`mitigations/getFilteredUsers?first=${first}&rows=${rows}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${encodeURI(JSON.stringify(filters))}`, payload);
  }

  getSelectedUsers(payload: any): Observable<any> {
    return this.http.post('mitigations/getSelectedUsers', payload);
  }

  selectAllUsers(payload: any): Observable<any> {
    return this.http.post('mitigations/selecAlltUsers', payload);
  }

  saveSelectedUsers(payload: any): Observable<any> {
    return this.http.post('mitigations/saveSelectedUsers', payload);
  }

  saveDates(payload: any): Observable<any> {
    return this.http.post('mitigations/saveDates', payload);
  }

  // ── Owners Management ────────────────────────────────────

  getAvailableOwners(payload: any): Observable<any> {
    return this.http.post('mitigations/getOwners', payload);
  }

  getSelectedOwners(payload: any): Observable<any> {
    return this.http.post('mitigations/getSelectedOwners', payload);
  }

  saveSelectedOwners(payload: any): Observable<any> {
    return this.http.post('mitigations/saveSelectedOwners', payload);
  }

  // ── ICM Controls Management ──────────────────────────────

  getAvailableIcmControls(payload: any, first: number, rows: number, sortOrder: number, sortField: string, filters: any): Observable<any> {
    return this.http.post(`mitigations/getFilteredIcmControls?first=${first}&rows=${rows}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${encodeURI(JSON.stringify(filters))}`, payload);
  }

  getSelectedIcmControls(payload: any): Observable<any> {
    return this.http.post('mitigations/getSelectedIcmControls', payload);
  }

  saveSelectedIcmControls(payload: any): Observable<any> {
    return this.http.post('mitigations/saveSelectedIcmControls', payload);
  }

  // ── Attachment ───────────────────────────────────────────

  downloadAttachment(attachmentId: number): Observable<any> {
    return this.http.get(`download?resourceId=${attachmentId}`, { observe: 'response', responseType: 'blob' });
  }

  // ── Upload ───────────────────────────────────────────────

  getRequiredInfo(): Observable<any> {
    return this.http.get('uploads/importMitigation');
  }

  uploadMitigationFiles(formData: FormData, templateName: string): Observable<any> {
    let url = '';
    if (templateName === 'MitigationSample.xlsx') url = 'uploadMitigations';
    if (templateName === 'MitigationUsersSample.xlsx') url = 'uploadMitigationUsers';
    if (templateName === 'MitigationOwnersSample.xlsx') url = 'uploadMitigationOwners';
    return this.http.post(`mitigations/${url}`, formData);
  }
}
