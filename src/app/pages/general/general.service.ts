import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { TableQueryParams } from "../../../app/shared/components/advanced-table/advanced-table.models";

// A mock ApiResponse for migration mapping
export interface ApiResponse {
    success: boolean;
    message: string;
    data: any;
}

export interface ApiRespModel {
    success: boolean;
    message: string;
    data: any | { rows: any[]; records: number };
}

@Injectable({ providedIn: "root" })
export class GeneralService {
    constructor(private _httpClient: HttpClient) { }

    // Issue endpoints
    public getIssues(): Observable<ApiRespModel> {
        return this._httpClient.get<ApiRespModel>(`general/getIssues`);
    }

    public createIssue(requestIssue: any): Observable<ApiResponse> {
        return this._httpClient.post<ApiResponse>(`general/createIssue`, requestIssue);
    }

    /**
     * Fetches available JIRA issue types from the configured backend.
     * Returns Task, Bug, and Story types dynamically from the JIRA project.
     */
    public getIssueTypes(): Observable<ApiResponse> {
        return this._httpClient.get<ApiResponse>(`general/getIssueTypes`);
    }

    // Export Results endpoints
    public getExportResults(params: TableQueryParams): Observable<ApiRespModel> {
        let pageIndex = params.pageIndex || 1;
        let pageSize = params.pageSize || 10;
        let first = (pageIndex - 1) * pageSize;
        let rows = pageSize;

        let sortField = params.sort?.field || 'startedOn';
        let sortOrder = params.sort?.direction === 'descend' ? -1 : 1;

        const filters = params.filters ? encodeURI(JSON.stringify(params.filters)) : encodeURI('{}');

        return this._httpClient.get<ApiRespModel>(
            `batch/getJobs?timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&first=${first}&rows=${rows}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${filters}`
        );
    }

    public downloadReport(jobId: any, reportType: any, id: any): Observable<any> {
        let url = `batch/downloadReport?reportType=${reportType}&batchJobId=${id}`;
        if (jobId != null) {
            url += `&jobId=${jobId}`;
        }
        return this._httpClient.get(url, { observe: 'response', responseType: "blob" });
    }

    public batchRemove(jobId: any, reportType: any, id: any): Observable<ApiRespModel> {
        let url = `batch/remove?reportType=${reportType}&batchJobId=${id}`;
        if (jobId != null) {
            url += `&jobId=${jobId}`;
        }
        return this._httpClient.get<ApiRespModel>(url);
    }

}
