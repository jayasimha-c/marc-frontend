import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class SetupService {
    constructor(private http: HttpClient) { }

    // ─── Review Rules ───────────────────────────────────────────────
    getReviewRule(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('pamreviewrule/get');
    }

    saveReviewRule(payload: any[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('pamreviewrule/save', payload);
    }

    deleteReviewRule(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`pamreviewrule/delete?id=${id}`);
    }

    // ─── PAM Reasons ────────────────────────────────────────────────
    getPamReason(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('pamreason/get');
    }

    savePamReason(payload: any[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('pamreason/save', payload);
    }

    deletePamReason(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`pamreason/delete?id=${id}`);
    }

    // ─── Privileges ─────────────────────────────────────────────────
    getPrivilegeList(payload: any): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(
            `priv/list?first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField || ''}&sortOrder=${payload.sortOrder || 1}&filters=${encodeURI(JSON.stringify(payload.filters || {}))}`
        );
    }

    getPrivilegeStatistics(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('priv/statistics');
    }

    addPrivilege(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('priv/new', payload);
    }

    updatePrivilege(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('priv/update', payload);
    }

    deletePrivilege(id: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`priv/delete?id=${id}`);
    }

    privilegeSwitchStatus(id: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`priv/switchStatus?id=${id}`);
    }

    getPrivilegeSetting(id: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`priv/get_settings?id=${id}`);
    }

    savePrivilegeSetting(privilegeId: string, payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`priv/save_settings?privilegeId=${privilegeId}`, payload);
    }

    saveFullPrivilege(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('priv/saveFullPriv', payload);
    }

    // ─── SAP System Mapping ─────────────────────────────────────────
    getSapMapping(privId?: string): Observable<ApiResponse> {
        const url = privId ? `mapping/list?privId=${privId}` : 'mapping/list';
        return this.http.get<ApiResponse>(url);
    }

    saveMapping(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('mapping/save', payload);
    }

    deleteMapping(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`mapping/delete?id=${id}`);
    }

    mappingSwitchStatus(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`mapping/switchStatus?id=${id}`);
    }

    // ─── Privilege Users (Reviewers / Approvers / Requesters) ───────
    getPrivilegeUsers(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('manager/list', payload);
    }

    getAllUsers(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('manager/getAllUsers');
    }

    savePrivilegeUsers(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('manager/save', payload);
    }

    saveAllUserTypes(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('manager/saveAllTypes', payload);
    }

    deletePrivilegeUser(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('manager/delete', payload);
    }

    privilegeUserSwitchStatus(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('manager/switchStatus', payload);
    }

    // ─── Privilege History ──────────────────────────────────────────
    getPrivilegeHistory(privilegeId: string, timeZone: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`privLog/getPrivilegeHistory?privilegeId=${privilegeId}&timeZone=${timeZone}`);
    }

    getPrivilegeLogDetails(logId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`privLog/getLogDetails?logId=${logId}`);
    }

    // ─── Schedulers & Jobs ──────────────────────────────────────────
    getScheduleJobs(payload: any): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(
            `priv_schedule/jobs?first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField || ''}&sortOrder=${payload.sortOrder || 1}&filters=${encodeURI(JSON.stringify(payload.filters || {}))}`
        );
    }

    getScheduleLogs(payload: any, sapId: any, jobId: any): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(
            `priv_schedule/logs?first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField || ''}&sortOrder=${payload.sortOrder || 1}&filters=${encodeURI(JSON.stringify(payload.filters || {}))}&sapId=${sapId}&jobId=${jobId}`
        );
    }

    privScheduleStartJob(id: any): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`priv_schedule/startJob?sapId=${id}`);
    }

    getPrivSchedule(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('priv_schedule/list');
    }

    savePriv_schedule(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('priv_schedule/save', payload);
    }

    deletePrivSchedule(id: any): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`priv_schedule/delete?id=${id}`);
    }
}
