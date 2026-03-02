import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

@Injectable({ providedIn: 'root' })
export class TeamsActivityService {
  private baseUrl = 'teams-activity';

  constructor(private httpClient: HttpClient) {}

  getFiltered(request: any): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/getFiltered`, request);
  }
}
