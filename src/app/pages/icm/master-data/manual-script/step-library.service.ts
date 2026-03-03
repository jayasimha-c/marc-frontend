import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface StepLibraryItem {
  id?: number;
  stepName: string;
  category?: string;
  tags?: string;
  stepDescription?: string;
  stepInstructions?: string;
  expectedOutcome?: string;
  expectedResult?: string;
  evidenceType?: string;
  evidenceRequired?: boolean;
  allowedFileTypes?: string;
  maxFileSizeMb?: number;
  estimatedDurationMinutes?: number;
  referenceUrl?: string;
  isActive?: boolean;
  usageCount?: number;
}

@Injectable({ providedIn: 'root' })
export class StepLibraryService {
  private base = `${environment.apiUrl}/icm/step-library`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.base);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }

  getCategories(): Observable<any> {
    return this.http.get(`${this.base}/categories`);
  }

  search(term: string): Observable<any> {
    return this.http.get(`${this.base}/search`, { params: { term } });
  }

  save(step: StepLibraryItem): Observable<any> {
    return this.http.post(this.base, step);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }

  incrementUsage(id: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/use`, {});
  }
}
