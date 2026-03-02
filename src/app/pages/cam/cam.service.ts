import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response';

@Injectable({
  providedIn: 'root',
})
export class CamService {
  constructor(private http: HttpClient) {}

  // ─── User Exceptions ─────────────────────────────

  getUserException(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('userexception/list');
  }

  saveUserException(payload: { userId: string; sapId: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('userexception/save', payload);
  }

  deleteUserException(ids: number[]): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`userexception/delete?ids=${ids}`);
  }

  // ─── Approval Delegation ─────────────────────────

  getDelegates(params: {
    pageIndex: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: number;
    filters?: any;
  }): Observable<ApiResponse> {
    const first = (params.pageIndex - 1) * params.pageSize;
    const sortField = params.sortField || '';
    const sortOrder = params.sortOrder ?? 1;
    const filters = encodeURIComponent(JSON.stringify(params.filters || {}));
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.get<ApiResponse>(
      `delegate/get?first=${first}&rows=${params.pageSize}&sortField=${sortField}&sortOrder=${sortOrder}&filters=${filters}&timeZone=${tz}`
    );
  }

  getDelegateInfo(params: { edit?: boolean; id?: number; admin?: boolean }): Observable<ApiResponse> {
    const parts: string[] = [];
    if (params.admin) parts.push('admin=true');
    if (params.edit) parts.push('edit=true');
    if (params.id != null) parts.push(`id=${params.id}`);
    const query = parts.length ? '?' + parts.join('&') : '';
    return this.http.get<ApiResponse>(`delegate/requiredInfo${query}`);
  }

  saveDelegate(payload: any): Observable<ApiResponse> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.post<ApiResponse>(`delegate/saveDelegate?timeZone=${tz}`, payload);
  }

  // ─── CAM Parameters ──────────────────────────────

  getCamParams(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('camParams/getParams');
  }

  getCamParamsInfo(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('camParams/info');
  }

  saveCamParams(payload: any[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('camParams/saveParams', payload);
  }

  getCamParamsDefault(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('camParams/getDefaultParams');
  }

  // ─── User Provision Fields ────────────────────────

  getAllProvisionUserFields(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('provisionUserField/getAllFields');
  }

  getProvisionUserField(fieldId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`provisionUserField/getValues?fieldId=${fieldId}`);
  }

  getProvisionUserRequiredInfo(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('provisionUserField/requiredInfo');
  }

  provisionUserFieldAddEdit(payload: any, action: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`provisionUserField/operations?oper=${action}`, payload);
  }

  provisionUserFieldDelete(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`provisionUserField/operations?oper=del&id=${id}`, {});
  }

  provisionUserFieldSaveValues(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('provisionUserField/saveUserFields', payload);
  }

  // ─── SAP Systems ──────────────────────────────────

  getSapSystems(): Observable<any> {
    return this.http.get<any>('sys/list');
  }

  getPasswordRule(sapName: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sys/rule?sapName=${sapName}`);
  }

  savePasswordRule(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('sys/saverule', payload);
  }

  getSystemOrder(sapName: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sys/order?sapName=${sapName}`);
  }

  saveSystemOrder(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('sys/saveSysOrder', payload);
  }

  getRiskVariant(sapName: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`sys/favRisk?sapName=${sapName}`);
  }

  saveRiskVariant(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('sys/saveFavRisks', payload);
  }

  // ─── ARC (User Access Review) ───────────────────

  getArcReviewRequiredInfo(): Observable<any> {
    return this.http.get('arc/task/requiredInfo');
  }

  getArcReview(params: { pageIndex: number; pageSize: number; sortField?: string; sortOrder?: number; filters?: any; globalFilter?: string }, signOff: boolean): Observable<ApiResponse> {
    const first = (params.pageIndex - 1) * params.pageSize;
    const sortField = params.sortField || '';
    const sortOrder = params.sortOrder ?? 1;
    const filters = encodeURIComponent(JSON.stringify(params.filters || {}));
    return this.http.get<ApiResponse>(
      `arc/task/batch?first=${first}&rows=${params.pageSize}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${filters}&signOff=${signOff}`
    );
  }

  getArcUsersListRequiredInfo(taskId: string): Observable<any> {
    return this.http.get(`arc/task/usersPage?taskId=${taskId}`);
  }

  getArcUserList(params: { pageIndex: number; pageSize: number; sortField?: string; sortOrder?: number; filters?: any }, taskId: string, signOff: boolean): Observable<ApiResponse> {
    const first = (params.pageIndex - 1) * params.pageSize;
    const sortField = params.sortField || '';
    const sortOrder = params.sortOrder ?? 1;
    const filters = encodeURIComponent(JSON.stringify(params.filters || {}));
    return this.http.get<ApiResponse>(
      `arc/task/users?first=${first}&rows=${params.pageSize}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${filters}&taskId=${taskId}&signOff=${signOff}`
    );
  }

  getArcRoles(params: { pageIndex: number; pageSize: number; sortField?: string; sortOrder?: number; filters?: any }, id: string): Observable<ApiResponse> {
    const first = (params.pageIndex - 1) * params.pageSize;
    const sortField = params.sortField || '';
    const sortOrder = params.sortOrder ?? 1;
    const filters = encodeURIComponent(JSON.stringify(params.filters || {}));
    return this.http.get<ApiResponse>(
      `arc/task/roles?first=${first}&rows=${params.pageSize}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${filters}&id=${id}`
    );
  }

  getArcTransactions(params: { pageIndex: number; pageSize: number; sortField?: string; sortOrder?: number; filters?: any }, id: string): Observable<ApiResponse> {
    const first = (params.pageIndex - 1) * params.pageSize;
    const sortField = params.sortField || '';
    const sortOrder = params.sortOrder ?? 1;
    const filters = encodeURIComponent(JSON.stringify(params.filters || {}));
    return this.http.get<ApiResponse>(
      `arc/task/trans?first=${first}&rows=${params.pageSize}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${filters}&id=${id}`
    );
  }

  getArcRiskViolations(params: { pageIndex: number; pageSize: number; sortField?: string; sortOrder?: number; filters?: any }, id: string): Observable<ApiResponse> {
    const first = (params.pageIndex - 1) * params.pageSize;
    const sortField = params.sortField || '';
    const sortOrder = params.sortOrder ?? 1;
    const filters = encodeURIComponent(JSON.stringify(params.filters || {}));
    return this.http.get<ApiResponse>(
      `arc/task/getRisks?first=${first}&rows=${params.pageSize}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${filters}&id=${id}`
    );
  }

  getArcAttachments(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`arc/task/attach?id=${id}`);
  }

  getArcComments(id: string): Observable<any> {
    return this.http.get(`arc/task/getComments?id=${id}`);
  }

  changeTaskStatus(status: number, ids: string): Observable<any> {
    return this.http.get(`arc/task/changeStatus?status=${status}&ids=${ids}`);
  }

  signOffTask(taskId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`arc/task/signoff?taskId=${taskId}`);
  }

  signOffTaskWithDocument(taskId: string, payload: FormData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`arc/task/signoffUpload?taskId=${taskId}`, payload);
  }

  uploadTaskAttachment(payload: FormData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('arc/task/upload', payload);
  }

  deleteTaskAttachment(attachmentId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`arc/task/del_attach?id=${attachmentId}`);
  }

  downloadArcAttachment(attachmentId: number): Observable<any> {
    return this.http.get(`arc/task/download_attach?id=${attachmentId}`, { observe: 'response', responseType: 'blob' });
  }

  saveTaskComments(payload: { id: string; comemnts: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`arc/task/saveComments?id=${payload.id}&comments=${payload.comemnts}`, payload);
  }

  downloadArcGuide(attachmentId: number): Observable<any> {
    return this.http.get(`arc/task/download_guild?resourceId=${attachmentId}`, { observe: 'response', responseType: 'blob' });
  }

  getExportArcReviewUsers(taskId: string): Observable<any> {
    return this.http.get(`arc/downloadReviewUsers?taskId=${taskId}`, { observe: 'response', responseType: 'blob' });
  }

  getUserBatch(taskId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`arc/task/reviewUsersForDashboard?taskId=${taskId}`);
  }

  // ─── ARC Jobs (Job Schedule) ──────────────────

  getArcJob(params: { pageIndex: number; pageSize: number; sortField?: string; sortOrder?: number; filters?: any }): Observable<ApiResponse> {
    const first = (params.pageIndex - 1) * params.pageSize;
    const sortField = params.sortField || '';
    const sortOrder = params.sortOrder ?? 1;
    const filters = encodeURIComponent(JSON.stringify(params.filters || {}));
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.get<ApiResponse>(
      `arc/job/get?first=${first}&rows=${params.pageSize}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${filters}&timeZone=${tz}`
    );
  }

  abortTasks(id: number, abortTasks: boolean): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`arc/job/delete?id=${id}&abortTasks=${abortTasks}`, {});
  }

  getJobInfo(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('arc/job/toAdd');
  }

  addArc(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('arc/job/add', payload);
  }

  getJobConfig(jobId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`arc/job/toConfig?jobId=${jobId}`);
  }

  uploadArcAttachment(file: File, entityType: string, entityId: number): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId.toString());
    return this.http.post<ApiResponse>('attachments/upload', formData);
  }

  // ─── Admin Request Operations ──────────────────

  findAdUser(params: { first: number; rows: number; sortField: string; sortOrder: number; filters: any }): Observable<ApiResponse> {
    const filters = encodeURIComponent(JSON.stringify(params.filters || {}));
    return this.http.get<ApiResponse>(
      `adUser/findUsers?first=${params.first}&rows=${params.rows}&sortField=${params.sortField}&sortOrder=${params.sortOrder}&filters=${filters}`
    );
  }

  sapSearch(userId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`s/sapSearch?userId=${userId}&&bb=false`);
  }

  checkSapUserExistence(userId: string, systemId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`util/checkSapUserExistence?userId=${userId}&systemId=${systemId}`);
  }

  getRequiredInfo(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('s/requiredInfo');
  }

  getChangeRequiredInfo(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('s_e/requiredInfo');
  }

  searchRequiredInfo(sapIds: string[], userId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`s/search?saps=${sapIds}&userId=${userId}`);
  }

  changeSearchRequiredInfo(sapIds: string[], userId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`s_e/search?saps=${sapIds}&userId=${userId}`);
  }

  getUserAssignedRoles(userId: string, systemId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`s_e/getUserAssignedRoles?userId=${userId}&systemId=${systemId}`);
  }

  getRoleCatForReq(sapId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`s/roleCatForReq?sapId=${sapId}`);
  }

  getRoleCatalogueAllRoles(rcId: number | string): Observable<ApiResponse> {
    if (rcId == null) return of({ success: true, data: [] } as ApiResponse);
    return this.http.get<ApiResponse>(`roleCatalogue/getRCAllRoles?rcId=${rcId}`);
  }

  getAvailableGroups(payload: { sapIds: string[]; selectedGroups: any[] }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('s/getGroups', payload);
  }

  startSimulations(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('simulations/camUserSimulation', payload);
  }

  submitReq(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('s/add', payload);
  }

  submitChangeReq(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('s_e/changeUser', payload);
  }

  // ─── Lock / Unlock / Reset Password / Delete ───

  getLockUnlockRequiredInfo(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('s_l/requiredInfo');
  }

  getResetPwdRequiredInfo(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('s_pwd/requiredInfo');
  }

  getDeleteRequiredInfo(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('s_d/requiredInfo');
  }

  searchLockUnlock(sapIds: any, userId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`s_l/search?saps=${sapIds}&userId=${userId}`);
  }

  searchResetPwd(sapIds: any, userId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`s_pwd/search?saps=${sapIds}&userId=${userId}`);
  }

  searchDelete(sapIds: any, userId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`s_d/search?saps=${sapIds}&userId=${userId}`);
  }

  lockUnlockUser(userId: string, sapId: any, lock: boolean, nodeTypeId: string): Observable<ApiResponse> {
    const { protocol, hostname, port } = window.location;
    return this.http.get<ApiResponse>(
      `s_l/lock?saps=${sapId}&userId=${userId}&nodeTypeId=${nodeTypeId}&lock=${lock}&protocol=${protocol}&host=${hostname}&port=${port}`
    );
  }

  resetUserPassword(userId: string, sapId: any, nodeTypeId: string): Observable<ApiResponse> {
    const { protocol, hostname, port } = window.location;
    return this.http.get<ApiResponse>(
      `s_pwd/reset?saps=${sapId}&userId=${userId}&nodeTypeId=${nodeTypeId}&protocol=${protocol}&host=${hostname}&port=${port}`
    );
  }

  deleteUser(userId: string, sapId: any, nodeTypeId: string): Observable<ApiResponse> {
    const { protocol, hostname, port } = window.location;
    return this.http.get<ApiResponse>(
      `s_d/delete?saps=${sapId}&userId=${userId}&nodeTypeId=${nodeTypeId}&protocol=${protocol}&host=${hostname}&port=${port}`
    );
  }
}
