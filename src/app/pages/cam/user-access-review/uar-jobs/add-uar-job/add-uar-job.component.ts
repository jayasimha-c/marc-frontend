import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { formatDate } from '@angular/common';
import { CamService } from '../../../cam.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ApiResponse } from '../../../../../core/models/api-response';

interface SnowSystemOption {
  id: number;
  name: string;
}

@Component({
  standalone: false,
  selector: 'app-add-uar-job',
  templateUrl: './add-uar-job.component.html',
})
export class AddUarJobComponent implements OnInit {
  sapSysList: any[] = [];
  snowSystemList: SnowSystemOption[] = [];
  currentStep = 0;
  isViewOnly = false;
  isPageMode = false;
  jobId: number | null = null;
  durationDays: number[] = Array.from(Array(32).keys());

  months = [
    { id: 1, name: 'January' }, { id: 2, name: 'February' }, { id: 3, name: 'March' },
    { id: 4, name: 'April' }, { id: 5, name: 'May' }, { id: 6, name: 'June' },
    { id: 7, name: 'July' }, { id: 8, name: 'August' }, { id: 9, name: 'September' },
    { id: 10, name: 'October' }, { id: 11, name: 'November' }, { id: 12, name: 'December' },
  ];

  form!: FormGroup;

  attachmentId: number | null = null;
  attachmentName = '';
  userFile: number | null = null;
  userFileName = '';

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
    @Optional() public modal: NzModalRef,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private camService: CamService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      sapSystem: ['', [Validators.required]],
      durationDays: [1, [Validators.required]],
      notes: ['', [Validators.required]],
      radioOption: ['1', [Validators.required]],
      periodicJob: [true, [Validators.required]],
      interval: ['MONTHLY', [Validators.required]],
      startMonth: [''],
      startYear: [null as number | null],
      endMonth: [''],
      endYear: [null as number | null],
      startDate: [new Date()],
      startTime: [new Date()],
      expireExisting: [true, [Validators.required]],
      includeExpiredAccounts: [true, [Validators.required]],
      lockedAccounts: [true, [Validators.required]],
      ignoreUsersWithoutRoles: [true, [Validators.required]],
      transactionHistory: [90, [Validators.required]],
      userType: [['A', 'B', 'C', 'L', 'S'], [Validators.required]],
      performReconciliation: [false],
      snowSystemId: [null],
    });
    this.isPageMode = !this.dialogData;

    if (!this.isPageMode) {
      this.isViewOnly = this.dialogData.action === 'view';
    }

    this.camService.getJobInfo().subscribe((resp: ApiResponse) => {
      this.sapSysList = resp.data?.sapSystemList || [];
      this.snowSystemList = resp.data?.snowSystemList || [];
    });
  }

  ngOnInit(): void {
    if (this.isPageMode) {
      this.route.paramMap.subscribe(params => {
        const routeId = params.get('id');
        if (routeId) {
          this.jobId = parseInt(routeId, 10);
          this.isViewOnly = true;
          this.camService.getJobConfig(this.jobId).subscribe((resp: ApiResponse) => {
            this.populateFormValues(resp);
          });
        } else {
          this.isViewOnly = false;
        }
      });
    } else if (this.isViewOnly) {
      const jobIdToLoad = this.dialogData?.data?.id;
      if (jobIdToLoad) {
        this.camService.getJobConfig(jobIdToLoad).subscribe((resp: ApiResponse) => {
          this.populateFormValues(resp);
        });
      }
    }
  }

  onReconciliationChange(): void {
    const performReconciliation = this.form.get('performReconciliation')?.value;
    if (performReconciliation) {
      this.form.get('snowSystemId')?.setValidators([Validators.required]);
    } else {
      this.form.get('snowSystemId')?.clearValidators();
      this.form.get('snowSystemId')?.setValue(null);
    }
    this.form.get('snowSystemId')?.updateValueAndValidity();
  }

  onFileSelected(event: Event, from: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.camService.uploadArcAttachment(file, 'ARC_JOB', 0).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) {
          this.notificationService.success('File uploaded successfully');
          if (from === 'system') {
            this.attachmentId = res.data.id;
            this.attachmentName = res.data.originalName;
          } else {
            this.userFile = res.data.id;
            this.userFileName = res.data.originalName;
          }
        }
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Error uploading file');
      },
    });
    input.value = '';
  }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      this.notificationService.error('Please fill all mandatory fields');
      return;
    }

    const f = this.form.value;
    const startTime = f.startTime ? formatDate(f.startTime, 'h:mm a', 'en-US') : '';
    const payload = {
      job: {
        sapId: f.sapSystem,
        description: f.notes,
        attachment: this.attachmentId,
        durationDays: f.durationDays,
        useFile: f.radioOption === '2',
        userFile: this.userFile,
        periodic: f.periodicJob,
        repeatType: f.interval,
        startMonth: f.startMonth,
        startYear: f.startYear || null,
        endMonth: f.endMonth,
        endYear: f.endYear || null,
        startDate: f.periodicJob ? null : (f.startDate ? formatDate(f.startDate, 'MM/dd/yyyy', 'en-US') : null),
        runTime: startTime,
        expireIfExisting: f.expireExisting,
        performReconciliation: f.performReconciliation,
        snowSystemId: f.snowSystemId,
      },
      config: {
        includeExpiredAccounts: f.includeExpiredAccounts,
        lockedAccounts: f.lockedAccounts,
        userType: Array.isArray(f.userType) ? f.userType.join(',') : f.userType,
        ignoreUsersWithoutRoles: f.ignoreUsersWithoutRoles,
        transactionHistory: f.transactionHistory,
      },
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    this.camService.addArc(payload).subscribe((resp: ApiResponse) => {
      this.notificationService.success(resp.data);
      if (this.isPageMode) {
        this.router.navigate(['/cam/user-access-review/uar-jobs']);
      } else {
        this.modal?.close(true);
      }
    });
  }

  downloadTemplate(): void {
    const link = document.createElement('a');
    link.setAttribute('type', 'hidden');
    link.href = 'assets/templates/template_arc.xlsx';
    link.download = '';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  onNext(): void {
    if (this.currentStep < 4) this.currentStep++;
  }

  onPrevious(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  cancel(): void {
    if (this.isPageMode) {
      this.router.navigate(['/cam/user-access-review/uar-jobs']);
    } else {
      this.modal?.close();
    }
  }

  private populateFormValues(resp: ApiResponse): void {
    const jobData = this.isPageMode ? resp.data?.job : this.dialogData?.data;
    const configData = resp.data;

    this.form.patchValue({
      sapSystem: jobData?.sapId,
      durationDays: jobData?.durationDays,
      notes: jobData?.description,
      radioOption: jobData?.useFile ? '2' : '1',
      periodicJob: jobData?.repeatType !== 'NOT_PERIODIC',
      interval: jobData?.repeatType,
      startMonth: jobData?.startMonth,
      startYear: jobData?.startYear || null,
      endMonth: jobData?.endMonth,
      endYear: jobData?.endYear || null,
      startDate: jobData?.startDate ? new Date(jobData.startDate) : null,
      expireExisting: jobData?.expireIfExisting,
      includeExpiredAccounts: configData?.includeExpiredAccounts,
      lockedAccounts: configData?.lockedAccounts,
      ignoreUsersWithoutRoles: configData?.ignoreUsersWithoutRoles,
      userType: configData?.userType?.includes(',') ? configData.userType.split(',') : [configData?.userType],
      transactionHistory: configData?.transactionHistory,
      performReconciliation: jobData?.performReconciliation || false,
      snowSystemId: jobData?.snowSystemId || null,
    });

    if (jobData?.attachment) {
      this.attachmentId = parseInt(jobData.attachment, 10);
      this.attachmentName = jobData.attachmentName || 'Attachment';
    }
    if (jobData?.userFile) {
      this.userFile = parseInt(jobData.userFile, 10);
      this.userFileName = jobData.userFileName || 'User File';
    }

    this.setStartTimeInView(jobData?.runTime);
    this.form.disable();
  }

  private setStartTimeInView(runTime: string): void {
    if (!runTime) return;
    const match = runTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      const d = new Date();
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      d.setHours(hours, minutes, 0, 0);
      this.form.patchValue({ startTime: d });
    }
  }
}
