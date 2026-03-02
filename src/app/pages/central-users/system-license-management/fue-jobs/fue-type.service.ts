import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class FueTypeService {

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>('fueMeasurement/types');
    }

    save(item: any): Observable<ApiResponse> {
        const { status, ...payload } = item;
        return this.http.post<ApiResponse>('fueMeasurement/types/save', payload);
    }

    delete(id: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`fueMeasurement/types/delete?id=${id}`);
    }

    generateAcmMapping(): Observable<ApiResponse> {
        return this.http.post<ApiResponse>('fueMeasurement/fue2acm/generate', {});
    }
}
