import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response';

export interface IdentityException {
  exceptionId: number;
  jobRunId: number;
  sourceSystem: string;
  sourceSystemDisplay: string;
  sourceUserId: string;
  sourceUsername: string;
  sourceEmail: string;
  exceptionType: string;
  exceptionTypeDisplay: string;
  correlationPhase: number;
  reason: string;
  candidateIdentityIds: string;
  status: string;
  statusDisplay: string;
  resolvedAt: number;
  resolvedAtStr: string;
  resolvedBy: string;
  resolutionType: string;
  resolutionIdentityId: number;
  resolutionNotes: string;
  createdAt: number;
  createdAtStr: string;
  updatedAt: number;
  updatedAtStr: string;
}

export interface ExceptionStatistics {
  pendingCount: number;
  inReviewCount: number;
  totalUnresolved: number;
  bySourceSystem: { [key: string]: number };
}

@Injectable({ providedIn: 'root' })
export class IdentityExceptionService {
  private baseUrl = 'identityException';

  constructor(private http: HttpClient) {}

  getFiltered(tableEvent: any): Observable<ApiResponse> {
    const request = this.buildGridRequest(tableEvent);
    return this.http.post<ApiResponse>(`${this.baseUrl}/getFiltered`, request);
  }

  getPending(tableEvent: any): Observable<ApiResponse> {
    const request = this.buildGridRequest(tableEvent);
    return this.http.post<ApiResponse>(`${this.baseUrl}/getPending`, request);
  }

  getPendingList(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/pendingList`);
  }

  getException(id: number): Observable<ApiResponse> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<ApiResponse>(`${this.baseUrl}/get`, { params });
  }

  getByJob(jobId: number): Observable<ApiResponse> {
    const params = new HttpParams().set('jobId', jobId.toString());
    return this.http.get<ApiResponse>(`${this.baseUrl}/byJob`, { params });
  }

  getStatistics(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/statistics`);
  }

  resolveByLink(exceptionId: number, identityId: number, notes?: string): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('exceptionId', exceptionId.toString())
      .set('identityId', identityId.toString());
    if (notes) params = params.set('notes', notes);
    return this.http.post<ApiResponse>(`${this.baseUrl}/resolveByLink`, null, { params });
  }

  resolveByNew(exceptionId: number, notes?: string): Observable<ApiResponse> {
    let params = new HttpParams().set('exceptionId', exceptionId.toString());
    if (notes) params = params.set('notes', notes);
    return this.http.post<ApiResponse>(`${this.baseUrl}/resolveByNew`, null, { params });
  }

  resolveByIgnore(exceptionId: number, notes?: string): Observable<ApiResponse> {
    let params = new HttpParams().set('exceptionId', exceptionId.toString());
    if (notes) params = params.set('notes', notes);
    return this.http.post<ApiResponse>(`${this.baseUrl}/resolveByIgnore`, null, { params });
  }

  markInReview(exceptionId: number): Observable<ApiResponse> {
    const params = new HttpParams().set('exceptionId', exceptionId.toString());
    return this.http.post<ApiResponse>(`${this.baseUrl}/markInReview`, null, { params });
  }

  private buildGridRequest(tableEvent?: any): any {
    if (!tableEvent) {
      return { page: 0, size: 25, sortField: 'createdAt', sortDirection: 'DESC', filters: [] };
    }

    const filtersArray: any[] = [];
    if (tableEvent.filters) {
      for (const key of Object.keys(tableEvent.filters)) {
        if (tableEvent.filters[key] !== null && tableEvent.filters[key] !== '') {
          filtersArray.push({ field: key, operator: 'CONTAINS', value: tableEvent.filters[key] });
        }
      }
    }

    return {
      page: (tableEvent.pageIndex || 1) - 1,
      size: tableEvent.pageSize || 25,
      sortField: tableEvent.sort?.field || 'createdAt',
      sortDirection: tableEvent.sort?.direction === 'descend' ? 'DESC' : 'ASC',
      filters: filtersArray,
      globalFilter: tableEvent.globalSearch || null
    };
  }
}
