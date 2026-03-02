import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';
import { RuleTag } from '../css-shared/css-shared.model';
import { SapParameter, SapParameterRule, SapParameterType, SapParameterTypeNames } from './sap-parameter.model';

function getRuleTypeByLabel(label: string): string {
  const entry = Object.entries(SapParameterTypeNames).find(([, v]) => v === label);
  return entry ? entry[0] : label;
}

@Injectable({ providedIn: 'root' })
export class SapParameterService {
  constructor(private http: HttpClient) {}

  getSapParameters(parameterType?: string): Observable<ApiResponse> {
    let params = new HttpParams();
    if (parameterType) {
      params = params.set('parameterType', parameterType);
    }
    return this.http.get<ApiResponse>('css/getSapParameters', { params });
  }

  deleteSapParameter(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`css/deleteSapParameter?parameterId=${id}`, null);
  }

  saveSapParameter(parameter: SapParameter): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/saveSapParameter', parameter);
  }

  getParameterRules(
    parameterType?: string,
    tags: RuleTag[] | null = null,
    books: any[] | null = null
  ): Observable<ApiResponse> {
    if (tags != null && tags.length !== 0) {
      const params = new HttpParams().set('tags', tags.map((tag) => tag.id).join(','));
      return this.http.get<ApiResponse>('css/getParameterRule', { params });
    } else if (books != null && books.length !== 0) {
      const params = new HttpParams().set('books', books.map((book: any) => book.id).join(','));
      return this.http.get<ApiResponse>('css/getParameterRule', { params });
    } else if (parameterType) {
      const params = new HttpParams().set('parameterType', getRuleTypeByLabel(parameterType));
      return this.http.get<ApiResponse>('css/getParameterRule', { params });
    }
    return this.http.get<ApiResponse>('css/getParameterRule');
  }

  saveParameterRule(parameterRule: SapParameterRule): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css/saveParameterRules', parameterRule);
  }

  deleteParameterRule(id: number, parameterType: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `css/deleteParameterRules?ruleId=${id}&parameterType=${parameterType}`,
      null
    );
  }

  testParameterRule(parameterRule: SapParameterRule, value: string): Observable<ApiResponse> {
    const params = new URLSearchParams();
    params.append('value', value);
    return this.http.post<ApiResponse>(`css/testRule?${params.toString()}`, parameterRule);
  }

  getUtilSystems(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('util/getSystems?offline=false');
  }

  exportParameterRules(): Observable<ArrayBuffer> {
    return this.http.get('css/getParameterRuleExport', { responseType: 'arraybuffer' });
  }

  exportAllRules(): Observable<ArrayBuffer> {
    return this.http.get('css/getAllRulesExport', { responseType: 'arraybuffer' });
  }

  getAllRules(pagination: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `css/getAllRules/v2?first=${pagination.first}&rows=${pagination.rows}&page=${pagination.page}&sortOrder=${pagination.sortOrder}&sortField=${pagination.sortField}&filters=${encodeURI(JSON.stringify(pagination.filters || {}))}`
    );
  }

  getById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`css/sap-parameter?id=${id}`);
  }

  getDashboardMetrics(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('css/dashboard-metrics');
  }

  cloneRule(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('css-rule/clone', payload);
  }

  searchRulesByObjects(objectIds: string[], objectTypes: string[], pagination: any): Observable<ApiResponse> {
    const payload = {
      objectIds,
      objectTypes,
      matchMode: 'OR',
      first: pagination.first,
      rows: pagination.rows,
      sortField: pagination.sortField || '',
      sortOrder: pagination.sortOrder,
      filters: JSON.stringify(pagination.filters || {}),
    };
    return this.http.post<ApiResponse>('css/searchByObjects', payload);
  }

  getFrameworksRequirements(pagination: any): Observable<any> {
    return this.http
      .get<any>(
        `controls/all?first=${pagination.first}&rows=${pagination.rows}&page=${pagination.page}&sortOrder=${pagination.sortOrder}&sortField=${pagination.sortField}&filters=${encodeURIComponent(JSON.stringify(pagination.filters || {}))}`
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching frameworks:', error);
          return of([]);
        })
      );
  }

  getAbapRules(first = 0, rows = 10, search = ''): Observable<any> {
    const filters = search
      ? JSON.stringify({ ruleDescription: [{ value: search, matchMode: 'contains' }] })
      : '{}';
    return this.http.get<any>(
      `rules/get?first=${first}&rows=${rows}&sortOrder=0&sortField=&filters=${encodeURIComponent(filters)}`
    );
  }
}
