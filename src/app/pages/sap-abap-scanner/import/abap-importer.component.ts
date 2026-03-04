import { Component, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AbapService } from '../abap.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FileSaverService } from '../../../core/services/file-saver.service';
import { AbapImportMode } from './abap-import.model';
import { AbapImporterDialogComponent } from './abap-importer-dialog.component';

@Component({
  standalone: false,
  selector: 'app-abap-importer',
  templateUrl: './abap-importer.component.html',
  styleUrls: ['./abap-importer.component.scss'],
})
export class AbapImporterComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  uploadProgress: { [key: string]: boolean } = {};
  uploadSuccess: { [key: string]: boolean } = {};
  selectedFiles: { [key: string]: File } = {};

  readonly AbapImportMode = AbapImportMode;

  constructor(
    private abapService: AbapService,
    private notification: NotificationService,
    private fileSaverService: FileSaverService,
    private modal: NzModalService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Template downloads via server-side export
  downloadPatternTemplate(): void {
    this.abapService.exportExcel('pattern').pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => this.saveBlob(blob, 'DetectionPatternTemplate.xlsx'),
      error: () => this.notification.error('Failed to download template'),
    });
  }

  downloadRulesTemplate(): void {
    this.abapService.exportRulesReport().pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => this.saveBlob(blob, 'RulesTemplate.xlsx'),
      error: () => this.notification.error('Failed to download template'),
    });
  }

  downloadImportTemplate(): void {
    this.abapService.downloadImportTemplateExcel().pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => this.saveBlob(blob, 'ImportTemplate.xlsx'),
      error: () => this.notification.error('Failed to download template'),
    });
  }

  private saveBlob(blob: Blob, filename: string): void {
    this.fileSaverService.saveExcel(filename.replace('.xlsx', ''), blob);
    this.notification.success('Template downloaded');
  }

  // File selection and upload
  onFileChanged(event: Event, uploadType: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadSuccess[uploadType] = false;

    if (!this.validateFile(file)) {
      input.value = '';
      return;
    }

    this.selectedFiles[uploadType] = file;
    this.uploadProgress[uploadType] = true;

    const mode = uploadType === 'overwrite' ? AbapImportMode.REPLACE : AbapImportMode.APPEND;

    const dialogRef = this.modal.create({
      nzContent: AbapImporterDialogComponent,
      nzWidth: '95vw',
      nzData: { file, mode },
      nzFooter: null,
      nzMaskClosable: false,
      nzClosable: false,
      nzClassName: 'abap-importer-dialog-modal',
    });

    dialogRef.afterClose.pipe(takeUntil(this.destroy$)).subscribe((result) => {
      this.uploadProgress[uploadType] = false;

      if (result?.success) {
        this.uploadSuccess[uploadType] = true;
        this.notification.success('ABAP data import completed successfully');
        this.clearFileInput(uploadType, input);
        setTimeout(() => (this.uploadSuccess[uploadType] = false), 5000);
      } else {
        this.clearFileInput(uploadType, input);
      }
    });
  }

  private validateFile(file: File): boolean {
    const validExtensions = ['.xlsx', '.xls'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      this.notification.error('Please upload only Excel files (.xlsx, .xls)');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.notification.error('File size must be less than 10MB');
      return false;
    }
    return true;
  }

  getFileName(uploadType: string): string {
    return this.selectedFiles[uploadType]?.name || '';
  }

  private clearFileInput(uploadType: string, input: HTMLInputElement): void {
    input.value = '';
    delete this.selectedFiles[uploadType];
  }
}
