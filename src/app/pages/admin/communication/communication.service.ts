import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../../../core/models/api-response';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CommunicationService {
  constructor(private httpClient: HttpClient) {}

  // ── Email Settings ──────────────────────────────────────

  getMailForm(): Observable<any> {
    return this.httpClient.get('sys/mailform');
  }

  testMail(): Observable<any> {
    return this.httpClient.get('sys/testmail');
  }

  testMessage(emailId: string): Observable<any> {
    return this.httpClient.post(`sys/testmessage?recipient=${emailId}`, {});
  }

  saveMail(payload: any): Observable<any> {
    return this.httpClient.post('sys/savemail', payload);
  }

  // ── Email Logs ──────────────────────────────────────────

  getMailLogs(params: {
    first: number;
    rows: number;
    sortOrder: number;
    sortField: string;
    filters: Record<string, any>;
  }): Observable<ApiResponse> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.httpClient.get<ApiResponse>(
      `sys/getMailLogs?first=${params.first}&rows=${params.rows}` +
      `&sortOrder=${params.sortOrder}&sortField=${params.sortField}` +
      `&filters=${encodeURI(JSON.stringify(params.filters))}&timeZone=${timeZone}`
    );
  }

  // ── Template ────────────────────────────────────────────

  getReqDataForTemplate(): Observable<any> {
    return this.httpClient.get('sys/templateedit');
  }

  getCurrentTemplate(templateName: string): Observable<any> {
    return this.httpClient.get(`sys/getCurrentTemplate?templateName=${templateName}`);
  }

  saveCurrentTemplate(template: string, text1: string, text2: string): Observable<any> {
    return this.httpClient.post(
      `sys/submitTemplate?template=${template}&text1=${text1}&text2=${text2}`, {}
    );
  }

  // ── Logo ────────────────────────────────────────────────

  getLogo(): Observable<any> {
    return this.httpClient.get('sys/getLogo');
  }

  getLogoContent(attachmentId: number): Observable<any> {
    return this.httpClient.get(`sys/getLogoContent?id=${attachmentId}`, {
      responseType: 'blob' as 'json',
    });
  }

  uploadLogo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpClient.post('sys/uploadLogo', formData);
  }

  saveLogo(attachmentId: number): Observable<any> {
    return this.httpClient.post(`sys/saveLogo?attachment_id=${attachmentId}`, {});
  }
}
