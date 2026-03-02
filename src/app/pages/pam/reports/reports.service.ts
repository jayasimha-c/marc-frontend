import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface PaginationModel {
    first: number;
    rows: number;
    filters: any;
    sortOrder: number;
    sortField: string;
}

export interface ApiResponse {
    success: boolean;
    data: any;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PAMReportsService {
    constructor(private httpClient: HttpClient) { }

    public getAuditLog(payload: PaginationModel): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privLog/getAuditLog?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField}&sortOrder=${payload.sortOrder}&filters=${encodeURI(JSON.stringify(payload.filters))}`);
    }

    public getVariantNames(pageName: string): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`variant/getVariantNames?pageName=${pageName}`);
    }

    public pivotPrivilegeData(): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privdashboard/pivotePrivilagesData`);
    }

    public pivotPrivilegeRequestData(): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privdashboard/pivotePrivilageRequestData`);
    }

    public getAllRequests(payload: PaginationModel, requestBody: any): Observable<ApiResponse> {
        return this.httpClient.post<ApiResponse>(`priv/allRequests?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField}&sortOrder=${payload.sortOrder}&filters=${encodeURI(JSON.stringify(payload.filters))}`, requestBody);
    }

    public getTxnLogs(id: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/toReview?id=${id}`);
    }

    public getReqLogs(id: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/reqLogs?id=${id}`);
    }

    public getLogDetails(payload: PaginationModel, id: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privLog/getLogDetails?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField}&sortOrder=${payload.sortOrder}&filters=${encodeURI(JSON.stringify(payload.filters))}&logId=${id}`);
    }

    public exportTxnLogs(id: number): Observable<any> {
        return this.httpClient.get(`exportTxnLogs?id=${id}`, { observe: 'response', responseType: "blob" });
    }

    public exportPrivRequests(payload: PaginationModel): Observable<any> {
        return this.httpClient.get(`exportPrivRequests?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField}&sortOrder=${payload.sortOrder}&filters=${encodeURI(JSON.stringify(payload.filters))}`, { observe: 'response', responseType: "blob" });
    }
}
