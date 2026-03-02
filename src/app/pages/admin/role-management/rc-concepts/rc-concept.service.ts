import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response';

// ========== Interfaces ==========

export interface SapSystemInfo {
    id: number;
    sid?: string;
    destinationName: string;
}

export interface RcConceptDTO {
    id?: number;
    name: string;
    description?: string;
    version?: number;
    isActive?: boolean;
    isDefault?: boolean;
    createdBy?: string;
    createdOn?: number;
    modifiedBy?: string;
    modifiedOn?: number;
    patternsCount?: number;
    masterDataCount?: number;
    assignedSystemsCount?: number;
    patterns?: RcPatternDTO[];
    masterData?: RcMasterDataDTO[];
    systemAssignments?: RcSystemAssignmentDTO[];
    syncRemoveOrphanApprovers?: boolean;
    syncUpdateExisting?: boolean;
    debugMode?: boolean;
}

export interface RcPatternDTO {
    id?: number;
    conceptId?: number;
    pattern: string;
    patternType: string;
    businessProcess?: string;
    subProcess?: string;
    department?: string;
    division?: string;
    criticality?: string;
    roleType?: string;
    approvers?: string;
    backupApprovers?: string;
    priority?: number;
    isActive?: boolean;
    createdOn?: number;
    modifiedOn?: number;
    matchCount?: number;
}

export interface RcMasterDataDTO {
    id?: number;
    conceptId?: number;
    category: string;
    code: string;
    name: string;
    parentCode?: string;
    sortOrder?: number;
    isActive?: boolean;
    createdOn?: number;
    modifiedOn?: number;
}

export interface RcSystemAssignmentDTO {
    id?: number;
    conceptId?: number;
    conceptName?: string;
    sapSystemId: number;
    sapSystemName?: string;
    isActive?: boolean;
    assignedBy?: string;
    assignedDate?: number;
    unassignedBy?: string;
    unassignedDate?: number;
}

export interface ConceptInfoResponse {
    sapSystems: SapSystemInfo[];
}

// ========== Simulation DTOs ==========

export interface RcSimulationResultDTO {
    totalRoles: number;
    matchedCount: number;
    conflictCount: number;
    noMatchCount: number;
    results: RoleSimulationResult[];
}

export interface RoleSimulationResult {
    roleName: string;
    status: string;  // MATCHED, CONFLICT, NO_MATCH
    matchedPattern?: string;
    patternType?: string;
    patternPriority?: number;
    businessProcess?: string;
    subProcess?: string;
    department?: string;
    division?: string;
    criticality?: string;
    roleType?: string;
    approvers?: string;
    backupApprovers?: string;
    allMatchingPatterns?: MatchedPatternInfo[];
}

export interface MatchedPatternInfo {
    patternId: number;
    pattern: string;
    patternType: string;
    priority: number;
    businessProcess?: string;
    subProcess?: string;
    department?: string;
    division?: string;
    criticality?: string;
    roleType?: string;
    approvers?: string;
    backupApprovers?: string;
}

// ========== Service ==========

@Injectable({ providedIn: 'root' })
export class RcConceptService {

    private readonly baseUrl = 'rcConcept';

    constructor(private http: HttpClient) {}

    // ==================== INFO ====================

    getInfo(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/info`);
    }

    // ==================== CONCEPT CRUD ====================

    getAllConcepts(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}`);
    }

    getConceptById(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/${id}`);
    }

    createConcept(dto: RcConceptDTO): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}`, dto);
    }

    updateConcept(id: number, dto: RcConceptDTO): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.baseUrl}/${id}`, dto);
    }

    deleteConcept(id: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.baseUrl}/${id}`);
    }

    cloneConcept(id: number, newName: string): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/${id}/clone`, { name: newName });
    }

    // ==================== PATTERNS ====================

    getPatterns(conceptId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/${conceptId}/patterns`);
    }

    savePatterns(conceptId: number, patterns: RcPatternDTO[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/${conceptId}/patterns`, patterns);
    }

    addPattern(conceptId: number, pattern: RcPatternDTO): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/${conceptId}/patterns/add`, pattern);
    }

    updatePattern(conceptId: number, patternId: number, pattern: RcPatternDTO): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.baseUrl}/${conceptId}/patterns/${patternId}`, pattern);
    }

    deletePattern(conceptId: number, patternId: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.baseUrl}/${conceptId}/patterns/${patternId}`);
    }

    // ==================== MASTER DATA ====================

    getMasterData(conceptId: number, category?: string): Observable<ApiResponse> {
        let params = new HttpParams();
        if (category) {
            params = params.set('category', category);
        }
        return this.http.get<ApiResponse>(`${this.baseUrl}/${conceptId}/masterData`, { params });
    }

    saveMasterDataByCategory(conceptId: number, category: string, items: RcMasterDataDTO[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/${conceptId}/masterData/${category}`, items);
    }

    addMasterDataItem(conceptId: number, item: RcMasterDataDTO): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/${conceptId}/masterData/add`, item);
    }

    deleteMasterDataItem(conceptId: number, itemId: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.baseUrl}/${conceptId}/masterData/${itemId}`);
    }

    // ==================== SYSTEM ASSIGNMENT ====================

    getAssignedSystems(conceptId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/${conceptId}/systems`);
    }

    getAssignedSystemIds(conceptId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/${conceptId}/systemIds`);
    }

    assignToSystems(conceptId: number, systemIds: number[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/${conceptId}/systems/assign`, { systemIds });
    }

    unassignFromSystems(conceptId: number, systemIds: number[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/${conceptId}/systems/unassign`, { systemIds });
    }

    getConceptForSystem(systemId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/forSystem/${systemId}`);
    }

    // ==================== PATTERN SIMULATION ====================

    simulatePatterns(conceptId: number, roleNames: string[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(
            `${this.baseUrl}/${conceptId}/simulate`,
            { conceptId, roleNames }
        );
    }
}
