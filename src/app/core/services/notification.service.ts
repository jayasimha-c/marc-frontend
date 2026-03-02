import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private duration = 2500;

  constructor(private notification: NzNotificationService) {}

  success(message: string): void {
    this.notification.success('Success', message, {
      nzDuration: this.duration,
      nzPlacement: 'topRight',
    });
  }

  error(message: string): void {
    this.notification.error('Error', message, {
      nzDuration: this.duration,
      nzPlacement: 'topRight',
    });
  }

  warn(message: string): void {
    this.notification.warning('Warning', message, {
      nzDuration: this.duration,
      nzPlacement: 'topRight',
    });
  }

  info(message: string): void {
    this.notification.info('Info', message, {
      nzDuration: this.duration,
      nzPlacement: 'topRight',
    });
  }

  show(apiResponse: ApiResponse): void {
    if (apiResponse.success) {
      this.success(apiResponse.message);
    } else {
      this.error(apiResponse.message);
    }
  }

  handleHttpError(errorResponse: HttpErrorResponse): void {
    if (errorResponse.status === 400) {
      this.error(errorResponse.error.message != null ? errorResponse.error.message : errorResponse.error);
    } else if (errorResponse.status === 500) {
      this.error('Internal Server error: ' + errorResponse.error);
    } else {
      this.error('Unknown error: ' + errorResponse.error);
    }
  }
}
