import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { ReportingUnitService } from '../reporting-units.service';
import { TableColumn, TableAction, RowAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-systems',
  templateUrl: './systems.component.html',
})
export class SystemsComponent implements OnInit {
  systems: any[] = [];
  totalRecords = 0;
  loading = false;
  lastQuery: TableQueryParams | null = null;

  columns: TableColumn[] = [
    { field: 'destinationName', header: 'System Name', sortable: true },
    { field: 'description', header: 'Description' },
    { field: 'systemType', header: 'Type', type: 'tag', width: '120px' },
    { field: 'hostName', header: 'Host' },
    { field: 'statusText', header: 'Status', type: 'tag', width: '100px',
      tagColors: { Active: 'green', Offline: 'default' } },
    { field: 'systemRole', header: 'Environment', width: '120px' },
    { field: 'userName', header: 'User' },
    { field: 'actions', header: 'Actions', type: 'actions', width: '160px',
      actions: this.getRowActions() },
  ];

  tableActions: TableAction[] = [
    { label: 'Add System', icon: 'plus', type: 'primary', command: () => this.addSystem() },
  ];

  constructor(
    private router: Router,
    private modal: NzModalService,
    private notificationService: NotificationService,
    private reportingUnitService: ReportingUnitService,
  ) { }

  ngOnInit(): void { }

  private getRowActions(): RowAction[] {
    return [
      { icon: 'edit', tooltip: 'Edit System', command: (row) => this.editSystem(row) },
      { icon: 'api', tooltip: 'Test Connection', command: (row) => this.testSystem(row) },
      { icon: 'solution', tooltip: 'Role Concepts', command: (row) => this.openRoleConcepts(row),
        hidden: (row) => row.systemType !== 'SAP' },
      { icon: 'copy', tooltip: 'Duplicate', command: (row) => this.duplicateSystem(row) },
      { icon: 'delete', tooltip: 'Delete', command: (row) => this.deleteSystem(row), danger: true },
    ];
  }

  loadSystems(params: TableQueryParams): void {
    this.lastQuery = params;
    this.loading = true;
    this.reportingUnitService.sapList(params).subscribe({
      next: (resp) => {
        const rows = resp.data?.rows || [];
        this.systems = rows.map((item: any) => ({
          ...item,
          statusText: item.offline ? 'Offline' : 'Active',
        }));
        this.totalRecords = resp.data?.records || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  addSystem(): void {
    this.router.navigate(['/admin/reporting-units/systems/add']);
  }

  editSystem(system: any): void {
    this.router.navigate(['/admin/reporting-units/systems/edit', system.id, system.systemType]);
  }

  openRoleConcepts(system: any): void {
    this.router.navigate(['/admin/reporting-units/systems', system.id, 'role-concept']);
  }

  duplicateSystem(system: any): void {
    const systemToDuplicate = { ...system, id: 0 };
    sessionStorage.setItem('duplicateSystem', JSON.stringify(systemToDuplicate));
    this.router.navigate(['/admin/reporting-units/systems/add'], { queryParams: { duplicate: true } });
  }

  testSystem(system: any): void {
    if (system.offline) {
      this.notificationService.error('Please select an online system');
      return;
    }

    const isIntegration = ['JIRA', 'SERVICE_NOW', 'SECURITY_NOTE'].includes(system.systemType);
    const api$ = isIntegration
      ? this.reportingUnitService.testIntegrationSystems(system)
      : this.reportingUnitService.testSapSystem(system.id);

    api$.subscribe({
      next: (resp) => { this.notificationService.show(resp); },
      error: (err) => { this.notificationService.show(err.error); },
    });
  }

  private deleteSystem(system: any): void {
    this.modal.confirm({
      nzTitle: 'Delete System',
      nzContent: `Do you want to remove system "${system.destinationName}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        const isIntegration = ['JIRA', 'SERVICE_NOW', 'SECURITY_NOTE'].includes(system.systemType);
        const api$ = isIntegration
          ? this.reportingUnitService.deleteIntegrationSystems(system)
          : this.reportingUnitService.sapDelete(system.id);

        api$.subscribe({
          next: (resp) => {
            this.notificationService.show(resp);
            if (this.lastQuery) this.loadSystems(this.lastQuery);
          },
          error: (err) => { this.notificationService.show(err.error); },
        });
      },
    });
  }
}
