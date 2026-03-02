import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';
import { TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

// ========== Interfaces ==========

export interface RoleConceptSegment {
    id?: number;
    conceptId?: number;
    templateId?: number;
    templateSegmentId?: number;
    segmentName: string;
    segmentOrder: number;
    segmentType: 'ENUM' | 'FREE_TEXT' | 'PATTERN' | 'ORG_TEMPLATE';
    startPosition?: number;
    length?: number;
    allowedValues?: string;
    enumSetId?: number;
    enumSetName?: string;
    minLength?: number;
    maxLength?: number;
    regexPattern?: string;
    isRequired: boolean;
    errorMessage?: string;
}

export interface RoleConceptTemplate {
    id?: number;
    name: string;
    description?: string;
    formatType: 'POSITION_BASED' | 'DELIMITER_BASED';
    roleType?: 'SINGLE' | 'COMPOSITE';
    delimiter?: string;
    totalLength?: number;
    isActive: boolean;
    createdBy?: string;
    createdDate?: number;
    modifiedBy?: string;
    modifiedDate?: number;
    segments: RoleConceptSegment[];
    systemCount?: number;
}

export interface RoleConcept {
    id?: number;
    sapSystemId: number;
    sapSystemName?: string;
    templateId?: number;
    templateName?: string;
    name: string;
    description?: string;
    formatType: 'POSITION_BASED' | 'DELIMITER_BASED';
    delimiter?: string;
    totalLength?: number;
    isActive: boolean;
    createdBy?: string;
    createdDate?: number;
    modifiedBy?: string;
    modifiedDate?: number;
    segments: RoleConceptSegment[];
}

export interface RoleConceptEnumSet {
    id?: number;
    name: string;
    description?: string;
    valuesList: string;
    createdBy?: string;
    createdDate?: number;
}

export interface RoleComplianceResult {
    roleName: string;
    compliant: boolean;
    violations: {
        conceptName: string;
        messages: string[];
    }[];
}

export interface SapSystemInfo {
    id: number;
    sid?: string;
    destinationName: string;
}

export interface TemplateSystemAssignment {
    id?: number;
    templateId: number;
    templateName?: string;
    sapSystemId: number;
    sapSystemName?: string;
    isActive?: boolean;
    assignedBy?: string;
    assignedDate?: number;
}

export interface EntityVersion {
    id?: number;
    entityId: number;
    entityType: string;
    entityName?: string;
    version: number;
    changeType: 'CREATED' | 'UPDATED' | 'DELETED';
    changeTypeDisplay?: string;
    changeSummary?: string;
    snapshotJson?: string;
    changedBy?: string;
    changedDate?: number;
    previousVersion?: number;
    previousSnapshotJson?: string;
}

@Injectable({ providedIn: 'root' })
export class RoleConceptService {

    private readonly TEMPLATE_URL = 'role-concept-template';
    private readonly CONCEPT_URL = 'role-concept';

    constructor(
        private http: HttpClient
    ) { }

    // Helper for grid filters
    private postFiltered(url: string, params: TableQueryParams, extraParams?: any): Observable<ApiResponse> {
        let sortDirection: string | null = null;
        if (params.sort?.direction) {
            sortDirection = params.sort.direction === 'ascend' ? 'ASC' : 'DESC';
        }

        // Map TableQueryParams filters (which are simple key-value strings) to the ColumnFilter array format expected by GridFilterRequest
        const filtersArray: any[] = [];
        if (params.filters) {
            for (const key of Object.keys(params.filters)) {
                if (params.filters[key] !== null && params.filters[key] !== '') {
                    filtersArray.push({
                        field: key,
                        operator: 'CONTAINS',
                        value: params.filters[key]
                    });
                }
            }
        }

        // Push any extra params (like sapSystemId) as EQUALS filters,
        // unless they are meant to be somewhere else. The old code passed them in URL query params.
        // Let's pass extraParams in URL instead of body if it was used that way!
        // Wait, NO, old code GridFilterService.postFiltered appended queryParams to URL.

        // Let's mimic old GridFilterService buildUrl logic for extraParams:
        let finalUrl = url;
        if (extraParams) {
            const queryStrings = Object.keys(extraParams)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(extraParams[key])}`)
                .join('&');
            if (queryStrings) {
                finalUrl += (finalUrl.indexOf('?') === -1 ? '?' : '&') + queryStrings;
            }
        }

        const payload = {
            page: params.pageIndex - 1, // Angular is normally 1-indexed for the AdvancedTable
            size: params.pageSize,
            sortField: params.sort?.field || undefined,
            sortDirection: sortDirection,
            globalFilter: params.globalSearch || '',
            filters: filtersArray
        };

        return this.http.post<ApiResponse>(finalUrl, payload);
    }

    // ========== Template APIs ==========

    searchTemplates(params: TableQueryParams): Observable<ApiResponse> {
        return this.postFiltered(`${this.TEMPLATE_URL}/search`, params);
    }

    getTemplatesList(activeOnly: boolean = false): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.TEMPLATE_URL}/list?activeOnly=${activeOnly}`);
    }

    getTemplateById(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.TEMPLATE_URL}/find/${id}`);
    }

    saveTemplate(template: RoleConceptTemplate): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.TEMPLATE_URL}/save`, template);
    }

    deleteTemplate(id: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.TEMPLATE_URL}/delete/${id}`);
    }

    toggleTemplateActive(id: number): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.TEMPLATE_URL}/toggleActive/${id}`, {});
    }

    duplicateTemplate(id: number, newName: string): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(
            `${this.TEMPLATE_URL}/duplicate/${id}?newName=${encodeURIComponent(newName)}`,
            {}
        );
    }

    getFormatTypes(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.TEMPLATE_URL}/formatTypes`);
    }

    getSegmentTypes(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.TEMPLATE_URL}/segmentTypes`);
    }

    // ========== Enum Set APIs ==========

    getEnumSets(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.TEMPLATE_URL}/enumSets`);
    }

    saveEnumSet(enumSet: RoleConceptEnumSet): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.TEMPLATE_URL}/enumSet/save`, enumSet);
    }

    deleteEnumSet(id: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.TEMPLATE_URL}/enumSet/delete/${id}`);
    }

    // ========== Per-System Concept APIs ==========

    searchConcepts(sapSystemId: number, params: TableQueryParams): Observable<ApiResponse> {
        return this.postFiltered(`${this.CONCEPT_URL}/search`, params, { sapSystemId });
    }

    getConceptsList(sapSystemId: number, activeOnly: boolean = false): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(
            `${this.CONCEPT_URL}/list?sapSystemId=${sapSystemId}&activeOnly=${activeOnly}`
        );
    }

    getConceptById(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.CONCEPT_URL}/find/${id}`);
    }

    saveConcept(concept: RoleConcept): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.CONCEPT_URL}/save`, concept);
    }

    createConceptFromTemplate(
        templateId: number,
        sapSystemId: number,
        name: string
    ): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(
            `${this.CONCEPT_URL}/createFromTemplate?templateId=${templateId}&sapSystemId=${sapSystemId}&name=${encodeURIComponent(name)}`,
            {}
        );
    }

    deleteConcept(id: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.CONCEPT_URL}/delete/${id}`);
    }

    toggleConceptActive(id: number): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.CONCEPT_URL}/toggleActive/${id}`, {});
    }

    // ========== Validation APIs ==========

    validateRoles(sapSystemId: number, roleNames: string[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(
            `${this.CONCEPT_URL}/validate?sapSystemId=${sapSystemId}`,
            roleNames
        );
    }

    testValidation(conceptId: number, roleName: string): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(
            `${this.CONCEPT_URL}/testValidation?conceptId=${conceptId}&roleName=${encodeURIComponent(roleName)}`,
            {}
        );
    }

    // ========== Template-to-System Assignment APIs ==========

    getSapSystems(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('util/getSAPSystems');
    }

    getAssignedSystems(templateId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.TEMPLATE_URL}/${templateId}/assigned-systems`);
    }

    assignTemplateToSystems(templateId: number, sapSystemIds: number[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(
            `${this.TEMPLATE_URL}/${templateId}/assign-systems`,
            sapSystemIds
        );
    }

    unassignTemplateFromSystems(templateId: number, sapSystemIds: number[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(
            `${this.TEMPLATE_URL}/${templateId}/unassign-systems`,
            sapSystemIds
        );
    }

    getTemplatesForSystem(sapSystemId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.TEMPLATE_URL}/by-system/${sapSystemId}`);
    }

    // ========== Version History APIs ==========

    getTemplateVersionHistory(templateId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.TEMPLATE_URL}/${templateId}/versions`);
    }

    getTemplateVersion(templateId: number, version: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.TEMPLATE_URL}/${templateId}/versions/${version}`);
    }

    getTemplateVersionWithComparison(templateId: number, version: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.TEMPLATE_URL}/${templateId}/versions/${version}/compare`);
    }
}
