import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { TableColumn } from '../../../shared/components/advanced-table/advanced-table.models';
import { RemService } from './rem.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-risks-config',
  templateUrl: './add-risks-config.component.html',
})
export class AddRisksConfigComponent implements OnInit {
  formType: string;
  sapSystemList: any[] = [];
  sapSystem: number | null = null;

  // Risk grid
  riskColumns: TableColumn[] = [
    { field: 'name', header: 'Name', type: 'text', sortable: true },
    { field: 'riskDescription', header: 'Description', type: 'text' },
    { field: 'riskType.name', header: 'Type', type: 'text' },
  ];
  riskData: any[] = [];
  riskLoading = false;
  riskSelected: any[] = [];

  // Rule grid
  ruleColumns: TableColumn[] = [
    { field: 'ruleName', header: 'Rule ID', type: 'text', sortable: true },
    { field: 'ruleDescription', header: 'Description', type: 'text' },
    { field: 'ruleType.name', header: 'Type', type: 'text' },
  ];
  ruleData: any[] = [];
  ruleLoading = false;
  ruleSelected: any[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) private dialogData: any,
    private modalRef: NzModalRef,
    private remService: RemService,
    private notify: NotificationService,
  ) {
    this.formType = this.dialogData.formType || 'addRisk';
  }

  ngOnInit(): void {
    this.loadSapSystems();
    if (this.formType === 'addRisk') {
      this.loadRisks();
    } else {
      this.loadRules();
    }
  }

  private loadSapSystems(): void {
    this.remService.getSapSystems().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.sapSystemList = resp.data;
        }
      },
      error: (err) => this.notify.handleHttpError(err),
    });
  }

  private loadRisks(): void {
    this.riskLoading = true;
    this.remService.getRisksToAdd().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.riskData = resp.data.rows || resp.data || [];
        }
        this.riskLoading = false;
      },
      error: (err) => {
        this.riskLoading = false;
        this.notify.handleHttpError(err);
      },
    });
  }

  private loadRules(): void {
    this.ruleLoading = true;
    this.remService.getRulesToAdd().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.ruleData = resp.data.rows || resp.data || [];
        }
        this.ruleLoading = false;
      },
      error: (err) => {
        this.ruleLoading = false;
        this.notify.handleHttpError(err);
      },
    });
  }

  save(): void {
    if (!this.sapSystem) {
      this.notify.error('Please select a SAP System.');
      return;
    }

    if (this.formType === 'addRisk') {
      if (!this.riskSelected.length) {
        this.notify.error('Please select at least one risk.');
        return;
      }
      const payload = {
        sapSystemId: this.sapSystem,
        riskIds: this.riskSelected.map((r) => r.id),
      };
      this.remService.addRiskConfig(payload).subscribe({
        next: (resp) => {
          if (resp.success) this.notify.success('Risk config added successfully');
          this.modalRef.close(true);
        },
        error: (err) => {
          this.notify.handleHttpError(err);
          this.modalRef.close();
        },
      });
    } else {
      if (!this.ruleSelected.length) {
        this.notify.error('Please select at least one rule.');
        return;
      }
      const payload = {
        sapSystemId: this.sapSystem,
        ruleIds: this.ruleSelected.map((r) => r.id),
      };
      this.remService.addRuleConfig(payload).subscribe({
        next: (resp) => {
          if (resp.success) this.notify.success('Rule config added successfully');
          this.modalRef.close(true);
        },
        error: (err) => {
          this.notify.handleHttpError(err);
          this.modalRef.close();
        },
      });
    }
  }

  close(): void {
    this.modalRef.close();
  }
}
