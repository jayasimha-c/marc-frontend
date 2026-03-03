import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardFilter {
  startDate?: number;
  endDate?: number;
  systemId?: number;
}

export interface DashboardSummary {
  totalControls: number;
  activeControls: number;
  testedControls: number;
  notTestedControls: number;
  effectiveControls: number;
  partiallyEffectiveControls: number;
  ineffectiveControls: number;
  effectivenessRate: number;
  totalDeficiencies: number;
  openDeficiencies: number;
  criticalDeficiencies: number;
  overdueDeficiencies: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  todayExecutions: number;
  connectedSystems: number;
  effectivenessRateTrend?: number;
  deficiencyTrend?: number;
  executionTrend?: number;
}

export interface DeficiencyStats {
  totalDeficiencies: number;
  openDeficiencies: number;
  inProgressDeficiencies: number;
  closedDeficiencies: number;
  notApplicableDeficiencies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  overdueCount: number;
  overduePercentage: number;
  age0to30: number;
  age31to60: number;
  age61to90: number;
  age90plus: number;
  averageAgeInDays: number;
  averageTimeToClose: number;
  openedThisPeriod: number;
  closedThisPeriod: number;
  netChange: number;
  byBusinessProcess?: CategoryCount[];
  byOwner?: CategoryCount[];
}

export interface CategoryCount {
  category: string;
  count: number;
  openCount?: number;
  closedCount?: number;
}

export interface ExecutionStats {
  todayTotalExecutions: number;
  todaySuccessCount: number;
  todayFailedCount: number;
  todayRunningCount: number;
  todayErrorCount: number;
  periodTotalExecutions: number;
  periodSuccessCount: number;
  periodFailedCount: number;
  periodSuccessRate: number;
  totalExceptionsFound: number;
  controlsWithExceptions: number;
  averageExecutionTimeMs?: number;
  longestExecutionTimeMs?: number;
  activeSchedulers: number;
  disabledSchedulers: number;
  overdueSchedulers: number;
  bySystem?: SystemExecutionStats[];
  topExceptionControls?: ControlExceptionStats[];
}

export interface SystemExecutionStats {
  systemId: number;
  systemName: string;
  totalExecutions: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  lastExecutionTime?: string;
  status: string;
}

export interface ControlExceptionStats {
  controlId: number;
  controlName: string;
  exceptionCount: number;
  executionCount: number;
  exceptionRate: number;
  lastExecutionDate?: string;
}

export interface TrendData {
  period: string;
  granularity: string;
  effectivenessTrend?: TrendPoint[];
  deficiencyOpenedTrend?: TrendPoint[];
  deficiencyClosedTrend?: TrendPoint[];
  executionTrend?: TrendPoint[];
  exceptionTrend?: TrendPoint[];
}

export interface TrendPoint {
  date: string;
  timestamp?: number;
  value: number;
  percentage?: number;
}

export interface GroupedStats {
  groupBy: string;
  groups: GroupStats[];
  totalControls: number;
  totalEffective: number;
  totalDeficiencies: number;
  overallEffectivenessRate: number;
}

export interface GroupStats {
  groupId: number;
  groupName: string;
  groupCode?: string;
  totalControls: number;
  activeControls: number;
  testedControls: number;
  effectiveControls: number;
  ineffectiveControls: number;
  effectivenessRate: number;
  openDeficiencies: number;
  criticalDeficiencies?: number;
  riskLevel: string;
}

export interface RiskHeatmap {
  xAxisLabels: string[];
  yAxisLabels: string[];
  cells: HeatmapCell[];
  totalHighRiskCells: number;
  totalMediumRiskCells: number;
  totalLowRiskCells: number;
}

export interface HeatmapCell {
  xIndex: number;
  yIndex: number;
  xLabel: string;
  yLabel: string;
  controlCount: number;
  deficiencyCount: number;
  ineffectiveCount: number;
  effectivenessRate?: number;
  riskScore: number;
  riskLevel: string;
}

@Injectable({
  providedIn: 'root',
})
export class IcmDashboardService {
  private readonly baseUrl = `${environment.apiUrl}/icm/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(filter?: DashboardFilter): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get(`${this.baseUrl}/summary`, { params });
  }

  getDeficiencyStats(filter?: DashboardFilter): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get(`${this.baseUrl}/deficiency-stats`, { params });
  }

  getExecutionStats(filter?: DashboardFilter): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get(`${this.baseUrl}/execution-stats`, { params });
  }

  getTrend(period: string, systemId?: number): Observable<any> {
    let params = new HttpParams();
    if (systemId) {
      params = params.set('systemId', systemId.toString());
    }
    return this.http.get(`${this.baseUrl}/trend/${period}`, { params });
  }

  getStatsByBusinessProcess(systemId?: number): Observable<any> {
    let params = new HttpParams();
    if (systemId) {
      params = params.set('systemId', systemId.toString());
    }
    return this.http.get(`${this.baseUrl}/by-business-process`, { params });
  }

  getStatsByCriticality(systemId?: number): Observable<any> {
    let params = new HttpParams();
    if (systemId) {
      params = params.set('systemId', systemId.toString());
    }
    return this.http.get(`${this.baseUrl}/by-criticality`, { params });
  }

  getStatsByOwner(systemId?: number): Observable<any> {
    let params = new HttpParams();
    if (systemId) {
      params = params.set('systemId', systemId.toString());
    }
    return this.http.get(`${this.baseUrl}/by-owner`, { params });
  }

  getComplianceScore(systemId?: number): Observable<any> {
    let params = new HttpParams();
    if (systemId) {
      params = params.set('systemId', systemId.toString());
    }
    return this.http.get(`${this.baseUrl}/compliance-score`, { params });
  }

  getRiskHeatmap(systemId?: number): Observable<any> {
    let params = new HttpParams();
    if (systemId) {
      params = params.set('systemId', systemId.toString());
    }
    return this.http.get(`${this.baseUrl}/risk-heatmap`, { params });
  }

  private buildParams(filter?: DashboardFilter): HttpParams {
    let params = new HttpParams();
    if (filter) {
      if (filter.startDate) {
        params = params.set('startDate', filter.startDate.toString());
      }
      if (filter.endDate) {
        params = params.set('endDate', filter.endDate.toString());
      }
      if (filter.systemId) {
        params = params.set('systemId', filter.systemId.toString());
      }
    }
    return params;
  }
}
