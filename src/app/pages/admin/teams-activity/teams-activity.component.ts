import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiResponse } from '../../../core/models/api-response';
import { NotificationService } from '../../../core/services/notification.service';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';
import { SidePanelComponent } from '../../../shared/components/side-panel/side-panel.component';
import { TeamsActivityService } from './teams-activity.service';

@Component({
  standalone: false,
  selector: 'app-teams-activity',
  templateUrl: './teams-activity.component.html',
  styleUrls: ['./teams-activity.component.scss']
})
export class TeamsActivityComponent implements OnInit, OnDestroy {
  @ViewChild('detailPanel') detailPanel!: SidePanelComponent;
  private destroy$ = new Subject<void>();

  selectedRow: any = null;
  loading = false;
  data: any[] = [];
  total = 0;

  columns: TableColumn[] = [
    { field: 'createdAtDisplay', header: 'Time', sortable: true, width: '160px' },
    { field: 'teamsUserName', header: 'Teams User', sortable: true, filterable: true, width: '150px' },
    { field: 'marcUsername', header: 'MARC User', sortable: true, filterable: true, width: '150px' },
    { field: 'activityType', header: 'Type', sortable: true, filterable: true, width: '120px' },
    { field: 'command', header: 'Command', sortable: true, filterable: true, width: '140px' },
    { field: 'commandArgs', header: 'Details', filterable: true, width: '180px' },
    { field: 'status', header: 'Status', sortable: true, filterable: true, width: '100px' },
    { field: 'durationFormatted', header: 'Duration', width: '100px' },
    { field: 'errorMessage', header: 'Error', filterable: true, width: '200px' }
  ];

  actions: TableAction[] = [
    { label: 'Refresh', icon: 'reload', command: () => this.loadData() }
  ];

  constructor(
    private teamsActivityService: TeamsActivityService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onQueryChange(params: any): void {
    this.loadData(params);
  }

  loadData(params?: any): void {
    this.loading = true;

    const filtersArray: any[] = [];
    if (params?.filters) {
      for (const key of Object.keys(params.filters)) {
        if (params.filters[key] !== null && params.filters[key] !== '') {
          filtersArray.push({ field: key, operator: 'CONTAINS', value: params.filters[key] });
        }
      }
    }

    const request = {
      page: params?.pageIndex ? params.pageIndex - 1 : 0,
      size: params?.pageSize ?? 20,
      sortField: params?.sort?.field || 'createdAt',
      sortDirection: params?.sort?.direction === 'ascend' ? 'ASC' : 'DESC',
      filters: filtersArray,
      globalFilter: params?.globalSearch || ''
    };

    this.teamsActivityService.getFiltered(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.data = (resp.data.content || resp.data.rows || []).map((row: any) => ({
              ...row,
              createdAtDisplay: row.createdAt ? new Date(row.createdAt).toLocaleString() : '—',
              durationFormatted: row.durationMs != null ? row.durationMs + 'ms' : '—'
            }));
            this.total = resp.data.totalElements || resp.data.records || 0;
          }
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load Teams activity logs');
          this.loading = false;
        }
      });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
    this.detailPanel.open();
  }

  onPanelClosed(): void {
    this.selectedRow = null;
  }

  onCopyToClipboard(): void {
    if (!this.selectedRow) return;
    const text = [
      `Teams User: ${this.selectedRow.teamsUserName || '—'}`,
      `MARC User: ${this.selectedRow.marcUsername || '—'}`,
      `Type: ${this.selectedRow.activityType || '—'}`,
      `Status: ${this.selectedRow.status || '—'}`,
      `Command: ${this.selectedRow.command || '—'}`,
      `Arguments: ${this.selectedRow.commandArgs || '—'}`,
      `Duration: ${this.selectedRow.durationFormatted || '—'}`,
      `Time: ${this.selectedRow.createdAtDisplay || '—'}`,
      this.selectedRow.errorMessage ? `Error: ${this.selectedRow.errorMessage}` : '',
      `Conversation ID: ${this.selectedRow.conversationId || '—'}`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      this.notificationService.success('Copied to clipboard');
    });
  }

  getStatusColor(status: string): string {
    if (!status) return 'default';
    const s = status.toLowerCase();
    if (s === 'success' || s === 'completed') return 'success';
    if (s === 'error' || s === 'failed') return 'error';
    if (s === 'pending' || s === 'processing') return 'processing';
    return 'default';
  }
}
