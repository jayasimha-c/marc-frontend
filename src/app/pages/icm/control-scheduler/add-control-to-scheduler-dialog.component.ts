import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ControlSchedulerService } from './control-scheduler.service';
import { IcmControlService } from '../icm-control.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: true,
  selector: 'app-add-control-to-scheduler-dialog',
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzCheckboxModule, NzButtonModule, NzIconModule,
    NzSpinModule, NzEmptyModule, NzTagModule, NzModalModule,
  ],
  template: `
    <p style="color: rgba(0,0,0,0.45); margin-bottom: 16px;">
      Select controls to add to this scheduler. Controls already assigned are not shown.
    </p>

    <nz-spin [nzSpinning]="loading">
      <nz-table #controlTable
        [nzData]="controls"
        [nzShowPagination]="controls.length > 10"
        [nzPageSize]="10"
        nzSize="small"
        [nzScroll]="{ y: '350px' }">
        <thead>
          <tr>
            <th nzWidth="50px"
              [(nzChecked)]="allChecked"
              [nzIndeterminate]="indeterminate"
              (nzCheckedChange)="onAllChecked($event)"></th>
            <th>Control Name</th>
            <th nzWidth="120px">Type</th>
            <th nzWidth="80px">Active</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let ctrl of controlTable.data">
            <td [nzChecked]="selectedIds.has(ctrl.id)" (nzCheckedChange)="onItemChecked(ctrl.id, $event)"></td>
            <td>{{ ctrl.name }}</td>
            <td>
              <nz-tag [nzColor]="getTypeColor(ctrl.controlTypeName)">{{ ctrl.controlTypeName || '-' }}</nz-tag>
            </td>
            <td>
              <nz-tag [nzColor]="ctrl.isActive ? 'green' : 'default'">
                {{ ctrl.isActive ? 'Yes' : 'No' }}
              </nz-tag>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-spin>

    <div *ngIf="selectedIds.size > 0" style="margin-top: 8px; font-size: 13px; color: rgba(0,0,0,0.65);">
      <span nz-icon nzType="check-circle" nzTheme="outline" style="color: #1890ff; margin-right: 4px;"></span>
      {{ selectedIds.size }} control(s) selected
    </div>

    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()" [disabled]="saving">Cancel</button>
      <button nz-button nzType="primary" (click)="addSelected()" [nzLoading]="saving"
        [disabled]="saving || selectedIds.size === 0">
        Add Selected ({{ selectedIds.size }})
      </button>
    </div>
  `,
})
export class AddControlToSchedulerDialogComponent implements OnInit {
  loading = true;
  saving = false;
  schedulerId!: number;
  existingControlIds: number[] = [];
  controls: any[] = [];

  selectedIds = new Set<number>();
  allChecked = false;
  indeterminate = false;

  constructor(
    public modal: NzModalRef,
    private icmService: IcmControlService,
    private schedulerService: ControlSchedulerService,
    private notificationService: NotificationService,
    @Inject(NZ_MODAL_DATA) public data: any,
  ) {
    this.schedulerId = data.schedulerId;
    this.existingControlIds = data.existingControlIds || [];
  }

  ngOnInit(): void {
    this.loadControls();
  }

  private loadControls(): void {
    this.loading = true;
    this.icmService.getActiveControls().subscribe({
      next: resp => {
        this.controls = (resp.data || []).filter((c: any) => !this.existingControlIds.includes(c.id));
        this.loading = false;
      },
      error: () => {
        this.controls = [];
        this.loading = false;
        this.notificationService.error('Failed to load controls');
      },
    });
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = { Automated: 'green', Manual: 'gold', Standard: 'blue' };
    return map[type] || 'default';
  }

  onAllChecked(checked: boolean): void {
    this.controls.forEach(c => checked ? this.selectedIds.add(c.id) : this.selectedIds.delete(c.id));
    this.refreshCheckStatus();
  }

  onItemChecked(id: number, checked: boolean): void {
    checked ? this.selectedIds.add(id) : this.selectedIds.delete(id);
    this.refreshCheckStatus();
  }

  private refreshCheckStatus(): void {
    this.allChecked = this.controls.length > 0 && this.controls.every(c => this.selectedIds.has(c.id));
    this.indeterminate = this.controls.some(c => this.selectedIds.has(c.id)) && !this.allChecked;
  }

  addSelected(): void {
    if (this.selectedIds.size === 0) return;
    this.saving = true;
    const ids = Array.from(this.selectedIds);
    let completed = 0;
    let errors = 0;

    ids.forEach(controlId => {
      this.schedulerService.addControl(this.schedulerId, controlId).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length) this.finish(ids.length, errors);
        },
        error: () => {
          completed++;
          errors++;
          if (completed === ids.length) this.finish(ids.length, errors);
        },
      });
    });
  }

  private finish(total: number, errors: number): void {
    this.saving = false;
    if (errors === 0) {
      this.notificationService.success(`Added ${total} control(s) to scheduler`);
    } else if (errors === total) {
      this.notificationService.error('Failed to add controls');
      return;
    } else {
      this.notificationService.warn(`Added ${total - errors} control(s), ${errors} failed`);
    }
    this.modal.close(true);
  }
}
