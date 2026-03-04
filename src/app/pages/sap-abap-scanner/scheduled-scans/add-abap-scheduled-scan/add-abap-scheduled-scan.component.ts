import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { AbapService } from '../../abap.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CssMonitoringService } from '../../../css/monitoring/css-monitoring.service';
import { BrowseProgramsModalComponent } from '../../code-scan/browse-programs-modal/browse-programs-modal.component';

@Component({
  standalone: false,
  selector: 'app-add-abap-scheduled-scan',
  templateUrl: './add-abap-scheduled-scan.component.html',
  styleUrls: ['./add-abap-scheduled-scan.component.scss'],
})
export class AddAbapScheduledScanComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  formType: 'add' | 'edit' = 'add';
  scanData: any;
  currentStep = 0;

  // Date range for BETWEEN filter
  dateRangeForm = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });

  // Repeat interval options
  daysList: number[] = Array.from({ length: 31 }, (_, i) => i);
  hoursList: number[] = Array.from({ length: 24 }, (_, i) => i);
  minsList: number[] = Array.from({ length: 60 }, (_, i) => i);

  // SAP Systems
  availableSapSystems: any[] = [];

  // Rules
  selectedRules: any[] = [];

  // Transport
  transportObjects: any[] = [];
  isLoadingTransportObjects = false;
  selectedTransportPrograms: any[] = [];
  transportError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private abapService: AbapService,
    private notification: NotificationService,
    private router: Router,
    private cssMonitoringService: CssMonitoringService,
    private nzModal: NzModalService
  ) {
    this.form = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      startDateTime: [null, Validators.required],
      endDateTime: [null],
      repeatPeriodically: [true],
      days: [0],
      hours: [0],
      mins: [0],
      cronExpression: [''],
      description: [''],
      active: [true],
      systems: [[], Validators.required],
      programFilterMode: ['PATTERN'],
      programPattern: [''],
      programNames: [''],
      transportNumbers: [''],
      dateFilterType: ['NONE'],
      programDate: [null],
      changedByFilterType: ['NONE'],
      changedByValue: [''],
    });
  }

  ngOnInit(): void {
    const state = window.history.state;
    this.scanData = state?.scheduledScan;
    this.formType = state?.formType || 'add';

    this.getSystemList();

    if (this.formType === 'edit' && this.scanData) {
      this.patchForm(this.scanData);
    }

    // Watch changes that affect cron expression
    ['startDateTime', 'repeatPeriodically', 'days', 'hours', 'mins'].forEach((field) => {
      this.form.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.generateCronExpression());
    });

    this.generateCronExpression();

    // Watch date filter type changes
    this.form.get('dateFilterType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((filterType: string) => this.updateDateValidation(filterType));
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

  private patchForm(scan: any): void {
    const startDateTimeDate = scan.startDateTime ? new Date(scan.startDateTime) : null;
    const endDateTimeDate = scan.endDateTime ? new Date(scan.endDateTime) : null;

    this.form.patchValue({
      id: scan.id,
      name: scan.name,
      startDateTime: startDateTimeDate,
      endDateTime: endDateTimeDate,
      repeatPeriodically: scan.repeatPeriodically !== false,
      description: scan.description,
      cronExpression: scan.cronExpression,
      active: scan.active,
      systems: scan.systems,
      programFilterMode: scan.programFilterMode || 'PATTERN',
      programPattern: scan.programPattern,
      programNames: scan.programNames || '',
      transportNumbers: scan.transportNumbers || '',
      dateFilterType: scan.dateFilterType || 'NONE',
      programDate: scan.programDate,
      changedByFilterType: scan.changedByFilterType || 'NONE',
      changedByValue: scan.changedByValue || '',
    });

    if (scan.dateFilterType === 'BETWEEN' && (scan.programDateFrom || scan.programDateTo)) {
      this.dateRangeForm.patchValue({
        start: scan.programDateFrom ? new Date(scan.programDateFrom) : null,
        end: scan.programDateTo ? new Date(scan.programDateTo) : null,
      });
    }

    this.selectedRules = scan?.rules || [];

    const { days, hours, mins } = this.parseIntervalHours(scan.repeatIntervalHours);
    this.form.patchValue({ days, hours, mins });
  }

  private parseIntervalHours(intervalHours: number): { days: number; hours: number; mins: number } {
    if (!intervalHours || intervalHours <= 0) {
      return { days: 1, hours: 0, mins: 0 };
    }
    const days = Math.floor(intervalHours / 24);
    const hours = intervalHours % 24;
    return { days, hours, mins: 0 };
  }

  private generateCronExpression(): void {
    const repeatPeriodically = this.form.get('repeatPeriodically')?.value;
    const startDateTime = this.form.get('startDateTime')?.value;
    const days = this.form.get('days')?.value || 0;
    const hours = this.form.get('hours')?.value || 0;
    const mins = this.form.get('mins')?.value || 0;

    let startMinute = 0;
    let startHour = 2;
    if (startDateTime) {
      const date = new Date(startDateTime);
      startMinute = date.getMinutes();
      startHour = date.getHours();
    }

    let cronExpression: string;
    if (repeatPeriodically) {
      if (days > 0) {
        cronExpression = `${startMinute} ${startHour} */${days} * *`;
      } else if (hours > 0) {
        cronExpression = `${startMinute} */${hours} * * *`;
      } else if (mins > 0) {
        cronExpression = `*/${mins} * * * *`;
      } else {
        cronExpression = `${startMinute} ${startHour} * * *`;
      }
    } else {
      cronExpression = `${startMinute} ${startHour} * * *`;
    }

    this.form.patchValue({ cronExpression }, { emitEvent: false });
  }

  private updateDateValidation(filterType: string): void {
    const programDateControl = this.form.get('programDate');
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
  }

  // Rules
  onAbapRuleChanges(data: any): void {
    this.selectedRules = data;
  }

  // Program filter mode helpers
  isTransportMode(): boolean {
    return this.form.get('programFilterMode')?.value === 'TRANSPORT';
  }

  isListMode(): boolean {
    return this.form.get('programFilterMode')?.value === 'LIST';
  }

  isPatternMode(): boolean {
    return this.form.get('programFilterMode')?.value === 'PATTERN';
  }

  // Browse programs
  openBrowsePrograms(): void {
    const systems = this.form.get('systems')?.value;
    if (!systems || systems.length === 0) {
      this.notification.error('Please select at least one SAP System first');
      return;
    }
    const sapSystemId = systems[0];
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
        const current = (this.form.get('programNames')?.value || '')
          .split(/[\n,;]+/)
          .map((n: string) => n.trim())
          .filter((n: string) => n);
        const newNames = names.filter((n) => !current.includes(n));
        if (newNames.length) {
          const combined = current.length
            ? current.join('\n') + '\n' + newNames.join('\n')
            : newNames.join('\n');
          this.form.get('programNames')?.setValue(combined);
        }
      }
    });
  }

  // Transport resolution
  resolveTransportObjects(): void {
    const systems = this.form.get('systems')?.value;
    const transportNumbersRaw = this.form.get('transportNumbers')?.value;

    if (!systems || systems.length === 0) {
      this.notification.error('Please select at least one SAP System first');
      return;
    }
    if (!transportNumbersRaw || !transportNumbersRaw.trim()) {
      this.notification.error('Please enter transport numbers');
      return;
    }

    const sapSystemId = systems[0];
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

  // Changed By helpers
  showChangedByValueField(): boolean {
    const filterType = this.form.get('changedByFilterType')?.value;
    return filterType && filterType !== 'NONE';
  }

  getChangedByPlaceholder(): string {
    const filterType = this.form.get('changedByFilterType')?.value;
    if (filterType === 'EQUALS' || filterType === 'NOT_EQUALS') {
      return 'e.g., SAP';
    }
    return 'e.g., SAP, DDIC, DEV01';
  }

  getChangedByHint(): string {
    const filterType = this.form.get('changedByFilterType')?.value;
    switch (filterType) {
      case 'EQUALS': return 'Only programs changed by this user';
      case 'NOT_EQUALS': return 'Exclude programs changed by this user';
      case 'IN': return 'Only programs changed by any of these users (comma-separated)';
      case 'NOT_IN': return 'Exclude programs changed by any of these users (comma-separated)';
      default: return '';
    }
  }

  // Date helpers
  shouldShowDateFields(): boolean {
    const dateFilterType = this.form.get('dateFilterType')?.value;
    return dateFilterType && dateFilterType !== 'NONE';
  }

  getFromDateLabel(): string {
    const dateFilterType = this.form.get('dateFilterType')?.value;
    switch (dateFilterType) {
      case 'GREATER_THAN': return 'From Date';
      case 'BETWEEN': return 'From Date';
      default: return 'Date';
    }
  }

  getDateHelpText(): string {
    const dateFilterType = this.form.get('dateFilterType')?.value;
    if (dateFilterType === 'GREATER_THAN') return 'Programs modified after this date';
    return '';
  }

  // Save
  onSave(): void {
    const formValue = { ...this.form.value };

    // Handle date range for BETWEEN
    if (formValue.dateFilterType === 'BETWEEN') {
      formValue.programDateFrom = this.dateRangeForm.get('start')?.value;
      formValue.programDateTo = this.dateRangeForm.get('end')?.value;
      formValue.programDate = null;
    } else {
      formValue.programDateFrom = null;
      formValue.programDateTo = null;
    }

    // For TRANSPORT mode, store resolved program names
    if (formValue.programFilterMode === 'TRANSPORT' && this.selectedTransportPrograms.length > 0) {
      formValue.programNames = this.selectedTransportPrograms.map((obj) => obj.objName).join('\n');
    }

    // Clear irrelevant fields based on mode
    if (formValue.programFilterMode === 'PATTERN') {
      formValue.programNames = null;
      formValue.transportNumbers = null;
    } else if (formValue.programFilterMode === 'LIST') {
      formValue.programPattern = null;
      formValue.transportNumbers = null;
      formValue.changedByFilterType = 'NONE';
      formValue.changedByValue = null;
      formValue.dateFilterType = 'NONE';
      formValue.programDate = null;
    } else if (formValue.programFilterMode === 'TRANSPORT') {
      formValue.programPattern = null;
      formValue.changedByFilterType = 'NONE';
      formValue.changedByValue = null;
      formValue.dateFilterType = 'NONE';
      formValue.programDate = null;
    }

    if (formValue.changedByFilterType === 'NONE') {
      formValue.changedByValue = null;
    }

    const { days, hours, mins, ...rest } = formValue;
    const totalIntervalHours = (days * 24) + hours + Math.ceil(mins / 60);
    const repeatIntervalHours = totalIntervalHours > 0 ? totalIntervalHours : 24;

    const startDateTimeEpoch = rest.startDateTime ? new Date(rest.startDateTime).getTime() : null;
    const endDateTimeEpoch = rest.endDateTime ? new Date(rest.endDateTime).getTime() : null;

    const payload = {
      ...rest,
      startDateTime: startDateTimeEpoch,
      endDateTime: endDateTimeEpoch,
      repeatIntervalHours,
      rules: this.selectedRules,
    };

    this.abapService.saveScheduledScan(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(res.message || 'Saved successfully');
        } else {
          this.notification.error(res.message || 'Save failed');
        }
        this.router.navigate(['/sap-abap-scanner/scheduled-scans']);
      },
      error: (err) => this.notification.error(err.error?.message || 'Save failed'),
    });
  }

  navigateBack(): void {
    this.router.navigate(['/sap-abap-scanner/scheduled-scans']);
  }
}
