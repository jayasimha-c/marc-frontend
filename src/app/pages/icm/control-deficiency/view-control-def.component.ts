import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable, tap, map } from 'rxjs';
import { IcmControlService } from '../icm-control.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ViewTaskStepsDialogComponent } from './view-task-steps-dialog.component';
import { TableColumn } from '../../../shared/components/advanced-table/advanced-table.models';
import { formatTaskStatus, formatManualControlTaskStepStatus } from '../utils/status-utils';

@Component({
  standalone: false,
  selector: 'app-view-control-def',
  templateUrl: './view-control-def.component.html',
  styleUrls: ['./view-control-def.component.scss'],
})
export class ViewControlDefComponent implements OnInit {
  dfcId!: number;
  dfcData: any = null;
  control: any = null;
  loading = true;
  isEditing = false;

  icmScript: any = null;
  icmRule: any = null;

  // Manual script steps
  manualScriptSteps: any[] = [];
  scriptStepColumns: TableColumn[] = [
    { field: 'stepOrder', header: 'Order', width: '80px', sortable: true },
    { field: 'stepName', header: 'Step Content', sortable: true, ellipsis: true },
    { field: 'isActive', header: 'Active', type: 'boolean', width: '80px' },
  ];

  // Manual results
  manualResults: any[] = [];
  manualResultColumns: TableColumn[] = [
    { field: 'executionDate', header: 'Task Date', type: 'date', sortable: true, width: '140px' },
    { field: 'scriptName', header: 'Script Name', sortable: true, ellipsis: true },
    { field: 'statusLabel', header: 'Status', type: 'tag', width: '120px',
      tagColors: { CREATED: 'blue', OPENED: 'processing', CLOSED: 'green', FAILED: 'red', OVERDUE: 'orange', DRAFT: 'default' } },
    { field: 'startDate', header: 'Start Date', type: 'date', sortable: true, width: '140px' },
    { field: 'finishDate', header: 'Finish Date', type: 'date', sortable: true, width: '140px' },
  ];

  // Automated results
  automatedResults: any[] = [];
  automatedResultColumns: TableColumn[] = [
    { field: 'executionDate', header: 'Execute Date', type: 'date', sortable: true, width: '140px' },
    { field: 'ruleName', header: 'Rule Name', sortable: true, ellipsis: true },
    { field: 'resultTableName', header: 'Table Name', sortable: true, ellipsis: true },
    { field: 'resultRecordCount', header: 'Records', width: '100px' },
    { field: 'revision', header: 'Revision', width: '100px' },
    { field: 'mode', header: 'Mode', width: '100px' },
  ];

  // Rule details
  ruleFields: any[] = [];
  selectedFieldIds: number[] = [];
  isTableJoinEnabled = false;
  joinData: any = null;
  targetFieldList: any[] = [];

  // Deficiency form
  deficiencyForm!: FormGroup;
  deficiencyStatusList = [
    { id: 1, caption: 'Open' },
    { id: 2, caption: 'In progress' },
    { id: 3, caption: 'Not applicable' },
    { id: 4, caption: 'Closed' },
  ];

  // Dropdowns
  dropdownData: { [key: string]: any[] } = {
    sapSystemList: [],
    bpList: [],
    sbpList: [],
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private nzModal: NzModalService,
    private icmService: IcmControlService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.dfcId = Number(this.route.snapshot.paramMap.get('dfcId'));
    this.deficiencyForm = this.fb.group({
      deficiencyStatus: [null],
      comments: this.fb.array([]),
    });
    this.deficiencyForm.disable();

    this.loadDropdownData();
    this.loadDeficiency();
  }

  // --- Data Loading ---

  loadDeficiency(): void {
    this.loading = true;
    this.icmService.getDeficiencyById(this.dfcId).pipe(
      tap(res => {
        if (res?.data) {
          this.dfcData = res.data;
          this.control = res.data.icmControl;
          this.icmScript = res.data.icmScript ?? null;
          this.icmRule = res.data.icmRule ?? null;

          // Manual script steps
          const steps = res.data.icmScript?.steps;
          this.manualScriptSteps = steps ? (Array.isArray(steps) ? steps : Object.values(steps)) : [];

          // Rule fields
          if (this.icmRule) {
            this.ruleFields = this.icmRule.icmTable?.fields ?? [];
            this.selectedFieldIds = (this.icmRule.fields ?? []).map((f: any) => f.id);

            const joins = this.icmRule.joins;
            if (joins?.length > 0) {
              this.isTableJoinEnabled = true;
              this.joinData = joins[0];
              this.targetFieldList = joins[0]?.targetTable?.fields ?? [];
            }
          }

          // Load sub-processes for current control
          if (this.control?.businessProcess?.id) {
            this.loadSubProcesses(this.control.businessProcess.id);
          }

          this.initDeficiencyForm(res.data);
          this.loadResultsData();
        }
      }),
    ).subscribe({
      next: () => this.loading = false,
      error: () => {
        this.loading = false;
        this.notificationService.error('Failed to load deficiency');
      },
    });
  }

  loadDropdownData(): void {
    this.icmService.getSAPSystemList().subscribe({
      next: res => this.dropdownData['sapSystemList'] = res.data || [],
      error: () => {},
    });
    this.icmService.getBPList().subscribe({
      next: res => this.dropdownData['bpList'] = res.data?.rows || [],
      error: () => {},
    });
  }

  loadSubProcesses(bpId: number): void {
    this.icmService.getBusinessSubProcesses(bpId).subscribe({
      next: res => this.dropdownData['sbpList'] = res.data?.rows || [],
      error: () => {},
    });
  }

  loadResultsData(): void {
    if (this.icmScript && this.control?.id) {
      this.icmService.getManualTaskTableFull(this.control.id).subscribe({
        next: res => {
          this.manualResults = (res.data?.rows || []).map((row: any) => ({
            ...row,
            scriptName: row.script?.icmManualScript?.scriptName || '',
            statusLabel: formatTaskStatus(row.status),
          }));
        },
        error: () => this.manualResults = [],
      });
    }

    if (this.icmRule && this.dfcId) {
      this.icmService.getAutomatedTaskTableFull(this.dfcId).subscribe({
        next: res => {
          this.automatedResults = (res.data?.rows || []).map((row: any) => ({
            ...row,
            ruleName: row.icmRule?.name || '',
          }));
        },
        error: () => this.automatedResults = [],
      });
    }
  }

  // --- Deficiency Form ---

  initDeficiencyForm(data: any): void {
    const commentsData = Array.isArray(data.comments) ? data.comments : [];
    this.deficiencyForm = this.fb.group({
      deficiencyStatus: [data.deficiencyStatus?.id],
      comments: this.fb.array(commentsData.map((c: any) => this.createComment(c))),
    });
    if (this.comments.length === 0) {
      this.comments.push(this.createComment());
    }
    this.deficiencyForm.disable();
  }

  get comments(): FormArray {
    return this.deficiencyForm.get('comments') as FormArray;
  }

  createComment(data?: any): FormGroup {
    return this.fb.group({
      id: [data?.id || null],
      owner: [data?.owner || null],
      commentText: [data?.commentText || '', Validators.required],
      attachmentId: [data?.attachmentId || null],
      attachmentName: [data?.attachmentName || ''],
    });
  }

  addComment(): void {
    this.comments.push(this.createComment());
  }

  removeComment(index: number): void {
    this.comments.removeAt(index);
  }

  uploadAttachment(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.icmService.uploadAttachment(file, 'ICM_DEFICIENCY', 0).subscribe({
      next: res => {
        if (res.success) {
          this.comments.at(index).patchValue({
            attachmentId: res.data.id,
            attachmentName: res.data.originalName,
          });
          this.notificationService.success('File uploaded');
        }
      },
      error: err => this.notificationService.error(err.error?.message || 'Upload failed'),
    });
    input.value = '';
  }

  // --- Actions ---

  navigateBack(): void {
    this.router.navigate(['/icm/control-deficiency']);
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.deficiencyForm.enable();
    } else {
      this.deficiencyForm.disable();
    }
  }

  saveDeficiency(): void {
    const formValue = this.deficiencyForm.value;
    const payload = {
      id: this.dfcId,
      deficiencyStatus: { id: formValue.deficiencyStatus },
      comments: formValue.comments.map((c: any) => ({
        ...c,
        owner: this.control?.createdBy,
      })),
    };

    this.icmService.saveIcmDeficiency(payload).subscribe({
      next: resp => {
        this.notificationService.show(resp);
        this.navigateBack();
      },
      error: err => this.notificationService.handleHttpError(err),
    });
  }

  onManualResultRowClick(row: any): void {
    this.nzModal.create({
      nzTitle: 'Manual Control Task Steps',
      nzContent: ViewTaskStepsDialogComponent,
      nzWidth: '80vw',
      nzClassName: 'updated-modal',
      nzData: { taskId: row.id },
      nzFooter: null,
    });
  }

  // --- Helpers ---

  getSapSystemName(): string {
    if (this.dfcData?.sapSystemId && this.dropdownData.sapSystemList?.length) {
      const sys = this.dropdownData.sapSystemList.find((s: any) => s.id === this.dfcData.sapSystemId);
      if (sys) return sys.destinationName;
    }
    return this.control?.sapSystem?.destinationName || '-';
  }

  getStatusColor(statusId: number): string {
    switch (statusId) {
      case 1: return 'orange';
      case 2: return 'blue';
      case 3: return 'default';
      case 4: return 'green';
      default: return 'default';
    }
  }

  getStatusLabel(statusId: number): string {
    return this.deficiencyStatusList.find(s => s.id === statusId)?.caption || 'Unknown';
  }

  isFieldSelected(fieldId: number): boolean {
    return this.selectedFieldIds.includes(fieldId);
  }

  isJoinFieldSelected(fieldId: number): boolean {
    if (!this.joinData?.fields) return false;
    return this.joinData.fields.some((f: any) => f.id === fieldId);
  }
}
