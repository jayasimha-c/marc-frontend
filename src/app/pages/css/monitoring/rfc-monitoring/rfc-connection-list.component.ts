import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CssMonitoringService } from '../css-monitoring.service';
import { RfcMonitoringService, RfcConnectionVO, RfcConnectionFilterRequest } from './rfc-monitoring.service';
import { TableColumn, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-rfc-connection-list',
  templateUrl: './rfc-connection-list.component.html',
})
export class RfcConnectionListComponent implements OnInit {
  systems: any[] = [];
  connectionTypes: string[] = [];
  selectedSystem = new FormControl<number | null>(null);
  selectedType = new FormControl<string | null>(null);
  activeOnly = true;
  searchName = '';

  connections: any[] = [];
  totalRecords = 0;
  loading = false;
  lastQuery: TableQueryParams | null = null;

  selectedConnection: RfcConnectionVO | null = null;
  drawerVisible = false;

  typeLabels: { [key: string]: string } = {
    '3': 'RFC', 'H': 'HTTP', 'G': 'HTTP_EXT', 'T': 'TCP/IP',
    'L': 'Logical', 'I': 'Internal', 'X': 'ABAP/CPI',
  };

  columns: TableColumn[] = [
    { field: 'connectionName', header: 'Connection Name', sortable: true },
    { field: 'connectionTypeLabel', header: 'Type', width: '100px', type: 'tag' },
    { field: 'sapSystemName', header: 'SAP System', width: '140px', sortable: true },
    { field: 'targetHost', header: 'Target Host' },
    { field: 'username', header: 'Username', width: '120px' },
    { field: 'riskLevelTag', header: 'Risk', width: '90px', type: 'tag',
      tagColors: { CRITICAL: 'red', HIGH: 'volcano', MEDIUM: 'orange', LOW: 'green', INFO: 'default' } },
    { field: 'trustedTag', header: 'Trusted', width: '80px', type: 'tag',
      tagColors: { Yes: 'orange', No: 'default' } },
    { field: 'sncTag', header: 'SNC', width: '80px', type: 'tag',
      tagColors: { Yes: 'green', No: 'red' } },
    { field: 'activeTag', header: 'Active', width: '80px', type: 'tag',
      tagColors: { Active: 'green', Inactive: 'default' } },
    { field: 'actions', header: 'Actions', type: 'actions', width: '80px',
      actions: [
        { icon: 'eye', tooltip: 'View Details', command: (row: any) => this.openDetail(row) },
      ] },
  ];

  constructor(
    private rfcMonitoringService: RfcMonitoringService,
    private cssMonitoringService: CssMonitoringService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.loadSystems();
    this.loadConnectionTypes();
    this.applyQueryParams();
  }

  loadSystems(): void {
    this.cssMonitoringService.getSystemList(null).subscribe({
      next: (resp) => { if (resp.success) this.systems = resp.data; },
      error: () => { this.systems = []; },
    });
  }

  loadConnectionTypes(): void {
    this.rfcMonitoringService.getConnectionTypes().subscribe({
      next: (resp) => { if (resp.success) this.connectionTypes = resp.data; },
      error: () => { this.connectionTypes = []; },
    });
  }

  applyQueryParams(): void {
    const params = this.route.snapshot.queryParams;
    if (params['sapSystemId']) this.selectedSystem.setValue(+params['sapSystemId']);
    if (params['connectionType']) this.selectedType.setValue(params['connectionType']);
  }

  loadConnections(params: TableQueryParams): void {
    this.lastQuery = params;
    this.loading = true;

    const filter: RfcConnectionFilterRequest = {
      sapSystemId: this.selectedSystem.value || undefined,
      connectionType: this.selectedType.value || undefined,
      connectionName: this.searchName || undefined,
      isActive: this.activeOnly ? true : undefined,
      page: (params.pageIndex || 1) - 1,
      size: params.pageSize || 25,
      sortField: params.sort?.field || 'modifiedDate',
      sortDirection: params.sort?.direction === 'ascend' ? 'ASC' : 'DESC',
    };

    const request = this.activeOnly
      ? this.rfcMonitoringService.getActiveConnections(filter)
      : this.rfcMonitoringService.getConnections(filter);

    request.subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success && resp.data) {
          this.connections = (resp.data.rows || []).map((c: RfcConnectionVO) => ({
            ...c,
            riskLevelTag: c.riskLevel || 'INFO',
            trustedTag: c.trustedRfc ? 'Yes' : 'No',
            sncTag: c.sncEnabled ? 'Yes' : 'No',
            activeTag: c.isActive ? 'Active' : 'Inactive',
          }));
          this.totalRecords = resp.data.records || 0;
        } else {
          this.connections = [];
          this.totalRecords = 0;
        }
      },
      error: () => {
        this.loading = false;
        this.connections = [];
        this.totalRecords = 0;
      },
    });
  }

  onFilterChange(): void {
    if (this.lastQuery) {
      this.loadConnections({ ...this.lastQuery, pageIndex: 1 });
    }
  }

  clearFilters(): void {
    this.selectedSystem.setValue(null);
    this.selectedType.setValue(null);
    this.activeOnly = true;
    this.searchName = '';
    this.onFilterChange();
  }

  openDetail(connection: RfcConnectionVO): void {
    this.selectedConnection = connection;
    this.drawerVisible = true;
  }

  closeDrawer(): void {
    this.drawerVisible = false;
    this.selectedConnection = null;
  }

  navigateBack(): void {
    this.router.navigate(['/css/monitoring/rfc-monitoring']);
  }

  getTypeLabel(type: string): string {
    return this.typeLabels[type] || type;
  }
}
