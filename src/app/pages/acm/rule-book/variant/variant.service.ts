import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VariantService {

  constructor(private http: HttpClient) {}

  // ── Variant Rules ────────────────────────────────────────

  variantRuleRequiredInfo(): Observable<any> {
    return this.http.get('favoratesrules');
  }

  variantGetRules(systemType: string): Observable<any> {
    return this.http.get(`favoratesrules/rules?systemType=${systemType}`);
  }

  getVariantRules(id: number): Observable<any> {
    return this.http.get(`favoratesrules/find/${id}`);
  }

  deleteVariantRules(id: number): Observable<any> {
    return this.http.get(`favoratesrules/delete/${id}`);
  }

  saveOrUpdateVariantRule(data: any): Observable<any> {
    return this.http.post('favoratesrules/save', data);
  }

  // ── Variant Risks ────────────────────────────────────────

  variantRiskRequiredInfo(): Observable<any> {
    return this.http.get('favoratesrisks');
  }

  variantGetRisks(systemType: string): Observable<any> {
    return this.http.get(`favoratesrisks/risks?systemType=${systemType}`);
  }

  getVariantRisk(id: number): Observable<any> {
    return this.http.get(`favoratesrisks/find/${id}`);
  }

  deleteVariantRisk(id: number): Observable<any> {
    return this.http.get(`favoratesrisks/delete/${id}`);
  }

  saveOrUpdateVariantRisk(data: any): Observable<any> {
    return this.http.post('favoratesrisks/save', data);
  }
}
