import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RoleCatalogueService } from '../role-catalogue.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-rc-upload-wizard',
  templateUrl: './upload-wizard.component.html',
  styles: [`
    .wizard-summary { display: flex; gap: 16px; margin-bottom: 16px; }
    .wizard-summary-card { flex: 1; border: 1px solid #d9d9d9; border-radius: 4px; padding: 12px; text-align: center; }
    .wizard-summary-card--green { border-color: #52c41a; }
    .wizard-summary-card--red { border-color: #ff4d4f; }
    .wizard-summary-card--blue { border-color: #1890ff; }
    .wizard-summary-label { font-size: 12px; color: #8c8c8c; }
    .wizard-summary-value { font-size: 20px; font-weight: 600; }
    .wizard-summary-value--green { color: #52c41a; }
    .wizard-summary-value--red { color: #ff4d4f; }
    .wizard-summary-value--blue { color: #1890ff; }
    .wizard-result { text-align: center; padding: 40px 0; }
    .wizard-result-icon { font-size: 64px; }
    .wizard-result-title { font-size: 18px; font-weight: 600; margin-top: 16px; }
    .wizard-nav { text-align: right; margin-top: 16px; }
    .wizard-nav button { margin-left: 8px; }
    .field-summary-table { width: 100%; max-width: 400px; margin: 16px auto 0; }
    .field-summary-table th, .field-summary-table td { padding: 6px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
    .field-summary-table th { font-size: 12px; color: #8c8c8c; }
    .field-summary-table td:last-child { text-align: right; }
  `],
})
export class UploadWizardComponent implements OnInit {
  currentStep = 0;
  sapSysList: any[] = [];
  session: any = null;
  isUploading = false;
  isProcessing = false;
  uploadedFileName = '';
  fieldChangeSummary: any = null;

  form: FormGroup;

  // Staging preview
  stagingData: any[] = [];
  stagingTotal = 0;
  stagingPageIndex = 1;
  stagingPageSize = 10;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private notificationService: NotificationService,
    private rcService: RoleCatalogueService,
  ) {
    this.form = this.fb.group({
      sapSystemId: ['', [Validators.required]],
      uploadMode: ['APPEND', [Validators.required]],
      uploadType: ['ATTRIBUTES', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.rcService.getUtilSystems().subscribe({
      next: (res: any) => { this.sapSysList = res.data || []; },
    });
  }

  get attributesMode(): boolean {
    return (this.session?.uploadType || this.form.get('uploadType')!.value) === 'ATTRIBUTES';
  }

  get stagingColumns(): { field: string; header: string }[] {
    if (this.attributesMode) {
      return [
        { field: 'rowNum', header: 'Row #' },
        { field: 'status', header: 'Status' },
        { field: 'roleName', header: 'Role Name' },
        { field: 'businessProcess', header: 'Business Process' },
        { field: 'department', header: 'Department' },
        { field: 'criticality', header: 'Criticality' },
        { field: 'errorMessage', header: 'Error' },
      ];
    }
    return [
      { field: 'rowNum', header: 'Row #' },
      { field: 'status', header: 'Status' },
      { field: 'catalogueRoleName', header: 'Catalogue Role' },
      { field: 'sapRoleName', header: 'SAP Role' },
      { field: 'sapSystem', header: 'System' },
      { field: 'errorMessage', header: 'Error' },
    ];
  }

  // Step 1: Create session
  createSessionAndNext(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      this.notificationService.error('Please fill all required fields');
      return;
    }
    this.rcService.createUploadSession({
      sapSystemId: this.form.get('sapSystemId')!.value,
      uploadMode: this.form.get('uploadMode')!.value,
      uploadType: this.form.get('uploadType')!.value,
    }).subscribe({
      next: (res: any) => {
        if (res.success) { this.session = res.data; this.currentStep++; }
        else this.notificationService.error(res.message || 'Failed to create session');
      },
      error: (err: any) => this.notificationService.error(err.error?.message || 'Failed to create session'),
    });
  }

  // Step 2: Upload file
  uploadFile(event: any): void {
    const file: File = event.target.files[0];
    if (!file || !this.session?.id) return;

    const formData = new FormData();
    formData.append('file', file);
    this.isUploading = true;
    this.uploadedFileName = file.name;

    this.rcService.uploadFile(this.session.id, formData).subscribe({
      next: (res: any) => {
        this.isUploading = false;
        if (res.success) {
          this.session = res.data;
          this.notificationService.success('File uploaded and validated');
        } else {
          this.notificationService.error(res.message || 'Upload failed');
        }
      },
      error: (err: any) => {
        this.isUploading = false;
        this.notificationService.error(err.error?.message || 'Upload failed');
      },
    });
  }

  goToPreview(): void {
    if (this.session?.status !== 'VALIDATED') {
      this.notificationService.error('Please upload a file first');
      return;
    }
    this.loadStagingRecords();
    this.currentStep++;
  }

  loadStagingRecords(): void {
    const first = (this.stagingPageIndex - 1) * this.stagingPageSize;
    this.rcService.getUploadStaging(this.session.id, first, this.stagingPageSize).subscribe({
      next: (res: any) => {
        this.stagingData = res?.data?.rows || [];
        this.stagingTotal = res?.data?.records || 0;
      },
    });
  }

  onStagingPageChange(page: number): void {
    this.stagingPageIndex = page;
    this.loadStagingRecords();
  }

  // Step 3: Process
  processUpload(): void {
    if (!this.session?.id || this.session.validRecords === 0) {
      this.notificationService.error('No valid records to process');
      return;
    }
    this.isProcessing = true;
    this.currentStep++;

    this.rcService.processUpload(this.session.id).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        if (res.success) {
          this.session = res.data;
          if (this.session?.fieldChangeSummary) {
            try { this.fieldChangeSummary = JSON.parse(this.session.fieldChangeSummary); }
            catch { this.fieldChangeSummary = null; }
          }
          this.notificationService.success('Upload processed successfully');
        } else {
          this.notificationService.error(res.message || 'Processing failed');
        }
      },
      error: (err: any) => {
        this.isProcessing = false;
        this.notificationService.error(err.error?.message || 'Processing failed');
      },
    });
  }

  previousStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  cancel(): void {
    if (this.session?.id) this.rcService.deleteUploadSession(this.session.id).subscribe();
    this.router.navigate(['/cam/settings/role-catalogue']);
  }

  finish(): void {
    this.router.navigate(['/cam/settings/role-catalogue']);
  }

  downloadTemplate(): void {
    const name = this.form.get('uploadType')!.value === 'ATTRIBUTES'
      ? 'RoleCatalogueSample.xlsx' : 'RoleMappingSample.xlsx';
    const a = document.createElement('a');
    a.href = `assets/templates/${name}`;
    a.download = name;
    a.click();
  }

  getSapSystemName(): string {
    const id = this.form.get('sapSystemId')!.value;
    return this.sapSysList.find(s => s.id === id)?.destinationName || '';
  }

  getUploadModeLabel(): string {
    return this.form.get('uploadMode')!.value === 'APPEND' ? 'Append' : 'Overwrite';
  }

  getUploadTypeLabel(): string {
    return this.form.get('uploadType')!.value === 'ATTRIBUTES' ? 'Catalogue Attributes' : 'Role Mappings';
  }

  getFieldChangeEntries(): { key: string; value: number }[] {
    if (!this.fieldChangeSummary) return [];
    return Object.entries(this.fieldChangeSummary).map(([key, value]) => ({ key, value: value as number }));
  }

  formatFieldName(name: string): string {
    const labels: Record<string, string> = {
      businessProcess: 'Business Process', subBusinessProcess: 'Sub Business Process',
      department: 'Department', division: 'Division', criticality: 'Criticality',
      certRequired: 'Cert Required', roleMapping: 'Role Mapping', roleType: 'Role Type',
      jobProfile: 'Job Profile', approvers: 'Approvers',
    };
    return labels[name] || name;
  }
}
