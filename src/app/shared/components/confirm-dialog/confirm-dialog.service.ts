import { Injectable } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from './confirm-dialog.component';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmBtnText?: string;
  cancelBtnText?: string;
  checkbox?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  constructor(private modalService: NzModalService) {}

  confirm(data: ConfirmDialogData): Observable<any> {
    return new Observable(observer => {
      const modal = this.modalService.create({
        nzContent: ConfirmDialogComponent,
        nzData: data,
        nzFooter: null,
        nzClosable: false,
        nzMaskClosable: false,
        nzWidth: 480,
        nzCentered: true
      });

      modal.afterClose.subscribe(result => {
        observer.next(result === undefined ? false : result);
        observer.complete();
      });
    });
  }
}
