import { Component, Inject, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { IcmControlService } from '../icm-control.service';

@Component({
  standalone: true,
  imports: [
    CommonModule, NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzDescriptionsModule, NzSpinModule, NzEmptyModule, NzDividerModule, NzModalModule,
  ],
  selector: 'app-result-detail-dialog',
  template: `
    <!-- Summary -->
    <nz-descriptions nzBordered nzSize="small" [nzColumn]="4" style="margin-bottom: 16px;">
      <nz-descriptions-item nzTitle="Control">{{ resultData?.controlName || '-' }}</nz-descriptions-item>
      <nz-descriptions-item [nzTitle]="isManualControl ? 'Script' : 'Rule'">{{ getRuleName() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="Type">{{ resultData?.executionTypeName || '-' }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="Status">
        <nz-tag [nzColor]="statusColor">{{ resultData?.statusName || '-' }}</nz-tag>
      </nz-descriptions-item>
      <nz-descriptions-item nzTitle="Execution Date">{{ getExecutionDate() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="Mode" *ngIf="!isManualControl">{{ getMode() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="Records" *ngIf="!isManualControl">
        <nz-tag [nzColor]="(resultData?.resultRecordCount || 0) > 0 ? 'red' : 'green'">
          {{ resultData?.resultRecordCount || 0 }}
        </nz-tag>
      </nz-descriptions-item>
    </nz-descriptions>

    <!-- Data Table -->
    <nz-spin [nzSpinning]="loading">
      <nz-table *ngIf="tableColumns.length > 0"
        #resultTable
        [nzData]="tableData"
        [nzShowPagination]="tableData.length > 20"
        [nzPageSize]="20"
        nzSize="small"
        [nzScroll]="{ x: scrollX }">
        <thead>
          <tr>
            <th *ngFor="let col of tableColumns" [nzWidth]="col.width || null">{{ col.header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of resultTable.data">
            <td *ngFor="let col of tableColumns">
              <ng-container [ngSwitch]="col.field">
                <nz-tag *ngSwitchCase="'statusName'" [nzColor]="getStepStatusColor(row[col.field])">
                  {{ row[col.field] || '-' }}
                </nz-tag>
                <span *ngSwitchDefault>{{ row[col.field] ?? '-' }}</span>
              </ng-container>
            </td>
          </tr>
        </tbody>
      </nz-table>

      <nz-empty *ngIf="tableColumns.length === 0 && !loading"
        nzNotFoundContent="No result data available for this execution">
      </nz-empty>
    </nz-spin>

    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Close</button>
    </div>
  `,
})
export class ResultDetailDialogComponent implements OnInit, AfterViewInit {
  resultData: any;
  loading = false;
  isManualControl = false;
  statusColor = 'default';
  scrollX = '800px';

  tableColumns: { field: string; header: string; width?: string }[] = [];
  tableData: any[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modal: NzModalRef,
    private icmService: IcmControlService,
    private cdr: ChangeDetectorRef,
  ) {
    this.resultData = dialogData?.resultData;
  }

  ngOnInit(): void {
    const executionType = this.resultData?.executionType;
    const scriptTaskId = this.resultData?.scriptTaskId;
    this.isManualControl = executionType === 2 || !!scriptTaskId;

    const status = this.resultData?.statusName;
    this.statusColor = status === 'Success' ? 'green' : status === 'Failed' ? 'red' : 'default';
  }

  ngAfterViewInit(): void {
    if (this.resultData) {
      setTimeout(() => this.loadResultDetails(), 0);
    }
  }

  loadResultDetails(): void {
    const { ruleId, controlId, stdControlId, scriptTaskId, revision, executionType } = this.resultData || {};
    if (!controlId) return;

    this.loading = true;

    if (executionType === 2 || scriptTaskId) {
      this.loadManualResults(scriptTaskId);
    } else if (stdControlId) {
      this.loadStandardResults(stdControlId, controlId, revision);
    } else if (ruleId) {
      this.loadRegularResults(ruleId, controlId, revision);
    } else {
      this.loading = false;
    }
  }

  private loadManualResults(scriptTaskId: number): void {
    if (!scriptTaskId) {
      this.tableColumns = [{ field: 'info', header: 'Information' }];
      this.tableData = [{ info: 'Manual control execution details not available.' }];
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.icmService.getManualTaskSteps(scriptTaskId).subscribe({
      next: res => {
        if (res.success && res.data?.rows) {
          this.tableColumns = [
            { field: 'stepOrder', header: '#', width: '60px' },
            { field: 'stepName', header: 'Step Name' },
            { field: 'stepDescription', header: 'Description' },
            { field: 'statusName', header: 'Status', width: '100px' },
            { field: 'executeDate', header: 'Executed Date', width: '160px' },
            { field: 'comment', header: 'Comment' },
          ];
          this.tableData = res.data.rows.map((step: any) => ({
            stepOrder: step.stepOrder,
            stepName: step.scriptStep?.stepName || '-',
            stepDescription: step.scriptStep?.description || '-',
            statusName: this.getStepStatusName(step.status),
            executeDate: step.executeDate ? new Date(step.executeDate).toLocaleString() : '-',
            comment: step.comment?.description || '-',
          }));
        } else {
          this.setNoData('No script steps found.');
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.setNoData('Error loading script steps.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadRegularResults(ruleId: number, controlId: number, revision: number): void {
    let metaCols: any[] = [];
    this.icmService.getRuleResultColumns(ruleId, controlId).subscribe({
      next: res => {
        if (res.success && res.data?.rows) {
          metaCols = res.data.rows;
          this.buildColumns(metaCols);
        }
        this.icmService.getRuleResult(ruleId, revision, controlId).subscribe({
          next: dataRes => {
            if (dataRes.success && dataRes.data) {
              this.tableData = this.mapData(dataRes.data.rows || [], metaCols);
            }
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loading = false; this.cdr.detectChanges(); },
        });
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  private loadStandardResults(stdControlId: number, controlId: number, revision: number): void {
    let metaCols: any[] = [];
    this.icmService.getStandardAutomatedRuleResultColumns(stdControlId, controlId, revision).subscribe({
      next: res => {
        if (res.success && res.data?.rows) {
          metaCols = res.data.rows;
          this.buildColumns(metaCols);
        }
        this.icmService.getStandardAutomatedRuleResult(stdControlId, controlId, revision).subscribe({
          next: dataRes => {
            if (dataRes.success && dataRes.data) {
              this.tableData = this.mapData(dataRes.data.rows || [], metaCols);
            }
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loading = false; this.cdr.detectChanges(); },
        });
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  private buildColumns(columnData: any[]): void {
    this.tableColumns = columnData.map(col => ({
      field: col.canonicalName || col.fieldName || col.field,
      header: col.desc || col.description || col.header || col.canonicalName || col.fieldName,
    }));
    this.scrollX = Math.max(800, this.tableColumns.length * 150) + 'px';
  }

  private mapData(data: any[], metaCols: any[]): any[] {
    if (!data.length || !metaCols.length) return [];
    return data.map(row => {
      const obj: any = {};
      metaCols.forEach((col, i) => {
        obj[col.canonicalName || col.fieldName || col.field] = row[i];
      });
      return obj;
    });
  }

  private setNoData(message: string): void {
    this.tableColumns = [{ field: 'info', header: 'Information' }];
    this.tableData = [{ info: message }];
  }

  private getStepStatusName(status: number): string {
    switch (status) {
      case 0: return 'Not Started';
      case 1: return 'Passed';
      case 2: return 'Failed';
      default: return '-';
    }
  }

  getRuleName(): string {
    return this.resultData?.ruleName || this.resultData?.stdControlName || this.resultData?.scriptName || '-';
  }

  getExecutionDate(): string {
    if (!this.resultData?.executionDate) return '-';
    try {
      return new Date(this.resultData.executionDate).toLocaleString();
    } catch { return '-'; }
  }

  getMode(): string {
    return this.resultData?.executionModeName || (this.resultData?.executionMode === 0 ? 'Execution' : this.resultData?.executionMode === 1 ? 'Simulation' : '-');
  }

  getStepStatusColor(status: string): string {
    switch (status) {
      case 'Passed': return 'green';
      case 'Failed': return 'red';
      case 'Not Started': return 'default';
      default: return 'default';
    }
  }
}
