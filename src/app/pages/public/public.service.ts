import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class PublicService {
  constructor(private http: HttpClient) {}

  getSelfServiceDetails(id: string, ruId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${environment.apiUrl}/public/selfservice/${id}?ruId=${ruId}`);
  }

  getPublicBranding(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${environment.apiUrl}/public/branding`);
  }
}
