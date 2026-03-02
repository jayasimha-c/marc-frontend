import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../../core/models/api-response";

@Injectable({ providedIn: 'root' })
export class CentralUsersService {

    constructor(private http: HttpClient) { }

    // ==================== Central User DB ====================

    getCentralUsers(request: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('centralUser/search', request);
    }

    getCentralUserRoles(userId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`centralUser/getRoles?userId=${userId}`);
    }

    getCentralUserTransactions(userId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`centralUser/getTransactions?userId=${userId}`);
    }

    getCentralUserRisks(userId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`centralUser/getRisks?userId=${userId}`);
    }

    getCentralUserRules(userId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`centralUser/getTaskExe?userId=${userId}`);
    }

    getCentralUserProvisioning(userId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`centralUser/getCamRequests?userId=${userId}`);
    }

    getCentralUserSODControls(userId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`centralUser/getSODControls?userId=${userId}`);
    }

    getStdMetadata(icmControlId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`icm/rs/std_meta2?icmControlId=${icmControlId}`);
    }

    getICMStdSODDetails(userId: number, icmControlId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`icm/rs/std_data_full2?userId=${userId}&icmControlId=${icmControlId}`);
    }

    executeOperation(ids: string, action: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`centralUser/operation?ids=${ids}&user_action=${action}`);
    }

    getUserDetails(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`centralUser/userDetails?id=${id}`);
    }

    getUserMetrics(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('centralUser/report');
    }

    userRoleCompare(selectedUsers: any[]): Observable<ApiResponse> {
        const ids = selectedUsers.map(user => user.id);
        return this.http.get<ApiResponse>(`centralUser/rc/usrRoleCompare?selectedUsers=${ids}`);
    }

    getCentralUserDashboard(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('centralUser/dashboard');
    }

    getCentralUserInfoDashboard(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('centralUser/getUserInfo');
    }

    // ==================== Central User Pivot ====================

    getVariantNames(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('centralUser/pivote');
    }

    getVariantData(dataSet: any): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`centralUser/pivoteData?dataSet=${dataSet}`);
    }

    // ==================== Lock Parameters / Inactive Users ====================

    getRequiredInfo(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('cuLock/requiredInfo');
    }

    getLockParams(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('cuLock/getLockParams');
    }

    saveLockParams(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('cuLock/saveLockParams', payload);
    }

    getCULockJobs(request: any): Observable<ApiResponse> {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return this.http.post<ApiResponse>(`cuLock/getJobs?timeZone=${tz}`, request);
    }

    checkOtherJobRunning(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('cuLock/checkOtherJobRunning');
    }

    runSimulation(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('cuLock/runSimulation');
    }

    deleteCUJobs(jobId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`cuLock/deleteJobs?jobId=${jobId}`);
    }

    getInactiveUserData(request: any, jobId: number): Observable<ApiResponse> {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return this.http.post<ApiResponse>(`cuLock/getInactiveUserData?timeZone=${tz}&jobId=${jobId}`, request);
    }

    // ==================== System License Info ====================

    getSysLicenseInfo(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sysLicenseInfo/get');
    }

    saveSysLicenseInfo(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('sysLicenseInfo/save', payload);
    }

    getLicenseRules(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sysLicenseInfo/getLicenseRules');
    }

    saveLicenseRules(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('sysLicenseInfo/saveLicenseRules', payload);
    }

    getLicenseMgmtRules(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sysLicenseInfo/licenseMgmtRules');
    }

    // ==================== License Indirect Usage ====================

    getLicIndirectUsage(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sysLicenseInfo/getLicIndirectUsage');
    }

    getIndirectUsageUsers(usageId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`sysLicenseInfo/getIndirectUsageUsers?usageId=${usageId}`);
    }

    saveIndirectUsageUsers(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('sysLicenseInfo/saveIndirectUsageUsers', payload);
    }

    deleteIndirectUsage(usageId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`sysLicenseInfo/deleteIndirectUsage?usageIds=${usageId}`);
    }

    getIndirectUsageInfo(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sysLicenseInfo/addIndirectUsage');
    }

    addIndirectSave(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('sysLicenseInfo/addIndirectSave', payload);
    }

    editIndirectSave(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('sysLicenseInfo/editIndirectSave', payload);
    }

    // ==================== License Management ====================

    getSysLicenseMgmt(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sysLicenseInfo/sysLicenseMgmt');
    }

    getLicMgmtData(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sysLicenseInfo/getLicMgmtData');
    }

    getLicTypeData(request: any, licMgmtId: number): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`sysLicenseInfo/getLicTypeData?licMgmtId=${licMgmtId}`, request);
    }

    changeLicType(ids: number[], licType: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`sysLicenseInfo/changeLicType?ids=${ids.join(',')}&licType=${licType}`);
    }

    getTransactions(request: any, resultDataId: number): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`sysLicenseInfo/getTransactions?resultDataId=${resultDataId}`, request);
    }

    // ==================== License Jobs ====================

    getLicenseMgmtJobs(first = 0, rows = 100, sortField = 'startedOn', sortOrder = -1): Observable<ApiResponse> {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return this.http.get<ApiResponse>(`sysLicenseInfo/getLicenseMgmtJobs?first=${first}&rows=${rows}&sortField=${sortField}&sortOrder=${sortOrder}&filters=&timeZone=${tz}`);
    }

    deleteJobs(jobId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`sysLicenseInfo/deleteJobs?jobId=${jobId}`);
    }

    getJobResults(request: any, jobId: number): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`sysLicenseInfo/getJobResults?jobId=${jobId}`, request);
    }

    checkIfOtherJobRunning(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sysLicenseInfo/checkOtherJobRunning');
    }

    updateLicMgmt(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sysLicenseInfo/updateLicMgmt');
    }

    // ==================== License Pivot ====================

    getSysLicenseInfoPivot(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sysLicenseInfo/pivot');
    }

    getPivotData(pageName: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`sysLicenseInfo/pivotData?dataSet=${pageName}`);
    }

    // ==================== FUE Measurement ====================

    getFueDashboard(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('fueMeasurement/dashboard');
    }

    getFueMeasurementJobs(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('fueMeasurement/jobs');
    }

    getFueMeasurementResults(jobId: number, system?: string): Observable<ApiResponse> {
        let url = `fueMeasurement/results?jobId=${jobId}`;
        if (system) url += `&system=${encodeURIComponent(system)}`;
        return this.http.get<ApiResponse>(url);
    }

    getFueMeasurementSummary(jobId: number, system?: string): Observable<ApiResponse> {
        let url = `fueMeasurement/summary?jobId=${jobId}`;
        if (system) url += `&system=${encodeURIComponent(system)}`;
        return this.http.get<ApiResponse>(url);
    }

    runFueMeasurement(payload: { measureFrom: Date; measureTo: Date }): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('fueMeasurement/run', payload);
    }

    deleteFueMeasurementJob(jobId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`fueMeasurement/delete?jobId=${jobId}`);
    }

    getFueJobLogs(jobId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`fueMeasurement/jobLogs?jobId=${jobId}`);
    }
}
