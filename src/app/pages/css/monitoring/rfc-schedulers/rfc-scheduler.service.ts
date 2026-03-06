import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response';

export interface RfcScheduler {
  id?: number;
  name: string;
  sapSystemId: number;
  sapSystemName?: string;
  description?: string;
  startDate: number;
  endDate?: number;
  repeatPeriodically: boolean;
  repeatAfterDays?: number;
  lastExecutionTime?: number;
  nextExecutionTime?: number;
  isEnabled: boolean;
  createdBy?: string;
  createdDate?: number;
  modifiedBy?: string;
  modifiedDate?: number;
}

export interface RfcSchedulerJob {
  id: number;
  schedulerId: number;
  sapSystemId: number;
  sapSystemName: string;
  profileName: string;
  startedOn: number;
  completedOn?: number;
  status: string;
  completionMessage?: string;
  connectionsFound: number;
  newConnections: number;
  updatedConnections: number;
  deactivatedConnections: number;
  findingsCreated: number;
  runBy: string;
  durationMs?: number;
}

@Injectable({ providedIn: 'root' })
export class RfcSchedulerService {
  private readonly baseUrl = 'css/rfc-schedulers';

  constructor(private http: HttpClient) {}

  getAllSchedulers(systemId?: number): Observable<ApiResponse> {
    const url = systemId ? `${this.baseUrl}?systemId=${systemId}` : this.baseUrl;
    return this.http.get<ApiResponse>(url);
  }

  getScheduler(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/${id}`);
  }

  saveScheduler(scheduler: RfcScheduler): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.baseUrl, scheduler);
  }

  deleteScheduler(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/${id}`);
  }

  toggleScheduler(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/${id}/toggle`, {});
  }

  runNow(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/${id}/run`, {});
  }

  isRunning(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/${id}/running`);
  }

  getJobsByScheduler(schedulerId: number, limit = 50): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/${schedulerId}/jobs?limit=${limit}`);
  }

  getRecentJobs(limit = 20): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/jobs/recent?limit=${limit}`);
  }

  getJob(jobId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/jobs/${jobId}`);
  }

  getStatus(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/status`);
  }
}
