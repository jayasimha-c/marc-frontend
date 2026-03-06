import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({
  providedIn: 'root',
})
export class HanaService {
  constructor(private http: HttpClient) {}

  getAllParameters(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('hana/global-ini/getAllParameters');
  }

  getAllParameterRules(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('hana/global-ini-parameter/getAllParameterRules');
  }
}
