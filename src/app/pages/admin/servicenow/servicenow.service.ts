import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

export interface SnowSyncConfig {
  id?: number;
  systemId: number;
  systemName?: string;
  enabled: boolean;
  syncUsers: boolean;
  syncRoles: boolean;
  syncGroups: boolean;
  syncUserRoles: boolean;
  incrementalCron?: string;
  fullSyncCron?: string;
  pageSize: number;
  maxRecords: number;
  activeUsersOnly: boolean;
  deleteOrphans: boolean;
  retryCount: number;
  retryDelaySeconds: number;
  nextIncrementalSync?: Date;
  nextFullSync?: Date;
  syncRunning?: boolean;
}

export interface SnowSyncStatus {
  id: number;
  systemId: number;
  entityType: string;
  lastSyncTime?: Date;
  lastFullSyncTime?: Date;
  lastSyncStatus?: string;
  recordsSynced: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  lastErrorMessage?: string;
  nextScheduledSync?: Date;
}

export interface SnowSyncLog {
  id: number;
  systemId: number;
  syncType: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  usersSynced: number;
  usersCreated: number;
  usersUpdated: number;
  usersDeleted: number;
  rolesSynced: number;
  rolesCreated: number;
  rolesUpdated: number;
  rolesDeleted: number;
  groupsSynced: number;
  groupsCreated: number;
  groupsUpdated: number;
  groupsDeleted: number;
  userRolesSynced: number;
  userRolesCreated: number;
  userRolesUpdated: number;
  userRolesDeleted: number;
  errorMessage?: string;
  triggeredBy?: string;
}

export interface SnowUser {
  id: number;
  sysId: string;
  systemId: number;
  userName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  active: boolean;
  lockedOut: boolean;
  department?: string;
  title?: string;
  manager?: string;
  employeeNumber?: string;
  phone?: string;
  mobilePhone?: string;
  location?: string;
  company?: string;
  sysCreatedOn?: Date;
  sysUpdatedOn?: Date;
  localCreatedOn?: Date;
  localUpdatedOn?: Date;
}

export interface SnowRole {
  id: number;
  sysId: string;
  systemId: number;
  name: string;
  description?: string;
  elevatedPrivilege: boolean;
  assignableBy?: string;
  canDelegate: boolean;
  sysCreatedOn?: Date;
  sysUpdatedOn?: Date;
  localCreatedOn?: Date;
  localUpdatedOn?: Date;
}

export interface SnowGroup {
  id: number;
  sysId: string;
  systemId: number;
  name: string;
  description?: string;
  active: boolean;
  manager?: string;
  email?: string;
  parent?: string;
  type?: string;
  sysCreatedOn?: Date;
  sysUpdatedOn?: Date;
  localCreatedOn?: Date;
  localUpdatedOn?: Date;
}

export interface SnowUserRole {
  id: number;
  sysId: string;
  systemId: number;
  userSysId?: string;
  userName?: string;
  roleSysId?: string;
  roleName?: string;
  grantedBy?: string;
  inherited: boolean;
  state?: string;
  sysCreatedOn?: Date;
  sysUpdatedOn?: Date;
  localCreatedOn?: Date;
  localUpdatedOn?: Date;
}

export interface SnowAgentConfig {
  id?: number;
  snowSystemId: number;
  targetSapSystemId: number;
  snowSystemName?: string;
  targetSapSystemName?: string;
  enabled: boolean;
  pollCron?: string;
  snowCatalogueItemId?: string;
  roleFieldName?: string;
  autoProvision: boolean;
  riskThreshold: string;
  defaultUserGroup?: string;
  validityDays?: number;
  requesterUserId?: number;
  requesterName?: string;
  defaultUserType?: string;
  lastPollTime?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SnowAgentLog {
  id: number;
  configId: number;
  snowRequestSysId: string;
  snowTicketNumber?: string;
  requestedForUser?: string;
  roleName?: string;
  technicalRoleCount?: number;
  targetSystem?: string;
  analysisJobId?: number;
  violationCount: number;
  maxSeverity?: string;
  decision: string;
  workflowJobId?: number;
  errorMessage?: string;
  processedAt: string;
  snowStatusUpdated: boolean;
  requestId?: string;
}

export interface SnowAgentEventLog {
  id: number;
  configId: number;
  requestId: string;
  stepNumber: number;
  eventType: string;
  status: string;
  message?: string;
  inputData?: string;
  outputData?: string;
  errorDetail?: string;
  durationMs: number;
  ticketNumber?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ServiceNowService {
  private baseUrl = 'servicenow/sync';
  private agentBaseUrl = 'servicenow/agent';

  constructor(private httpClient: HttpClient) {}

  // Configuration endpoints
  getConfig(systemId: number): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/config/${systemId}`);
  }

  saveConfig(config: SnowSyncConfig): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/config`, config);
  }

  // Sync trigger endpoints
  triggerIncrementalSync(systemId: number): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/trigger/${systemId}/incremental`, {});
  }

  triggerFullSync(systemId: number): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/trigger/${systemId}/full`, {});
  }

  // Status and statistics endpoints
  getSyncStatus(systemId: number): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/status/${systemId}`);
  }

  getSyncStats(systemId: number): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/stats/${systemId}`);
  }

  getSyncLogs(systemId: number, page: number = 0, size: number = 20): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/logs/${systemId}`, { params });
  }

  // Data query endpoints
  getUserRoles(systemId: number, page: number = 0, size: number = 100, userSysId?: string): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (userSysId) {
      params = params.set('userSysId', userSysId);
    }
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/data/${systemId}/user-roles`, { params });
  }

  // Filtered data query endpoints (server-side)
  getFilteredUsers(systemId: number, request: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/data/${systemId}/users/filtered`, request);
  }

  getFilteredRoles(systemId: number, request: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/data/${systemId}/roles/filtered`, request);
  }

  getFilteredGroups(systemId: number, request: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/data/${systemId}/groups/filtered`, request);
  }

  getFilteredUserRoles(systemId: number, request: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/data/${systemId}/user-roles/filtered`, request);
  }

  // System selection
  getServiceNowSystems(): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>('sapsystem/getByType?systemType=SERVICENOW');
  }

  getSapSystems(): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>('sapsystem/getByType?systemType=SAP');
  }

  // Agent endpoints
  getAgentConfigs(): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.agentBaseUrl}/configs`);
  }

  getAgentConfig(id: number): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.agentBaseUrl}/config/${id}`);
  }

  saveAgentConfig(config: SnowAgentConfig): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.agentBaseUrl}/config`, config);
  }

  deleteAgentConfig(id: number): Observable<ApiResponse> {
    return this.httpClient.delete<ApiResponse>(`${this.agentBaseUrl}/config/${id}`);
  }

  triggerAgentPoll(configId: number): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.agentBaseUrl}/trigger/${configId}`, {});
  }

  getAgentLogs(configId: number, request: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.agentBaseUrl}/logs/${configId}`, request);
  }

  getAgentLogStats(configId: number): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.agentBaseUrl}/logs/${configId}/stats`);
  }

  mockAgentProcess(configId: number, sapBname: string, roleName: string): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(
      `${this.agentBaseUrl}/mock-process?configId=${configId}&sapBname=${sapBname}&roleName=${roleName}`, {}
    );
  }

  getAgentEvents(requestId: string): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.agentBaseUrl}/events/${requestId}`);
  }

  testAgentConnection(snowSystemId: number, snowCatalogueItemId?: string): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.agentBaseUrl}/test-connection`, {
      snowSystemId,
      snowCatalogueItemId: snowCatalogueItemId || null
    });
  }

  getAppUsers(): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>('admin/getUsers');
  }
}
