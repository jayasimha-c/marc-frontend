import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IcmControlService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // --- Dropdown data ---

  getCriticalityList(): Observable<any> {
    return this.http.get(`${this.base}/icm/criticality/table-full`);
  }

  getBPList(): Observable<any> {
    return this.http.get(`${this.base}/icm/bp/table-full`);
  }

  getBusinessSubProcesses(bpId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/sbp/table-full`, { params: { bp: bpId.toString() } });
  }

  getRegulationList(): Observable<any> {
    return this.http.get(`${this.base}/icm/regulation/table-full`);
  }

  getGroupList(): Observable<any> {
    return this.http.get(`${this.base}/icm/group/table-full`);
  }

  getCategoryList(): Observable<any> {
    return this.http.get(`${this.base}/icm/category/table-full`);
  }

  getImpactList(): Observable<any> {
    return this.http.get(`${this.base}/icm/impact/table-full`);
  }

  getControlTypeList(): Observable<any> {
    return this.http.get(`${this.base}/icm/controltype/table-full`);
  }

  // --- Controls ---

  getControlList(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] != null) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get(`${this.base}/icm/controls/table-with-filter`, { params: httpParams });
  }

  saveControl(payload: any): Observable<any> {
    return this.http.post(`${this.base}/icm/controls/save-or-update`, payload);
  }

  getControlByName(name: string): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/find-by-name`, { params: { name } });
  }

  getControlById(id: number): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/find-full`, { params: { id: id.toString() } });
  }

  getStdControls(): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/stdControls`);
  }

  getActiveControls(): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/active`);
  }

  // --- Manual Scripts ---

  getManualScripts(): Observable<any> {
    return this.http.get(`${this.base}/icm/scripts/list-table-full`);
  }

  // --- Query Rules ---

  getAllQueryRules(): Observable<any> {
    return this.http.get(`${this.base}/icm/rules/all`);
  }

  // --- Users ---

  getControlUserList(): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/select-user-by-name`);
  }

  // --- Execute / Simulate ---

  execute(controlId: number, systemId: number): Observable<any> {
    return this.http.post(`${this.base}/icm/controls/execute?systemId=${systemId}`, { id: controlId.toString() });
  }

  simulate(controlId: number, systemId: number): Observable<any> {
    return this.http.post(`${this.base}/icm/controls/simulation?controlId=${controlId}&systemId=${systemId}`, {});
  }

  executeStandardControl(controlId: number): Observable<any> {
    return this.http.post(`${this.base}/icm/std/controls/executeControl`, { id: controlId.toString() });
  }

  simulateStandardControl(controlId: number): Observable<any> {
    return this.http.post(`${this.base}/icm/std/controls/simulation`, { id: controlId.toString() });
  }

  // --- Rule Audit Logs ---

  getDynamicControls(first: number, rows: number, sortOrder: number, sortField: string, filters: string): Observable<any> {
    return this.http.get(`${this.base}/icm/ruleLog/getRuleChanges`, {
      params: { first: first.toString(), rows: rows.toString(), sortOrder: sortOrder.toString(), sortField, filters }
    });
  }

  getStandardControls(first: number, rows: number, sortOrder: number, sortField: string, filters: string): Observable<any> {
    return this.http.get(`${this.base}/icm/ruleLog/getStdRuleChanges`, {
      params: { first: first.toString(), rows: rows.toString(), sortOrder: sortOrder.toString(), sortField, filters }
    });
  }

  // --- SAP Systems ---

  getSAPSystemList(): Observable<any> {
    return this.http.get(`${this.base}/sys/list`);
  }

  // --- Deficiency ---

  getDeficiencyData(params: {
    first: number; rows: number;
    sapSystem?: string; controlName?: string; scriptName?: string;
    status?: string; businessProcess?: string; businessSubProcess?: string;
    lastExecutedDate?: string; ruleName?: string; created?: string;
  }): Observable<any> {
    const httpParams = new HttpParams()
      .set('iDisplayStart', params.first.toString())
      .set('iDisplayLength', params.rows.toString())
      .set('sapSystem', params.sapSystem || '')
      .set('controlNameValue', params.controlName || '')
      .set('scriptName', params.scriptName || '')
      .set('deficiencyStatus', params.status || '')
      .set('businessProcess', params.businessProcess || '')
      .set('businessSubProcess', params.businessSubProcess || '')
      .set('lastExecutedDate', params.lastExecutedDate && params.lastExecutedDate !== '~' ? params.lastExecutedDate : '')
      .set('ruleName', params.ruleName || '')
      .set('createdValue', params.created && params.created !== '~' ? params.created : '');
    return this.http.get(`${this.base}/icm/deficiency/table-data`, { params: httpParams });
  }

  getDeficiencyById(dfcId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/deficiency/find-full`, { params: { id: dfcId.toString() } });
  }

  saveIcmDeficiency(payload: any): Observable<any> {
    return this.http.post(`${this.base}/icm/deficiency/save-or-update`, payload);
  }

  getManualTaskTableFull(controlId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/task-full`, { params: { controlId: controlId.toString() } });
  }

  getAutomatedTaskTableFull(deficiencyId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/def-results`, { params: { deficiencyId: deficiencyId.toString() } });
  }

  getManualTaskSteps(taskId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/tasks/task-steps`, { params: { taskId: taskId.toString() } });
  }

  // --- Execution Results ---

  getExecutionResultsTableFull(): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/execution-results/table-full`);
  }

  getExecutionResultsByControl(controlId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/execution-results/by-control/${controlId}`);
  }

  getExecutionResultsStats(): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/execution-results/stats`);
  }

  getRuleResultColumns(ruleId: number, controlId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/rs/meta`, {
      params: { ruleId: ruleId.toString(), controlId: controlId.toString() },
    });
  }

  getRuleResult(ruleId: number, revision: number, controlId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/rs/data-full`, {
      params: { ruleId: ruleId.toString(), rev: revision.toString(), controlId: controlId.toString() },
    });
  }

  getStandardAutomatedRuleResultColumns(stdControlId: number, controlId: number, revision: number): Observable<any> {
    return this.http.get(`${this.base}/icm/rs/std-meta`, {
      params: { stdControlId: stdControlId.toString(), icmControlId: controlId.toString(), revision: revision.toString() },
    });
  }

  getStandardAutomatedRuleResult(stdControlId: number, controlId: number, revision: number): Observable<any> {
    return this.http.get(`${this.base}/icm/rs/std-data-full`, {
      params: { stdControlId: stdControlId.toString(), icmControlId: controlId.toString(), rev: revision.toString() },
    });
  }

  // --- Attachments ---

  uploadAttachment(file: File, entityType: string, entityId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId.toString());
    return this.http.post(`${this.base}/attachments/upload`, formData);
  }

  downloadAttachment(attachmentId: number): Observable<Blob> {
    return this.http.get(`${this.base}/attachments/download/${attachmentId}`, { responseType: 'blob' });
  }

  // --- Control Tasks ---

  getControlTasks(): Observable<any> {
    return this.http.get(`${this.base}/icm/tasks/tasks-by-user`);
  }

  getManualActiveTasks(controlId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/task-active`, { params: { controlId: controlId.toString() } });
  }

  getManualTaskWizard(taskId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/tasks/wizard`, { params: { id: taskId.toString() } });
  }

  saveManualTaskAnswer(payload: any): Observable<any> {
    return this.http.post(`${this.base}/icm/tasks/finish`, payload);
  }

  saveManualTaskAnswerDraft(payload: any): Observable<any> {
    return this.http.post(`${this.base}/icm/tasks/draft-save`, payload);
  }

  // Control Monitoring
  getControlMonitoring(first: number, rows: number): Observable<any> {
    return this.http.get(`${this.base}/icm/monitoring/table-with-filter`, {
      params: { system: '', status: '', bp: '', sp: '', cn: '', rn: '', from: '', to: '', first: first.toString(), rows: rows.toString() },
    });
  }

  getControlMonitoringJournalLog(journalId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/monitoring/journal-log`, {
      params: { journalId: journalId.toString() },
    });
  }
}
