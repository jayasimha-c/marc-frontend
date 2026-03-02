import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';

export interface ContentType {
  id: string;
  name: string;
  description: string;
}

export interface ImportResult {
  success: boolean;
  fileName: string;
  contentType: string;
  importMode: string;
  recordsImported: number;
  recordsSkipped: number;
  recordsUpdated: number;
  recordsDeleted: number;
  duration: number;
  importedBy: string;
  importedAt: Date;
  error?: string;
}

export interface PreviewResult {
  success: boolean;
  fileName: string;
  contentType: string;
  totalRecords: number;
  existingRecords: number;
  previewData: any[];
}

export interface ImportError {
  recordIndex: number;
  recordIdentifier: string;
  errorType: string;
  field?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContentImportService {
  private baseUrl = 'admin/contentImport';

  constructor(private httpClient: HttpClient) {}

  getContentTypes(): Observable<ApiResponse> {
    return this.httpClient.get<ApiResponse>(`${this.baseUrl}/types`);
  }

  previewFile(file: File, contentType: string, limit: number = 10): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentType', contentType);
    formData.append('limit', limit.toString());
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/preview`, formData);
  }

  importFile(file: File, contentType: string, importMode: string): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentType', contentType);
    formData.append('importMode', importMode);
    return this.httpClient.post<ApiResponse>(`${this.baseUrl}/import`, formData);
  }
}
