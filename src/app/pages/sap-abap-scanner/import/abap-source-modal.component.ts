import { Component, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../core/services/notification.service';

export interface AbapProgramData {
  success: boolean;
  programName: string;
  timestamp: string;
  header: any;
  rawAbapSource: string;
  compressedData: string;
  lineCount: number;
  fileSize: number;
  error?: string;
}

@Component({
  standalone: false,
  selector: 'app-abap-source-modal',
  templateUrl: './abap-source-modal.component.html',
  styleUrls: ['./abap-source-modal.component.scss'],
})
export class AbapSourceModalComponent {

  constructor(
    public modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) public data: AbapProgramData,
    private notification: NotificationService
  ) {}

  close(): void {
    this.modalRef.close();
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  copyToClipboard(): void {
    if (!this.data.rawAbapSource) return;

    navigator.clipboard.writeText(this.data.rawAbapSource).then(
      () => this.notification.success('Code copied to clipboard'),
      () => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = this.data.rawAbapSource;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          this.notification.success('Code copied to clipboard');
        } catch {
          this.notification.error('Failed to copy');
        }
        document.body.removeChild(textArea);
      }
    );
  }

  downloadSource(): void {
    if (!this.data.rawAbapSource) return;

    const blob = new Blob([this.data.rawAbapSource], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.data.programName}.abap`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getSourceLines(): string[] {
    if (!this.data.rawAbapSource) return [];
    return this.data.rawAbapSource.split('\n');
  }
}
