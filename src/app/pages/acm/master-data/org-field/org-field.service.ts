import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface ApiResponse {
  success: boolean;
  data: any;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class OrgFieldService {

  constructor(private http: HttpClient) {}

  // ── ORG Fields ──

  getOrgFields(searchText: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`orgField/getAll?searchString=${searchText || ''}`);
  }

  getOrgFieldValues(fieldId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`orgField/getValues?fieldId=${fieldId}`);
  }

  saveOrgFieldValues(payload: { fieldId: number; data: any[] }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('orgField/saveOrgFields', payload);
  }

  addOrEditOrgField(oper: string, payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`orgField/operations?oper=${oper}`, payload);
  }

  deleteOrgField(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`orgField/operations?oper=del&id=${id}`, { id });
  }

  initializeDefaultOrgFields(sapSystemId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`orgField/initializeDefaultOrgFields?sapSystemId=${sapSystemId}`, {});
  }

  downloadOrgFields(sapSystemId: number): Observable<any> {
    return this.http.get(`orgField/exportData?sapSystemId=${sapSystemId}`, {
      responseType: 'arraybuffer',
    });
  }

  uploadOrgFields(formData: FormData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('orgField/uploadOrgFields', formData);
  }

  // ── ORG Names ──

  getOrgNames(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('orgName/get');
  }

  addOrgName(payload: { name: string; description: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('orgName/addOrgNameSave', payload);
  }

  deleteOrgName(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`orgName/deleteOrgName?id=${id}`);
  }

  getOrgNamesBySystem(sapSystemId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`orgName/getOrgNames?sapSystemId=${sapSystemId}`);
  }

  // ── ORG Name Variants ──

  getAllOrgVariants(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('orgName/findAllFavourites');
  }

  getOrgVariant(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`orgName/find/${id}`);
  }

  deleteOrgVariant(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`orgName/favDelete/${id}`);
  }

  saveOrgVariant(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('orgName/save', payload);
  }

  // ── Utility ──

  getSAPSystems(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('util/getSAPSystems');
  }
}
