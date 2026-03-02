import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response';

// ========== Interfaces (matching source backend DTOs) ==========

export type ComplianceStatus = 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT' | 'ERROR';

export interface OrgComplianceRequest {
    sapSystemId: number;
    templateIds: number[];
    roleNames: string[];
    roleConceptTemplateId?: number;
    useRoleConceptExtraction: boolean;
}

export interface FieldComplianceDTO {
    fieldName: string;
    expectedValues: string[];
    actualValues: string[];
    matchingValues: string[];
    missingValues: string[];
    additionalValues: string[];
    compliant: boolean;
}

export interface OrgComplianceResultDTO {
    roleName: string;
    extractedTemplateCode?: string;
    resolvedTemplateId?: number;
    templateName?: string;
    overallStatus: ComplianceStatus;
    fieldResults: FieldComplianceDTO[];
    errorMessage?: string;
    matchingFieldCount: number;
    missingValueCount: number;
    additionalValueCount: number;
}

export interface OrgComplianceSummaryDTO {
    totalRoles: number;
    compliantCount: number;
    partialCount: number;
    nonCompliantCount: number;
    errorCount: number;
    processedCount: number;
    totalMissingValues: number;
    totalAdditionalValues: number;
    totalFieldsChecked: number;
}

export interface OrgTemplateOption {
    id: number;
    templateName: string;
    templateCode: string;
    description?: string;
    fieldCount?: number;
}

export interface RoleConceptTemplateOption {
    id: number;
    name: string;
    formatType: 'POSITION_BASED' | 'DELIMITER_BASED';
    hasOrgTemplateSegment: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrgComplianceService {

    private readonly baseUrl = 'org-compliance';
    private readonly orgTemplatesUrl = 'orgValueTemplates';
    private readonly roleConceptUrl = 'role-concept-template';

    constructor(private http: HttpClient) {}

    /**
     * Run compliance check with pagination.
     */
    runComplianceCheck(request: OrgComplianceRequest, page: number = 0, size: number = 50): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(
            `${this.baseUrl}/run?page=${page}&size=${size}`,
            request
        );
    }

    /**
     * Get compliance summary (counts only).
     */
    getComplianceSummary(request: OrgComplianceRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/summary`, request);
    }

    /**
     * Get roles filtered by org template codes.
     */
    getFilteredRoles(
        params: any,
        sapSystemId: number,
        roleConceptTemplateId?: number | null,
        templateCodes?: string[]
    ): Observable<ApiResponse> {
        let url = `${this.baseUrl}/roles/getFiltered?sapSystemId=${sapSystemId}`;
        if (roleConceptTemplateId) {
            url += `&roleConceptTemplateId=${roleConceptTemplateId}`;
        }
        if (templateCodes && templateCodes.length > 0) {
            url += `&templateCodes=${templateCodes.join(',')}`;
        }
        return this.http.post<ApiResponse>(url, params);
    }

    /**
     * Get org templates for a SAP system.
     */
    getOrgTemplates(sapSystemId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(
            `${this.orgTemplatesUrl}/list?sapSystemId=${sapSystemId}`
        );
    }

    /**
     * Get role concept templates for a SAP system.
     */
    getRoleConceptTemplates(sapSystemId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(
            `${this.roleConceptUrl}/by-system/${sapSystemId}`
        );
    }

    /**
     * Get all role concept templates (for systems that don't have specific ones).
     */
    getAllRoleConceptTemplates(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(
            `${this.roleConceptUrl}/list?activeOnly=true`
        );
    }

    /**
     * Get a single role concept template by ID.
     */
    getRoleConceptTemplate(templateId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(
            `${this.roleConceptUrl}/find/${templateId}`
        );
    }

    /**
     * Get SAP systems list.
     */
    getSapSystems(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('util/getSAPSystems');
    }

    // ==================== Background Job Methods ====================

    /**
     * Check if background execution is recommended for the given request.
     */
    checkBackgroundRecommendation(request: OrgComplianceRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/check-background`, request);
    }

    /**
     * Start background compliance check job.
     */
    runBackgroundComplianceCheck(request: OrgComplianceRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/runBackground`, request);
    }

    /**
     * Get background job status.
     */
    getJobStatus(jobId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/job/${jobId}`);
    }

    /**
     * Download Excel report for completed job.
     */
    downloadJobReport(jobId: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/job/${jobId}/download`, {
            responseType: 'blob'
        });
    }

    // ==================== Select All Support ====================

    /**
     * Get ALL role names matching template codes (for Select All functionality).
     */
    getAllFilteredRoleNames(
        sapSystemId: number,
        roleConceptTemplateId?: number | null,
        templateCodes?: string[]
    ): Observable<ApiResponse> {
        let url = `${this.baseUrl}/roles/getAllNames?sapSystemId=${sapSystemId}`;
        if (roleConceptTemplateId) {
            url += `&roleConceptTemplateId=${roleConceptTemplateId}`;
        }
        if (templateCodes && templateCodes.length > 0) {
            url += `&templateCodes=${templateCodes.join(',')}`;
        }
        return this.http.get<ApiResponse>(url);
    }
}
