import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ControlBookService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(`${this.base}/icm/control-books`);
  }

  getActive(): Observable<any> {
    return this.http.get(`${this.base}/icm/control-books/active`);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.base}/icm/control-books/${id}`);
  }

  create(book: any): Observable<any> {
    return this.http.post(`${this.base}/icm/control-books`, book);
  }

  update(id: number, book: any): Observable<any> {
    return this.http.put(`${this.base}/icm/control-books/${id}`, book);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.base}/icm/control-books/${id}`);
  }

  getControls(bookId: number): Observable<any> {
    return this.http.get(`${this.base}/icm/control-books/${bookId}/controls`);
  }

  addControl(bookId: number, controlId: number): Observable<any> {
    return this.http.post(`${this.base}/icm/control-books/${bookId}/controls/${controlId}`, {});
  }

  removeControl(bookId: number, controlId: number): Observable<any> {
    return this.http.delete(`${this.base}/icm/control-books/${bookId}/controls/${controlId}`);
  }

  activate(id: number): Observable<any> {
    return this.http.put(`${this.base}/icm/control-books/${id}/activate`, {});
  }

  deactivate(id: number): Observable<any> {
    return this.http.put(`${this.base}/icm/control-books/${id}/deactivate`, {});
  }

  getAllControls(): Observable<any> {
    return this.http.get(`${this.base}/icm/controls/table-full`);
  }
}
