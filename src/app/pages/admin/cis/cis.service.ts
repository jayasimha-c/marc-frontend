import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

export interface CISUser {
  id: number;
  userUuid: string;
  userName: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  active: boolean;
  system: string;
  userType?: string;
  locale?: string;
  timezone?: string;
  lastSyncDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CISGroup {
  id: number;
  groupUuid: string;
  displayName: string;
  description?: string;
  system: string;
  groupType?: string;
  lastSyncDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  memberCount?: number;
}

export interface CISSyncJob {
  id: number;
  system: string;
  jobType: string;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
  runBy?: string;
  usersSynced: number;
  groupsSynced: number;
  errorMessage?: string;
  duration?: number;
}

export interface CISDataSummary {
  userCount: number;
  groupCount: number;
}

@Injectable({ providedIn: 'root' })
export class CISService {
  private baseUrl = 'cis';

  constructor(private httpClient: HttpClient) {}

  getCISSystems(): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>('sapsystem/getByType?systemType=SAP_CLOUD_IDENTITY');
  }

  testConnection(systemId: number): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/test-connection/${systemId}`);
  }

  getConnectionStats(systemId: number): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/connection-stats/${systemId}`);
  }

  syncUsers(systemId: number): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/sync/users/${systemId}`, {});
  }

  syncGroups(systemId: number): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/sync/groups/${systemId}`, {});
  }

  syncAll(systemId: number): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/sync/all/${systemId}`, {});
  }

  getDashboard(systemId: number): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/dashboard/${systemId}`);
  }

  getDataSummary(systemId: number): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/data/${systemId}/summary`);
  }

  getSyncJobs(systemId: number, page: number = 0, size: number = 20): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/sync-jobs/${systemId}?page=${page}&size=${size}`);
  }

  getLatestSyncJob(systemId: number): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/sync-jobs/latest/${systemId}`);
  }

  getFilteredUsers(systemId: number, request: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/data/${systemId}/users/filtered`, request);
  }

  getFilteredGroups(systemId: number, request: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/data/${systemId}/groups/filtered`, request);
  }

  getGroupMembers(groupId: number): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/group/${groupId}/members`);
  }
}
