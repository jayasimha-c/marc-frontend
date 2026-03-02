import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

export interface Framework {
  id: string;
  name: string;
  refId?: string;
  provider?: string;
  version?: string;
  description?: string;
}

export interface RequirementNode {
  id: string;
  name: string;
  refId?: string;
  description?: string;
  parentId?: string;
  children?: RequirementNode[];
  frameworkId: string;
  level?: number;
  status?: 'compliant' | 'non-compliant' | 'partial' | 'not-assessed';
  priority?: 'high' | 'medium' | 'low';
  criticality?: string;
  significance?: string;
  implementationGuidance?: string;
  testingProcedures?: string;
  mappings?: { framework: string; reference: string }[];
}

export interface ImportResult {
  success: boolean;
  message: string;
  frameworkId?: string;
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'parsing' | 'finalizing' | 'complete' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ControlFrameworkService {

  constructor(private http: HttpClient) {}

  getFrameworks(): Observable<any> {
    return this.http.get<any>('control-frameworks').pipe(
      catchError(() => of([]))
    );
  }

  getFrameworksRequirementsById(frameworkId: string): Observable<any> {
    return this.http.get<any>(`control-frameworks/${frameworkId}/requirements`).pipe(
      catchError(() => of([]))
    );
  }

  getFrameworksRequirements(params: TableQueryParams): Observable<any> {
    const pageIndex = params.pageIndex || 1;
    const pageSize = params.pageSize || 10;
    const first = (pageIndex - 1) * pageSize;
    const sortField = params.sort?.field || '';
    const sortOrder = params.sort?.direction === 'descend' ? -1 : 1;
    const filters = params.filters ? encodeURIComponent(JSON.stringify(params.filters)) : encodeURIComponent('{}');

    return this.http.get<any>(
      `controls/all?first=${first}&rows=${pageSize}&page=${pageIndex}&sortOrder=${sortOrder}&sortField=${sortField}&filters=${filters}`
    ).pipe(catchError(() => of([])));
  }

  getFrameworkStats(): Observable<any> {
    return this.http.get<any>('control-frameworks/stat');
  }

  getControlStat(): Observable<any> {
    return this.http.get<any>('controls/stat');
  }

  importFramework(file: File): Observable<UploadProgress | ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImportResult>('control-frameworks/import', formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round(100 * event.loaded / event.total);
          let status: UploadProgress['status'] = 'uploading';
          if (progress < 50) status = 'uploading';
          else if (progress < 90) status = 'parsing';
          else status = 'finalizing';
          return { progress, status } as UploadProgress;
        } else if (event instanceof HttpResponse) {
          return { ...event.body, progress: 100, status: 'complete' } as ImportResult;
        }
        return null;
      }),
      catchError(error => of({
        success: false,
        message: error.error?.message || 'Import failed. Please try again.',
        progress: 0,
        status: 'error'
      } as ImportResult)),
      map(result => result as UploadProgress | ImportResult)
    );
  }

  deleteFramework(id: string): Observable<any> {
    return this.http.get<any>(`control-frameworks/delete?frameworkId=${id}`);
  }

  validateYamlFile(file: File): boolean {
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return ['.yml', '.yaml'].includes(ext);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
