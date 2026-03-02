import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ApiResponse } from '../../../../../core/models/api-response';
import { BtpService } from '../../btp.service';
import { AddBtpSystemMappingComponent } from '../add-btp-system-mapping/add-btp-system-mapping.component';

@Component({
  standalone: false,
  selector: 'app-system-mapping',
  templateUrl: './system-mapping.component.html',
})
export class SystemMappingComponent implements OnInit {
  commandId: number;
  mappings: any[] = [];
  btpSystemList: any[] = [];
  loading = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modal: NzModalRef,
    private nzModal: NzModalService,
    private btpService: BtpService,
    private notificationService: NotificationService
  ) {
    this.commandId = this.dialogData?.data?.id;
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.btpService.getCommandsMapping(this.commandId).subscribe({
      next: (resp: ApiResponse) => {
        this.mappings = resp?.data?.systemList || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
    this.btpService.getSystemList().subscribe({
      next: (resp: ApiResponse) => { this.btpSystemList = resp?.data || []; },
    });
  }

  onAdd(): void {
    this.nzModal.create({
      nzTitle: 'Add BTP System Mapping',
      nzContent: AddBtpSystemMappingComponent,
      nzWidth: '400px',
      nzData: { btpSystems: this.btpSystemList, commandId: this.commandId },
      nzFooter: null,
    }).afterClose.subscribe(() => this.loadData());
  }

  onDelete(row: any): void {
    this.nzModal.confirm({
      nzTitle: 'Confirm Delete',
      nzContent: 'Are you sure you want to delete this mapping?',
      nzOkDanger: true,
      nzOnOk: () => {
        this.btpService.deleteCommandsMapping(row.id).subscribe({
          next: (resp: ApiResponse) => {
            this.notificationService.show(resp);
            this.loadData();
          },
          error: ({ error }) => this.notificationService.error(error?.message || 'Delete failed'),
        });
      },
    });
  }
}
