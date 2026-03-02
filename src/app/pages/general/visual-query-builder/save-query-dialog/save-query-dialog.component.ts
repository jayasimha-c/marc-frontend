import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

export interface SaveQueryDialogData {
  finalJSON: string;
  extractionSQL: string;
  ruleSQL: string;
  tableName: string;
  isEditMode?: boolean;
  defaultName?: string;
  defaultDescription?: string;
}

@Component({
  selector: 'app-save-query-dialog',
  standalone: true,
  imports: [
    CommonModule, NzButtonModule, NzIconModule, ClipboardModule,
    ReactiveFormsModule, NzFormModule, NzInputModule, NzToolTipModule,
  ],
  templateUrl: './save-query-dialog.component.html',
  styleUrls: ['./save-query-dialog.component.scss'],
})
export class SaveQueryDialogComponent implements OnInit {
  copiedMessage = '';
  queryDetailsForm!: FormGroup;

  constructor(
    public modal: NzModalRef,
    @Inject(NZ_MODAL_DATA) public data: SaveQueryDialogData,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.queryDetailsForm = this.fb.group({
      name: [this.data.defaultName || '', [Validators.required]],
      description: [this.data.defaultDescription || '', [Validators.required]],
    });
  }

  onCancel(): void { this.modal.close({ confirmed: false }); }

  onConfirm(): void {
    this.queryDetailsForm.markAllAsTouched();
    if (this.queryDetailsForm.valid) {
      this.modal.close({ confirmed: true, queryDetails: this.queryDetailsForm.value });
    }
  }

  onCopy(type: string): void {
    this.copiedMessage = `${type} copied to clipboard!`;
    setTimeout(() => { this.copiedMessage = ''; }, 2000);
  }

  get formattedJSON(): string {
    try { return JSON.stringify(JSON.parse(this.data.finalJSON), null, 2); }
    catch { return this.data.finalJSON; }
  }
}
