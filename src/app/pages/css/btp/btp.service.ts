import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class BtpService {
  logDetails = new Subject<string>();

  constructor(private http: HttpClient) {}

  // ─── BTP Commands ───

  getCommandsList(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('btp-command/list');
  }

  testConnection(commandId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`btp-command/testConn/${commandId}`);
  }

  saveFrequency(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('btp-command/update-frequency', payload);
  }

  getCommandExecutionLog(params: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `btp/command-execution-log?first=${params.first}&rows=${params.rows}&sortOrder=${params.sortOrder}&sortField=${params.sortField}&filters=${encodeURI(JSON.stringify(params.filters))}`
    );
  }

  // ─── BTP System Mapping ───

  getSystemList(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('btp/util/getSystemList');
  }

  getCommandsMapping(commandId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`btp-command-system-mapping/list?commandId=${commandId}`);
  }

  saveCommandsMapping(commandId: number, payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`btp-command-system-mapping/save-or-update-mapping?commandId=${commandId}`, payload);
  }

  deleteCommandsMapping(mappingId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`btp-command-system-mapping?id=${mappingId}`);
  }

  // ─── BTP Rules ───

  getRule(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`btp-rules?id=${id}`);
  }

  saveRule(rule: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('btp-rules/save-or-update', rule);
  }

  deleteRule(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`btp-rules?id=${id}`);
  }

  getRuleDefinitions(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('btp-rule-definition/list');
  }

  exportBtpRules(): Observable<any> {
    return this.http.get('css/getBtpRuleExport', { responseType: 'arraybuffer' });
  }
}
