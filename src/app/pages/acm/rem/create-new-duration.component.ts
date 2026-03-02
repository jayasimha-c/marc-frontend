import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { formatDate } from '@angular/common';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { RemService } from './rem.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-create-new-duration',
  templateUrl: './create-new-duration.component.html',
})
export class CreateNewDurationComponent implements OnInit {
  form!: FormGroup;
  sapSystemList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private modalRef: NzModalRef,
    private remService: RemService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      fromDateStr: [null, [Validators.required]],
      sapSystemId: [null, [Validators.required]],
    });
    this.loadSapSystems();
  }

  private loadSapSystems(): void {
    this.remService.getSapSystems().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.sapSystemList = resp.data;
        }
      },
      error: (err) => this.notify.handleHttpError(err),
    });
  }

  save(): void {
    Object.values(this.form.controls).forEach((c) => {
      c.markAsDirty();
      c.updateValueAndValidity();
    });
    if (this.form.invalid) return;

    const val = this.form.value;
    const payload = {
      fromDateStr: formatDate(val.fromDateStr, 'dd/MM/yyyy', 'en'),
      sapSystemId: val.sapSystemId,
    };
    this.remService.addDurConfig(payload).subscribe({
      next: (resp) => {
        if (resp.success) this.notify.success('Duration created successfully');
        this.modalRef.close(true);
      },
      error: (err) => this.notify.handleHttpError(err),
    });
  }

  close(): void {
    this.modalRef.close();
  }
}
