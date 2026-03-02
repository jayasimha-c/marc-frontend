import { Component, Inject, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { TransferItem } from 'ng-zorro-antd/transfer';
import { NotificationService } from '../../../../core/services/notification.service';
import { ReportService } from '../report.service';

@Component({
  standalone: false,
  selector: 'app-org-checks-modal',
  template: `
    <div style="padding: 16px;">
      <nz-transfer
        [nzDataSource]="transferItems"
        [nzTitles]="['Selectable Orgs', 'Selected Orgs']"
        [nzShowSearch]="true"
        [nzListStyle]="{ height: '320px' }"
        (nzChange)="onTransferChange($event)"
        [nzRenderList]="[renderItem, renderItem]"
      >
        <ng-template #renderItem let-items>
          <nz-list nzSize="small">
            <nz-list-item *ngFor="let item of items" style="padding: 4px 0;">
              <span>{{ item.title }}</span>
            </nz-list-item>
          </nz-list>
        </ng-template>
      </nz-transfer>
    </div>

    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Close</button>
      <button nz-button nzType="primary" [nzLoading]="saving" (click)="save()">Save</button>
    </div>
  `,
})
export class OrgChecksModalComponent {
  transferItems: TransferItem[] = [];
  targetKeys: string[] = [];
  saving = false;

  private jobId: any;
  private mode: string;

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
    @Optional() public modal: NzModalRef,
    private reportService: ReportService,
    private notificationService: NotificationService,
  ) {
    const orgList: string[] = this.dialogData?.option || [];
    this.jobId = this.dialogData?.data?.id;
    this.mode = this.dialogData?.mode || 'simulation';

    this.transferItems = orgList.map((org, index) => ({
      key: String(index),
      title: org,
      direction: 'left' as const,
    }));
  }

  onTransferChange(event: any): void {
    // nz-transfer updates item directions internally; rebuild targetKeys
    this.targetKeys = this.transferItems
      .filter((item) => item.direction === 'right')
      .map((item) => item.title);
  }

  save(): void {
    if (this.targetKeys.length === 0) {
      this.notificationService.warn('Please select at least one org.');
      return;
    }

    this.saving = true;
    this.reportService
      .startOrgChecks({
        jobId: this.jobId,
        selectedOrgs: this.targetKeys,
        mode: this.mode,
      })
      .subscribe({
        next: (resp) => {
          this.saving = false;
          if (resp.success) {
            this.notificationService.success(resp.message || 'Org checks started.');
            this.modal.close(true);
          } else {
            this.notificationService.error(resp.message || 'Failed to start org checks.');
          }
        },
        error: () => {
          this.saving = false;
          this.notificationService.error('Failed to start org checks.');
        },
      });
  }
}
