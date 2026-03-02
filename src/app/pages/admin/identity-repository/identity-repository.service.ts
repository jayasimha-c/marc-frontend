import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

export interface MarcIdentityVO {
  id: number;
  employeeId: string;
  sourceUsername: string;
  primaryEmail: string;
  displayName: string;
  firstName: string;
  lastName: string;
  department: string;
  jobTitle: string;
  managerEmployeeId: string;
  managerName: string;
  costCenter: string;
  companyCode: string;
  location: string;
  phone: string;
  userType: string;
  sapBname: string;
  sapBtpUserId: string;
  sourceType: string;
  sourceId: string;
  active: boolean;
  lastSyncedAt: number;
  createdAt: number;
  updatedAt: number;
  sourceTypeDisplay?: string;
  lastSyncedDisplay?: string;
  statusDisplay?: string;
  linkedAccountsCount?: number;
  linkedAccounts?: LinkedAccount[];
  linkedAccountsDisplay?: string;
}

export interface LinkedAccount {
  linkId: number;
  applicationType: string;
  applicationLabel: string;
  connectionId: number;
  connectionName: string;
  systemName: string;
  systemId: number;
  accountId: string;
  accountUsername: string;
  accountEmail: string;
  sourceId: string;
  linkingField: string;
  linkingValue: string;
  lastSyncedAt: number;
  status: 'linked' | 'unlinked' | 'orphaned' | 'multiple' | 'active' | 'inactive';
  matchConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matchMethod: string;
  correlationPhase: number;
  lastSyncedDisplay?: string;
  statusLabel?: string;
}

export interface IdentityStats {
  totalIdentities: number;
  fullyLinked: number;
  partiallyLinked: number;
  unlinked: number;
  orphanedAccounts: number;
}

export interface OrphanedAccount {
  id: number;
  applicationType: string;
  applicationLabel: string;
  systemName: string;
  systemId: number;
  accountId: string;
  accountUsername: string;
  accountEmail: string;
  accountDisplayName: string;
  lastSyncedAt: number;
  potentialMatches?: MarcIdentityVO[];
  lastSyncedDisplay?: string;
}

export type CleanupScope = 'FULL_RESET' | 'IDENTITY_ONLY' | 'SOURCE_ONLY' | 'SPECIFIC_SOURCES';
export type SourceType = 'AD' | 'AZURE' | 'CIS' | 'SNOW' | 'SAP';

export interface CleanupOptions {
  scope: CleanupScope;
  selectedSources?: SourceType[];
  cleanOrphanedIdentities?: boolean;
  dryRun: boolean;
  includeJobHistory: boolean;
  resetAutoIncrement: boolean;
}

export interface CleanupPreview {
  sourceCounts: { [tableName: string]: number };
  identityCounts: { [tableName: string]: number };
  cascadingCounts: { [description: string]: number };
  jobCounts: { [tableName: string]: number };
  totalRecords: number;
  warnings: string[];
}

export interface CleanupResult {
  success: boolean;
  message: string;
  deletedCounts: { [tableName: string]: number };
  cascadedCounts: { [description: string]: number };
  totalDeleted: number;
  executionTimeMs: number;
  cleanedBy: string;
  cleanedAt: number;
  options?: CleanupOptions;
}

@Injectable({ providedIn: 'root' })
export class IdentityRepositoryService {
  private baseUrl = 'admin/identity-repository';

  constructor(private http: HttpClient) {}

  getIdentities(tableEvent: any, linkStatus?: string): Observable<ApiResponse> {
    const request = this.buildGridRequest(tableEvent);
    let params = new HttpParams();
    if (linkStatus && linkStatus !== 'all') {
      params = params.set('linkStatus', linkStatus);
    }
    return this.http.post<ApiResponse>(`${this.baseUrl}/getFiltered`, request, { params });
  }

  getIdentityById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/${id}`);
  }

  getStats(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/stats`);
  }

  getOrphanedAccounts(tableEvent: any): Observable<ApiResponse> {
    const request = this.buildGridRequest(tableEvent);
    return this.http.post<ApiResponse>(`${this.baseUrl}/orphaned/getFiltered`, request);
  }

  getLinkedAccounts(identityId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/${identityId}/linked-accounts`);
  }

  getSyncHistory(identityId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/${identityId}/sync-history`);
  }

  getSourceTypes(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/cleanup/source-types`);
  }

  getCleanupPreview(options: Partial<CleanupOptions>): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('scope', options.scope || 'FULL_RESET')
      .set('includeJobHistory', (options.includeJobHistory || false).toString())
      .set('cleanOrphanedIdentities', (options.cleanOrphanedIdentities || false).toString());
    if (options.scope === 'SPECIFIC_SOURCES' && options.selectedSources?.length) {
      params = params.set('selectedSources', options.selectedSources.join(','));
    }
    return this.http.get<ApiResponse>(`${this.baseUrl}/cleanup/preview`, { params });
  }

  executeCleanup(options: CleanupOptions): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('scope', options.scope)
      .set('dryRun', options.dryRun.toString())
      .set('includeJobHistory', options.includeJobHistory.toString())
      .set('resetAutoIncrement', options.resetAutoIncrement.toString())
      .set('cleanOrphanedIdentities', (options.cleanOrphanedIdentities || false).toString());
    if (options.scope === 'SPECIFIC_SOURCES' && options.selectedSources?.length) {
      params = params.set('selectedSources', options.selectedSources.join(','));
    }
    return this.http.post<ApiResponse>(`${this.baseUrl}/cleanup/execute`, null, { params });
  }

  private buildGridRequest(tableEvent?: any): any {
    if (!tableEvent) {
      return { page: 0, size: 25, sortField: 'displayName', sortDirection: 'ASC', filters: [] };
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
      sortField: tableEvent.sort?.field || 'displayName',
      sortDirection: tableEvent.sort?.direction === 'descend' ? 'DESC' : 'ASC',
      filters: filtersArray,
      globalFilter: tableEvent.globalSearch || null
    };
  }
}
