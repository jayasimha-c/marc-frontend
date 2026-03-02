import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';
import { PaginationModel } from '../../../core/models/pagination.model';

@Injectable({
    providedIn: 'root'
})
export class RequestService {

    constructor(private httpClient: HttpClient) { }

    public getPrivilegeList(payload: PaginationModel, requestBody: any): Observable<ApiResponse> {
        return this.httpClient.post<ApiResponse>(`priv/approvals?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField}&sortOrder=${payload.sortOrder}&filters=${encodeURI(JSON.stringify(payload.filters))}`, requestBody);
    }

    public getRequests(payload: PaginationModel): Observable<ApiResponse> {
        return this.httpClient.post<ApiResponse>(`priv/requests?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField}&sortOrder=${payload.sortOrder}&filters=${encodeURI(JSON.stringify(payload.filters))}`, {});
    }

    public getInfoForRequests(): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/toRequest`);
    }

    public getPrivilegesForRequests(id: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/privileges?sapId=${id}`);
    }

    public sendRequest(payload: any): Observable<ApiResponse> {
        return this.httpClient.post<ApiResponse>(`priv/request`, payload);
    }

    public updateRequest(payload: any): Observable<ApiResponse> {
        return this.httpClient.post<ApiResponse>(`priv/save`, payload);
    }

    public getRequestsTxn(id: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/getTxns?id=${id}`);
    }

    public smartUpload(payload: any): Observable<ApiResponse> {
        return this.httpClient.post<ApiResponse>(`uploads/smartUpload`, payload);
    }

    public toEditRequest(id: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/toEditRequest?id=${id}`);
    }

    public toEndRequest(id: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/end?id=${id}`);
    }

    public getReviews(payload: PaginationModel, requestBody: any): Observable<ApiResponse> {
        return this.httpClient.post<ApiResponse>(`priv/reviews?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField}&sortOrder=${payload.sortOrder}&filters=${encodeURI(JSON.stringify(payload.filters))}`, requestBody);
    }

    public approveReview(id: any, comments: string): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/review?id=${id}&comments=${comments}&approved=true`);
    }

    public rejectReview(id: any, comments: string): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/review?id=${id}&comments=${comments}&approved=false`);
    }

    public approveRequest(id: any, validFrom: any, validTo: any, comments?: string): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/approve?id=${id}&validFrom=${validFrom}&validTo=${validTo}&comments=${comments || ''}&approved=true`);
    }

    public rejectRequest(id: any, comments: string): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/approve?id=${id}&comments=${comments}&approved=false`);
    }

    public requestReset(id: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/clearError?id=${id}`);
    }

    public endRequest(id: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/end?id=${id}`);
    }

    public getMyRequestSummary(): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privAccessStats/requestsSummary`);
    }

    // Get single request by ID
    public getRequestById(id: number): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/request/${id}`);
    }

    // PAM Integration Settings
    public getPamIntegrationSettings(): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/integration-settings`);
    }

    // Ticket Validation
    public validateTicket(ticketNumber: string, integrationType: string): Observable<ApiResponse> {
        return this.httpClient.post<ApiResponse>(`priv/validate-ticket`, {
            ticketNumber: ticketNumber,
            integrationType: integrationType
        });
    }

    // Transaction Logs / Reports
    public getTxnLogs(id: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/toReview?id=${id}`);
    }

    public exportTxnLogs(id: number): Observable<any> {
        return this.httpClient.get(`exportTxnLogs?id=${id}`, { observe: 'response', responseType: "blob" });
    }

    // All Requests Report
    public getAllRequests(payload: PaginationModel, requestBody: any): Observable<ApiResponse> {
        return this.httpClient.post<ApiResponse>(`priv/allRequests?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField}&sortOrder=${payload.sortOrder}&filters=${encodeURI(JSON.stringify(payload.filters))}`, requestBody);
    }

    public getReqLogs(id: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`priv/reqLogs?id=${id}`);
    }

    public exportPrivRequests(payload: PaginationModel): Observable<any> {
        return this.httpClient.get(`exportPrivRequests?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField}&sortOrder=${payload.sortOrder}&filters=${encodeURI(JSON.stringify(payload.filters))}`, { observe: 'response', responseType: "blob" });
    }
}
