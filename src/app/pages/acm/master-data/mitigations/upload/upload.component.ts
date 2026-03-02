import { Component, OnInit } from '@angular/core';
import { MitigationsService } from '../mitigations.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-mitigation-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
})
export class MitigationUploadComponent implements OnInit {
  sapSystemList: any[] = [];
  selectedSapSystem = '';
  uploadProgress: { [key: string]: boolean } = {};
  uploadSuccess: { [key: string]: boolean } = {};
  selectedFiles: { [key: string]: File } = {};

  templateList = [
    {
      name: 'Mitigations Template',
      value: 'MitigationSample.xlsx',
      uploadBtnName: 'Upload Mitigations',
      icon: 'file-text',
      description: 'Upload mitigation controls and their details',
    },
    {
      name: 'Mitigation Users Template',
      value: 'MitigationUsersSample.xlsx',
      uploadBtnName: 'Upload Mitigation Users',
      icon: 'team',
      description: 'Upload users assigned to mitigations',
    },
    {
      name: 'Mitigation Owners Template',
      value: 'MitigationOwnersSample.xlsx',
      uploadBtnName: 'Upload Mitigation Owners',
      icon: 'user',
      description: 'Upload mitigation control owners',
    },
  ];

  constructor(
    private mitigationsService: MitigationsService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.mitigationsService.getRequiredInfo().subscribe((res) => {
      if (res.data) {
        this.sapSystemList = res.data.map((o: any) => ({ id: o.id, name: o.destinationName }));
      }
    });
  }

  downloadTemplate(name: string): void {
    const link = document.createElement('a');
    link.setAttribute('type', 'hidden');
    link.href = `assets/templates/${name}`;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  onFileChanged(event: any, templateName: string): void {
    const file: File = event.target.files[0];
    if (!file) return;

    this.uploadSuccess[templateName] = false;

    if (!this.selectedSapSystem) {
      this.notificationService.error('Please select SAP System first');
      event.target.value = '';
      return;
    }

    if (!this.validateFile(file)) {
      event.target.value = '';
      return;
    }

    this.selectedFiles[templateName] = file;
    this.uploadProgress[templateName] = true;

    const formData = new FormData();
    formData.append('fileUpload', file);
    formData.append('sapSystemId', this.selectedSapSystem);

    this.mitigationsService.uploadMitigationFiles(formData, templateName).subscribe({
      next: (res) => {
        this.uploadProgress[templateName] = false;
        this.uploadSuccess[templateName] = true;
        this.notificationService.success(res.data?.message || 'File uploaded successfully');
        event.target.value = '';
        delete this.selectedFiles[templateName];
        setTimeout(() => { this.uploadSuccess[templateName] = false; }, 5000);
      },
      error: (err) => {
        this.uploadProgress[templateName] = false;
        this.notificationService.error(err.error?.message || 'Upload failed. Please try again.');
        event.target.value = '';
        delete this.selectedFiles[templateName];
      },
    });
  }

  validateFile(file: File): boolean {
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension.toLowerCase())) {
      this.notificationService.error('Please upload only Excel files (.xlsx, .xls)');
      return false;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.notificationService.error('File size must be less than 10MB');
      return false;
    }
    return true;
  }

  getFileName(templateValue: string): string {
    const file = this.selectedFiles[templateValue];
    return file ? file.name : '';
  }
}
