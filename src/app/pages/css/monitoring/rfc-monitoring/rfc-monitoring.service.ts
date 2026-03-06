import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response';

export interface RfcConnectionFilterRequest {
  sapSystemId?: number;
  connectionType?: string;
  connectionName?: string;
  targetHost?: string;
  username?: string;
  isActive?: boolean;
  isStandard?: boolean;
  trustedRfc?: boolean;
  sncEnabled?: boolean;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sortField?: string;
  sortDirection?: string;
}

export interface RfcConnectionVO {
  id: number;
  sapSystemId: number;
  sapSystemName: string;
  connectionName: string;
  connectionType: string;
  connectionTypeLabel: string;
  sourceSystemId: string;
  sourceClient: string;
  targetHost: string;
  resolvedHostname: string;
  gatewayHost: string;
  gatewayService: string;
  username: string;
  hasPassword: boolean;
  trustedRfc: boolean;
  sncEnabled: boolean;
  sncMode: string;
  language: string;
  pooledConnection: boolean;
  isStandard: boolean;
  isActive: boolean;
  revision: number;
  firstSeenAt: number;
  lastSeenAt: number;
  createdDate: number;
  modifiedDate: number;
  riskLevel: string;
  riskIndicators: string[];
}

export interface RfcStatisticsVO {
  totalConnections: number;
  activeConnections: number;
  systemsWithConnections: number;
  connectionsWithPassword: number;
  trustedRfcCount: number;
  noSncCount: number;
  connectionsByType: { [key: string]: number };
  connectionsBySystem: { [key: string]: number };
}

export interface RfcNetworkGraphVO {
  nodes: GraphNode[];
  edges: GraphEdge[];
  typeColorMap: { [key: string]: string };
  metadata: GraphMetadata;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  sapSystemId?: number;
  connectionCount?: number;
  riskLevel?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  type: string;
  count: number;
  width?: number;
  color?: string;
  opacity?: number;
  isBidirectional?: boolean;
  curveStyle?: string;
}

export interface GraphMetadata {
  totalNodes: number;
  totalEdges: number;
  totalConnections: number;
  recommendedLayout: string;
}

export interface RfcRiskRule {
  id?: number;
  ruleName: string;
  ruleDescription: string;
  isTemplate: boolean;
  isEnabled: boolean;
  ruleConditions: string;
  severity: string;
  outcome: string;
  scopeType: string;
  scopeValue?: string;
  createdDate?: number;
  modifiedDate?: number;
  version?: number;
}

export interface RfcFinding {
  id: number;
  rfcConnectionId: number;
  rfcRiskRuleId: number;
  sapSystemId: number;
  connectionName: string;
  ruleName: string;
  severity: string;
  findingDescription: string;
  status: string;
  assignee?: string;
  mitigationNotes?: string;
  closedBy?: string;
  closedDate?: number;
  firstDetectedAt: number;
  lastDetectedAt: number;
  detectionCount: number;
}

@Injectable({ providedIn: 'root' })
export class RfcMonitoringService {
  private readonly baseUrl = 'css/rfc-monitoring';

  constructor(private http: HttpClient) {}

  getConnections(filter: RfcConnectionFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/connections`, filter);
  }

  getActiveConnections(filter: RfcConnectionFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/connections/active`, filter);
  }

  getConnection(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/connections/${id}`);
  }

  getConnectionHistory(systemId: number, connectionName: string): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('systemId', systemId.toString())
      .set('connectionName', connectionName);
    return this.http.get<ApiResponse>(`${this.baseUrl}/connections/history`, { params });
  }

  getStatistics(filter?: RfcConnectionFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/statistics`, filter || {});
  }

  getNetworkGraphData(filter?: RfcConnectionFilterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/graph-data`, filter || {});
  }

  getConnectionTypes(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/connection-types`);
  }

  getRecentChanges(days = 7, limit = 10): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('days', days.toString())
      .set('limit', limit.toString());
    return this.http.post<ApiResponse>(`${this.baseUrl}/recent-changes`, {}, { params });
  }

  getScanStatus(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/scan/status`);
  }

  getScanLogs(systemId: number, days = 30): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('systemId', systemId.toString())
      .set('days', days.toString());
    return this.http.get<ApiResponse>(`${this.baseUrl}/scan/logs`, { params });
  }

  getStandardPatterns(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/standard-patterns`);
  }

  // Risk Rules
  getAllRiskRules(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/risk-rules`);
  }

  getEnabledRiskRules(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/risk-rules/enabled`);
  }

  getRiskRule(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/risk-rules/${id}`);
  }

  saveRiskRule(rule: RfcRiskRule): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/risk-rules`, rule);
  }

  deleteRiskRule(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/risk-rules/${id}`);
  }

  toggleRiskRule(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/risk-rules/${id}/toggle`, {});
  }

  validateRiskRuleJson(jsonInput: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/risk-rules/validate`, { jsonInput });
  }

  // Findings
  getOpenFindings(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/findings`);
  }

  getOpenFindingsBySystem(systemId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/findings/system/${systemId}`);
  }

  getFindingStatistics(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/findings/statistics`);
  }

  closeFinding(id: number, notes?: string): Observable<ApiResponse> {
    const params = notes ? new HttpParams().set('notes', notes) : undefined;
    return this.http.post<ApiResponse>(`${this.baseUrl}/findings/${id}/close`, {}, { params });
  }

  markFalsePositive(id: number, notes?: string): Observable<ApiResponse> {
    const params = notes ? new HttpParams().set('notes', notes) : undefined;
    return this.http.post<ApiResponse>(`${this.baseUrl}/findings/${id}/false-positive`, {}, { params });
  }

  acknowledgeFinding(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/findings/${id}/acknowledge`, {});
  }
}
