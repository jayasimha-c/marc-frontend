import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

export interface RcConceptOption {
  id: number;
  name: string;
  description?: string;
  linkedSystemCount: number;
}

export interface SyncScheduler {
  id?: number;
  name: string;
  syncType: string;
  syncTypeDisplay?: string;
  syncMode: string;
  sapSystemId: number;
  sapSystem?: string;
  conceptId?: number;
  conceptName?: string;
  startDate?: Date;
  endDate?: Date;
  lastExecutionTime?: Date;
  nextExecutionTime?: Date;
  createdOn?: Date;
  modifiedOn?: Date;
  startDateStr?: string;
  startTimeStr?: string;
  endDateStr?: string;
  endTimeStr?: string;
  lastExecutionTimeStr?: string;
  nextExecutionTimeStr?: string;
  repeatPeriodically: boolean;
  repeatAfterDays: number;
  repeatIntervalMinutes?: number;
  runBy?: string;
  runById?: number;
  oneTimeRun?: boolean;
  monthlyRun?: boolean;
  monthRunDate?: Date;
  monthRunDateStr?: string;
  snowSyncUsers?: boolean;
  snowSyncRoles?: boolean;
  snowSyncGroups?: boolean;
  snowSyncUserRoles?: boolean;
  snowActiveUsersOnly?: boolean;
  snowDeleteOrphans?: boolean;
  snowMaxRecords?: number;
  abapPageSize?: number;
  analysisWindowDays?: number;
  roleSyncOrgValues?: boolean;
  cisSyncUsers?: boolean;
  cisSyncGroups?: boolean;
  cisActiveUsersOnly?: boolean;
  cisDeleteOrphans?: boolean;
  correlationIncludeAd?: boolean;
  correlationIncludeAzure?: boolean;
  correlationIncludeCis?: boolean;
  correlationIncludeSnow?: boolean;
  correlationIncludeSap?: boolean;
  correlationAdIds?: string;
  correlationAzureIds?: string;
  correlationCisIds?: string;
  correlationSnowIds?: string;
  correlationSapIds?: string;
}

export interface SyncJob {
  id: number;
  schedulerId?: number;
  schedulerName?: string;
  syncType: string;
  syncMode: string;
  sapSystemId: number;
  sapSystem: string;
  status: string;
  startedOn?: Date;
  completedOn?: Date;
  recordsExtracted: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsDeleted: number;
  duration?: string;
  errorMessage?: string;
  runBy?: string;
}

export interface SyncJobLog {
  id: number;
  jobId: number;
  tableName?: string;
  message: string;
  isError: boolean;
  createdOn: Date;
}

export interface SyncTypeOption {
  value: string;
  label: string;
  dataScope: string;
  supportsIncremental: boolean;
}

export interface SyncModeOption {
  value: string;
  label: string;
}

export interface ConnectionDTO {
  id: number;
  name: string;
  description?: string;
}

export interface CorrelationSources {
  adConnections: ConnectionDTO[];
  azureConnections: ConnectionDTO[];
  cisConnections: ConnectionDTO[];
  snowConnections: ConnectionDTO[];
  sapConnections: ConnectionDTO[];
}

export interface SyncSchedulerFormData {
  scheduler?: SyncScheduler;
  sapSystems: any[];
  syncTypes: SyncTypeOption[];
  syncModes: SyncModeOption[];
  correlationSources?: CorrelationSources;
  rcConcepts?: RcConceptOption[];
}

@Injectable({ providedIn: 'root' })
export class DataSyncService {
  private baseUrl = 'syncAdmin';

  constructor(private httpClient: HttpClient) {}

  getSchedulers(syncType?: string): Observable<ApiResponse> {
    let params = new HttpParams();
    if (syncType) params = params.set('syncType', syncType);
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/schedulers`, { params });
  }

  getScheduler(id: number): Observable<ApiResponse> {
    const params = new HttpParams().set('id', id.toString());
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/scheduler`, { params });
  }

  getSchedulerInfo(id?: number, syncType?: string): Observable<ApiResponse> {
    let params = new HttpParams();
    if (id) params = params.set('id', id.toString());
    if (syncType) params = params.set('syncType', syncType);
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/schedulerInfo`, { params });
  }

  saveScheduler(scheduler: any): Observable<ApiResponse> {
    const headers = new HttpHeaders().set('X-TIMEZONE', Intl.DateTimeFormat().resolvedOptions().timeZone);
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/saveScheduler`, scheduler, { headers });
  }

  deleteScheduler(id: number): Observable<ApiResponse> {
    const params = new HttpParams().set('id', id.toString());
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/deleteScheduler`, null, { params });
  }

  runScheduler(id: number): Observable<ApiResponse> {
    const params = new HttpParams().set('id', id.toString());
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/runScheduler`, null, { params });
  }

  getJobs(tableEvent?: any, syncType?: string): Observable<ApiResponse> {
    let params = new HttpParams();
    if (tableEvent) {
      params = params
        .set('first', (tableEvent.first || 0).toString())
        .set('rows', (tableEvent.rows || 50).toString());
      const sortField = tableEvent.sortField || 'startedOn';
      const sortOrder = tableEvent.sortField ? (tableEvent.sortOrder || 1) : 1;
      params = params.set('sortField', sortField).set('sortOrder', sortOrder.toString());
      if (tableEvent.filters && Object.keys(tableEvent.filters).length > 0) {
        params = params.set('filters', JSON.stringify(tableEvent.filters));
      }
    } else {
      params = params.set('first', '0').set('rows', '50').set('sortField', 'startedOn').set('sortOrder', '1');
    }
    if (syncType) params = params.set('syncType', syncType);
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/jobs`, { params });
  }

  getJob(id: number): Observable<ApiResponse> {
    const params = new HttpParams().set('id', id.toString());
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/job`, { params });
  }

  getJobLogs(jobId: number): Observable<ApiResponse> {
    const params = new HttpParams().set('jobId', jobId.toString());
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/jobLogs`, { params });
  }

  getSyncStatus(syncType?: string): Observable<ApiResponse> {
    let params = new HttpParams();
    if (syncType) params = params.set('syncType', syncType);
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/status`, { params });
  }
}
