import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { AbapService } from '../abap.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AbapImportLog, AbapImportDialogData, AbapImportMode } from './abap-import.model';

interface LogTable {
  name: string;
  logs: AbapImportLog[];
  columns: { field: string; header: string }[];
}

@Component({
  standalone: false,
  selector: 'app-abap-importer-dialog',
  templateUrl: './abap-importer-dialog.component.html',
  styleUrls: ['./abap-importer-dialog.component.scss'],
})
export class AbapImporterDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  static readonly KNOWN_OBJECTS = [
    'pattern', 'DetectionPattern', 'AbapDetectionPattern',
    'rule', 'Rule', 'AbapRule',
    'scan', 'ScheduledScan', 'AbapScheduledScan',
    'Import', 'Import Summary', 'Transaction', 'Delete',
  ];

  tables: LogTable[] = [];
  importSuccess = false;
  numWarnings = 0;
  numErrors = 0;
  numInfo = 0;
  isLoading = false;
  importDone = false;
  currentPhase: 'preview' | 'import' | 'completed' = 'preview';

  readonly AbapImportMode = AbapImportMode;

  get successStatus(): string {
    if (!this.importSuccess) return 'Import Failed';
    if (this.numErrors > 0) return 'Completed with Errors';
    if (this.numWarnings > 0) return 'Completed with Warnings';
    return 'Completed Successfully';
  }

  get statusColor(): string {
    if (!this.importSuccess) return 'red';
    if (this.numErrors > 0) return 'orange';
    if (this.numWarnings > 0) return 'blue';
    return 'green';
  }

  get statusIcon(): string {
    if (!this.importSuccess) return 'close-circle';
    if (this.numErrors > 0) return 'warning';
    if (this.numWarnings > 0) return 'info-circle';
    return 'check-circle';
  }

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: AbapImportDialogData,
    private abapService: AbapService,
    public modalRef: NzModalRef,
    private modal: NzModalService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.startPreview();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPreview(): void {
    this.isLoading = true;
    this.currentPhase = 'preview';
    const isDelete = this.dialogData.mode === AbapImportMode.REPLACE;

    this.abapService.importWorkbook(this.dialogData.file, true, isDelete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.processImportResponse(response);
        },
        error: (error) => {
          this.isLoading = false;
          this.processImportResponse(error.error || {
            success: false,
            message: error.message || 'Unknown error occurred',
            data: [],
          });
        },
      });
  }

  private processImportResponse(response: any): void {
    this.importSuccess = response.success;
    const rawLogs: AbapImportLog[] = (response.data || []).map((v: any, i: number) => ({ ...v, index: i }));

    this.numErrors = rawLogs.filter(l => l.level === 'ERROR' || l.level === 'ABORT').length;
    this.numWarnings = rawLogs.filter(l => l.level === 'WARNING').length;
    this.numInfo = rawLogs.filter(l => l.level === 'INFO').length;

    this.tables = [];
    const baseColumns = [
      { field: 'index', header: '#' },
      { field: 'level', header: 'Level' },
      { field: 'object', header: 'Object' },
      { field: 'objectId', header: 'ID' },
      { field: 'message', header: 'Message' },
    ];

    const buildColumns = (logs: AbapImportLog[]) => {
      const cols = [...baseColumns];
      if (logs.some(l => l.sheetName)) cols.splice(4, 0, { field: 'sheetName', header: 'Sheet' });
      if (logs.some(l => l.rowNumber)) cols.splice(-1, 0, { field: 'rowNumber', header: 'Row' });
      if (logs.some(l => l.fieldName)) cols.splice(-1, 0, { field: 'fieldName', header: 'Field' });
      return cols;
    };

    // Errors
    const errorLogs = rawLogs.filter(l => l.level === 'ERROR' || l.level === 'ABORT');
    if (errorLogs.length) this.tables.push({ name: 'Errors', logs: errorLogs, columns: buildColumns(errorLogs) });

    // Warnings
    const warningLogs = rawLogs.filter(l => l.level === 'WARNING');
    if (warningLogs.length) this.tables.push({ name: 'Warnings', logs: warningLogs, columns: buildColumns(warningLogs) });

    // Info
    const infoLogs = rawLogs.filter(l => l.level === 'INFO');
    if (infoLogs.length) this.tables.push({ name: 'Information', logs: infoLogs, columns: buildColumns(infoLogs) });

    // Group by object type
    const objectTypes = new Set(rawLogs.map(l => l.object));
    const otherLogs: AbapImportLog[] = [];

    objectTypes.forEach(objectType => {
      if (AbapImporterDialogComponent.KNOWN_OBJECTS.includes(objectType)) {
        const objectLogs = rawLogs.filter(l => l.object === objectType);
        if (objectLogs.length) {
          const displayName = objectType
            ? objectType.substring(0, 1).toUpperCase() + objectType.substring(1).toLowerCase()
            : 'Unknown';
          // Avoid duplicate tab names with error/warning/info tabs
          if (!this.tables.find(t => t.name === displayName)) {
            this.tables.push({ name: displayName, logs: objectLogs, columns: buildColumns(objectLogs) });
          }
        }
      } else {
        otherLogs.push(...rawLogs.filter(l => l.object === objectType));
      }
    });

    if (otherLogs.length) {
      otherLogs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      this.tables.push({ name: 'Other', logs: otherLogs, columns: buildColumns(otherLogs) });
    }

    // All logs tab
    this.tables.push({ name: 'All Logs', logs: rawLogs, columns: buildColumns(rawLogs) });
  }

  onImport(): void {
    if (!this.importSuccess) {
      this.notification.error('Preview failed. Cannot perform import.');
      return;
    }

    if (this.numErrors === 0) {
      this.performImport();
      return;
    }

    this.modal.confirm({
      nzTitle: 'Perform Import with Errors?',
      nzContent: `The preview completed but contained ${this.numErrors} error(s). Do you want to continue with the import? Some items may not be imported.`,
      nzOkText: 'Continue Import',
      nzOkDanger: true,
      nzOnOk: () => this.performImport(),
    });
  }

  private performImport(): void {
    this.isLoading = true;
    this.importDone = true;
    this.currentPhase = 'import';
    this.tables = [];

    const isDelete = this.dialogData.mode === AbapImportMode.REPLACE;

    this.abapService.importWorkbook(this.dialogData.file, false, isDelete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.currentPhase = 'completed';
          this.processImportResponse(response);

          if (response.success) {
            this.notification.success('ABAP data imported successfully');
          } else {
            this.notification.error('Import completed with errors');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.currentPhase = 'completed';
          this.processImportResponse(error.error || {
            success: false,
            message: error.message || 'Import failed',
            data: [],
          });
          this.notification.error('Import failed: ' + (error.error?.message || error.message));
        },
      });
  }

  onClose(): void {
    this.modalRef.close({
      success: this.importSuccess && this.importDone,
      phase: this.currentPhase,
    });
  }

  getFileInfo(): string {
    const file = this.dialogData.file;
    const sizeInKB = Math.round(file.size / 1024);
    return `${file.name} (${sizeInKB} KB)`;
  }

  getModeDisplay(): string {
    switch (this.dialogData.mode) {
      case AbapImportMode.REPLACE:
        return 'Replace (Delete all existing data and import)';
      case AbapImportMode.APPEND:
        return 'Append (Update existing, add new)';
      default:
        return this.dialogData.mode;
    }
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'ERROR':
      case 'ABORT': return 'red';
      case 'WARNING': return 'orange';
      case 'INFO': return 'blue';
      default: return 'default';
    }
  }
}
