import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiResponse } from '../../../core/models/api-response';
import { NotificationService } from '../../../core/services/notification.service';
import { ContentImportService, ContentType, ImportError } from './content-import.service';

@Component({
  standalone: false,
  selector: 'app-admin-content-import',
  templateUrl: './content-import.component.html',
  styleUrls: ['./content-import.component.scss']
})
export class ContentImportComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();

  contentTypes: ContentType[] = [];
  selectedContentType = '';
  selectedFile: File | null = null;

  importMode = 'merge';
  importModes = [
    { value: 'merge', label: 'Merge', description: 'Add new records, skip existing' },
    { value: 'update', label: 'Update', description: 'Update existing, add new' },
    { value: 'replace', label: 'Replace', description: 'Delete all and reimport' }
  ];

  showPreview = false;
  previewData: any[] = [];
  totalRecords = 0;
  existingRecords = 0;

  loadingTypes = false;
  loadingPreview = false;
  importing = false;
  importProgress = 0;
  contentTypesError = false;

  lastImportResult: any = null;
  importErrors: ImportError[] = [];
  importWarnings: string[] = [];
  showErrorDetails = false;

  importHistory: any[] = [];

  constructor(
    private notificationService: NotificationService,
    private contentImportService: ContentImportService
  ) {}

  ngOnInit(): void {
    this.loadContentTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContentTypes(): void {
    this.loadingTypes = true;
    this.contentTypesError = false;
    this.contentImportService.getContentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data && resp.data.length > 0) {
            this.contentTypes = resp.data;
          } else {
            this.contentTypesError = true;
            this.notificationService.error('No content types available');
          }
          this.loadingTypes = false;
        },
        error: () => {
          this.notificationService.error('Failed to load content types');
          this.loadingTypes = false;
          this.contentTypesError = true;
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.showPreview = false;
      this.previewData = [];
      this.clearImportResult();
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  clearFile(): void {
    this.selectedFile = null;
    this.showPreview = false;
    this.previewData = [];
    this.importProgress = 0;
    this.clearImportResult();
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  clearImportResult(): void {
    this.lastImportResult = null;
    this.importErrors = [];
    this.importWarnings = [];
    this.showErrorDetails = false;
  }

  loadPreview(): void {
    if (!this.selectedFile || !this.selectedContentType) {
      this.notificationService.error('Please select a file and content type');
      return;
    }

    this.loadingPreview = true;
    this.contentImportService.previewFile(this.selectedFile, this.selectedContentType, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.showPreview = true;
            this.previewData = resp.data.previewData || [];
            this.totalRecords = resp.data.totalRecords || 0;
            this.existingRecords = resp.data.existingRecords || 0;
          } else {
            this.notificationService.error(resp.message || 'Failed to load preview');
          }
          this.loadingPreview = false;
        },
        error: () => {
          this.notificationService.error('Failed to load preview');
          this.loadingPreview = false;
        }
      });
  }

  startImport(): void {
    if (!this.selectedFile || !this.selectedContentType) {
      this.notificationService.error('Please select a file and content type');
      return;
    }

    this.importing = true;
    this.importProgress = 0;
    this.clearImportResult();

    const progressInterval = setInterval(() => {
      if (this.importProgress < 90) {
        this.importProgress += 10;
      }
    }, 200);

    this.contentImportService.importFile(this.selectedFile, this.selectedContentType, this.importMode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          clearInterval(progressInterval);
          this.importProgress = 100;

          if (resp.success && resp.data) {
            const result = resp.data;
            this.lastImportResult = result;
            this.importErrors = result.errors || [];
            this.importWarnings = result.warnings || [];

            if (result.partialSuccess) {
              this.notificationService.error(
                `Import completed with issues: ${result.recordsImported} imported, ${result.recordsUpdated} updated, ${result.recordsFailed} failed`
              );
            } else if (this.importWarnings.length > 0) {
              this.notificationService.success(
                `Import completed with warnings: ${result.recordsImported} imported, ${result.recordsSkipped} skipped, ${result.recordsUpdated} updated`
              );
            } else {
              this.notificationService.success(
                `Import completed: ${result.recordsImported} imported, ${result.recordsSkipped} skipped, ${result.recordsUpdated} updated`
              );
            }

            this.addToHistory(result);

            setTimeout(() => {
              this.selectedFile = null;
              this.showPreview = false;
              this.previewData = [];
              if (this.fileInput) {
                this.fileInput.nativeElement.value = '';
              }
              this.importing = false;
            }, 500);
          } else {
            const errorMsg = resp.data?.error || resp.message || 'Import failed';
            const errorType = resp.data?.errorType || 'UNKNOWN';

            if (errorType === 'DEPENDENCY_CONSTRAINT') {
              this.notificationService.error(
                `Cannot use Replace mode: ${resp.data.dependentRecordsCount} dependent records exist in '${resp.data.dependentTableName}' table. Use Merge or Update mode instead.`
              );
            } else {
              this.notificationService.error(errorMsg);
            }

            this.lastImportResult = resp.data;
            this.importing = false;
          }
        },
        error: (err) => {
          clearInterval(progressInterval);
          this.notificationService.error('Import failed: ' + (err.message || 'Unknown error'));
          this.importing = false;
        }
      });
  }

  toggleErrorDetails(): void {
    this.showErrorDetails = !this.showErrorDetails;
  }

  getErrorTypeLabel(errorType: string): string {
    const labels: Record<string, string> = {
      'CONSTRAINT_VIOLATION': 'Constraint Violation',
      'MISSING_REQUIRED_FIELD': 'Missing Field',
      'INVALID_FIELD_VALUE': 'Invalid Value',
      'DUPLICATE_RECORD': 'Duplicate',
      'FOREIGN_KEY_VIOLATION': 'FK Violation',
      'DATA_ACCESS_ERROR': 'Data Error',
      'UNEXPECTED_ERROR': 'Error'
    };
    return labels[errorType] || errorType;
  }

  getErrorTagColor(errorType: string): string {
    const colors: Record<string, string> = {
      'CONSTRAINT_VIOLATION': 'error',
      'MISSING_REQUIRED_FIELD': 'warning',
      'INVALID_FIELD_VALUE': 'warning',
      'DUPLICATE_RECORD': 'processing',
      'FOREIGN_KEY_VIOLATION': 'error',
      'DATA_ACCESS_ERROR': 'error',
      'UNEXPECTED_ERROR': 'error'
    };
    return colors[errorType] || 'default';
  }

  private addToHistory(result: any): void {
    const contentType = this.contentTypes.find(t => t.id === this.selectedContentType);
    const hasErrors = (result.errors && result.errors.length > 0) || result.recordsFailed > 0;

    this.importHistory = [{
      contentTypeName: contentType?.name || this.selectedContentType,
      fileName: result.fileName,
      importMode: this.importMode.charAt(0).toUpperCase() + this.importMode.slice(1),
      recordsImported: result.recordsImported,
      recordsSkipped: result.recordsSkipped,
      recordsUpdated: result.recordsUpdated,
      recordsFailed: result.recordsFailed || 0,
      status: hasErrors ? 'Partial' : 'Success',
      importedBy: result.importedBy,
      importedAt: new Date()
    }, ...this.importHistory];
  }

  getContentTypeIcon(id: string): string {
    const icons: Record<string, string> = {
      'sap_parameter': 'setting',
      'btp_rule_definitions': 'audit',
      'sap_audit_event': 'file-text'
    };
    return icons[id] || 'inbox';
  }

  canImport(): boolean {
    return !!this.selectedFile && !!this.selectedContentType && !this.importing;
  }
}
