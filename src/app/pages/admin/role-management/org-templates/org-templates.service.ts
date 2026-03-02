import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response';

// ========== Interfaces ==========

export interface OrgFieldInfo {
    fieldName: string;
    description: string;
}

export interface OrgTemplateFieldValue {
    id?: number;
    templateId?: number;
    fieldName: string;
    fieldDescription?: string;
    value: string;
    displayOrder?: number;
}

export interface OrgValueTemplate {
    id?: number;
    sapSystemId: number;
    templateName: string;
    templateCode?: string;
    description?: string;
    parentTemplateId?: number;
    parentTemplateName?: string;
    displayOrder?: number;
    active: boolean;
    createdBy?: string;
    createdOn?: number;
    modifiedBy?: string;
    modifiedOn?: number;
    fieldValues?: OrgTemplateFieldValue[];
    fieldValuesMap?: { [fieldName: string]: OrgTemplateFieldValue[] };
    fieldCount?: number;
    valueCount?: number;
}

export interface OrgFieldCell {
    displayText: string;
    count: number;
    additionalCount: number;
    hasWildcard: boolean;
    values: OrgTemplateFieldValue[];
}

export interface OrgFieldMaster {
    id: number;
    fieldName: string;
    description: string;
    dataType?: string;
    isCommon: boolean;
    displayOrder: number;
}

export interface OrgTemplateMatrix {
    templates: OrgValueTemplate[];
    fields: OrgFieldInfo[];
    matrix: { [fieldName: string]: { [templateId: number]: OrgFieldCell } };
}

export interface OrgTemplateRequest {
    id?: number;
    sapSystemId: number;
    templateName: string;
    templateCode?: string;
    description?: string;
    parentTemplateId?: number;
    displayOrder?: number;
    active: boolean;
    fieldValues?: OrgTemplateFieldValue[];
    // Clone operation
    clone?: boolean;
    sourceTemplateId?: number;
    newTemplateName?: string;
    newTemplateCode?: string;
}

// ========== Import Interfaces ==========

export type ImportMode = 'REPLACE' | 'MERGE';

export interface OrgTemplateFieldValueItem {
    fieldName: string;
    value: string;
}

export interface OrgTemplateImportItem {
    templateName: string;
    templateCode?: string;
    description?: string;
    fieldValues: OrgTemplateFieldValueItem[];
}

export interface OrgTemplateImportRequest {
    sapSystemId: number;
    templates: OrgTemplateImportItem[];
    mode?: ImportMode;
}

export type ImportStatus = 'CREATED' | 'UPDATED' | 'FAILED';

export interface ImportResultItem {
    templateName: string;
    status: ImportStatus;
    message?: string;
}

export interface OrgTemplateImportResult {
    totalProcessed: number;
    created: number;
    updated: number;
    failed: number;
    details: ImportResultItem[];
}

// ========== Version History ==========

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

export interface SapSystemInfo {
    id: number;
    sid?: string;
    destinationName: string;
}

// ========== Service ==========

@Injectable({ providedIn: 'root' })
export class OrgTemplatesService {

    private readonly baseUrl = 'orgValueTemplates';

    constructor(private http: HttpClient) {}

    // ==================== Template CRUD ====================

    getTemplates(sapSystemId: number): Observable<ApiResponse> {
        const params = new HttpParams().set('sapSystemId', sapSystemId.toString());
        return this.http.get<ApiResponse>(`${this.baseUrl}/list`, { params });
    }

    getTemplate(templateId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/${templateId}`);
    }

    createTemplate(request: OrgTemplateRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/create`, request);
    }

    updateTemplate(templateId: number, request: OrgTemplateRequest): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.baseUrl}/${templateId}`, request);
    }

    deleteTemplate(templateId: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.baseUrl}/${templateId}`);
    }

    bulkDeleteTemplates(templateIds: number[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/bulkDelete`, templateIds);
    }

    cloneTemplate(sourceTemplateId: number, newTemplateName: string, newTemplateCode?: string): Observable<ApiResponse> {
        const request: OrgTemplateRequest = {
            clone: true,
            sourceTemplateId,
            newTemplateName,
            newTemplateCode,
            sapSystemId: 0,       // Will be determined from source
            templateName: '',     // Required but not used for clone
            active: true
        };
        return this.http.post<ApiResponse>(`${this.baseUrl}/clone`, request);
    }

    importTemplates(request: OrgTemplateImportRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/import`, request);
    }

    // ==================== Matrix View ====================

    getMatrixView(sapSystemId: number): Observable<ApiResponse> {
        const params = new HttpParams().set('sapSystemId', sapSystemId.toString());
        return this.http.get<ApiResponse>(`${this.baseUrl}/matrix`, { params });
    }

    // ==================== Field Values ====================

    getFieldValues(templateId: number, fieldName: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/${templateId}/field/${fieldName}`);
    }

    updateFieldValues(templateId: number, fieldName: string, values: OrgTemplateFieldValue[]): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.baseUrl}/${templateId}/field/${fieldName}`, values);
    }

    // ==================== Utilities ====================

    searchTemplates(sapSystemId: number, search: string): Observable<ApiResponse> {
        const params = new HttpParams()
            .set('sapSystemId', sapSystemId.toString())
            .set('search', search);
        return this.http.get<ApiResponse>(`${this.baseUrl}/search`, { params });
    }

    getAvailableFields(sapSystemId: number): Observable<ApiResponse> {
        const params = new HttpParams().set('sapSystemId', sapSystemId.toString());
        return this.http.get<ApiResponse>(`${this.baseUrl}/availableFields`, { params });
    }

    getSapSystems(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('util/getSAPSystems');
    }

    // ==================== Initialize Default ====================

    initializeDefaultFields(sapSystemId: number): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(
            `orgField/initializeDefaultOrgFields?sapSystemId=${sapSystemId}`,
            {}
        );
    }

    getOrgFieldMaster(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/orgFieldMaster`);
    }

    hasOrgFields(sapSystemId: number): Observable<ApiResponse> {
        const params = new HttpParams().set('sapSystemId', sapSystemId.toString());
        return this.http.get<ApiResponse>(`${this.baseUrl}/hasOrgFields`, { params });
    }

    // ==================== Version History ====================

    getVersionHistory(templateId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/${templateId}/versions`);
    }

    getVersion(templateId: number, version: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/${templateId}/versions/${version}`);
    }

    getVersionWithComparison(templateId: number, version: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/${templateId}/versions/${version}/compare`);
    }
}
