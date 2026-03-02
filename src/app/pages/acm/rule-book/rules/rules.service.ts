import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RulesService {
  private cachedSystemTypes: string[] = [];

  constructor(private http: HttpClient) {}

  getRules(first: number, rows: number, sortOrder: number, sortField: string, filters: string): Observable<any> {
    return this.http.get(`rules/get?first=${first}&rows=${rows}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${filters}`);
  }

  getRuleStatistics(): Observable<any> {
    return this.http.get('rules/statistics');
  }

  searchRulesByObjects(payload: any): Observable<any> {
    return this.http.post('rules/searchByObjects', payload);
  }

  getRuleObjects(ruleId: number, systemType: string): Observable<any> {
    const prefix = systemType === 'SAP' ? 'ruleObjects' : 'sfruleObjects';
    return this.http.get(`${prefix}/get?ruleId=${ruleId}`);
  }

  saveRuleObjects(payload: any, systemType: string): Observable<any> {
    const prefix = systemType === 'SAP' ? 'ruleObjects' : 'sfruleObjects';
    return this.http.post(`${prefix}/saveRuleObjects`, payload);
  }

  autoComplete(value: string, col: string): Observable<any> {
    const endpoint = col === 'auth-object' ? 'autoCompleteObject' : 'autoCompleteAuthfield';
    return this.http.get(`ruleObjects/${endpoint}/${value}`);
  }

  getAddRequired(): Observable<any> {
    return this.http.get('rules/addRule');
  }

  getEditRequired(ruleId: number): Observable<any> {
    return this.http.get(`rules/editRule?ruleId=${ruleId}`);
  }

  ruleSave(data: any, copy?: boolean, ruleId?: number): Observable<any> {
    let url = 'rules/addRuleSave';
    if (copy && ruleId !== undefined) {
      url += `?copy=${copy}&ruleId=${ruleId}`;
    }
    return this.http.post(url, data);
  }

  ruleEdit(data: any): Observable<any> {
    return this.http.post('rules/editRuleSave', data);
  }

  ruleDelete(ruleIds: string): Observable<any> {
    return this.http.get(`rules/deleteRule?ruleId=${ruleIds}`);
  }

  getExportRules(): Observable<any> {
    return this.http.get('rules/exportRules', { responseType: 'arraybuffer' });
  }

  getRuleTransport(): Observable<any> {
    return this.http.get('exportRuleBook', { responseType: 'blob' });
  }

  getSystemTypes(): Observable<any> {
    if (this.cachedSystemTypes.length > 0) {
      return of({ data: this.cachedSystemTypes });
    }
    return this.http.get('util/getSystemTypes').pipe(
      tap((res: any) => { this.cachedSystemTypes = res.data || []; })
    );
  }

  getRuleHistory(ruleName: string, timezone: string): Observable<any> {
    return this.http.get(`ruleLog/getRuleHistory?ruleName=${encodeURIComponent(ruleName)}&timeZone=${timezone}`);
  }

  getRuleLogDetails(logId: number): Observable<any> {
    return this.http.get(`ruleLog/getRuleLogDetails?logId=${logId}`);
  }

  getRuleObjLogDetails(logId: number): Observable<any> {
    return this.http.get(`ruleLog/getRuleObjLogDetails?logId=${logId}`);
  }

  getBpmnMapRule(ruleId: number): Observable<any> {
    return this.http.get(`bpmn/mapRule?ruleId=${ruleId}`);
  }

  getBpmnTasks(processId: number): Observable<any> {
    return this.http.get(`bpmn/findTaskNodes?processId=${processId}`);
  }

  saveBpmnRuleMap(payload: any): Observable<any> {
    return this.http.post('bpmn/saveRuleMap', payload);
  }

  // ── Upload ─────────────────────────────────────────────────

  uploadRules(formData: FormData): Observable<any> {
    return this.http.post('rules/uploadRules', formData);
  }

  uploadRuleObjects(formData: FormData, overwrite: boolean): Observable<any> {
    return this.http.post(`ruleObjects/uploadRuleObjects?overwrite=${overwrite}`, formData);
  }
}
