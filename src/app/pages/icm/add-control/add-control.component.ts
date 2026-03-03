import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { IcmControlService } from '../icm-control.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AddNotificationDialogComponent } from './add-notification-dialog.component';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';

enum ControlType {
  AUTOMATED = 1,
  MANUAL = 2,
  STANDARD_AUTOMATED = 3,
}

@Component({
  standalone: false,
  selector: 'app-add-control',
  templateUrl: './add-control.component.html',
  styleUrls: ['./add-control.component.scss'],
})
export class AddControlComponent implements OnInit {
  currentStep = 0;

  step1Form: FormGroup;
  step2Form: FormGroup;
  manualScriptForm: FormGroup;

  // Dropdown data
  criticallyList: any[] = [];
  bpList: any[] = [];
  sbpList: any[] = [];
  regulationList: any[] = [];
  groupList: any[] = [];
  categoryList: any[] = [];
  impactList: any[] = [];
  typeList: any[] = [];

  // Step 2 data
  stdControls: any[] = [];
  queryRulesList: any[] = [];
  manualScriptList: any[] = [];
  manualScripts: any[] = [];
  selectedType = '';

  // Step 3 - Notifications
  notifySettings: any[] = [];

  // Table configs
  scriptColumns: TableColumn[] = [
    { field: 'id', header: 'Script ID', sortable: true, width: '100px' },
    { field: 'scriptName', header: 'Script Name', sortable: true },
    { field: 'isActive', header: 'Active', type: 'boolean', width: '100px' },
    {
      field: '_actions', header: '', type: 'actions', width: '60px', fixed: 'right',
      actions: [{ icon: 'delete', tooltip: 'Remove', danger: true, command: (row: any) => this.removeScript(row) }],
    },
  ];

  notifyColumns: TableColumn[] = [
    { field: 'controlRoleId.name', header: 'Role', sortable: true },
    { field: 'icmUser.username', header: 'User', sortable: true },
    { field: 'icmUser.email', header: 'Email', sortable: true },
    { field: 'dateFrom', header: 'Date From', type: 'date', sortable: true },
    { field: 'dateTo', header: 'Date To', type: 'date', sortable: true },
    { field: 'isActive', header: 'Active', type: 'boolean', width: '80px' },
    {
      field: '_actions', header: '', type: 'actions', width: '60px', fixed: 'right',
      actions: [{ icon: 'delete', tooltip: 'Remove', danger: true, command: (row: any) => this.removeNotification(row) }],
    },
  ];

  notifyActions: TableAction[] = [
    { label: 'Add Notification', icon: 'plus', type: 'primary', command: () => this.openAddNotification() },
  ];

  saving = false;
  controlExist = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private nzModal: NzModalService,
    private controlService: IcmControlService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {
    this.step1Form = this.fb.group({
      controlName: ['', Validators.required],
      critically: [null, Validators.required],
      businessProcess: [null, Validators.required],
      businessSubProcess: [null, Validators.required],
      description: ['', Validators.required],
      regulation: [null, Validators.required],
      group: [null, Validators.required],
      category: [null, Validators.required],
      impact: [null, Validators.required],
      type: [null, Validators.required],
    });

    this.step2Form = this.fb.group({
      stdControlId: [null],
      queryRuleId: [null],
    });

    this.manualScriptForm = this.fb.group({
      manualControlScript: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();

    this.step1Form.get('type')!.valueChanges.subscribe(type => {
      this.selectedType = type?.toString() || '';
      if (this.selectedType === ControlType.MANUAL.toString()) {
        this.loadManualScripts();
      } else if (this.selectedType === ControlType.AUTOMATED.toString()) {
        this.loadQueryRules();
      } else if (this.selectedType === ControlType.STANDARD_AUTOMATED.toString()) {
        this.loadStdControls();
      }
    });

    this.step1Form.get('businessProcess')!.valueChanges.subscribe(bpId => {
      if (bpId) {
        this.controlService.getBusinessSubProcesses(bpId).subscribe({
          next: (res) => this.sbpList = res.data?.rows || [],
          error: () => this.sbpList = [],
        });
      } else {
        this.sbpList = [];
      }
      this.step1Form.get('businessSubProcess')!.setValue(null);
    });
  }

  // --- Data loading ---

  private loadDropdowns(): void {
    this.controlService.getCriticalityList().subscribe({ next: (r) => this.criticallyList = r.data?.rows || [] });
    this.controlService.getBPList().subscribe({ next: (r) => this.bpList = r.data?.rows || [] });
    this.controlService.getRegulationList().subscribe({ next: (r) => this.regulationList = r.data?.rows || [] });
    this.controlService.getGroupList().subscribe({ next: (r) => this.groupList = r.data?.rows || [] });
    this.controlService.getCategoryList().subscribe({ next: (r) => this.categoryList = r.data?.rows || [] });
    this.controlService.getImpactList().subscribe({ next: (r) => this.impactList = r.data?.rows || [] });
    this.controlService.getControlTypeList().subscribe({ next: (r) => this.typeList = r.data?.rows || [] });
  }

  private loadManualScripts(): void {
    this.controlService.getManualScripts().subscribe({
      next: (r) => this.manualScriptList = r.data?.rows || [],
      error: () => this.manualScriptList = [],
    });
  }

  private loadQueryRules(): void {
    this.controlService.getAllQueryRules().subscribe({
      next: (r) => this.queryRulesList = r.data?.rows || [],
      error: () => this.queryRulesList = [],
    });
  }

  private loadStdControls(): void {
    this.controlService.getStdControls().subscribe({
      next: (r) => this.stdControls = r.data?.rows || [],
      error: () => this.stdControls = [],
    });
  }

  // --- Step navigation ---

  async goToStep2(): Promise<void> {
    if (this.step1Form.invalid) return;

    const name = this.step1Form.get('controlName')!.value;
    try {
      const res = await this.controlService.getControlByName(name).toPromise();
      this.controlExist = res.data && res.data.id != null;
    } catch {
      this.controlExist = false;
    }

    if (this.controlExist) {
      this.notificationService.error('Control name already exists');
      return;
    }
    this.currentStep = 1;
  }

  goToStep3(): void {
    if (this.selectedType === ControlType.AUTOMATED.toString() && !this.step2Form.get('queryRuleId')!.value) {
      this.notificationService.error('Please select a Query Rule');
      return;
    }
    if (this.selectedType === ControlType.STANDARD_AUTOMATED.toString() && !this.step2Form.get('stdControlId')!.value) {
      this.notificationService.error('Please select a Standard Control');
      return;
    }
    this.currentStep = 2;
  }

  // --- Manual scripts ---

  addManualScript(): void {
    const selected = this.manualScriptForm.get('manualControlScript')!.value;
    if (!selected?.id) {
      this.notificationService.error('Please select a manual script');
      return;
    }
    if (this.manualScripts.some(s => s.id === selected.id)) {
      this.notificationService.warn('This script is already added');
      return;
    }
    this.manualScripts = [...this.manualScripts, selected];
    this.manualScriptForm.reset();
  }

  removeScript(row: any): void {
    this.manualScripts = this.manualScripts.filter(s => s.id !== row.id);
  }

  // --- Notifications ---

  openAddNotification(): void {
    this.nzModal.create({
      nzTitle: 'Add Notification',
      nzContent: AddNotificationDialogComponent,
      nzClassName: 'updated-modal',
      nzFooter: null,
    }).afterClose.subscribe((result: any) => {
      if (!result) return;
      const mapped = {
        controlRoleId: { id: result.controlRoleId.id, name: result.controlRoleId.name },
        icmUser: { id: result.icmUser.id, username: result.icmUser.username, email: result.icmUser.email },
        isActive: result.isActive,
        dateFrom: result.dateFrom instanceof Date ? result.dateFrom.toISOString().split('T')[0] : result.dateFrom,
        dateTo: result.dateTo instanceof Date ? result.dateTo.toISOString().split('T')[0] : result.dateTo,
      };
      this.notifySettings = [...this.notifySettings, mapped];
    });
  }

  removeNotification(row: any): void {
    this.notifySettings = this.notifySettings.filter(n => n.icmUser.id !== row.icmUser.id);
  }

  // --- Save ---

  save(): void {
    if (this.selectedType === ControlType.MANUAL.toString()) {
      const hasExecutor = this.notifySettings.some(item => item.controlRoleId?.name === 'EXECUTOR');
      if (!hasExecutor) {
        this.notificationService.error('EXECUTOR role is required for manual controls');
        return;
      }
    }

    const notifyPayload = this.notifySettings.map(item => ({
      ...item,
      dateFrom: new Date(item.dateFrom).toISOString(),
      dateTo: new Date(item.dateTo).toISOString(),
      icmUser: item.icmUser.id,
      controlRoleId: item.controlRoleId.id,
    }));

    let selectedRuleObject: any = null;
    if (this.selectedType === ControlType.AUTOMATED.toString()) {
      const qrId = this.step2Form.value.queryRuleId;
      selectedRuleObject = this.queryRulesList.find(r => r.id === qrId);
    }

    const newControl = {
      id: null,
      name: this.step1Form.value.controlName,
      criticality: { id: this.step1Form.value.critically },
      description: this.step1Form.value.description,
      businessProcess: { id: this.step1Form.value.businessProcess },
      businessSubProcess: { id: this.step1Form.value.businessSubProcess },
      regulations: [{ id: this.step1Form.value.regulation }],
      category: this.step1Form.value.category,
      controlType: { id: this.step1Form.value.type },
      group: this.step1Form.value.group,
      impact: this.step1Form.value.impact,
      stdControlId: this.step2Form.value.stdControlId,
      rules: this.selectedType === ControlType.AUTOMATED.toString()
        ? (selectedRuleObject ? [{ id: selectedRuleObject.id }] : [])
        : [],
      scripts: this.manualScripts.map(s => ({ id: null, icmManualScript: { id: s.id } })),
      notifySettings: notifyPayload,
    };

    this.saving = true;
    this.controlService.saveControl({ newControl }).subscribe({
      next: (resp) => {
        this.saving = false;
        this.notificationService.show(resp);
        if (resp.data?.dtoId) {
          this.router.navigate([`/icm/controls/${resp.data.dtoId}`]);
        } else {
          this.router.navigate(['/icm/controls']);
        }
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.handleHttpError(err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/icm/controls']);
  }
}
