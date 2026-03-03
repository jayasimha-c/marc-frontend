import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class RiskAnalysisOnlineService {
  preSelectedData: Subject<any> = new Subject();

  constructor(private http: HttpClient, private nzModal: NzModalService) {}

  // -- PreSelection --

  loadSelection(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('adhocAnalysis/adhocSelection');
  }

  findFavorites(sapSystemId: any, analysisType: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`analysis/findFavourites?sapSystemId=${sapSystemId}&risk=${analysisType}`);
  }

  savePreselection(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('adhocAnalysis/savePreSelection', data);
  }

  // -- Users --

  findUsers(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('adhocAnalysis/findUsers', data);
  }

  findAllUsers(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('adhocAnalysis/selectAllUsers', data);
  }

  userSelectedList(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('adhocAnalysis/selectedUserDetails', data);
  }

  // -- Roles --

  findRoles(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('adhocAnalysis/rolesResults', data);
  }

  findAllRoles(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('adhocAnalysis/selectAllRoles', data);
  }

  roleSelectedList(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('adhocAnalysis/currentlySelectedRoles', data);
  }

  selectRoles(ids: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`adhocAnalysis/selectRoles/?roleIds=${ids}`);
  }

  roleDetail(data: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('adhocAnalysis/roleDetails', { params: new HttpParams({ fromObject: { ...data } }) });
  }

  // -- Rules --

  findRules(favoriteIdStr: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`adhocAnalysis/favRules?favoriteIdStr=${favoriteIdStr ? favoriteIdStr : -1}`);
  }

  findAllRules(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('adhocAnalysis/selectFavAllRules', data);
  }

  // -- Risks --

  findRisks(favoriteIdStr: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`adhocAnalysis/favRisks?favoriteIdStr=${favoriteIdStr ? favoriteIdStr : -1}`);
  }

  findAllRisks(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('adhocAnalysis/selectFavAllRisks', data);
  }

  // -- Analysis Execution --

  startAnalysis(background: boolean, data: any): Observable<ApiResponse> {
    const url = background ? `adhocAnalysis/startAnalysis?background=${background}` : 'adhocAnalysis/startAnalysis';
    return this.http.post<ApiResponse>(url, data);
  }

  getViolationResults(jobId: string, event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `analysis/violationResults?jobId=${jobId}&first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || null))}`
    );
  }

  getResultSummary(jobId: string, event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `analysis/resultSummary?jobId=${jobId}&first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || null))}`
    );
  }

  getDetailedResult(jobId: string, event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `adhocAnalysis/results?jobId=${jobId}&first=${event.first}&rows=${10000}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || null))}`
    );
  }

  // -- Exports --

  getExportDetailResults(jobId: any): Observable<any> {
    return this.http.get(`simulations/exportSimulationDetailResults?jobId=${jobId}`, { observe: 'response', responseType: 'blob' });
  }

  getExportSummaryResults(jobId: any): Observable<any> {
    return this.http.get(`simulations/exportRuleSummary?jobId=${jobId}`, { observe: 'response', responseType: 'blob' });
  }

  getExportRuleSummaryResults(jobId: any): Observable<any> {
    return this.http.get(`analysis/exportRuleResults?jobId=${jobId}`, { observe: 'response', responseType: 'blob' });
  }

  getExportRiskSummaryResults(jobId: any): Observable<any> {
    return this.http.get(`analysis/exportRiskResults?jobId=${jobId}`, { observe: 'response', responseType: 'blob' });
  }

  // -- Org Checks + Mitigation --

  loadOrgSelection(jobId: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`simulations/loadOrgSelection?jobId=${jobId}&mode=analysis`);
  }

  startOrgChecks(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('analysis/startOrgChecks', payload);
  }

  getSapSystemNameForAssignMitigation(jobId: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`analysis/showAdhocAssignMitigation?jobId=${jobId}`);
  }

  // -- Simulation Endpoints (needed by shared sub-components) --

  simulationsUserSelectedList(data: any, simulationType: string): Observable<ApiResponse> {
    if (simulationType === 'offline') {
      return this.http.post<ApiResponse>('simulations/offline/selectedUserDetails', data).pipe(
        map((resp) => {
          if (resp.data?.rows) this.parseOfflineUsersResponse(resp.data.rows);
          return resp;
        })
      );
    }
    return this.http.post<ApiResponse>('simulations/selectedUserDetails', data);
  }

  simulationsFindUsers(data: any, simulationType: string): Observable<ApiResponse> {
    if (simulationType === 'offline') {
      return this.http.post<ApiResponse>('simulations/offline/findUsers', data).pipe(
        map((resp) => {
          if (resp.data?.gridData?.rows) this.parseOfflineUsersResponse(resp.data.gridData.rows);
          return resp;
        })
      );
    }
    return this.http.post<ApiResponse>('simulations/findUsers', data);
  }

  simulationsFindAllUsers(data: any, simulationType: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`simulations${simulationType === 'offline' ? '/offline' : ''}/addAllUsers`, data);
  }

  getSimulationAddUsers(data: any, simulationType: string): Observable<ApiResponse> {
    if (simulationType === 'offline') {
      return this.http.post<ApiResponse>('simulations/offline/addUsers', data).pipe(
        map((resp) => {
          if (resp.data?.userRoles) {
            resp.data.userRoles.forEach((elm: any) => { elm.roleName = elm.name; elm.roleDesc = elm.roleDescStr; });
            resp.data.sapuserRoles = resp.data.userRoles;
          }
          return resp;
        })
      );
    }
    return this.http.post<ApiResponse>('simulations/addUsers', data);
  }

  simulationsAdditionalRoles(data: any, simulationType: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`simulations${simulationType === 'offline' ? '/offline' : ''}/additionalRoles`, data);
  }

  simulationsGetRolesListForSelection(data: any, simulationType: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`simulations${simulationType === 'offline' ? '/offline' : ''}/rolesResults`, data);
  }

  simulationsFindAllRoles(data: any, simulationType: string): Observable<ApiResponse> {
    if (simulationType === 'offline') {
      return this.http.post<ApiResponse>('simulations/offline/selectAllRoles', data);
    }
    return this.http.post<ApiResponse>('simulations/selectAllSimRoles', data);
  }

  simulationsLoadSelection(simulationType: string): Observable<ApiResponse> {
    const prefix = simulationType === 'offline' ? 'simulations/offline' : 'simulations';
    return this.http.get<ApiResponse>(`${prefix}/loadSelection`);
  }

  saveSimulationsPreSelection(data: any, simulationType: string): Observable<ApiResponse> {
    const prefix = simulationType === 'offline' ? 'simulations/offline' : 'simulations';
    return this.http.post<ApiResponse>(`${prefix}/preSelection`, data);
  }

  startSimulationAnalysis(data: any, simulationType: string): Observable<ApiResponse> {
    const prefix = simulationType === 'offline' ? 'simulations/offline' : 'simulations';
    return this.http.post<ApiResponse>(`${prefix}/startSimulation`, data);
  }

  getSimulationResultSummary(jobId: string, event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `analysis/simulationResultSummary?jobId=${jobId}&first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || null))}`
    );
  }

  getSimulationDetailedResult(jobId: string, event: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `analysis/simulationRiskViolaitonGrid?jobId=${jobId}&first=${event.first}&rows=${10000}&sortOrder=${event.sortOrder}&sortField=${event.sortField || ''}&filters=${encodeURI(JSON.stringify(event.filters || null))}`
    );
  }

  getExportSimulationSummaryResults(jobId: any): Observable<any> {
    return this.http.get(`simulations/exportSimulationRuleSummary?jobId=${jobId}`, { observe: 'response', responseType: 'blob' });
  }

  exportSimulationPdf(jobId: any): Observable<any> {
    return this.http.get(`pdf/exportSimulationSummary?jobId=${jobId}`, { observe: 'response', responseType: 'blob' });
  }

  // -- Cross-system --

  findCrossSystemUsers(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('adhocAnalysis/findCrossSystemUsers', payload);
  }

  getCrossSystemRiskList(payload: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('adhocAnalysis/risksCS');
  }

  // -- SF Analysis --

  sfAnalysisSelectedUsers(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('sfAnalysis/selectedUsers', data);
  }

  getSfSelectUserFrom(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('sfAnalysis/findUsers', payload);
  }

  getSfSelectedRules(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('sfAnalysis/selectedRules', payload);
  }

  getSfSelectedRisks(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('sfAnalysis/selectedRisks', payload);
  }

  // -- Utility --

  ruleDetail(data: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('rules/ruleDetails', { params: new HttpParams({ fromObject: { ...data } }) });
  }

  riskDetail(data: any): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('risks/riskDetailsByName', { params: new HttpParams({ fromObject: { ...data } }) });
  }

  onlineSystems(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('util/getSystemsOnline');
  }

  // -- Export / Batch Report --

  getExportViolations(jobId: any): Observable<any> {
    return this.http.get(`analysis/exportViolations?jobId=${jobId}`, { observe: 'response', responseType: 'blob' });
  }

  generateBatchRuleSummary(jobId: any): Observable<any> {
    return this.http.get(`batch/generateRuleSummaryReport?jobId=${jobId}`);
  }

  generateBatchRuleDetail(jobId: any): Observable<any> {
    return this.http.get(`batch/generateRuleDetailReport?jobId=${jobId}`);
  }

  generateBatchRiskSummary(jobId: any): Observable<any> {
    return this.http.get(`batch/generateSummaryReport?jobId=${jobId}`);
  }

  generateBatchRiskDetail(jobId: any): Observable<any> {
    return this.http.get(`batch/generateDetailReport?jobId=${jobId}`);
  }

  getExportRoleSODMatrix(jobId: any): Observable<any> {
    return this.http.get(`roleMatrix/generateMatrixReport?jobId=${jobId}`, { observe: 'response', responseType: 'blob' });
  }

  private parseOfflineUsersResponse(rows: any[]): void {
    rows.forEach((row) => {
      row.bname = row.userName.bname;
      row.userNameVO = row.userName;
      row.userName = row.userNameVO.userText;
    });
  }

  openRunBackgroundAlert(message?: string, redirect?: string): void {
    // Lazy import to avoid circular dependency
    import('./online/alert-background-modal.component').then((m) => {
      this.nzModal.create({
        nzTitle: 'Analysis Status',
        nzContent: m.AlertBackgroundModalComponent,
        nzWidth: '400px',
        nzFooter: null,
        nzData: { message, redirect },
      });
    });
  }
}
