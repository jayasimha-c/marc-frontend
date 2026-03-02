import { Component, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  standalone: false,
  selector: 'app-import-error-dialog',
  templateUrl: './import-error-dialog.component.html',
})
export class ImportErrorDialogComponent {
  constructor(
    @Inject(NZ_MODAL_DATA) public data: { title: string; errorMessages: string[] },
    private modalRef: NzModalRef,
  ) {}

  close(): void {
    this.modalRef.close();
  }
}
