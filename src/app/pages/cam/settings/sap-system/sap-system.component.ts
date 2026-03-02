import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { CamService } from '../../cam.service';
import { TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';
import { ManageSapSystemComponent } from './manage-sap-system/manage-sap-system.component';

@Component({
  standalone: false,
  selector: 'app-sap-system',
  templateUrl: './sap-system.component.html',
})
export class SapSystemComponent implements OnInit {
  data: any[] = [];
  loading = false;

  columns: TableColumn[] = [
    { field: 'destinationName', header: 'Name', filterable: true },
    { field: 'hostName', header: 'Host', filterable: true },
    { field: 'SID', header: 'Type' },
    { field: 'sysNr', header: 'Sysnr', width: '80px' },
    { field: 'clientNumber', header: 'Client', width: '80px' },
    { field: 'userName', header: 'Account', filterable: true },
    { field: 'languageCode', header: 'Language', width: '90px' },
    {
      field: 'operations',
      header: 'Operations',
      type: 'actions',
      width: '140px',
      align: 'center',
      actions: [
        { icon: 'key', tooltip: 'Set Password Rule', command: (row: any) => this.openManage('Set Password Rule', row) },
        { icon: 'ordered-list', tooltip: 'Set System Order', command: (row: any) => this.openManage('Set System Order', row) },
        { icon: 'tool', tooltip: 'Set Risk Variant', command: (row: any) => this.openManage('Set Risk Variant', row) },
      ],
    },
  ];

  constructor(
    private modal: NzModalService,
    private notificationService: NotificationService,
    private camService: CamService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.camService.getSapSystems().subscribe({
      next: (resp: any) => {
        this.data = resp?.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private openManage(formType: string, rowData: any): void {
    this.modal
      .create({
        nzTitle: formType,
        nzContent: ManageSapSystemComponent,
        nzWidth: '500px',
        nzData: { formType, rowData },
        nzFooter: null,
        nzClassName: 'updated-modal',
      })
      .afterClose.subscribe((result) => {
        if (result) {
          this.notificationService.success(result);
        }
      });
  }
}
