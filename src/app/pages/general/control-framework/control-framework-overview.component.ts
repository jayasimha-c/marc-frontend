import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ControlFrameworkService } from './control-framework.service';
import { ControlFrameworkImportComponent } from './control-framework-import.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-control-framework-overview',
  templateUrl: './control-framework-overview.component.html',
})
export class ControlFrameworkOverviewComponent implements OnInit {
  totalFrameworks = 0;
  totalRequirements = 0;
  avgRequirementsPerFramework = 0;
  activeProviders = 0;
  loading = false;
  statsLoading = true;

  columns: TableColumn[] = [
    { field: 'name', header: 'Framework Name', sortable: true, onClick: (row: any) => this.viewFrameworkDetails(row) },
    { field: 'refId', header: 'Reference ID', sortable: true },
    { field: 'provider', header: 'Provider', sortable: true },
    { field: 'version', header: 'Version', sortable: true },
    { field: 'requirementCount', header: 'Controls', sortable: true, type: 'number' },
    { field: 'updatedAt', header: 'Last Updated', sortable: true, type: 'date' },
  ];

  actions: TableAction[] = [
    { label: 'Import Framework', icon: 'upload', command: () => this.openImportDialog() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.deleteSelected() },
  ];

  data: any[] = [];
  selectedRow: any = null;

  constructor(
    private cfService: ControlFrameworkService,
    private modal: NzModalService,
    private router: Router,
    private notify: NotificationService,
    private confirm: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadFrameworks();
    this.loadStats();
  }

  loadFrameworks(): void {
    this.loading = true;
    this.cfService.getFrameworks().subscribe({
      next: (res) => {
        if (res.success) {
          this.data = res.data?.rows || [];
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadStats(): void {
    this.statsLoading = true;
    this.cfService.getFrameworkStats().subscribe({
      next: (res) => {
        const stat = res.data;
        if (stat) {
          this.totalFrameworks = stat.totalFramework || 0;
          this.totalRequirements = stat.totalControls || 0;
          this.avgRequirementsPerFramework = stat.avgControlsPerFramework || 0;
          this.activeProviders = stat.activeProviders || 0;
        }
        this.statsLoading = false;
      },
      error: () => { this.statsLoading = false; },
    });
  }

  openImportDialog(): void {
    const ref = this.modal.create({
      nzTitle: 'Import Control Framework',
      nzContent: ControlFrameworkImportComponent,
      nzWidth: '600px',
      nzFooter: null,
    });
    ref.afterClose.subscribe(result => {
      if (result?.success) {
        this.loadFrameworks();
        this.loadStats();
      }
    });
  }

  deleteSelected(): void {
    if (!this.selectedRow) {
      this.notify.error('Please select a framework first');
      return;
    }
    this.confirm.confirm({
      title: 'Delete Framework',
      message: 'Are you sure you want to delete this framework?',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.cfService.deleteFramework(this.selectedRow.id).subscribe((res) => {
          this.notify.show(res);
          this.loadFrameworks();
          this.loadStats();
        });
      }
    });
  }

  viewFrameworkDetails(framework: any): void {
    this.router.navigate(['/general/control-framework/dashboard'], {
      state: { selectedFrameworkId: framework.id },
    });
  }
}
