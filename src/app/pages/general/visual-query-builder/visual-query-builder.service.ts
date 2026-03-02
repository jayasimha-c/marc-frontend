import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VisualQueryBuilderService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSAPSystemList(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sys/list`);
  }

  getTableListBySAPId(sapId: any): Observable<any> {
    const params = { sap: sapId };
    return this.http.get(`${this.baseUrl}/table/select/by-table-name`, { params });
  }

  refreshTableFromSAP(sapId: any, tableId: any): Observable<any> {
    const params = new HttpParams()
      .set('id', tableId)
      .set('sapSystem', sapId);
    return this.http.get(`${this.baseUrl}/table/refresh`, { params });
  }

  getTableFullFromSAP(sapId: any, tableId: any, tableName: any): Observable<any> {
    let params = new HttpParams()
      .set('sapSystem', parseInt(sapId))
      .set('tableName', tableName);
    if (tableId != null && tableId !== '') {
      params = params.set('id', tableId);
    }
    return this.http.get(`${this.baseUrl}/table/full`, { params });
  }

  saveRuleTemplate(payload: any): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    });
    return this.http.post<any>(`${this.baseUrl}/icm/rules`, payload, { headers });
  }

  getRuleById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/icm/rules/${id}`);
  }

  getAllQueries(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/icm/rules/all`);
  }

  getQueryStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/icm/rules/stats`);
  }

  deleteRuleById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/icm/rules/${id}`);
  }
}
