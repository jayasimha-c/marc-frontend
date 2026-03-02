import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { OrgFieldService } from '../../org-field.service';

@Component({
  standalone: false,
  selector: 'app-initialize-dialog',
  templateUrl: './initialize-dialog.component.html',
})
export class InitializeDialogComponent implements OnInit {
  sapSystemList: any[] = [];
  loading = false;

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

  onConfirm(): void {
    if (this.form.valid) {
      this.modal.close(this.form.get('sapSystem')?.value);
    }
  }
}
