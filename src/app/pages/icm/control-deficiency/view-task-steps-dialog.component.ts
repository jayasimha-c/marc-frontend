import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { IcmControlService } from '../icm-control.service';
import { formatManualControlTaskStepStatus } from '../utils/status-utils';

@Component({
  standalone: true,
  imports: [CommonModule, NzTableModule, NzButtonModule, NzIconModule, NzTagModule, NzEmptyModule, NzSpinModule, NzModalModule],
  selector: 'app-view-task-steps-dialog',
  template: `
    <nz-spin [nzSpinning]="loading">
      <nz-table #stepsTable
        [nzData]="steps"
        [nzShowPagination]="steps.length > 10"
        [nzPageSize]="10"
        nzSize="small"
        [nzNoResult]="emptyTpl">
        <thead>
          <tr>
            <th nzWidth="70px">Order</th>
            <th>Step Name</th>
            <th nzWidth="110px">Status</th>
            <th nzWidth="140px">Execute Date</th>
            <th>Comment</th>
            <th nzWidth="110px">Attachment</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let step of stepsTable.data">
            <td>{{ step.stepOrder }}</td>
            <td>{{ step.scriptStep?.stepName || step.stepName || '-' }}</td>
            <td>
              <nz-tag [nzColor]="getStatusColor(step.statusLabel)">{{ step.statusLabel }}</nz-tag>
            </td>
            <td>{{ step.executeDate | date:'MM/dd/yyyy HH:mm' }}</td>
            <td>{{ step.comment?.commentText || '-' }}</td>
            <td>{{ step.resultCount || 0 }} file(s)</td>
          </tr>
        </tbody>
      </nz-table>
      <ng-template #emptyTpl>
        <nz-empty nzNotFoundContent="No task steps found"></nz-empty>
      </ng-template>
    </nz-spin>

    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Close</button>
    </div>
  `,
})
export class ViewTaskStepsDialogComponent implements OnInit {
  steps: any[] = [];
  loading = true;
  private taskId: number;

  constructor(
    @Inject(NZ_MODAL_DATA) public data: any,
    public modal: NzModalRef,
    private icmService: IcmControlService,
  ) {
    this.taskId = data.taskId;
  }

  ngOnInit(): void {
    this.loadSteps();
  }

  loadSteps(): void {
    this.icmService.getManualTaskSteps(this.taskId).subscribe({
      next: res => {
        this.steps = (res.data?.rows || []).map((row: any) => ({
          ...row,
          statusLabel: formatManualControlTaskStepStatus(row.status),
        }));
        this.loading = false;
      },
      error: () => {
        this.steps = [];
        this.loading = false;
      },
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'green';
      case 'FAILED': return 'red';
      case 'NONE': return 'default';
      default: return 'default';
    }
  }
}
