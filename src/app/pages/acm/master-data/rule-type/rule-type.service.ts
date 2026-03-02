import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface ApiResponse {
  success: boolean;
  data: any;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class RuleTypeService {

  constructor(private http: HttpClient) {}

  getRuleTypes(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('ruleType/getRuleTypes');
  }

  saveRuleType(payload: { id?: number; name: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('ruleType/ruleTypeOperations', payload);
  }

  deleteRuleType(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`ruleType/deleteRuleType?id=${id}`);
  }
}
