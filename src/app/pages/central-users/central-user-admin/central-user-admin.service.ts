import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../../../core/models/api-response";


// DTOs matching backend
export interface DashboardStats {
    totalSystems: number;
    systemClients: number;
    uniqueUsers: number;
    totalAccounts: number;
    roleAssignments: number;
    lockedAccounts: number;
}

export interface AggregatedUser {
    identityId: number;
    sapBname: string;
    employeeId: string;
    displayName: string;
    firstName: string;
    lastName: string;
    primaryEmail: string;
    department: string;
    active: boolean;
    systemCount: number;
    lockedCount: number;
    totalRoleCount: number;
    uniqueRoleCount: number;
    criticalRoleCount: number;
    hasSapAll: boolean;
    lastLoginAnySystem: string;
}

export interface UserStats {
    totalSystems: number;
    productionSystems: number;
    qualitySystems: number;
    developmentSystems: number;
    totalRoles: number;
    uniqueRoles: number;
    criticalRoles: number;
    lockedAccounts: number;
    hasSapAll: boolean;
}

export interface UserRole {
    id: number;
    roleName: string;
    roleType: string;
    validFrom: string;
    validTo: string;
    critical: boolean;
}

export interface UserRoleAggregated {
    id: number;
    centralUserId: number;
    userId: string;
    system: string;
    roleName: string;
    roleDescription: string;
    roleType: string;
    critical: boolean;
    validFrom: string;
    validTo: string;
    orgLevel: string;
}

export interface UserTransaction {
    txnId: string;
    txnDesc: string;
    system: string;
    lastUsed: string;
    count: number;
}

export interface UserRiskViolation {
    id: number;
    riskName: string;
    riskType: string;
    riskDesc: string;
    ruleName: string;
    ruleDesc: string;
    system: string;
    businessProcess: string;
    businessSubProcess: string;
    mitigationName: string;
    status: string;
    color: string;
}

export interface UserRequest {
    id: number;
    requestId: string;
    type: string;
    system: string;
    roleName: string;
    requestedBy: string;
    requestedDate: string;
    status: string;
    completedDate: string;
}

export interface UserRule {
    ruleName: string;
    ruleDesc: string;
    tranCode: string;
    tranName: string;
    createdDate: number;
}

export interface UserSODControl {
    id: number;
    controlName: string;
    desc: string;
}

export interface UserRoleComparison {
    roleName: string;
    users: { [userId: string]: boolean };
}

export interface ScenarioUser {
    identityId: number;
    sapBname: string;
    displayName: string;
    primaryEmail: string;
    employeeId: string;
    department: string;
    active: boolean;
    systemCount: number;
    lockedCount: number;
    activeCount: number;
}

export interface UserScenario {
    value: string;
    label: string;
    description: string;
}

export interface UserSystem {
    centralUserId: number;
    sid: string;
    client: string;
    environmentType: string; // Production, Quality, Development
    userType: string; // Dialog, Service, Communication, System
    locked: boolean;
    lastLogin: string;
    validFrom: string;
    validTo: string;
    roles: UserRole[];
}

export interface UserDetail {
    identityId: number;
    sapBname: string;
    employeeId: string;
    displayName: string;
    firstName: string;
    lastName: string;
    primaryEmail: string;
    department: string;
    jobTitle: string;
    managerName: string;
    active: boolean;
    stats: UserStats;
    systems: UserSystem[];
}

export interface RoleMaster {
    id: number;
    roleName: string;
    roleType: string;
    description: string;
    critical: boolean;
    userCount: number;
    systemCount: number;
}

export interface SapSystemVO {
    id: number;
    sid: string;
    destinationName: string;
    hostName: string;
    description: string;
    clientNumber: string;
    systemType: number;
    systemTypeName?: string;
    offline?: boolean;
    active?: boolean;
    userCount?: number;
    lockedCount?: number;
    activePercentage?: number;
}

export interface OperationRequest {
    userId: string;
    systems: string[];
    reason?: string;
}

export interface OperationResult {
    success: boolean;
    message: string;
    operationType: string;
    affectedSystems: string[];
    failedSystems: string[];
}

export interface OperationLog {
    id: number;
    operationType: string;
    targetUserId: string;      // The user being operated on
    targetSystem: string;      // The SAP system (SID)
    targetRole: string;        // Role name (for role operations)
    executedBy: string;        // Who performed the operation
    executedAt: number;        // Timestamp (epoch ms)
    status: string;            // PENDING, SUCCESS, FAILED
    message: string;           // Error/success message
    batchId: number;           // Batch ID for bulk operations
}

export interface BulkOperationRequest {
    userIds: string[];
    systems: string[];
    reason?: string;
}

export interface RoleAdditionRequest {
    userIds: string[];
    systems: string[];
    roles: string[];
    reason?: string;
}

export interface PasswordOperationRequest {
    userIds: string[];
    systems: string[];
    password: string;
    reason?: string;
}

export interface TaskStatus {
    id: number;
    userId: string;
    system: string;
    status: string;
    message: string;
    executedAt: number;
}

export interface BatchStatus {
    batchId: number;
    operationType: string;
    status: string;
    totalTasks: number;
    completedTasks: number;
    successfulTasks: number;
    failedTasks: number;
    progressPercent: number;
    reason: string;
    createdBy: string;
    createdAt: number;
    startedAt: number;
    completedAt: number;
    tasks: TaskStatus[];
}

@Injectable({ providedIn: 'root' })
export class CentralUserAdminService {

    private readonly BASE_URL = 'central-user-admin';

    constructor(
        private http: HttpClient
    ) { }

    // ==================== Dashboard ====================

    getDashboardStats(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/dashboard/stats`);
    }

    getCriticalRoles(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/dashboard/critical-roles`);
    }

    getTopRoles(limit: number = 10): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/dashboard/top-roles?limit=${limit}`);
    }

    // ==================== User Search ====================

    searchUsers(request: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/users/search`, request);
    }

    getUserDetail(identityId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/users/${identityId}`);
    }

    getUserDetailByBname(bname: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/users/by-bname/${bname}`);
    }

    getUsersBySystem(systemName: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/users/by-system/${encodeURIComponent(systemName)}`);
    }

    getUserRoles(identityId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/users/${identityId}/roles`);
    }

    getUserTransactions(identityId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/users/${identityId}/transactions`);
    }

    getUserRisks(identityId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/users/${identityId}/risks`);
    }

    getUserRequests(identityId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/users/${identityId}/requests`);
    }

    quickSearchUsers(searchTerm: string, limit: number = 50): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/users/quick-search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`);
    }

    getAvailableScenarios(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/users/scenarios`);
    }

    getUsersByScenario(scenario: string, limit: number = 100): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/users/by-scenario?scenario=${encodeURIComponent(scenario)}&limit=${limit}`);
    }

    // ==================== Role Browser ====================

    searchRoles(request: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/roles/search`, request);
    }

    getRoleDetail(roleName: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/roles/${encodeURIComponent(roleName)}`);
    }

    getUsersWithRole(roleName: string, limit: number = 50): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/roles/${encodeURIComponent(roleName)}/users?limit=${limit}`);
    }

    getRoleStats(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/roles/stats`);
    }

    // ==================== System Landscape ====================

    getSystemLandscape(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/systems`);
    }

    getSystemDetail(systemId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/systems/${systemId}`);
    }

    // ==================== Operations ====================

    lockUser(request: OperationRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/operations/lock`, request);
    }

    unlockUser(request: OperationRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/operations/unlock`, request);
    }

    syncUser(request: OperationRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/operations/sync`, request);
    }

    getRecentOperations(page: number = 0, size: number = 20): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/operations/recent?page=${page}&size=${size}`);
    }

    getOperationsForUser(userId: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/operations/user/${userId}`);
    }

    // ==================== Bulk Operations ====================

    bulkLockUsers(request: BulkOperationRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/operations/bulk/lock`, request);
    }

    bulkUnlockUsers(request: BulkOperationRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/operations/bulk/unlock`, request);
    }

    getBatchStatus(batchId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/operations/batch/${batchId}`);
    }

    cancelBatch(batchId: number): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/operations/batch/${batchId}/cancel`, {});
    }

    // ==================== Role Addition ====================

    bulkExpireUsers(request: BulkOperationRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/operations/bulk/expire`, request);
    }

    bulkAddRoles(request: RoleAdditionRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/operations/bulk/add-roles`, request);
    }

    getRoleCatalogues(request: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('roleCatalogue/get', request);
    }

    // ==================== Password Operations ====================

    bulkResetPassword(request: PasswordOperationRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/operations/bulk/reset-password`, request);
    }

    bulkDeactivatePassword(request: PasswordOperationRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/operations/bulk/deactivate-password`, request);
    }

    // ==================== Rules/Task Execution ====================

    getUserRules(identityId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`centralUser/getTaskExe?userId=${identityId}`);
    }

    // ==================== SOD Controls ====================

    getUserSODControls(identityId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`centralUser/getSODControls?userId=${identityId}`);
    }

    getSODControlMetadata(icmControlId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`icm/rs/std_meta2?icmControlId=${icmControlId}`);
    }

    getSODControlDetails(userId: number, icmControlId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`icm/rs/std_data_full2?userId=${userId}&icmControlId=${icmControlId}`);
    }

    // ==================== User Role Comparison ====================

    compareUserRoles(userIds: number[], realtime: boolean = false): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/users/compare-roles?identityIds=${userIds.join(',')}&realtime=${realtime}`);
    }
}
