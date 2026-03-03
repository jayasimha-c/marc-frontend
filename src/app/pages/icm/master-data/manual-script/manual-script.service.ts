import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface ScriptVersionHistory {
  entityId: number;
  entityType: string;
  entityName: string;
  version: number;
  changeType: string;
  changeTypeDisplay: string;
  changeSummary: string;
  snapshotJson: string;
  changedBy: string;
  changedDate: number;
  previousVersion?: number;
  previousSnapshotJson?: string;
}

@Injectable({ providedIn: 'root' })
export class ManualScriptService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getManualScripts(): Observable<any> {
    return this.http.get(`${this.base}/icm/scripts/list-table-full`);
  }

  saveManualScripts(payload: any): Observable<any> {
    return this.http.post(`${this.base}/icm/scripts/save-or-update`, payload);
  }

  deleteManualScripts(id: number): Observable<any> {
    return this.http.delete(`${this.base}/icm/scripts/delete?ids=${id}`);
  }

  uploadAttachment(file: File, entityType: string, entityId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId.toString());
    return this.http.post(`${this.base}/attachments/upload`, formData);
  }

  getVersionHistory(scriptId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/scripts/${scriptId}/versions`);
  }

  getVersion(scriptId: number, version: number): Observable<any> {
    return this.http.get(`${this.base}/icm/scripts/${scriptId}/versions/${version}`);
  }

  cloneScript(scriptId: number, newName?: string): Observable<any> {
    const params = newName ? `?newName=${encodeURIComponent(newName)}` : '';
    return this.http.post(`${this.base}/icm/scripts/clone/${scriptId}${params}`, {});
  }

  exportToExcel(): Observable<Blob> {
    return this.http.get(`${this.base}/icm/scripts/export`, { responseType: 'blob' });
  }

  importFromExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.base}/icm/scripts/import`, formData);
  }
}
