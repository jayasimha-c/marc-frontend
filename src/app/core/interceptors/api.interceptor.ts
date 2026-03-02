import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, switchMap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(private message: NzMessageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => this.showUnhandledError(error)),
      switchMap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && event.body && event.body['success'] === false && !event.url?.includes('/public')) {
          const error = new HttpErrorResponse({
            status: 400,
            error: event.body,
            statusText: 'OK',
            headers: event.headers,
            url: event.url ?? undefined,
          });
          this.message.error(event.body['message'] || 'An error occurred');
          return throwError(() => error);
        }
        return of(event);
      })
    );
  }

  private showUnhandledError(error: HttpErrorResponse): Observable<never> {
    if (error.url?.includes('/auth/license')) {
      return throwError(() => error);
    }

    let errorMessage = 'An unexpected error occurred.';
    if (error.error) {
      const errorStr = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
      if (errorStr.includes('<!DOCTYPE') || errorStr.includes('<html')) {
        errorMessage = `Server error (${error.status}). Please try again later.`;
      } else {
        errorMessage = 'Error: ' + errorStr;
      }
    }

    this.message.error(errorMessage);
    return throwError(() => error);
  }
}
