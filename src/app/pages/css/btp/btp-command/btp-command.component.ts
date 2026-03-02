import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { BtpService } from '../btp.service';
import { SystemMappingComponent } from './system-mapping/system-mapping.component';
import { SystemMappingSettingComponent } from './system-mapping-setting/system-mapping-setting.component';

@Component({
  standalone: false,
  selector: 'app-btp-command',
  templateUrl: './btp-command.component.html',
})
export class BtpCommandComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;
  logDetail = '';
  activeTab = 0;

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', type: 'text' },
    { field: 'commandTemplate', header: 'Command Template', type: 'text' },
    { field: 'description', header: 'Description', type: 'text' },
    { field: '_frequency', header: 'Frequency', type: 'text' },
  ];

  actions: TableAction[] = [
    { label: 'Test', icon: 'play-circle', command: () => this.onTest() },
    { label: 'Map BTP Command', icon: 'link', command: () => this.onMapCommand() },
    { label: 'Setting', icon: 'setting', command: () => this.onSetting() },
  ];

  constructor(
    private btpService: BtpService,
    private notificationService: NotificationService,
    private nzModal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadCommands();
    this.btpService.logDetails.pipe(takeUntil(this.destroy$)).subscribe((log: string) => {
      this.logDetail = log;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCommands(): void {
    this.btpService.getCommandsList().subscribe((resp) => {
      if (resp?.data) {
        this.data = (resp.data.rows || []).map((row: any) => ({
          ...row,
          _frequency: this.decodeCron(row.frequency),
        }));
        this.totalRecords = resp.data.records || 0;
      }
    });
  }

  onRowClicked(row: any): void {
    this.selectedRow = row;
  }

  onTest(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a command first');
      return;
    }
    this.btpService.testConnection(this.selectedRow.id).subscribe((resp) => {
      if (resp?.data) {
        this.nzModal.create({
          nzTitle: 'Test Data',
          nzContent: TestDataContent,
          nzWidth: '90vw',
          nzClassName: 'updated-modal',
          nzData: { data: resp.data },
          nzFooter: null,
          nzBodyStyle: { height: '60vh', overflow: 'auto' },
        });
      }
    });
  }

  onMapCommand(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a command first');
      return;
    }
    this.nzModal.create({
      nzTitle: 'SAP Mapping',
      nzContent: SystemMappingComponent,
      nzWidth: '90vw',
      nzClassName: 'updated-modal',
      nzData: { data: this.selectedRow },
      nzFooter: null,
      nzBodyStyle: { height: '60vh', overflow: 'auto' },
    }).afterClose.subscribe(() => this.loadCommands());
  }

  onSetting(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a command first');
      return;
    }
    this.nzModal.create({
      nzTitle: 'Frequency',
      nzContent: SystemMappingSettingComponent,
      nzWidth: '450px',
      nzData: { data: this.selectedRow },
      nzFooter: null,
    }).afterClose.subscribe(() => this.loadCommands());
  }

  private decodeCron(cron: string): string {
    if (!cron || typeof cron !== 'string') return '';
    const parts = cron.trim().split(' ');
    if (parts.length < 5) return 'Invalid cron expression';

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const parseTime = (min: string, hr: string): string => {
      if (min.startsWith('*/')) return `Every ${min.replace('*/', '')} minutes`;
      if (hr === '*' && min !== '*') return `At minute ${min} every hour`;
      return `At ${hr.padStart(2, '0')}:${min.padStart(2, '0')}`;
    };

    let description = parseTime(minute, hour);

    if (dayOfWeek !== '*' && dayOfMonth === '*') {
      const index = parseInt(dayOfWeek, 10);
      const dayName = index >= 0 && index <= 6 ? daysOfWeek[index] : dayOfWeek;
      description += `, every week on ${dayName}`;
    } else if (dayOfMonth !== '*' && month !== '*') {
      const monthIndex = parseInt(month, 10) - 1;
      const monthName = monthIndex >= 0 && monthIndex < 12 ? months[monthIndex] : month;
      description += `, on day ${dayOfMonth} in ${monthName}`;
    } else if (dayOfMonth !== '*') {
      description += `, on day ${dayOfMonth} every month`;
    } else if (month !== '*') {
      const monthIndex = parseInt(month, 10) - 1;
      const monthName = monthIndex >= 0 && monthIndex < 12 ? months[monthIndex] : month;
      description += `, in ${monthName}`;
    }

    return description;
  }
}

@Component({
  standalone: false,
  selector: 'app-btp-test-data-content',
  template: `
    <nz-table #testTable [nzData]="tableData" nzSize="small" [nzScroll]="{ x: '100%' }"
      [nzShowPagination]="tableData.length > 20" [nzPageSize]="20" nzTableLayout="fixed">
      <thead>
        <tr>
          <th *ngFor="let col of columns">{{ col.header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let row of testTable.data">
          <td *ngFor="let col of columns">{{ row[col.field] }}</td>
        </tr>
      </tbody>
    </nz-table>
    <nz-empty *ngIf="tableData.length === 0" nzNotFoundContent="No test data returned" [nzNotFoundImage]="'simple'"></nz-empty>
    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Close</button>
    </div>
  `,
})
export class TestDataContent {
  tableData: any[] = [];
  columns: { field: string; header: string }[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modal: NzModalRef
  ) {
    const raw = this.dialogData?.data;
    this.tableData = Array.isArray(raw) ? raw : raw ? [raw] : [];
    if (this.tableData.length > 0) {
      this.columns = Object.keys(this.tableData[0]).map((key) => ({
        field: key,
        header: key.charAt(0).toUpperCase() + key.slice(1),
      }));
    }
  }
}
