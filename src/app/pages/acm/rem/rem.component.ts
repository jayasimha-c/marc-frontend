import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';
import { RemService } from './rem.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AddRisksConfigComponent } from './add-risks-config.component';
import { CreateNewDurationComponent } from './create-new-duration.component';

@Component({
  standalone: false,
  selector: 'app-rem',
  templateUrl: './rem.component.html',
})
export class RemComponent implements OnInit {
  // ── Tab 1: Risks in Scope ────────────────────────────
  riskColumns: TableColumn[] = [
    { field: 'riskName', header: 'Risk ID', type: 'text', sortable: true },
    { field: 'sapDestinationId', header: 'System', type: 'text', sortable: true },
    { field: 'sid', header: 'SID', type: 'text', sortable: true },
    { field: 'enabled', header: 'Active', type: 'boolean' },
  ];
  riskData: any[] = [];
  riskTotal = 0;
  riskLoading = false;
  riskSelected: any[] = [];
  riskActions: TableAction[] = [
    { label: 'Add Risks', icon: 'plus-circle', type: 'primary', command: () => this.addRisks() },
    { label: 'Remove', icon: 'delete', danger: true, command: () => this.removeRisks() },
  ];
  private lastRiskParams: TableQueryParams | null = null;

  // ── Tab 2: Rules in Scope ────────────────────────────
  ruleColumns: TableColumn[] = [
    { field: 'ruleName', header: 'Rule', type: 'text', sortable: true },
    { field: 'sapDestinationId', header: 'System', type: 'text', sortable: true },
    { field: 'sid', header: 'SID', type: 'text', sortable: true },
    { field: 'enabled', header: 'Active', type: 'boolean' },
  ];
  ruleData: any[] = [];
  ruleTotal = 0;
  ruleLoading = false;
  ruleSelected: any[] = [];
  ruleActions: TableAction[] = [
    { label: 'Add Rules', icon: 'plus-circle', type: 'primary', command: () => this.addRules() },
    { label: 'Remove', icon: 'delete', danger: true, command: () => this.removeRules() },
  ];
  private lastRuleParams: TableQueryParams | null = null;

  // ── Tab 3: Duration Configuration ────────────────────
  durationColumns: TableColumn[] = [
    { field: 'fromDate', header: 'Start From', type: 'date', dateFormat: 'dd/MM/yyyy', sortable: true },
    { field: 'sapDestinationId', header: 'System', type: 'text', sortable: true },
    { field: 'sid', header: 'SID', type: 'text', sortable: true },
    { field: 'enabled', header: 'Active', type: 'boolean' },
  ];
  durationData: any[] = [];
  durationLoading = false;
  durationSelected: any[] = [];
  durationActions: TableAction[] = [
    { label: 'Create New Duration', icon: 'plus-circle', type: 'primary', command: () => this.addDuration() },
    { label: 'Remove', icon: 'delete', danger: true, command: () => this.removeDuration() },
  ];

  constructor(
    private remService: RemService,
    private notify: NotificationService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.loadDurationData();
  }

  // ── Risk grid ────────────────────────────────────────
  onRiskQueryChange(params: TableQueryParams): void {
    this.lastRiskParams = params;
    this.loadRiskData();
  }

  private loadRiskData(): void {
    const p = this.lastRiskParams;
    const sortOrder = p?.sort?.direction === 'ascend' ? 1 : p?.sort?.direction === 'descend' ? -1 : 0;
    this.riskLoading = true;
    this.remService.getRiskConfig(
      p ? (p.pageIndex - 1) * p.pageSize : 0,
      p?.pageSize || 20,
      sortOrder,
      p?.sort?.field || '',
      [],
    ).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.riskData = resp.data.rows || [];
          this.riskTotal = resp.data.records || 0;
        }
        this.riskLoading = false;
      },
      error: (err) => {
        this.riskLoading = false;
        this.notify.handleHttpError(err);
      },
    });
  }

  // ── Rule grid ────────────────────────────────────────
  onRuleQueryChange(params: TableQueryParams): void {
    this.lastRuleParams = params;
    this.loadRuleData();
  }

  private loadRuleData(): void {
    const p = this.lastRuleParams;
    const sortOrder = p?.sort?.direction === 'ascend' ? 1 : p?.sort?.direction === 'descend' ? -1 : 0;
    this.ruleLoading = true;
    this.remService.getRuleConfig(
      p ? (p.pageIndex - 1) * p.pageSize : 0,
      p?.pageSize || 20,
      sortOrder,
      p?.sort?.field || '',
      [],
    ).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.ruleData = resp.data.rows || [];
          this.ruleTotal = resp.data.records || 0;
        }
        this.ruleLoading = false;
      },
      error: (err) => {
        this.ruleLoading = false;
        this.notify.handleHttpError(err);
      },
    });
  }

  // ── Duration grid ────────────────────────────────────
  private loadDurationData(): void {
    this.durationLoading = true;
    this.remService.getDurationConfig().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.durationData = resp.data.rows || [];
        }
        this.durationLoading = false;
      },
      error: (err) => {
        this.durationLoading = false;
        this.notify.handleHttpError(err);
      },
    });
  }

  // ── Actions ──────────────────────────────────────────
  addRisks(): void {
    const ref = this.modal.create({
      nzTitle: 'Add Risks Config',
      nzContent: AddRisksConfigComponent,
      nzWidth: '80vw',
      nzData: { formType: 'addRisk' },
      nzFooter: null,
      nzClassName: 'updated-modal',
    });
    ref.afterClose.subscribe((result) => {
      if (result) this.loadRiskData();
    });
  }

  removeRisks(): void {
    if (!this.riskSelected.length) {
      this.notify.error('Please select at least one risk to remove.');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Delete',
      nzContent: 'Please Confirm Before Deleting.',
      nzOnOk: () => {
        const ids = this.riskSelected.map((r) => r.id).join(',');
        this.remService.deleteRiskConfig(ids).subscribe({
          next: (resp) => {
            if (resp.success) {
              this.notify.success('Risk config removed successfully');
              this.riskSelected = [];
              this.loadRiskData();
            }
          },
          error: (err) => this.notify.handleHttpError(err),
        });
      },
    });
  }

  addRules(): void {
    const ref = this.modal.create({
      nzTitle: 'Add Rules Config',
      nzContent: AddRisksConfigComponent,
      nzWidth: '80vw',
      nzData: { formType: 'addRule' },
      nzFooter: null,
      nzClassName: 'updated-modal',
    });
    ref.afterClose.subscribe((result) => {
      if (result) this.loadRuleData();
    });
  }

  removeRules(): void {
    if (!this.ruleSelected.length) {
      this.notify.error('Please select at least one rule to remove.');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Delete',
      nzContent: 'Please Confirm Before Deleting.',
      nzOnOk: () => {
        const ids = this.ruleSelected.map((r) => r.id).join(',');
        this.remService.deleteRuleConfig(ids).subscribe({
          next: (resp) => {
            if (resp.success) {
              this.notify.success('Rule config removed successfully');
              this.ruleSelected = [];
              this.loadRuleData();
            }
          },
          error: (err) => this.notify.handleHttpError(err),
        });
      },
    });
  }

  addDuration(): void {
    const ref = this.modal.create({
      nzTitle: 'Create New Duration',
      nzContent: CreateNewDurationComponent,
      nzWidth: '35vw',
      nzFooter: null,
      nzClassName: 'updated-modal',
    });
    ref.afterClose.subscribe((result) => {
      if (result) this.loadDurationData();
    });
  }

  removeDuration(): void {
    if (!this.durationSelected.length) {
      this.notify.error('Please select a duration to remove.');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Delete',
      nzContent: 'Please Confirm Before Deleting.',
      nzOnOk: () => {
        const durId = this.durationSelected[0].id;
        this.remService.deleteDurationConfig(durId).subscribe({
          next: (resp) => {
            if (resp.success) {
              this.notify.success('Duration config removed successfully');
              this.durationSelected = [];
              this.loadDurationData();
            }
          },
          error: (err) => this.notify.handleHttpError(err),
        });
      },
    });
  }
}
