import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { BusinessProcessService } from '../../business-process.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-node-dialog',
  templateUrl: './add-node-dialog.component.html',
})
export class AddNodeDialogComponent implements OnInit {
  form!: FormGroup;
  isSaving = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public data: any,
    public modal: NzModalRef,
    private fb: FormBuilder,
    private bpService: BusinessProcessService,
    private notificationService: NotificationService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
    });
  }

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.node) {
      this.form.patchValue({ name: this.data.node.name });
    }
  }

  get parentProcessName(): string | null {
    return this.data.nodeType === 'subprocess' && this.data.parentProcess
      ? this.data.parentProcess.name
      : null;
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isSaving = true;
    const payload: any = {
      name: this.form.get('name')!.value.trim(),
      type: this.data.nodeType,
    };

    if (this.data.mode === 'edit' && this.data.node) {
      payload.id = this.data.node.id;
    }

    if (this.data.nodeType === 'subprocess') {
      payload.parentId = this.data.mode === 'edit' && this.data.node
        ? this.data.node.parentId
        : this.data.parentProcess?.id;
    }

    this.bpService.saveProcessNode(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.notificationService.success(res.message || 'Saved successfully');
          this.modal.close(true);
        } else {
          this.notificationService.error(res.message || 'Save failed');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.notificationService.error(err.error?.message || 'Failed to save');
      },
    });
  }
}
