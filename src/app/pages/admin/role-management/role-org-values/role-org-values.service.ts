import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response';

// ========== Interfaces ==========

export interface RoleSummary {
    roleName: string;
    roleDesc: string;
    composite: boolean;
    orgValueCount: number;
    fieldCount: number;
}

export interface OrgFieldValue {
    authObject: string;
    fieldName: string;
    lowValue: string;
    highValue: string;
    range: boolean;
    displayValue: string;
}

export interface RolePivotData {
    roleName: string;
    roleDesc: string;
    fieldValues: { [field: string]: string };
    fieldValueDetails: { [field: string]: OrgFieldValue[] };
}

export interface PivotViewResponse {
    sapSystemId: number;
    sapSystemName: string;
    roles: RoleSummary[];
    allFields: string[];
    fieldDescriptions: { [field: string]: string };
    totalRoles: number;
    totalOrgValues: number;
}

export interface FieldStatistic {
    fieldName: string;
    fieldDescription?: string;
    distinctValues: number;
    rolesWithField: number;
}

@Injectable({ providedIn: 'root' })
export class RoleOrgValuesService {

    private readonly baseUrl = 'roleOrgValues';

    constructor(private http: HttpClient) {}

    getPivotViewData(sapSystemId: number): Observable<ApiResponse> {
        const params = new HttpParams().set('sapSystemId', sapSystemId.toString());
        return this.http.get<ApiResponse>(`${this.baseUrl}/pivotView`, { params });
    }

    getRolePivotData(sapSystemId: number, roleName: string): Observable<ApiResponse> {
        const params = new HttpParams()
            .set('sapSystemId', sapSystemId.toString())
            .set('roleName', roleName);
        return this.http.get<ApiResponse>(`${this.baseUrl}/rolePivot`, { params });
    }

    getRolesWithOrgValue(sapSystemId: number, authField: string, fieldValue: string): Observable<ApiResponse> {
        const params = new HttpParams()
            .set('sapSystemId', sapSystemId.toString())
            .set('authField', authField)
            .set('fieldValue', fieldValue);
        return this.http.get<ApiResponse>(`${this.baseUrl}/rolesWithValue`, { params });
    }

    getDistinctFieldValues(sapSystemId: number, authField: string): Observable<ApiResponse> {
        const params = new HttpParams()
            .set('sapSystemId', sapSystemId.toString())
            .set('authField', authField);
        return this.http.get<ApiResponse>(`${this.baseUrl}/fieldValues`, { params });
    }

    getFieldStatistics(sapSystemId: number): Observable<ApiResponse> {
        const params = new HttpParams().set('sapSystemId', sapSystemId.toString());
        return this.http.get<ApiResponse>(`${this.baseUrl}/statistics`, { params });
    }

    getSapSystems(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('sapsystem/getSystemList');
    }

    getFieldDescriptions(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/fieldDescriptions`);
    }
}
