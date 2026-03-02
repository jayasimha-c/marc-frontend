import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';
import { RuleTag } from '../css-shared/css-shared.model';
import { SapAuditRule } from './sap-audit-log.model';

@Injectable({ providedIn: 'root' })
export class SapAuditLogService {
  constructor(private http: HttpClient) {}

  getAuditRules(tags: RuleTag[] | null = null, books: any[] | null = null): Observable<ApiResponse> {
    if (tags != null && tags.length !== 0) {
      const params = new HttpParams().set('tags', tags.map((tag) => tag.id).join(','));
      return this.http.get<ApiResponse>('css/getAuditRules', { params });
    } else if (books != null && books.length !== 0) {
      const params = new HttpParams().set('books', books.map((book: any) => book.id).join(','));
      return this.http.get<ApiResponse>('css/getAuditRules', { params });
    }
    return this.http.get<ApiResponse>('css/getAuditRules');
  }

  getAuditEvents(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('css/getAuditEvents');
  }

  getById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`css/audit-rule?id=${id}`);
  }

  deleteAuditRule(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`css/deleteAuditRule?ruleId=${id}`, null);
  }

  saveAuditRule(rule: SapAuditRule): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/saveAuditRule', rule);
  }

  exportAuditRules(): Observable<ArrayBuffer> {
    return this.http.get('css/getAuditRuleExport', { responseType: 'arraybuffer' });
  }
}
