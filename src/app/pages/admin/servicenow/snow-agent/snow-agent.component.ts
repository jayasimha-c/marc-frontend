import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApiResponse } from '../../../../core/models/api-response';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { ServiceNowService, SnowAgentConfig, SnowAgentLog } from '../servicenow.service';
import { SnowAgentConfigDialogComponent } from './snow-agent-config-dialog.component';
import { SnowAgentEventDialogComponent } from './snow-agent-event-dialog.component';

@Component({
  standalone: false,
  selector: 'app-snow-agent',
  templateUrl: './snow-agent.component.html',
  styleUrls: ['./snow-agent.component.scss']
})
export class SnowAgentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedConfig: SnowAgentConfig | null = null;
  pollRunning = false;
  stats: { [key: string]: number } = {};

  // Configs table
  configsData: any[] = [];
  configsColumns: TableColumn[] = [
    { field: 'snowSystemName', header: 'ServiceNow System', sortable: true, filterable: true, width: '180px' },
    { field: 'targetSapSystemName', header: 'Target SAP System', sortable: true, filterable: true, width: '180px' },
    { field: 'enabledDisplay', header: 'Enabled', sortable: true, width: '100px' },
    { field: 'autoProvisionDisplay', header: 'Auto-Provision', sortable: true, width: '120px' },
    { field: 'riskThreshold', header: 'Risk Threshold', sortable: true, width: '130px' },
    { field: 'pollCron', header: 'Poll CRON', width: '140px' },
    { field: 'lastPollTime', header: 'Last Poll', sortable: true, width: '160px' }
  ];
  configActions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onAdd() },
    { label: 'Edit', icon: 'edit', command: () => this.onEdit() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onDelete() },
    { label: 'Trigger Poll', icon: 'caret-right', command: () => this.onTriggerPoll() },
    { label: 'Mock Test', icon: 'experiment', command: () => this.onMockTest() }
  ];

  // Logs table
  logsData: any[] = [];
  logsTotal = 0;
  logsLoading = false;
  logsColumns: TableColumn[] = [
    { field: 'processedAt', header: 'Processed', sortable: true, width: '160px' },
    { field: 'snowTicketNumber', header: 'Ticket #', sortable: true, filterable: true, width: '120px' },
    { field: 'requestedForUser', header: 'User', sortable: true, filterable: true, width: '120px' },
    { field: 'roleName', header: 'Business Role', sortable: true, filterable: true, width: '140px' },
    { field: 'technicalRoleCount', header: 'Tech Roles', width: '90px' },
    { field: 'targetSystem', header: 'Target System', sortable: true, width: '120px' },
    { field: 'decision', header: 'Decision', sortable: true, filterable: true, width: '130px' },
    { field: 'violationCount', header: 'Violations', width: '90px' },
    { field: 'maxSeverity', header: 'Severity', sortable: true, width: '100px' },
    { field: 'snowUpdatedDisplay', header: 'SNOW Updated', width: '110px' },
    { field: 'requestId', header: 'Request ID', filterable: true, width: '140px' }
  ];

  constructor(
    private servicenowService: ServiceNowService,
    private notificationService: NotificationService,
    private nzModalService: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadConfigs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConfigs(): void {
    this.servicenowService.getAgentConfigs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.configsData = resp.data.map((c: SnowAgentConfig) => ({
              ...c,
              _original: c,
              enabledDisplay: c.enabled ? 'Active' : 'Inactive',
              autoProvisionDisplay: c.autoProvision ? 'Yes' : 'No'
            }));
          }
        },
        error: () => {
          this.notificationService.error('Failed to load agent configurations');
        }
      });
  }

  onConfigSelect(row: any): void {
    this.selectedConfig = row._original || row;
    this.loadStats();
  }

  onAdd(): void {
    const modalRef = this.nzModalService.create({
      nzTitle: 'Add Agent Configuration',
      nzContent: SnowAgentConfigDialogComponent,
      nzWidth: 650,
      nzData: {},
      nzFooter: null
    });

    modalRef.afterClose
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.notificationService.success('Configuration saved successfully');
          this.loadConfigs();
        }
      });
  }

  onEdit(): void {
    if (!this.selectedConfig) {
      this.notificationService.warn('Please select a configuration first');
      return;
    }

    const modalRef = this.nzModalService.create({
      nzTitle: 'Edit Agent Configuration',
      nzContent: SnowAgentConfigDialogComponent,
      nzWidth: 650,
      nzData: { config: this.selectedConfig },
      nzFooter: null
    });

    modalRef.afterClose
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.notificationService.success('Configuration updated successfully');
          this.loadConfigs();
        }
      });
  }

  onDelete(): void {
    if (!this.selectedConfig?.id) {
      this.notificationService.warn('Please select a configuration first');
      return;
    }

    this.nzModalService.confirm({
      nzTitle: 'Delete Configuration',
      nzContent: 'Are you sure you want to delete this agent configuration?',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.servicenowService.deleteAgentConfig(this.selectedConfig!.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (resp: ApiResponse) => {
              if (resp.success) {
                this.notificationService.success('Configuration deleted');
                this.selectedConfig = null;
                this.stats = {};
                this.logsData = [];
                this.logsTotal = 0;
                this.loadConfigs();
              } else {
                this.notificationService.error(resp.message || 'Delete failed');
              }
            },
            error: () => {
              this.notificationService.error('Failed to delete configuration');
            }
          });
      }
    });
  }

  onTriggerPoll(): void {
    if (!this.selectedConfig?.id) {
      this.notificationService.warn('Please select a configuration first');
      return;
    }

    this.pollRunning = true;
    this.servicenowService.triggerAgentPoll(this.selectedConfig.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.notificationService.success(resp.message || 'Poll completed');
            this.loadStats();
            this.loadConfigs();
          } else {
            this.notificationService.error(resp.message || 'Poll failed');
          }
          this.pollRunning = false;
        },
        error: () => {
          this.notificationService.error('Failed to trigger poll');
          this.pollRunning = false;
        }
      });
  }

  onLogsQueryChange(params: any): void {
    if (!this.selectedConfig?.id) return;
    this.logsLoading = true;

    const request = {
      page: params?.pageIndex ?? 0,
      size: params?.pageSize ?? 20,
      sortField: params?.sort?.field || 'processedAt',
      sortDirection: (params?.sort?.direction || 'desc').toUpperCase(),
      filters: params?.filters || [],
      globalFilter: params?.globalSearch || ''
    };

    this.servicenowService.getAgentLogs(this.selectedConfig.id, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.logsData = (resp.data.content || []).map((log: SnowAgentLog) => ({
              ...log,
              snowUpdatedDisplay: log.snowStatusUpdated ? 'Yes' : 'No'
            }));
            this.logsTotal = resp.data.totalElements || 0;
          }
          this.logsLoading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load logs');
          this.logsLoading = false;
        }
      });
  }

  loadStats(): void {
    if (!this.selectedConfig?.id) return;

    this.servicenowService.getAgentLogStats(this.selectedConfig.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.stats = resp.data;
          }
        }
      });
  }

  getStatCount(key: string): number {
    return this.stats[key] || 0;
  }

  getTotalProcessed(): number {
    return Object.values(this.stats).reduce((sum, count) => sum + count, 0);
  }

  onLogRowClick(row: any): void {
    if (!row?.requestId) {
      this.notificationService.warn('No event trail available for this log entry');
      return;
    }
    this.nzModalService.create({
      nzTitle: 'Event Timeline',
      nzContent: SnowAgentEventDialogComponent,
      nzWidth: 700,
      nzData: { requestId: row.requestId },
      nzFooter: null
    });
  }

  onMockTest(): void {
    if (!this.selectedConfig?.id) {
      this.notificationService.warn('Please select a configuration first');
      return;
    }

    this.nzModalService.create({
      nzTitle: 'Mock Test',
      nzContent: 'Enter SAP BNAME and Business Role Name to simulate an agent request.',
      nzFooter: null,
      nzClosable: true
    });

    // Use a simpler approach — prompt for inputs
    const sapBname = prompt('SAP BNAME (must exist in marc_identity):', 'MGR007');
    if (!sapBname) return;

    const roleName = prompt('Business Role Name (must exist in Role Catalogue):', 'FI-CLERK');
    if (!roleName) return;

    this.pollRunning = true;
    this.servicenowService.mockAgentProcess(this.selectedConfig.id, sapBname, roleName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.notificationService.success(resp.message || 'Mock request processed');
            this.loadStats();
          } else {
            this.notificationService.error(resp.message || 'Mock processing failed');
          }
          this.pollRunning = false;
        },
        error: () => {
          this.notificationService.error('Failed to process mock request');
          this.pollRunning = false;
        }
      });
  }
}
