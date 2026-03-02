import { Component, OnInit } from '@angular/core';
import { TableColumn, TableQueryParams } from '../../../../../shared/components/advanced-table/advanced-table.models';
import { CommunicationService } from '../../communication.service';

@Component({
  standalone: false,
  selector: 'app-email-logs',
  templateUrl: './log-section.component.html',
})
export class LogSectionComponent implements OnInit {
  columns: TableColumn[] = [
    { field: 'description', header: 'Type', sortable: true, filterable: true },
    { field: 'receiver', header: 'Recipient', sortable: true, filterable: true },
    { field: 'sendTimeStr', header: 'Time', sortable: true },
  ];

  data: any[] = [];
  loading = false;
  total = 0;

  constructor(private communicationService: CommunicationService) {}

  ngOnInit(): void {
    this.loadData({ pageIndex: 1, pageSize: 20, filters: {}, globalSearch: '' });
  }

  onQueryParamsChange(params: TableQueryParams): void {
    this.loadData(params);
  }

  loadData(params: TableQueryParams): void {
    this.loading = true;

    const sortOrder = params.sort?.direction === 'ascend' ? 1
                    : params.sort?.direction === 'descend' ? -1
                    : 1;

    this.communicationService.getMailLogs({
      first: (params.pageIndex - 1) * params.pageSize,
      rows: params.pageSize,
      sortOrder,
      sortField: params.sort?.field || 'sendTimeStr',
      filters: params.filters || {},
    }).subscribe({
      next: (resp) => {
        this.data = resp?.data?.rows || [];
        this.total = resp?.data?.records || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
