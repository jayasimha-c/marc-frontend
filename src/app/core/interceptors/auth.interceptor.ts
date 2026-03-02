import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthUtils } from '../auth/auth.utils';
import { environment } from '../../../environments/environment';

export const AUTHORIZATION_HEADER = 'Authorization';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let newReq = req.clone();

    if (!req.url.startsWith('.') && !req.url.startsWith(environment.apiUrl) && !req.url.startsWith('assets')) {
      newReq = req.clone({ url: `${environment.apiUrl}/${req.url}` });
    }

    if (this.authService.accessToken && !AuthUtils.isTokenExpired(this.authService.accessToken)) {
      newReq = newReq.clone({
        headers: req.headers.set(AUTHORIZATION_HEADER, 'Bearer ' + this.authService.accessToken),
      });
    }

    return next.handle(newReq).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.authService.signOut().subscribe(() => {
            location.reload();
          });
        }
        return throwError(() => error);
      })
    );
  }
}
