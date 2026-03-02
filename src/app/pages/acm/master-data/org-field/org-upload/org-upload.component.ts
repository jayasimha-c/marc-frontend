import { Component, OnInit } from '@angular/core';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { OrgFieldService } from '../org-field.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-org-upload',
  templateUrl: './org-upload.component.html',
})
export class OrgUploadComponent implements OnInit {
  sapSystemList: any[] = [];
  selectedSapSystem: string = '';
  uploadProgress = false;
  uploadSuccess = false;

  beforeUpload = (file: NzUploadFile): boolean => {
    const raw = file as any;
    if (!this.validateFile(raw)) return false;

    if (!this.selectedSapSystem) {
      this.notificationService.error('Please select a SAP System before uploading');
      return false;
    }

    this.uploadProgress = true;
    this.uploadSuccess = false;

    const formData = new FormData();
    formData.append('fileUpload', raw);
    formData.append('sapSystemId', this.selectedSapSystem);

    this.orgFieldService.uploadOrgFields(formData).subscribe({
      next: (res) => {
        this.uploadProgress = false;
        if (res.data?.error === false) {
          this.uploadSuccess = true;
          this.notificationService.success('Organization fields uploaded successfully');
          setTimeout(() => { this.uploadSuccess = false; }, 5000);
        } else {
          this.notificationService.error(res.data?.message || 'Upload failed');
        }
      },
      error: (err) => {
        this.uploadProgress = false;
        this.notificationService.error(err.error?.message || 'Upload failed. Please try again.');
      },
    });
    return false;
  };

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
