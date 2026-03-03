import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { ManualScriptService } from './manual-script.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
  warnings: string[];
}

@Component({
  selector: 'app-script-import-dialog',
  standalone: true,
  imports: [
    CommonModule, NzButtonModule, NzIconModule, NzSpinModule,
    NzUploadModule, NzResultModule, NzAlertModule, NzDividerModule,
  ],
  template: `
    <div *ngIf="!result">
      <nz-upload nzType="drag" [nzBeforeUpload]="beforeUpload" nzAccept=".xlsx,.xls"
        [nzDisabled]="importing" [nzShowUploadList]="false">
        <p class="ant-upload-drag-icon">
          <span nz-icon nzType="inbox"></span>
        </p>
        <p class="ant-upload-text">Click or drag Excel file to this area</p>
        <p class="ant-upload-hint">Accepts .xlsx files</p>
      </nz-upload>

      <nz-alert *ngIf="selectedFile" nzType="info" nzShowIcon style="margin-top: 16px;"
        [nzMessage]="selectedFile.name" nzCloseable (nzOnClose)="clearFile()">
      </nz-alert>

      <div *ngIf="importing" style="text-align: center; padding: 24px;">
        <nz-spin nzSimple></nz-spin>
        <p style="margin-top: 16px;">Importing scripts...</p>
      </div>

      <nz-divider></nz-divider>

      <div style="text-align: center;">
        <p>Need a template? Export existing scripts to get the correct format.</p>
        <button nz-button (click)="downloadTemplate()">
          <span nz-icon nzType="download" nzTheme="outline"></span> Download Template
        </button>
      </div>
    </div>

    <div *ngIf="result">
      <nz-result *ngIf="result.errors.length === 0"
        nzStatus="success" nzTitle="Import Successful"
        [nzSubTitle]="result.created + ' scripts created'">
      </nz-result>
      <nz-result *ngIf="result.errors.length > 0"
        nzStatus="error" nzTitle="Import Failed">
      </nz-result>
      <div *ngIf="result.errors.length > 0" style="max-height: 200px; overflow-y: auto;">
        <nz-alert *ngFor="let err of result.errors" nzType="error" [nzMessage]="err" nzShowIcon style="margin-bottom: 8px;"></nz-alert>
      </div>
      <div *ngIf="result.warnings.length > 0" style="max-height: 150px; overflow-y: auto; margin-top: 16px;">
        <nz-alert *ngFor="let warn of result.warnings" nzType="warning" [nzMessage]="warn" nzShowIcon style="margin-bottom: 8px;"></nz-alert>
      </div>
    </div>

    <div class="modal-footer">
      <ng-container *ngIf="!result">
        <button nz-button (click)="close()" [disabled]="importing">Cancel</button>
        <button nz-button nzType="primary" [disabled]="!selectedFile || importing" (click)="import()" [nzLoading]="importing">
          Import
        </button>
      </ng-container>
      <button *ngIf="result" nz-button nzType="primary" (click)="close()">Close</button>
    </div>
  `,
})
export class ScriptImportDialogComponent {
  selectedFile: NzUploadFile | null = null;
  importing = false;
  result: ImportResult | null = null;

  constructor(
    @Inject(NZ_MODAL_DATA) public data: any,
    private modal: NzModalRef,
    private scriptService: ManualScriptService,
    private notificationService: NotificationService,
  ) {}

  beforeUpload = (file: NzUploadFile): boolean => {
    if (!file.name?.match(/\.(xlsx|xls)$/i)) {
      this.notificationService.error('Please select an Excel file (.xlsx or .xls)');
      return false;
    }
    this.selectedFile = file;
    return false;
  };

  clearFile(): void {
    this.selectedFile = null;
  }

  downloadTemplate(): void {
    this.scriptService.exportToExcel().subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'scripts_template.xlsx'; a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.error('Failed to download template'),
    });
  }

  import(): void {
    if (!this.selectedFile) return;
    this.importing = true;
    const file = this.selectedFile.originFileObj!;
    this.scriptService.importFromExcel(file).subscribe({
      next: res => {
        this.importing = false;
        this.result = res.success && res.data ? res.data : { created: 0, updated: 0, errors: [res.message || 'Import failed'], warnings: [] };
      },
      error: err => {
        this.importing = false;
        this.result = { created: 0, updated: 0, errors: [err.error?.message || 'Import failed'], warnings: [] };
      },
    });
  }

  close(): void {
    this.modal.close(this.result && this.result.created > 0 ? { refreshNeeded: true } : null);
  }
}
