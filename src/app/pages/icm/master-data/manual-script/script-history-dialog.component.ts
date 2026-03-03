import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { ManualScriptService, ScriptVersionHistory } from './manual-script.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-script-history-dialog',
  standalone: true,
  imports: [
    CommonModule, NzButtonModule, NzSpinModule,
    NzTimelineModule, NzTagModule, NzEmptyModule,
  ],
  template: `
    <nz-spin [nzSpinning]="loading">
      <div style="min-height: 200px; max-height: 60vh; overflow-y: auto;">
        <nz-empty *ngIf="!loading && versions.length === 0" nzNotFoundContent="No version history available"></nz-empty>

        <nz-timeline *ngIf="versions.length > 0">
          <nz-timeline-item *ngFor="let v of versions" [nzColor]="getTimelineColor(v.changeType)">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <nz-tag [nzColor]="getTagColor(v.changeType)">{{ v.changeType }}</nz-tag>
              <small>v{{ v.version }}</small>
            </div>
            <p style="margin: 0 0 4px;">{{ v.changeSummary || getChangeSummary(v.changeType) }}</p>
            <small>{{ v.changedBy }} &middot; {{ formatDate(v.changedDate) }}</small>
          </nz-timeline-item>
        </nz-timeline>
      </div>
    </nz-spin>

    <div class="modal-footer">
      <button nz-button nzType="primary" (click)="close()">Close</button>
    </div>
  `,
})
export class ScriptHistoryDialogComponent implements OnInit {
  loading = true;
  versions: ScriptVersionHistory[] = [];
  scriptName = '';
  scriptId!: number;

  constructor(
    @Inject(NZ_MODAL_DATA) public data: { scriptId: number; scriptName: string },
    private modal: NzModalRef,
    private scriptService: ManualScriptService,
    private notificationService: NotificationService,
  ) {
    this.scriptId = data.scriptId;
    this.scriptName = data.scriptName;
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.scriptService.getVersionHistory(this.scriptId).subscribe({
      next: resp => {
        if (resp.success && resp.data) {
          this.versions = (resp.data as ScriptVersionHistory[]).reverse();
        } else {
          this.versions = [];
        }
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load version history');
        this.loading = false;
      },
    });
  }

  getChangeSummary(changeType: string): string {
    switch (changeType?.toUpperCase()) {
      case 'CREATED': return 'Script was created';
      case 'UPDATED': return 'Script was modified';
      case 'DELETED': return 'Script was deleted';
      default: return 'Changes were made';
    }
  }

  getTimelineColor(changeType: string): string {
    switch (changeType?.toUpperCase()) {
      case 'CREATED': return 'green';
      case 'UPDATED': return 'blue';
      case 'DELETED': return 'red';
      default: return 'gray';
    }
  }

  getTagColor(changeType: string): string {
    switch (changeType?.toUpperCase()) {
      case 'CREATED': return 'green';
      case 'UPDATED': return 'blue';
      case 'DELETED': return 'red';
      default: return 'default';
    }
  }

  formatDate(ts: number): string {
    return ts ? new Date(ts).toLocaleString() : '-';
  }

  close(): void {
    this.modal.close();
  }
}
