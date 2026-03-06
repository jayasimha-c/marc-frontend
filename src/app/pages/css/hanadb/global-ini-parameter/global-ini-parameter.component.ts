import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { HanaService } from '../hana.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-global-ini-parameter',
  templateUrl: './global-ini-parameter.component.html',
})
export class GlobalIniParameterComponent implements OnInit {
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'key', header: 'Parameter Name' },
    { field: 'description', header: 'Description' },
    { field: 'section', header: 'Section' },
    { field: 'sapSystemName', header: 'System' },
  ];

  actions: TableAction[] = [];

  constructor(
    private hanaService: HanaService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.hanaService.getAllParameters().subscribe({
      next: (resp) => {
        this.data = resp.data?.rows || [];
        this.totalRecords = resp.data?.records || 0;
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load HANA parameters');
        this.loading = false;
      },
    });
  }
}
