import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ControlSchedulerService {
  private base = `${environment.apiUrl}/icm/schedulers`;

  constructor(private http: HttpClient) {}

  getAll(systemId?: number): Observable<any> {
    let params = new HttpParams();
    if (systemId) params = params.set('systemId', systemId.toString());
    return this.http.get(this.base, { params });
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post(this.base, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }

  enable(id: number): Observable<any> {
    return this.http.put(`${this.base}/${id}/enable`, {});
  }

  disable(id: number): Observable<any> {
    return this.http.put(`${this.base}/${id}/disable`, {});
  }

  execute(id: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/execute`, {});
  }

  addControlBook(schedulerId: number, bookId: number): Observable<any> {
    return this.http.post(`${this.base}/${schedulerId}/books/${bookId}`, {});
  }

  removeControlBook(schedulerId: number, bookId: number): Observable<any> {
    return this.http.delete(`${this.base}/${schedulerId}/books/${bookId}`);
  }

  addControl(schedulerId: number, controlId: number): Observable<any> {
    return this.http.post(`${this.base}/${schedulerId}/controls/${controlId}`, {});
  }

  removeControl(schedulerId: number, controlId: number): Observable<any> {
    return this.http.delete(`${this.base}/${schedulerId}/controls/${controlId}`);
  }
}
