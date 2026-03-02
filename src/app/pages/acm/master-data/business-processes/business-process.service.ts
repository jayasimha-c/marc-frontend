import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BusinessProcessService {

  constructor(private http: HttpClient) {}

  // ── Tree API ───────────────────────────────────────────

  getBusinessProcessTree(): Observable<any> {
    return this.http.get('bp/tree');
  }

  saveProcessNode(payload: any): Observable<any> {
    return this.http.post('bp/node', payload);
  }

  deleteProcessNode(id: number, type: string): Observable<any> {
    return this.http.delete(`bp/node/${id}?type=${type}`);
  }

  // ── Legacy CRUD ────────────────────────────────────────

  getBusinessProcesses(): Observable<any> {
    return this.http.get('bp/getBusinessProcesses');
  }

  saveBusinessProcess(payload: any): Observable<any> {
    return this.http.post('bp/businessProcessOperations', payload);
  }

  deleteBusinessProcess(id: number): Observable<any> {
    return this.http.get(`bp/deleteBusinessProcess?id=${id}`);
  }

  // ── Sub-processes ──────────────────────────────────────

  getBusinessSubProcesses(): Observable<any> {
    return this.http.get('sbp/getBusinessSubProcesses');
  }

  saveBusinessSubProcess(payload: any): Observable<any> {
    return this.http.post('sbp/businessSubProcessOperations', payload);
  }

  deleteBusinessSubProcess(id: number): Observable<any> {
    return this.http.get(`sbp/deleteBusinessSubProcess?id=${id}`);
  }
}
