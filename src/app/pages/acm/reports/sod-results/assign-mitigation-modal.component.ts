import { Component, Inject, OnInit, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { ReportService } from '../report.service';
import { TableColumn, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-assign-mitigation-modal',
  template: `
    <div style="padding: 16px;">
      <app-advanced-table
        [title]="'Mitigations of Risk - ' + riskName"
        [columns]="columns"
        [data]="mitigations"
        [loading]="loading"
        [serverSide]="true"
        [totalRecords]="totalRecords"
        [showSelection]="true"
        [showSearch]="false"
        [showRefresh]="false"
        size="small"
        (queryParamsChange)="onQueryParamsChange($event)"
        (selectionChange)="onSelectionChange($event)"
      ></app-advanced-table>

      <!-- Create Mitigation Form -->
      <div *ngIf="showCreateForm" style="margin-top: 16px; padding: 16px; border: 1px solid #f0f0f0; border-radius: 4px;">
        <h4 style="margin-bottom: 12px;">Create New Mitigation</h4>
        <nz-form-item>
          <nz-form-control>
            <div class="nz-float-label" [class.has-value]="mitigationName">
              <input nz-input [(ngModel)]="mitigationName" maxlength="50" placeholder=" " />
              <label>Mitigation Name</label>
            </div>
            <span style="font-size: 12px; color: #999;">2-50 characters</span>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-control>
            <div class="nz-float-label" [class.has-value]="mitigationDescription">
              <textarea
                nz-input
                [(ngModel)]="mitigationDescription"
                maxlength="200"
                [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                placeholder=" "
              ></textarea>
              <label>Description</label>
            </div>
            <span style="font-size: 12px; color: #999;">{{ mitigationDescription.length }}/200</span>
          </nz-form-control>
        </nz-form-item>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button nz-button nzType="default" (click)="cancelCreate()">Cancel</button>
          <button nz-button nzType="primary" (click)="saveMitigation()" [nzLoading]="creating">
            Save Mitigation
          </button>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button nz-button nzType="default" (click)="toggleCreateForm()">
        <span nz-icon [nzType]="showCreateForm ? 'close' : 'plus-circle'" nzTheme="outline"></span>
        {{ showCreateForm ? 'Close Form' : 'Create New' }}
      </button>
      <span style="flex: 1;"></span>
      <button nz-button nzType="default" (click)="modal.close()">Close</button>
      <button nz-button nzType="primary" (click)="assignMitigation()">Assign</button>
    </div>
  `,
})
export class AssignMitigationModalComponent implements OnInit {
  columns: TableColumn[] = [
    { field: 'id', header: 'Mitigation ID', sortable: true, filterable: true },
    { field: 'description', header: 'Description', sortable: true, filterable: true },
    { field: 'sapSystemName', header: 'System', sortable: true, filterable: true },
    { field: 'riskName', header: 'Risk', sortable: true, filterable: true },
    { field: 'businessProcess', header: 'Business Process', sortable: true, filterable: true },
    { field: 'businessSubProcess', header: 'Sub Process', sortable: true, filterable: true },
  ];

  mitigations: any[] = [];
  totalRecords = 0;
  loading = false;
  selectedRows: any[] = [];

  riskName = '';
  sapSystemName = '';

  showCreateForm = false;
  creating = false;
  mitigationName = '';
  mitigationDescription = '';

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
    @Optional() public modal: NzModalRef,
    private reportService: ReportService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.riskName = this.dialogData?.data?.riskName || '';
    this.sapSystemName = this.dialogData?.data?.sapSystemName || '';
  }

  onQueryParamsChange(params: TableQueryParams): void {
    const sortOrder = params.sort?.direction === 'ascend' ? 1 : -1;
    const first = (params.pageIndex - 1) * params.pageSize;

    const filters: any = { ...params.filters };
    if (this.sapSystemName) {
      filters.sapSystemName = [{ value: this.sapSystemName, matchMode: 'contains' }];
    }
    if (this.riskName) {
      filters.riskName = [{ value: this.riskName, matchMode: 'contains' }];
    }

    this.loading = true;
    this.reportService
      .getMitigations({
        first,
        rows: params.pageSize,
        sortOrder,
        sortField: params.sort?.field || '',
        filters,
      })
      .subscribe({
        next: (resp) => {
          if (resp.success) {
            this.mitigations = resp.data.rows || [];
            this.totalRecords = resp.data.records || 0;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onSelectionChange(rows: any[]): void {
    this.selectedRows = rows;
  }

  assignMitigation(): void {
    if (this.selectedRows.length === 0) {
      this.notificationService.error('Please select a mitigation to assign.');
      return;
    }

    const selected = this.selectedRows[0];
    const userId = this.dialogData?.data?.bname || this.dialogData?.data?.id;

    this.reportService
      .addMitigationUser({ mitigationId: selected.id, userId })
      .subscribe({
        next: (resp) => {
          if (resp.success) {
            this.notificationService.success('Mitigation assigned successfully!');
          }
        },
        error: () => {
          this.notificationService.error('Failed to assign mitigation.');
        },
      });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetCreateForm();
    }
  }

  saveMitigation(): void {
    const name = this.mitigationName.trim();
    if (name.length < 2) {
      this.notificationService.error('Mitigation name must be at least 2 characters.');
      return;
    }
    if (name.length > 50) {
      this.notificationService.error('Name must be 50 characters or less.');
      return;
    }
    if (this.mitigationDescription.length > 200) {
      this.notificationService.error('Description must be 200 characters or less.');
      return;
    }

    this.creating = true;
    const payload = {
      name,
      description: this.mitigationDescription.trim(),
      riskName: this.dialogData?.data?.riskName,
      sapSystemId: this.dialogData?.data?.sapSystemId,
      sapSystemName: this.dialogData?.data?.sapSystemName,
    };

    this.reportService.addMitigation(payload).subscribe({
      next: (resp) => {
        this.creating = false;
        if (resp.success) {
          this.notificationService.success('Mitigation created successfully!');
          this.resetCreateForm();
          this.showCreateForm = false;
        } else {
          this.notificationService.error(resp.message || 'Failed to create mitigation.');
        }
      },
      error: () => {
        this.creating = false;
        this.notificationService.error('Failed to create mitigation.');
      },
    });
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.resetCreateForm();
  }

  private resetCreateForm(): void {
    this.mitigationName = '';
    this.mitigationDescription = '';
  }
}
