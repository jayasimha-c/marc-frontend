import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface ApiResponse {
    success: boolean;
    data: any;
    message?: string;
    records?: number;
}

export interface DashboardStats {
    systemId: number;
    systemName: string;
    totalRoles: number;
    compositeRoles: number;
    singleRoles: number;
    rolesWithoutDescription: number;
    emptyRoles: number;
    recentlyModifiedRoles: number;
    totalTcodes: number;
    uniqueTcodes: number;
    rolesWithExcessiveTcodes: number;
    excessiveTcodeThreshold: number;
    avgTcodesPerRole: number;
    totalChildRoleAssignments: number;
    totalMenuItems: number;
}

export interface RoleAnalysis {
    id: number;
    sapSystemId: number;
    systemName: string;
    roleName: string;
    roleDesc: string;
    isComposite: boolean;
    createdBy: string;
    creationDate: string;
    changedBy: string;
    changeDate: string;
    tcodeCount: number;
    childRoleCount: number;
    menuItemCount: number;
    hasDescription: boolean;
    hasTcodes: boolean;
    hasChildRoles: boolean;
    issueType: string;
    issueDescription: string;
    childRoles?: string[];
    namingCompliant?: boolean;
    matchedTemplateName?: string;
    namingViolations?: string;
    violationDetails?: ViolationDetail[];
}

export interface ViolationDetail {
    segmentName: string;
    violation: string;
}

export type RoleFilterType =
    | 'COMPOSITE'
    | 'SINGLE'
    | 'EMPTY'
    | 'WITHOUT_DESCRIPTION'
    | 'EXCESSIVE_TCODES'
    | 'RECENTLY_MODIFIED'
    | 'RECENTLY_CREATED'
    | 'NO_USERS'
    | 'NAME_PATTERN'
    | 'NON_COMPLIANT_NAMING';

export interface FilterTypeOption {
    value: RoleFilterType;
    label: string;
    description: string;
}

export interface RoleAnalysisRequest {
    page: number;
    size: number;
    sortField?: string;
    sortDirection?: 'ASC' | 'DESC';
    systemId: number;
    filterTypes: RoleFilterType[];
    tcodeThreshold?: number;
    daysThreshold?: number;
    roleNamePattern?: string;
    includeChildRoles?: boolean;
}

export interface SapSystemOption {
    id: number;
    sid: string;
    destinationName: string;
    systemType?: string;
    description: string;
}

@Injectable({ providedIn: 'root' })
export class SecurityReportsService {

    private readonly BASE_URL = 'security-reports';

    constructor(private http: HttpClient) { }

    getDashboardStats(systemId: number, threshold: number = 50): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(
            `${this.BASE_URL}/dashboard/stats?systemId=${systemId}&threshold=${threshold}`
        );
    }

    analyzeRoles(request: RoleAnalysisRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.BASE_URL}/analyze`, request);
    }

    getFilterTypes(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.BASE_URL}/filter-types`);
    }

    getSapSystems(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sapsystem/getSystemList');
    }
}
