import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { interval, Subject, takeUntil, takeWhile } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AbapService } from '../abap.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CssMonitoringService } from '../../css/monitoring/css-monitoring.service';
import { BrowseProgramsModalComponent } from './browse-programs-modal/browse-programs-modal.component';

export interface ScanProgress {
  id: number;
  executionId: number;
  phase: string;
  totalPrograms: number;
  scannedPrograms: number;
  totalRules: number;
  appliedRules: number;
  violationsFound: number;
  currentProgram: string;
  currentRule: string;
  errorMessage: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string;
  progressPercent: number;
  elapsedTime: string;
  isRunning: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isCancelled: boolean;
}

@Component({
  standalone: false,
  selector: 'app-code-scan',
  templateUrl: './code-scan.component.html',
  styleUrls: ['./code-scan.component.scss'],
})
export class CodeScanComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  scanForm!: FormGroup;
  isSubmitting = false;
  currentStep = 0;

  // Progress tracking
  showProgressDialog = false;
  scanProgress: ScanProgress | null = null;
  currentExecutionId: number | null = null;
  private scanFinished = false;

  // Date range
  dateRange: Date[] = [];
  dateRangeForm = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });

  // File upload
  selectedFiles: File[] = [];
  maxFileSize = 50 * 1024 * 1024;
  allowedExtensions = ['.abap', '.txt', '.inc'];
  isDragOver = false;

  // SAP Systems
  availableSapSystems: any[] = [];

  // Rules
  selectedRules: any[] = [];

  // Transport
  transportObjects: any[] = [];
  isLoadingTransportObjects = false;
  selectedTransportPrograms: any[] = [];
  transportError: string | null = null;

  // Edit mode
  codeScan: any;
  formType: 'add' | 'edit' = 'add';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private nzModal: NzModalService,
    private cssMonitoringService: CssMonitoringService,
    private abapService: AbapService,
    private notification: NotificationService
  ) {
    this.scanForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      scanType: ['SAP_SYSTEM', Validators.required],
      sapSystemId: [''],
      files: [null],
      repositoryUrl: [''],
      repositoryBranch: ['main'],
      repositoryPath: [''],
      programFilterMode: ['PATTERN'],
      programPattern: [''],
      programNames: [''],
      transportNumbers: [''],
      dateFilterType: ['NONE'],
      programDate: [null],
      maxFindings: [1000, [Validators.min(1), Validators.max(10000)]],
      timeout: [3600, [Validators.min(60), Validators.max(7200)]],
      parallelProcessing: [true],
      generateReport: [true],
      notifyOnCompletion: [true],
    });

    this.setupConditionalValidators();
    this.setupDateFilterValidation();
  }

  ngOnInit(): void {
    const state = window.history.state;
    this.codeScan = state?.codeScan;
    this.formType = state?.formType || 'add';

    this.getSystemList();

    if (this.formType === 'edit' && this.codeScan) {
      this.selectedRules = this.codeScan.rulesList || [];
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getSystemList(): void {
    this.cssMonitoringService.getSystemList(null).subscribe({
      next: (resp) => {
        this.availableSapSystems = resp.data || [];
      },
    });
  }

  private setupConditionalValidators(): void {
    this.scanForm.get('scanType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((scanType) => {
        this.clearConditionalValidators();
        if (scanType === 'GIT_REPOSITORY') {
          this.scanForm.get('repositoryUrl')?.setValidators([Validators.required]);
        }
        this.scanForm.updateValueAndValidity();
      });
  }

  private clearConditionalValidators(): void {
    ['repositoryUrl', 'sapSystemId'].forEach((field) => {
      this.scanForm.get(field)?.clearValidators();
      this.scanForm.get(field)?.updateValueAndValidity();
    });
  }

  private setupDateFilterValidation(): void {
    this.scanForm.get('dateFilterType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((filterType: string) => {
        const programDateControl = this.scanForm.get('programDate');
        programDateControl?.clearValidators();

        if (filterType === 'NONE') {
          programDateControl?.setValue(null);
          this.dateRangeForm.patchValue({ start: null, end: null });
        } else if (filterType === 'BETWEEN') {
          programDateControl?.setValue(null);
        } else {
          this.dateRangeForm.patchValue({ start: null, end: null });
          programDateControl?.setValidators([Validators.required]);
        }
        programDateControl?.updateValueAndValidity();
      });
  }

  // Template helpers
  isTransportMode(): boolean {
    return this.scanForm.get('programFilterMode')?.value === 'TRANSPORT';
  }

  shouldShowDateFields(): boolean {
    return this.scanForm.get('dateFilterType')?.value !== 'NONE';
  }

  getFromDateLabel(): string {
    const filterType = this.scanForm.get('dateFilterType')?.value;
    switch (filterType) {
      case 'EQUALS': return 'Date Equals';
      case 'GREATER_THAN': return 'Date After';
      default: return 'Program Date';
    }
  }

  getDateHelpText(): string {
    const filterType = this.scanForm.get('dateFilterType')?.value;
    switch (filterType) {
      case 'EQUALS': return 'Find programs modified on this date';
      case 'GREATER_THAN': return 'Find programs modified after this date';
      default: return '';
    }
  }

  onDateRangeChange(dates: Date[]): void {
    if (dates?.length === 2) {
      this.dateRangeForm.patchValue({ start: dates[0], end: dates[1] });
    } else {
      this.dateRangeForm.patchValue({ start: null, end: null });
    }
  }

  // File upload
  onFileSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles = [];
    for (const file of files) {
      if (this.validateFile(file)) {
        this.selectedFiles.push(file);
      }
    }
    this.scanForm.patchValue({ files: this.selectedFiles });
  }

  private validateFile(file: File): boolean {
    if (file.size > this.maxFileSize) {
      this.notification.error(`File ${file.name} is too large (max ${this.maxFileSize / 1024 / 1024}MB)`);
      return false;
    }
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      this.notification.error(`File ${file.name} has unsupported extension`);
      return false;
    }
    return true;
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.scanForm.patchValue({ files: this.selectedFiles });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files) as File[];
      this.selectedFiles = [];
      for (const file of files) {
        if (this.validateFile(file)) {
          this.selectedFiles.push(file);
        }
      }
      this.scanForm.patchValue({ files: this.selectedFiles });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Rules
  onAbapRuleChanges(data: any): void {
    this.selectedRules = data;
  }

  // Browse programs
  openBrowsePrograms(): void {
    const sapSystemId = this.scanForm.get('sapSystemId')?.value;
    if (!sapSystemId) {
      this.notification.error('Please select a SAP System first');
      return;
    }
    const selectedSystem = this.availableSapSystems.find((s) => s.id === sapSystemId);

    this.nzModal.create({
      nzTitle: `Browse Programs - ${selectedSystem?.destinationName || 'Unknown'}`,
      nzContent: BrowseProgramsModalComponent,
      nzWidth: '80vw',
      nzData: { sapSystemId, sapSystemName: selectedSystem?.destinationName || 'Unknown' },
      nzFooter: null,
      nzBodyStyle: { height: '70vh', overflow: 'auto' },
    }).afterClose.subscribe((names: string[] | null) => {
      if (names?.length) {
        const current = (this.scanForm.get('programNames')?.value || '')
          .split(/[\n,;]+/)
          .map((n: string) => n.trim())
          .filter((n: string) => n);
        const newNames = names.filter((n) => !current.includes(n));
        if (newNames.length) {
          const combined = current.length
            ? current.join('\n') + '\n' + newNames.join('\n')
            : newNames.join('\n');
          this.scanForm.get('programNames')?.setValue(combined);
        }
      }
    });
  }

  // Transport
  resolveTransportObjects(): void {
    const sapSystemId = this.scanForm.get('sapSystemId')?.value;
    const transportNumbersRaw = this.scanForm.get('transportNumbers')?.value;

    if (!sapSystemId) {
      this.notification.error('Please select a SAP System first');
      return;
    }
    if (!transportNumbersRaw || !transportNumbersRaw.trim()) {
      this.notification.error('Please enter transport numbers');
      return;
    }

    const transportNumbers: string[] = transportNumbersRaw
      .split(/[\n,;]+/)
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    if (transportNumbers.length === 0) {
      this.notification.error('Please enter valid transport numbers');
      return;
    }

    this.isLoadingTransportObjects = true;
    this.transportError = null;
    this.transportObjects = [];
    this.selectedTransportPrograms = [];

    this.abapService.resolveTransportObjects(sapSystemId, transportNumbers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingTransportObjects = false;
          if (res.success && res.data) {
            this.transportObjects = res.data;
            this.selectedTransportPrograms = [...this.transportObjects];
            if (this.transportObjects.length === 0) {
              this.transportError = 'No scannable objects found in the specified transports';
            }
          } else {
            this.transportError = res.message || 'Failed to resolve transport objects';
          }
        },
        error: () => {
          this.isLoadingTransportObjects = false;
          this.transportError = 'Failed to connect to SAP system';
        },
      });
  }

  // Submit
  onSubmit(): void {
    if (this.scanForm.invalid) {
      Object.values(this.scanForm.controls).forEach((control) => {
        control.markAsTouched();
      });
      return;
    }

    const formValue = this.scanForm.value;

    let programNamesList: string[] = [];
    let transportNumbersList: string[] = [];

    if (formValue.programFilterMode === 'LIST' && formValue.programNames) {
      programNamesList = formValue.programNames.split(/[\n,;]+/).map((n: string) => n.trim()).filter((n: string) => n.length > 0);
    } else if (formValue.programFilterMode === 'TRANSPORT') {
      programNamesList = this.selectedTransportPrograms.map((obj: any) => obj.objName);
      transportNumbersList = (formValue.transportNumbers || '').split(/[\n,;]+/).map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    }

    const scanRequest: any = {
      name: formValue.name,
      description: formValue.description,
      scanType: formValue.scanType,
      maxFindings: formValue.maxFindings,
      timeout: formValue.timeout,
      parallelProcessing: formValue.parallelProcessing,
      generateReport: formValue.generateReport,
      notifyOnCompletion: formValue.notifyOnCompletion,
      rulesList: this.selectedRules,
      programPattern: formValue.programFilterMode === 'PATTERN' ? formValue.programPattern : null,
      programNames: programNamesList.length > 0 ? programNamesList : null,
      programFilterMode: formValue.programFilterMode,
      transportNumbers: transportNumbersList.length > 0 ? transportNumbersList : null,
      dateFilterType: formValue.programFilterMode === 'TRANSPORT' ? 'NONE' : formValue.dateFilterType,
      programDate: formValue.programDate,
      dateRangeStart: formValue.dateFilterType === 'BETWEEN' ? this.dateRangeForm.get('start')?.value : null,
      dateRangeEnd: formValue.dateFilterType === 'BETWEEN' ? this.dateRangeForm.get('end')?.value : null,
    };

    switch (formValue.scanType) {
      case 'GIT_REPOSITORY':
        scanRequest.gitConfig = {
          repositoryUrl: formValue.repositoryUrl,
          repositoryBranch: formValue.repositoryBranch,
          repositoryPath: formValue.repositoryPath,
        };
        break;
      case 'SAP_SYSTEM':
        scanRequest.sapSystemId = formValue.sapSystemId;
        break;
    }

    this.submitScan(scanRequest);
  }

  private submitScan(scanRequest: any): void {
    this.isSubmitting = true;
    this.showProgressDialog = true;
    this.scanProgress = null;
    this.scanFinished = false;

    this.abapService.runOnDemandCodeScan(scanRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.currentExecutionId = res.data;
            this.notification.success('Scan started - tracking progress...');
            this.startProgressPolling(res.data);
          } else {
            this.showProgressDialog = false;
            this.isSubmitting = false;
            this.notification.error('Failed to start scan');
          }
        },
        error: () => {
          this.notification.error('Failed to start scan');
          this.showProgressDialog = false;
          this.isSubmitting = false;
        },
      });
  }

  private startProgressPolling(executionId: number): void {
    interval(1500)
      .pipe(
        takeUntil(this.destroy$),
        takeWhile(() => this.showProgressDialog && !this.scanFinished)
      )
      .subscribe(() => {
        this.abapService.getScanProgress(executionId).subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.scanProgress = res.data as ScanProgress;
              if (!this.scanFinished && (this.scanProgress.isCompleted || this.scanProgress.isFailed || this.scanProgress.isCancelled)) {
                this.scanFinished = true;
                this.onScanComplete(this.scanProgress);
              }
            }
          },
        });
      });
  }

  private onScanComplete(progress: ScanProgress): void {
    this.isSubmitting = false;
    if (progress.isCompleted) {
      this.notification.success(`Scan completed! Found ${progress.violationsFound} violations in ${progress.scannedPrograms} programs.`);
      setTimeout(() => this.viewScanResults(), 1500);
    } else if (progress.isCancelled) {
      this.notification.warn(`Scan cancelled. Found ${progress.violationsFound} violations before cancellation.`);
      this.showProgressDialog = false;
    } else if (progress.isFailed) {
      this.notification.error(`Scan failed: ${progress.errorMessage || 'Unknown error'}`);
      this.showProgressDialog = false;
    }
  }

  viewScanResults(): void {
    this.showProgressDialog = false;
    this.router.navigate(['/sap-abap-scanner/scan-results/detail'], {
      queryParams: {
        executionId: this.scanProgress?.executionId,
        systemId: this.scanForm.get('sapSystemId')?.value,
      },
    });
  }

  cancelScan(): void {
    if (this.scanProgress?.executionId) {
      this.abapService.cancelScan(this.scanProgress.executionId).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.notification.success('Scan cancellation requested.');
          } else {
            this.notification.error(res.message || 'Failed to cancel scan');
          }
        },
        error: () => this.notification.error('Failed to cancel scan'),
      });
    }
    this.showProgressDialog = false;
    this.isSubmitting = false;
  }

  dismissProgress(): void {
    this.showProgressDialog = false;
    this.isSubmitting = false;
    this.notification.success('Scan continues in background. Check Scan History for results.');
  }

  getPhaseLabel(phase: string): string {
    switch (phase) {
      case 'INITIALIZING': return 'Initializing...';
      case 'FETCHING_PROGRAMS': return 'Fetching Programs...';
      case 'SCANNING': return 'Scanning Programs...';
      case 'CALCULATING_SUMMARY': return 'Calculating Summary...';
      case 'COMPLETED': return 'Completed';
      case 'FAILED': return 'Failed';
      default: return phase;
    }
  }

  navigateBack(): void {
    this.router.navigate(['/sap-abap-scanner/code-scan']);
  }
}
