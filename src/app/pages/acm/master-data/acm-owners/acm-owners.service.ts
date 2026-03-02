import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface ApiResponse {
  success: boolean;
  data: any;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AcmOwnersService {

  constructor(private http: HttpClient) {}

  getOwnerRoles(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('ownerUser');
  }

  getOwnerUsers(first: number, rows: number, sortField: string, sortOrder: number, filters: any, addedCriteria: number[]): Observable<ApiResponse> {
    const params = `first=${first}&rows=${rows}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${encodeURIComponent(JSON.stringify(filters))}&addedCriteria=${encodeURIComponent(JSON.stringify(addedCriteria))}`;
    return this.http.get<ApiResponse>(`ownerUser/getUsers?${params}`);
  }

  autoCompleteUsers(tagName: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`ownerUser/autoCompleteUsers?tagName=${tagName}`);
  }

  findByUsername(username: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`ownerUser/findByUsername/${username}`);
  }

  saveOwnerUser(payload: { username: string; type: any[] }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('ownerUser/saveOwnerUser', payload);
  }
}
