import { Component, OnInit } from '@angular/core';
import { TableColumn, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { AuthenticationMgmtService } from '../authentication.service';

@Component({
  standalone: false,
  selector: 'app-login-history',
  templateUrl: './login-history.component.html',
  styleUrls: ['./login-history.component.scss'],
})
export class LoginHistoryComponent implements OnInit {
  data: any[] = [];
  loading = false;
  total = 0;

  columns: TableColumn[] = [
    { field: 'loginDate', header: 'Login Date', type: 'date', sortable: true, filterable: true },
    { field: 'username', header: 'User ID', sortable: true, filterable: true },
    { field: 'firstName', header: 'First Name', sortable: true, filterable: true },
    { field: 'lastName', header: 'Last Name', sortable: true, filterable: true },
    { field: 'ipAddr', header: 'IP Addr', sortable: true, filterable: true },
    { field: 'active', header: 'Active', type: 'boolean', sortable: true, width: '100px', align: 'center' },
  ];

  constructor(private authService: AuthenticationMgmtService) {}

  ngOnInit(): void {
    this.loadData({ pageIndex: 1, pageSize: 20, filters: {}, globalSearch: '' });
  }

  onQueryParamsChange(params: TableQueryParams): void {
    this.loadData(params);
  }

  loadData(params?: TableQueryParams): void {
    this.loading = true;
    const pageIndex = params?.pageIndex ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const first = (pageIndex - 1) * pageSize;

    let sortField = params?.sort?.field || 'loginDate';
    let sortOrder = 1; // descending by default (most recent first)
    if (params?.sort?.direction === 'ascend') {
      sortOrder = -1;
    } else if (params?.sort?.direction === 'descend') {
      sortOrder = 1;
    }

    const filters = params?.filters && Object.keys(params.filters).length > 0
      ? params.filters
      : null;

    this.authService
      .getLoginEvents({
        first,
        rows: pageSize,
        sortOrder,
        sortField,
        filters,
      })
      .subscribe({
        next: (resp) => {
          if (resp.success) {
            this.data = resp.data?.rows || [];
            this.total = resp.data?.records || 0;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}
