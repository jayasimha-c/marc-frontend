import { Component } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-audit-export',
  templateUrl: './export.component.html',
})
export class ExportComponent {

  constructor(private router: Router, public modal: NzModalRef) {}

  redirect(): void {
    this.router.navigateByUrl('admin/audit-logs/excel-download');
    this.modal.close();
  }
}
