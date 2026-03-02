import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TypedApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface SapSystemInfo {
    id: number;
    sid?: string;
    destinationName: string;
}

export interface UserInfo {
    id: number;
    username: string;
    name: string;
}

export interface RcSyncConfig {
    id?: number;
    configType: string;
    configName?: string;
    version: number;
    yamlContent: string;
    data?: any;
}

export interface RcSyncJob {
    id: number;
    conceptId?: number;
    conceptName?: string;
    sapSystemId: number;
    sapSystemName: string;
    status: string;
    startedOn: number;
    completedOn?: number;
    rolesFound: number;
    rolesAdded: number;
    rolesUpdated: number;
    rolesSkipped: number;
    rolesFailed: number;
    runBy: string;
    runById?: number;
    errorMessage?: string;
}

export interface RcConceptSummary {
    id: number;
    name: string;
    description?: string;
    linkedSystemCount: number;
    linkedSystems?: { id: number; name: string }[];
}

export interface PagedResult<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

export interface PatternTestResult {
    count: number;
    roles: { name: string; description: string }[];
}

export interface RcSyncInfo {
    sapSystems: SapSystemInfo[];
    users: UserInfo[];
    concepts?: RcConceptSummary[];
}

@Injectable({ providedIn: 'root' })
export class RcSyncConfigService {
    private baseUrl = 'rcSync';

    constructor(private http: HttpClient) {}

    getInfo(): Observable<TypedApiResponse<RcSyncInfo>> {
        return this.http.get<TypedApiResponse<RcSyncInfo>>(`${this.baseUrl}/info`);
    }

    getConfig(configType: string, sapSystemId?: number): Observable<TypedApiResponse<RcSyncConfig>> {
        let params = new HttpParams();
        if (sapSystemId) {
            params = params.set('sapSystemId', sapSystemId.toString());
        }
        return this.http.get<TypedApiResponse<RcSyncConfig>>(`${this.baseUrl}/config/${configType}`, { params });
    }

    saveConfig(configType: string, yamlContent: string, sapSystemId?: number): Observable<TypedApiResponse<string>> {
        let params = new HttpParams();
        if (sapSystemId) {
            params = params.set('sapSystemId', sapSystemId.toString());
        }
        return this.http.post<TypedApiResponse<string>>(`${this.baseUrl}/config/${configType}`, { yamlContent }, { params });
    }

    getMasterData(sapSystemId?: number): Observable<TypedApiResponse<any>> {
        let params = new HttpParams();
        if (sapSystemId) {
            params = params.set('sapSystemId', sapSystemId.toString());
        }
        return this.http.get<TypedApiResponse<any>>(`${this.baseUrl}/masterData`, { params });
    }

    testPattern(sapSystemId: number, pattern: string, patternType: string): Observable<TypedApiResponse<PatternTestResult>> {
        return this.http.post<TypedApiResponse<PatternTestResult>>(`${this.baseUrl}/testPattern`, {
            sapSystemId,
            pattern,
            patternType
        });
    }

    runSync(sapSystemId: number): Observable<TypedApiResponse<{ jobId: number; message: string }>> {
        const params = new HttpParams().set('sapSystemId', sapSystemId.toString());
        return this.http.post<TypedApiResponse<{ jobId: number; message: string }>>(`${this.baseUrl}/run`, {}, { params });
    }

    runConceptSync(conceptId: number): Observable<TypedApiResponse<{ jobIds: number[]; systemCount: number; message: string }>> {
        const params = new HttpParams().set('conceptId', conceptId.toString());
        return this.http.post<TypedApiResponse<{ jobIds: number[]; systemCount: number; message: string }>>(`${this.baseUrl}/runConcept`, {}, { params });
    }

    getJobs(sapSystemId?: number, page = 0, size = 20): Observable<TypedApiResponse<PagedResult<RcSyncJob>>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        if (sapSystemId) {
            params = params.set('sapSystemId', sapSystemId.toString());
        }
        return this.http.get<TypedApiResponse<PagedResult<RcSyncJob>>>(`${this.baseUrl}/jobs`, { params });
    }

    getJob(jobId: number): Observable<TypedApiResponse<RcSyncJob>> {
        return this.http.get<TypedApiResponse<RcSyncJob>>(`${this.baseUrl}/job/${jobId}`);
    }

    getAssignedSystems(): Observable<TypedApiResponse<number[]>> {
        return this.http.get<TypedApiResponse<number[]>>(`${this.baseUrl}/assignedSystems`);
    }

    updateAssignedSystems(systemIds: number[]): Observable<TypedApiResponse<string>> {
        return this.http.post<TypedApiResponse<string>>(`${this.baseUrl}/assignedSystems`, { systemIds });
    }
}
