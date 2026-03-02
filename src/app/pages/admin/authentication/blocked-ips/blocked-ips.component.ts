import { Component, OnInit } from '@angular/core';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { AuthenticationMgmtService } from '../authentication.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';

@Component({
  standalone: false,
  selector: 'app-blocked-ips',
  templateUrl: './blocked-ips.component.html',
  styleUrls: ['./blocked-ips.component.scss'],
})
export class BlockedIpsComponent implements OnInit {
  data: any[] = [];
  loading = false;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'ip', header: 'IP', sortable: true, filterable: true },
    {
      field: 'status', header: 'Status', sortable: true, filterable: true,
      type: 'tag',
      tagColors: { blocked: 'red', active: 'green' },
    },
    { field: 'usernames', header: 'Usernames', sortable: true, filterable: true },
    { field: 'created', header: 'Date', sortable: true, filterable: true },
  ];

  tableActions: TableAction[] = [
    { label: 'Unblock IP', icon: 'unlock', type: 'primary', command: () => this.unblockIp() },
  ];

  constructor(
    private authService: AuthenticationMgmtService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.authService.getBlockIpList().subscribe({
      next: (resp) => {
        if (resp.data) {
          this.data = resp.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  unblockIp(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row first.');
      return;
    }

    this.confirmDialog
      .confirm({
        title: 'Unblock IP',
        message: `Are you sure you want to unblock IP "${this.selectedRow.ip}"?`,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.authService.unblockIp(this.selectedRow.ip).subscribe({
          next: (resp) => {
            if (resp.success) {
              this.notificationService.success('IP unblocked successfully.');
              this.selectedRow = null;
              this.loadData();
            } else {
              this.notificationService.error(resp.message || 'Failed to unblock IP.');
            }
          },
          error: (err) => {
            this.notificationService.handleHttpError(err);
          },
        });
      });
  }
}
