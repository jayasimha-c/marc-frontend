import { Component } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { ControlFrameworkService } from './control-framework.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-control-framework-import',
  templateUrl: './control-framework-import.component.html',
})
export class ControlFrameworkImportComponent {
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  errorMessage = '';
  successMessage = '';

  beforeUpload = (file: NzUploadFile): boolean => {
    const raw = file as any;
    if (!this.cfService.validateYamlFile(raw)) {
      this.errorMessage = 'Please select a valid YAML file (.yml or .yaml)';
      this.notify.error('Invalid file type. Please select a YAML file.');
      return false;
    }
    this.selectedFile = raw;
    this.errorMessage = '';
    return false;
  };

  constructor(
    private cfService: ControlFrameworkService,
    private notify: NotificationService,
    public modal: NzModalRef,
  ) {}

  removeFile(): void {
    this.selectedFile = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  getProgressStatus(): string {
    if (this.uploadProgress < 50) return 'Uploading file...';
    if (this.uploadProgress < 90) return 'Parsing framework structure...';
    return 'Finalizing import...';
  }

  onImport(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;
    this.errorMessage = '';
    this.successMessage = '';

    this.cfService.importFramework(this.selectedFile).subscribe({
      next: (result) => {
        if (result && 'progress' in result && result.progress < 100) {
          this.uploadProgress = result.progress;
        } else if (result && 'success' in result) {
          this.isUploading = false;
          this.uploadProgress = 100;
          if (result.success) {
            this.successMessage = 'Framework imported successfully!';
            setTimeout(() => this.modal.close(result), 1500);
          } else {
            this.errorMessage = result.message || 'Import failed';
          }
        }
      },
      error: () => {
        this.isUploading = false;
        this.errorMessage = 'Import failed. Please try again.';
      },
    });
  }
}
