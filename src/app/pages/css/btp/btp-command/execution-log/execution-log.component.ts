import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TableColumn } from '../../../../../shared/components/advanced-table/advanced-table.models';
import { BtpService } from '../../btp.service';

@Component({
  standalone: false,
  selector: 'app-execution-log',
  templateUrl: './execution-log.component.html',
})
export class ExecutionLogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  data: any[] = [];
  totalRecords = 0;
  loading = false;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'commandName', header: 'Command', type: 'text' },
    { field: 'systemName', header: 'System Name', type: 'text' },
    { field: 'createdDate', header: 'Date', type: 'date' },
    { field: 'logStatus', header: 'Status', type: 'text' },
  ];

  constructor(private btpService: BtpService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    const params = { first: 0, rows: 20, sortOrder: -1, sortField: 'createdDate', filters: {} };
    this.btpService
      .getCommandExecutionLog(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.data = resp.data?.rows || [];
          this.totalRecords = resp.data?.records || 0;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onRowClicked(event: any): void {
    this.selectedRow = event;
    if (event?.rawLog) {
      this.btpService.logDetails.next(event.rawLog);
    }
  }
}
