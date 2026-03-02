import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class RemService {
  constructor(private http: HttpClient) {}

  getSapSystems(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('util/getSAPSystems');
  }

  getRiskConfig(first: number, rows: number, sortOrder: number, sortField: string, filters: any[]): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `riskAnalysis/getRiskConfig?first=${first}&rows=${rows}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${encodeURIComponent(JSON.stringify(filters))}`
    );
  }

  getRuleConfig(first: number, rows: number, sortOrder: number, sortField: string, filters: any[]): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `riskAnalysis/getRuleConfig?first=${first}&rows=${rows}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${encodeURIComponent(JSON.stringify(filters))}`
    );
  }

  getDurationConfig(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('riskAnalysis/getDurConfig');
  }

  getRisksToAdd(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('riskAnalysis/getRisks');
  }

  getRulesToAdd(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('riskAnalysis/getRules');
  }

  addRiskConfig(payload: { sapSystemId: number; riskIds: number[] }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('riskAnalysis/addRiskConfig', payload);
  }

  addRuleConfig(payload: { sapSystemId: number; ruleIds: number[] }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('riskAnalysis/addRuleConfig', payload);
  }

  addDurConfig(payload: { fromDateStr: string; sapSystemId: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('riskAnalysis/addDurConfig', payload);
  }

  deleteRiskConfig(riskIds: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`riskAnalysis/deleteRiskConfig?riskIds=${riskIds}`);
  }

  deleteRuleConfig(ruleIds: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`riskAnalysis/deleteRuleConfig?ruleIds=${ruleIds}`);
  }

  deleteDurationConfig(durId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`riskAnalysis/deleteDurConfig?durId=${durId}`);
  }
}
