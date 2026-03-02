import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class SetupService {
    constructor(private http: HttpClient) { }

    getReviewRule(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('pamreviewrule/get');
    }

    saveReviewRule(payload: any[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('pamreviewrule/save', payload);
    }

    deleteReviewRule(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`pamreviewrule/delete?id=${id}`);
    }

    getPamReason(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('pamreason/get');
    }

    savePamReason(payload: any[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('pamreason/save', payload);
    }

    deletePamReason(id: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`pamreason/delete?id=${id}`);
    }

    getScheduleJobs(payload: any): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`priv_schedule/jobs?first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField}&sortOrder=${payload.sortOrder}&filters=${encodeURI(JSON.stringify(payload.filters))}`);
    }

    getScheduleLogs(payload: any, sapId: any, jobId: any): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`priv_schedule/logs?first=${payload.first}&rows=${payload.rows}&sortField=${payload.sortField}&sortOrder=${payload.sortOrder}&filters=${encodeURI(JSON.stringify(payload.filters))}&sapId=${sapId}&jobId=${jobId}`);
    }

    privScheduleStartJob(id: any): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`priv_schedule/startJob?sapId=${id}`);
    }

    getPrivSchedule(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`priv_schedule/list`);
    }

    savePriv_schedule(payload: any): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`priv_schedule/save`, payload);
    }

    deletePrivSchedule(id: any): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`priv_schedule/delete?id=${id}`);
    }
}


