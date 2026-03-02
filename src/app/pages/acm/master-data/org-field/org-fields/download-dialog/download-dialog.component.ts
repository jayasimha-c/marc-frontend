import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { OrgFieldService } from '../../org-field.service';

@Component({
  standalone: false,
  selector: 'app-download-dialog',
  templateUrl: './download-dialog.component.html',
})
export class DownloadDialogComponent implements OnInit {
  sapSystemList: any[] = [];
  loading = false;
  downloading = false;

  form: FormGroup;

  constructor(
    public modal: NzModalRef,
    private orgFieldService: OrgFieldService,
  ) {
    this.form = new FormGroup({
      sapSystem: new FormControl('', Validators.required),
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.orgFieldService.getSAPSystems().subscribe({
      next: (res) => {
        this.sapSystemList = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.sapSystemList = [];
        this.loading = false;
      },
    });
  }

  onDownload(): void {
    if (this.form.invalid) return;

    this.downloading = true;
    const sapSystemId = this.form.get('sapSystem')?.value;

    this.orgFieldService.downloadOrgFields(sapSystemId).subscribe({
      next: (res) => {
        this.downloading = false;
        const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'org-fields.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
        this.modal.close(true);
      },
      error: () => {
        this.downloading = false;
      },
    });
  }
}
