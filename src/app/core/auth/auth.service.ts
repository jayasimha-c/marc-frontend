import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, throwError, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { User } from '../models/user';
import { AuthUtils } from './auth.utils';
import { UserService } from '../services/user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _authenticated = false;

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) { }

  get accessToken(): string | null {
    const token = localStorage.getItem('accessToken');
    return token === 'undefined' ? null : token;
  }

  set accessToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  private storeUserData(userData: User): void {
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  private getStoredUserData(): User | null {
    const data = localStorage.getItem('userData');
    if (data && data !== 'undefined') {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  }

  private clearStoredUserData(): void {
    localStorage.removeItem('userData');
    localStorage.removeItem('user');
  }

  forgotPassword(username: string, email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${environment.apiUrl}/auth/forgot-password?username=${username}&email=${email}`,
      null
    );
  }

  resetPassword(password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, password);
  }

  resetPasswordInitial(username: string, newPassword: string, confirmPassword: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${environment.apiUrl}/auth/reset-password`, {
      username,
      newPassword,
      confirmPassword,
    });
  }

  applyResetPasswordToken(token: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${environment.apiUrl}/auth/forgot/apply?token=${token}`, null);
  }

  reportingUnits(credentials: { username: string; password: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${environment.apiUrl}/auth/reporting-units`, credentials);
  }

  signIn(credentials: { username: string; password: string; reportingUnit?: string }): Observable<any> {
    if (this._authenticated) {
      return throwError(() => 'User is already logged in.');
    }

    return this.http.post(`${environment.apiUrl}/auth/sign-in`, credentials).pipe(
      switchMap((response: any) => {
        const data = response.data;
        this.accessToken = data.accessToken;

        const userData: User = {
          id: data.id,
          username: data.username,
          email: data.email,
          roles: data.roles || [],
          authorities: data.authorities || data.roles || [],
        };

        this.userService.user = userData;
        this._authenticated = true;
        this.storeUserData(userData);

        if (credentials.reportingUnit) {
          localStorage.setItem('reportingUnit', credentials.reportingUnit);
          const ruName = data.reportingUnits?.find((i: any) => i.id == credentials.reportingUnit)?.name;
          if (ruName) {
            localStorage.setItem('reportingUnitName', ruName);
          }
        }

        return of(response);
      })
    );
  }

  signInUsingToken(): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/auth/sign-in-with-token`, { accessToken: this.accessToken })
      .pipe(
        catchError(() => of(false)),
        switchMap((response: any) => {
          if (!response || response.data == null) {
            return of(false);
          }
          if (response.data.accessToken) {
            this.accessToken = response.data.accessToken;
          }

          this._authenticated = true;
          const userData: User = {
            id: response.data.id,
            username: response.data.username,
            email: response.data.email,
            roles: response.data.roles || [],
            authorities: response.data.authorities || response.data.roles || [],
          };
          this.userService.setUserWithParams(userData);
          return of(true);
        })
      );
  }

  signOut(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/sign-out`, {}).pipe(
      catchError(() => of(true)),
      switchMap(() => {
        this._authenticated = false;
        localStorage.removeItem('accessToken');
        this.clearStoredUserData();
        return of(true);
      })
    );
  }

  signUp(user: { name: string; email: string; password: string; company: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/sign-up`, user);
  }

  unlockSession(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/unlock-session`, credentials);
  }

  check(): Observable<boolean> {
    if (this._authenticated) {
      return of(true);
    }

    if (!this.accessToken) {
      return of(false);
    }

    if (AuthUtils.isTokenExpired(this.accessToken)) {
      this.clearStoredUserData();
      return of(false);
    }

    const storedUser = this.getStoredUserData();
    if (storedUser) {
      this._authenticated = true;
      this.userService.user = storedUser;
      return of(true);
    }

    return this.signInUsingToken();
  }

  getLicense(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${environment.apiUrl}/auth/license`);
  }

  applyLicense(licenseKey: string): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('licenseKey', licenseKey);
    return this.http.post<ApiResponse>(`${environment.apiUrl}/auth/apply-license`, formData);
  }
}
