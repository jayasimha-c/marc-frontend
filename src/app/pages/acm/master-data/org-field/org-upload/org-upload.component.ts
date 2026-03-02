import { Component, OnInit } from '@angular/core';
import { OrgFieldService } from '../org-field.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-org-upload',
  templateUrl: './org-upload.component.html',
  styleUrls: ['./org-upload.component.scss'],
})
export class OrgUploadComponent implements OnInit {
  sapSystemList: any[] = [];
  selectedSapSystem: string = '';
  uploadProgress = false;
  uploadSuccess = false;
  selectedFile: File | null = null;

  constructor(
    private orgFieldService: OrgFieldService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.orgFieldService.getSAPSystems().subscribe({
      next: (res) => { this.sapSystemList = res.data || []; },
      error: () => { this.sapSystemList = []; },
    });
  }

  downloadTemplate(): void {
    const link = document.createElement('a');
    link.href = 'assets/templates/OrgFieldsSample.xlsx';
    link.download = 'OrgFieldsSample.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    this.uploadSuccess = false;

    if (!this.validateFile(file)) {
      event.target.value = '';
      return;
    }

    if (!this.selectedSapSystem) {
      this.notificationService.error('Please select a SAP System before uploading');
      event.target.value = '';
      return;
    }

    this.selectedFile = file;
    this.uploadProgress = true;

    const formData = new FormData();
    formData.append('fileUpload', file);
    formData.append('sapSystemId', this.selectedSapSystem);

    this.orgFieldService.uploadOrgFields(formData).subscribe({
      next: (res) => {
        this.uploadProgress = false;
        if (res.data?.error === false) {
          this.uploadSuccess = true;
          this.notificationService.success('Organization fields uploaded successfully');
          event.target.value = '';
          this.selectedFile = null;
          setTimeout(() => { this.uploadSuccess = false; }, 5000);
        } else {
          this.notificationService.error(res.data?.message || 'Upload failed');
          event.target.value = '';
          this.selectedFile = null;
        }
      },
      error: (err) => {
        this.uploadProgress = false;
        this.notificationService.error(err.error?.message || 'Upload failed. Please try again.');
        event.target.value = '';
        this.selectedFile = null;
      },
    });
  }

  private validateFile(file: File): boolean {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.xlsx', '.xls'].includes(ext)) {
      this.notificationService.error('Please upload only Excel files (.xlsx, .xls)');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.notificationService.error('File size must be less than 10MB');
      return false;
    }
    return true;
  }
}
