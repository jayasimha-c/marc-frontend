import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  constructor(private http: HttpClient) {}

  // ─── Workflow Management ─────────────────────────

  getWorkflowList(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('wf/list');
  }

  addWorkflow(name: string, type: string, changeRoles: boolean, selfApprove: boolean, id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `wf/save?name=${encodeURIComponent(name)}&taskType=${type}&changeRoles=${changeRoles}&mustCheckRisk=false&selfApprove=${selfApprove}&id=${id}`, {}
    );
  }

  deleteWorkflow(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`wf/delete?id=${id}`);
  }

  statusWorkflow(id: number, active: boolean): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`wf/status?id=${id}&cancel=${active}`);
  }

  // ─── Workflow Nodes (assigned to workflow) ───────

  getWorkflowNodeList(wfId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`wfn/list?wfId=${wfId}`);
  }

  addWorkflowNode(wfId: number, nodeTypeId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`wfn/save?wfId=${wfId}&nodeTypeId=${nodeTypeId}`, {});
  }

  deleteWorkflowNode(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`wfn/delete?id=${id}`);
  }

  switchNodeOrder(id1: number, id2: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`wfn/switch_order?id1=${id1}&id2=${id2}`, {});
  }

  // ─── Node Types ──────────────────────────────────

  getNodeList(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('nodetype/list');
  }

  addNodeType(data: {
    id?: number; name: string; commentsRequired: boolean; mustCheckRisk: boolean;
    approveIfRiskPresent: boolean; enableRiskDetour: boolean; riskDetourNode: boolean; detourNodeId?: number;
  }): Observable<ApiResponse> {
    const p = new URLSearchParams();
    if (data.id) p.set('id', String(data.id));
    p.set('name', data.name);
    p.set('commentsRequired', String(data.commentsRequired));
    p.set('mustCheckRisk', String(data.mustCheckRisk));
    p.set('approveIfRiskPresent', String(data.approveIfRiskPresent));
    p.set('enableRiskDetour', String(data.enableRiskDetour));
    p.set('riskDetourNode', String(data.riskDetourNode));
    if (data.detourNodeId) p.set('detourNodeId', String(data.detourNodeId));
    return this.http.post<ApiResponse>(`nodetype/save?${p.toString()}`, {});
  }

  deleteNodeType(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`nodetype/delete?id=${id}`);
  }

  getNodeListData(nodeTypeId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`nodetype/listdata?ntId=${nodeTypeId}`);
  }

  addNodeTypeData(ntId: number, name: string, description: string, userIds: string, id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `nodetype/savedata?ntId=${ntId}&name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}&userId=${userIds}&id=${id}`, {}
    );
  }

  deleteNodeTypeData(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`nodetype/deletedata?id=${id}`);
  }

  getNodeTypeUsers(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`nodetype/users?id=${id}`);
  }

  // ─── Requests ────────────────────────────────────

  private buildPaginationParams(params: any, filters?: any): string {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const first = ((params.pageIndex || 1) - 1) * (params.pageSize || 10);
    const rows = params.pageSize || 10;
    const sortField = params.sort?.field || '';
    const sortOrder = params.sort?.direction === 'descend' ? -1 : 1;
    const filtersStr = encodeURIComponent(JSON.stringify(filters || {}));
    return `first=${first}&rows=${rows}&sortField=${sortField}&sortOrder=${sortOrder}&filters=${filtersStr}&timeZone=${tz}`;
  }

  private buildSearchParams(search: any): string {
    const parts: string[] = [];
    if (search.id) parts.push(`id=${encodeURIComponent(search.id)}`);
    if (search.requestType) parts.push(`requestType=${encodeURIComponent(search.requestType)}`);
    if (search.requesterName) parts.push(`requester=${encodeURIComponent(search.requesterName)}`);
    if (search.requestDate) parts.push(`requestDate=${encodeURIComponent(search.requestDate)}`);
    if (search.cancelDate) parts.push(`cancelDate=${encodeURIComponent(search.cancelDate)}`);
    if (search.cancellerName) parts.push(`cancellerName=${encodeURIComponent(search.cancellerName)}`);
    if (search.status) parts.push(`status=${encodeURIComponent(search.status)}`);
    if (search.batch) parts.push(`batch=${encodeURIComponent(search.batch)}`);
    if (search.userId) parts.push(`userId=${encodeURIComponent(search.userId)}`);
    if (search.approver) parts.push(`approver=${encodeURIComponent(search.approver)}`);
    return parts.join('&');
  }

  getMyRequests(params: any, search: any = {}): Observable<ApiResponse> {
    const pagination = this.buildPaginationParams(params);
    const searchStr = this.buildSearchParams(search);
    return this.http.get<ApiResponse>(`job/requests?${pagination}${searchStr ? '&' + searchStr : ''}`);
  }

  getAllRequests(params: any, search: any = {}): Observable<ApiResponse> {
    const pagination = this.buildPaginationParams(params);
    const searchStr = this.buildSearchParams(search);
    return this.http.get<ApiResponse>(`job/all_requests?${pagination}${searchStr ? '&' + searchStr : ''}`);
  }

  exportMyRequests(search: any = {}): Observable<any> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const searchStr = this.buildSearchParams(search);
    return this.http.get(`job/requests/export?timeZone=${tz}${searchStr ? '&' + searchStr : ''}`, { observe: 'response', responseType: 'blob' });
  }

  exportAllRequests(search: any = {}): Observable<any> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const searchStr = this.buildSearchParams(search);
    return this.http.get(`job/all_requests/export?timeZone=${tz}${searchStr ? '&' + searchStr : ''}`, { observe: 'response', responseType: 'blob' });
  }

  cancelRequest(jobId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`job/cancel?jobId=${jobId}`);
  }

  // ─── Approvals ───────────────────────────────────

  getApprovals(params: any): Observable<ApiResponse> {
    const pagination = this.buildPaginationParams(params);
    return this.http.get<ApiResponse>(`job/approvals?${pagination}`);
  }

  checkNodeLevelComment(approvalId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`job/checkNodeLevelComment?approvalId=${approvalId}`);
  }

  approveReject(approvalId: number, approve: boolean): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`job/approve?approvalId=${approvalId}&approval=${approve}`);
  }

  approveRejectWithComment(payload: { approvalId: number; approval: boolean; camComment: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('job/approveWithComments', payload);
  }

  // ─── Request Details ─────────────────────────────

  viewRequest(jobId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`job/details?id=${jobId}`);
  }

  getRequestApprovals(jobId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`job/request_approvals?jobId=${jobId}`);
  }

  getComments(jobId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`job/getComments?id=${jobId}`);
  }

  saveComment(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('job/saveComment', payload);
  }

  getAssignedRoles(jobId: number, detailId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`job/assignedRoles?jobId=${jobId}&detailId=${detailId}`);
  }

  getAssignedGroups(jobId: number, detailId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`job/assignedGroups?jobId=${jobId}&detailId=${detailId}`);
  }

  getRequestLogs(jobId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`job/reqLogs?id=${jobId}`);
  }

  sendEmail(approvalId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`job/sendEmail?approvalId=${approvalId}`);
  }

  // ─── Roles ───────────────────────────────────────

  getRolesDetails(detailId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`job/roles?detail_id=${detailId}`);
  }

  approveRole(payload: { sapDestination: string; approvalId: number; roleStatusList: any[] }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('job/approveRole', payload);
  }

  startMultiUserSimulation(params: any, payload: any): Observable<ApiResponse> {
    const qs = new URLSearchParams(params).toString();
    return this.http.post<ApiResponse>(`simulations/multiUserSimulation?${qs}`, payload);
  }

  getRoleOwners(roleName: string, sysName: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`roleCatalogue/getRoleOwners?roleName=${encodeURIComponent(roleName)}&sysName=${encodeURIComponent(sysName)}`);
  }

  getSodJobInfo(jobId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`analysis/jobInfo?jobId=${jobId}`);
  }

  // ─── Audit Logs ──────────────────────────────────

  getWorkflowAuditLogs(params: any): Observable<ApiResponse> {
    const pagination = this.buildPaginationParams(params);
    return this.http.get<ApiResponse>(`wfLog/getAuditLog?${pagination}`);
  }

  getWorkflowLogDetails(logId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`wfLog/getLogDetails?logId=${logId}`);
  }

  getNodeAuditLogs(params: any): Observable<ApiResponse> {
    const pagination = this.buildPaginationParams(params);
    return this.http.get<ApiResponse>(`nodeLog/getAuditLog?${pagination}`);
  }

  getNodeLogDetails(logId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`nodeLog/getLogDetails?logId=${logId}`);
  }

  getDelegationAuditLogs(params: any): Observable<ApiResponse> {
    const pagination = this.buildPaginationParams(params);
    return this.http.get<ApiResponse>(`delegate/getAuditLog?${pagination}`);
  }

  getDelegationLogDetails(logId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`delegate/getLogDetails?logId=${logId}`);
  }

  // ─── File Downloads ──────────────────────────────

  downloadAttachment(attachmentId: number): Observable<any> {
    return this.http.get(`download?resourceId=${attachmentId}`, { observe: 'response', responseType: 'blob' });
  }
}
