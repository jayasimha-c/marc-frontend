import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RisksService {
  private cachedSystemTypes: string[] = [];

  constructor(private http: HttpClient) {}

  // ── Risk CRUD ──────────────────────────────────────────────

  getRisks(): Observable<any> {
    return this.http.get('risks/get');
  }

  getAddRiskRequired(): Observable<any> {
    return this.http.get('risks/addRisk');
  }

  getEditRiskRequired(riskId: number): Observable<any> {
    return this.http.get(`risks/editRisk?riskId=${riskId}`);
  }

  riskSave(data: any): Observable<any> {
    return this.http.post('risks/addRiskSave', data);
  }

  riskEdit(data: any): Observable<any> {
    return this.http.post('risks/editRiskSave', data);
  }

  riskDelete(riskId: number): Observable<any> {
    return this.http.get(`risks/deleteRisk?riskId=${riskId}`);
  }

  riskEnable(riskId: number): Observable<any> {
    return this.http.get(`risks/enableRisk?riskId=${riskId}`);
  }

  riskDisable(riskId: number): Observable<any> {
    return this.http.get(`risks/disableRisk?riskId=${riskId}`);
  }

  // ── Risk Detail ────────────────────────────────────────────

  riskDetail(riskId: number): Observable<any> {
    return this.http.get(`riskDetail?riskId=${riskId}`);
  }

  // ── Risk Rules ─────────────────────────────────────────────

  getRiskRules(riskId: number): Observable<any> {
    return this.http.get(`risks/getRules?&riskId=${riskId}`);
  }

  getFilteredRules(first: number, rows: number, sortOrder: number, sortField: string, filters: string, selectedRules: number[]): Observable<any> {
    return this.http.get(`risks/getFilteredRules?first=${first}&rows=${rows}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${filters}&selectedRules=${selectedRules.join(',')}`);
  }

  saveSelectedRules(data: any): Observable<any> {
    return this.http.post('risks/saveSelectedRules', data);
  }

  // ── Cross System ───────────────────────────────────────────

  getSystemsForCrossSystem(): Observable<any> {
    return this.http.get('risks/getSystemsForCrossSystem');
  }

  // ── Search / Filter ────────────────────────────────────────

  searchRisksByObjects(payload: any): Observable<any> {
    return this.http.post('risks/searchByObjects', payload);
  }

  // ── Export ─────────────────────────────────────────────────

  getExportRisks(): Observable<any> {
    return this.http.get('risks/exportRisks', { responseType: 'arraybuffer' as any });
  }

  // ── Consistency ────────────────────────────────────────────

  riskConsistency(): Observable<any> {
    return this.http.get('risks/inconReport');
  }

  // ── History ────────────────────────────────────────────────

  getRiskHistory(riskName: string, timezone: string): Observable<any> {
    return this.http.get(`ruleLog/getRiskHistory?riskName=${encodeURIComponent(riskName)}&timeZone=${timezone}`);
  }

  getRiskLogDetails(logId: number): Observable<any> {
    return this.http.get(`ruleLog/getRiskLogDetails?logId=${logId}`);
  }

  getRiskRuleLogDetails(logId: number): Observable<any> {
    return this.http.get(`ruleLog/getRiskRuleLogDetails?logId=${logId}`);
  }

  // ── System Types (cached) ──────────────────────────────────

  getSystemTypes(): Observable<any> {
    if (this.cachedSystemTypes.length) {
      return of({ data: this.cachedSystemTypes });
    }
    return this.http.get('util/getSystemTypes').pipe(
      tap((res: any) => { this.cachedSystemTypes = res.data || []; })
    );
  }

  // ── Upload ─────────────────────────────────────────────────

  uploadRisks(formData: FormData): Observable<any> {
    return this.http.post('risks/uploadRisks', formData);
  }

  uploadRiskRules(formData: FormData): Observable<any> {
    return this.http.post('risks/uploadRules', formData);
  }
}
