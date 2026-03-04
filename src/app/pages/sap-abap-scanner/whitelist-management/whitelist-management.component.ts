import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AbapService } from '../abap.service';
import { CssMonitoringService } from '../../css/monitoring/css-monitoring.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TableColumn, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-whitelist-management',
  templateUrl: './whitelist-management.component.html',
  styleUrls: ['./whitelist-management.component.scss'],
})
export class WhitelistManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  activeTab = 0;
  filterForm!: FormGroup;

  // Whitelist entries table
  whitelistData: any[] = [];
  selectedRow: any = null;

  // Violation whitelist table
  violationData: any[] = [];
  violationTotal = 0;
  violationSelectedRow: any = null;
  violationLoading = false;
  private lastViolationParams: TableQueryParams | null = null;

  // Violation detail view (inline)
  showDetail = false;
  detailTitle = '';
  detailData: any[] = [];
  detailLoading = false;
  detailColumns: TableColumn[] = [];
  detailSelectedRow: any = null;

  // Add/Edit modal
  showAddModal = false;
  editingWhitelist: any = null;
  whitelistForm!: FormGroup;

  whitelistTypeOptions = [
    { value: 'LIST', label: 'List' },
    { value: 'PATTERN', label: 'Pattern' },
  ];

  whitelistFieldOptions = [
    { value: 'EMAIL', label: 'Email' },
    { value: 'USERNAME', label: 'Username' },
    { value: 'PROGRAM_NAME', label: 'Program Name' },
    { value: 'PACKAGE', label: 'Package' },
    { value: 'TRANSACTION', label: 'Transaction' },
  ];

  violationTypeLabels: Record<string, string> = {
    BTP: 'BTP Whitelist',
    HANA_ACCESS_PRIVILEGE: 'HANA Access Privilege',
    HANA_ROLE_WHITELIST: 'HANA Role Whitelist',
    UME_USER: 'UME User',
    HANA_AUDIT: 'HANA Audit Policy',
    HANA_INI: 'HANA INI Configuration',
    ACM_USERS_WHITELIST: 'ACM Users Whitelist',
  };

  violationColumns: TableColumn[] = [
    { field: 'whitelistSource', header: 'Name', sortable: false },
    { field: 'whitelistTypeLabel', header: 'Type', sortable: false, width: '180px' },
    { field: 'recordCount', header: 'Whitelisted Values', sortable: false, width: '140px' },
    { field: 'latestCreatedAt', header: 'Modified At', type: 'date', sortable: false, width: '160px' },
    { field: 'latestCreatedBy', header: 'Last Modified By', sortable: false, width: '140px' },
  ];

  constructor(
    private fb: FormBuilder,
    private abapService: AbapService,
    private cssMonitoringService: CssMonitoringService,
    private notification: NotificationService,
    private modal: NzModalService
  ) {
    this.filterForm = this.fb.group({
      search: [null],
      type: [null],
      isActive: [null],
    });

    this.whitelistForm = this.fb.group({
      id: [null],
      name: [''],
      description: [''],
      active: [true],
      type: ['LIST'],
      field: ['EMAIL'],
      pattern: [null],
      valueList: [null],
    });
  }

  ngOnInit(): void {
    this.loadWhitelist();

    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.loadWhitelist());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== Whitelist Entries ====================

  loadWhitelist(): void {
    const filters = this.filterForm.value;
    this.abapService.listWhitelist(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) {
          this.whitelistData = res.data?.rows || (Array.isArray(res.data) ? res.data : []);
        }
      },
    });
  }

  onWhitelistRowClick(row: any): void {
    this.selectedRow = row;
  }

  openAddModal(): void {
    this.editingWhitelist = null;
    this.whitelistForm.reset({ active: true, type: 'LIST', field: 'EMAIL' });
    this.showAddModal = true;
  }

  openEditModal(): void {
    if (!this.selectedRow) {
      this.notification.warn('Please select a row first');
      return;
    }
    this.editingWhitelist = this.selectedRow;
    this.whitelistForm.patchValue(this.selectedRow);
    this.showAddModal = true;
  }

  saveWhitelist(): void {
    if (!this.whitelistForm.get('name')?.value) {
      this.notification.warn('Name is required');
      return;
    }
    const payload = this.whitelistForm.value;
    this.abapService.saveWhitelist(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('Saved successfully');
          this.showAddModal = false;
          this.loadWhitelist();
        } else {
          this.notification.error(res.message || 'Save failed');
        }
      },
      error: (err) => this.notification.error(err.error?.message || 'Save failed'),
    });
  }

  deleteWhitelist(): void {
    if (!this.selectedRow) {
      this.notification.warn('Please select a row first');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Delete Confirmation',
      nzContent: 'Are you sure you want to delete this whitelist entry?',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.abapService.deleteWhitelist(this.selectedRow.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Deleted successfully');
              this.selectedRow = null;
              this.loadWhitelist();
            } else {
              this.notification.error(res.message || 'Delete failed');
            }
          },
          error: (err) => this.notification.error(err.error?.message || 'Delete failed'),
        });
      },
    });
  }

  // ==================== Violation Whitelists ====================

  onViolationQueryChange(params: TableQueryParams): void {
    this.lastViolationParams = params;
    this.loadViolationWhitelist(params);
  }

  loadViolationWhitelist(params?: TableQueryParams): void {
    const query = params || this.lastViolationParams;
    if (!query) return;

    this.violationLoading = true;
    this.abapService.listViolationWhitelist(query).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.violationLoading = false;
        if (res.success) {
          const rows = res.data?.rows || [];
          this.violationData = rows.map((r: any) => ({
            ...r,
            whitelistTypeLabel: this.violationTypeLabels[r.whitelistType] || r.whitelistType,
          }));
          this.violationTotal = res.data?.records || 0;
        }
      },
      error: () => {
        this.violationLoading = false;
      },
    });
  }

  onViolationRowClick(row: any): void {
    this.violationSelectedRow = row;
    this.loadViolationDetail(row);
  }

  // ==================== Violation Detail (inline) ====================

  private loadViolationDetail(row: any): void {
    const type = row.whitelistType;
    this.detailSelectedRow = null;
    this.detailData = [];
    this.showDetail = true;
    this.detailLoading = true;

    this.setupDetailColumns(type, row);
    this.setDetailTitle(type, row);

    const data$ = this.getDetailObservable(type, row);
    if (!data$) {
      this.detailLoading = false;
      return;
    }

    data$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.detailLoading = false;
        if (res.success) {
          this.detailData = res.data?.rows || (Array.isArray(res.data) ? res.data : []);
        }
      },
      error: () => {
        this.detailLoading = false;
        this.detailData = [];
      },
    });
  }

  private getDetailObservable(type: string, row: any) {
    switch (type) {
      case 'BTP':
        return this.cssMonitoringService.getBtpWhitelist();
      case 'HANA_ACCESS_PRIVILEGE':
        return this.cssMonitoringService.getAccessRuleWhitelist(false);
      case 'HANA_ROLE_WHITELIST':
        return this.cssMonitoringService.getAccessRuleWhitelist(true);
      case 'UME_USER':
        return this.cssMonitoringService.getAllUMEWhitelist();
      case 'HANA_AUDIT':
        return this.cssMonitoringService.getAuditRuleWhitelistByParameterName(row.whitelistSource);
      case 'HANA_INI':
        return this.cssMonitoringService.getInitWhiteListByParameterName(row.whitelistSource);
      case 'ACM_USERS_WHITELIST':
        return this.cssMonitoringService.getCssAcmViolationsWhitelist();
      default:
        return null;
    }
  }

  private setDetailTitle(type: string, row: any): void {
    switch (type) {
      case 'BTP': this.detailTitle = 'BTP Whitelist Details'; break;
      case 'HANA_ACCESS_PRIVILEGE': this.detailTitle = 'HANA Access Privilege Whitelist'; break;
      case 'HANA_ROLE_WHITELIST': this.detailTitle = 'HANA Role Whitelist'; break;
      case 'UME_USER': this.detailTitle = 'UME User Whitelist'; break;
      case 'HANA_AUDIT': this.detailTitle = 'HANA Audit Policy Whitelist — ' + row.whitelistSource; break;
      case 'HANA_INI': this.detailTitle = 'HANA INI Configuration Whitelist — ' + row.whitelistSource; break;
      case 'ACM_USERS_WHITELIST': this.detailTitle = 'ACM Users Whitelist'; break;
      default: this.detailTitle = 'Whitelist Details';
    }
  }

  private setupDetailColumns(type: string, row: any): void {
    switch (type) {
      case 'BTP':
        this.detailColumns = [
          { field: 'sapSystemName', header: 'SAP System', sortable: false },
          { field: 'fullName', header: 'Full Name', sortable: false },
          { field: 'username', header: 'Username', sortable: false, width: '120px' },
          { field: 'globalAccountName', header: 'Global Account', sortable: false },
          { field: 'subAccountName', header: 'Sub Account', sortable: false },
          { field: 'ruleName', header: 'Rule', sortable: false, width: '120px' },
          { field: 'whitelistReason', header: 'Reason', sortable: false },
          { field: 'createdAt', header: 'Created', type: 'date', sortable: false, width: '140px' },
          { field: 'createdBy', header: 'Created By', sortable: false, width: '120px' },
        ];
        break;
      case 'HANA_INI':
        this.detailColumns = [
          { field: 'sapSystemName', header: 'SAP System', sortable: false },
          { field: 'key', header: 'Parameter', sortable: false },
          { field: 'fileName', header: 'Type', sortable: false, width: '100px' },
          { field: 'value', header: 'Actual Value', sortable: false },
          { field: 'ruleName', header: 'Rule', sortable: false, width: '120px' },
          { field: 'whitelistReason', header: 'Reason', sortable: false },
          { field: 'createdAt', header: 'Whitelisted', type: 'date', sortable: false, width: '140px' },
          { field: 'createdBy', header: 'By', sortable: false, width: '100px' },
        ];
        break;
      case 'HANA_AUDIT':
        this.detailColumns = [
          { field: 'sapSystemName', header: 'SAP System', sortable: false },
          { field: 'auditPolicyName', header: 'Audit Policy', sortable: false },
          { field: 'eventStatus', header: 'Event Status', sortable: false, width: '100px' },
          { field: 'eventAction', header: 'Event Action', sortable: false, width: '100px' },
          { field: 'userName', header: 'User', sortable: false, width: '100px' },
          { field: 'ruleName', header: 'Rule', sortable: false, width: '120px' },
          { field: 'whitelistReason', header: 'Reason', sortable: false },
          { field: 'createdAt', header: 'Whitelisted', type: 'date', sortable: false, width: '140px' },
          { field: 'createdBy', header: 'By', sortable: false, width: '100px' },
        ];
        break;
      case 'HANA_ROLE_WHITELIST':
        this.detailColumns = [
          { field: 'sapSystemName', header: 'SAP System', sortable: false },
          { field: 'role', header: 'Role', sortable: false },
          { field: 'grantee', header: 'Grantee', sortable: false, width: '120px' },
          { field: 'grantor', header: 'Grantor', sortable: false, width: '120px' },
          { field: 'ruleName', header: 'Rule', sortable: false, width: '120px' },
          { field: 'whitelistReason', header: 'Reason', sortable: false },
          { field: 'createdAt', header: 'Whitelisted', type: 'date', sortable: false, width: '140px' },
          { field: 'createdBy', header: 'By', sortable: false, width: '100px' },
        ];
        break;
      case 'HANA_ACCESS_PRIVILEGE':
        this.detailColumns = [
          { field: 'sapSystemName', header: 'SAP System', sortable: false },
          { field: 'privilege', header: 'Privilege', sortable: false },
          { field: 'grantee', header: 'Grantee', sortable: false, width: '120px' },
          { field: 'grantor', header: 'Grantor', sortable: false, width: '120px' },
          { field: 'ruleName', header: 'Rule', sortable: false, width: '120px' },
          { field: 'whitelistReason', header: 'Reason', sortable: false },
          { field: 'createdAt', header: 'Whitelisted', type: 'date', sortable: false, width: '140px' },
          { field: 'createdBy', header: 'By', sortable: false, width: '100px' },
        ];
        break;
      case 'UME_USER':
        this.detailColumns = [
          { field: 'userId', header: 'User ID', sortable: false, width: '100px' },
          { field: 'name', header: 'Name', sortable: false },
          { field: 'ruleName', header: 'Rule', sortable: false, width: '120px' },
          { field: 'whitelistReason', header: 'Reason', sortable: false },
          { field: 'fromDate', header: 'From', type: 'date', sortable: false, width: '120px' },
          { field: 'toDate', header: 'To', type: 'date', sortable: false, width: '120px' },
          { field: 'createdAt', header: 'Whitelisted', type: 'date', sortable: false, width: '140px' },
          { field: 'createdBy', header: 'By', sortable: false, width: '100px' },
        ];
        break;
      case 'ACM_USERS_WHITELIST':
        this.detailColumns = [
          { field: 'sapSystemName', header: 'SAP System', sortable: false },
          { field: 'userName', header: 'User', sortable: false, width: '120px' },
          { field: 'businessProcess', header: 'Business Process', sortable: false },
          { field: 'businessSubProcess', header: 'Sub Process', sortable: false },
          { field: 'userType', header: 'User Type', sortable: false, width: '100px' },
          { field: 'ruleName', header: 'Rule', sortable: false, width: '120px' },
          { field: 'whitelistReason', header: 'Reason', sortable: false },
          { field: 'createdAt', header: 'Created', type: 'date', sortable: false, width: '140px' },
          { field: 'createdBy', header: 'By', sortable: false, width: '100px' },
        ];
        break;
    }
  }

  closeDetail(): void {
    this.showDetail = false;
    this.detailData = [];
    this.detailSelectedRow = null;
  }

  removeFromWhitelist(): void {
    if (!this.detailSelectedRow) {
      this.notification.warn('Please select a row first');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Remove from Whitelist',
      nzContent: 'Are you sure you want to remove this entry?',
      nzOkText: 'Remove',
      nzOkDanger: true,
      nzOnOk: () => {
        const ids = [this.detailSelectedRow.id];
        const type = this.violationSelectedRow?.whitelistType;
        const delete$ = this.getDeleteObservable(type, ids);
        if (!delete$) return;

        delete$.pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Removed from whitelist');
              this.detailSelectedRow = null;
              this.loadViolationDetail(this.violationSelectedRow);
            } else {
              this.notification.error(res.message || 'Remove failed');
            }
          },
          error: () => this.notification.error('Failed to remove from whitelist'),
        });
      },
    });
  }

  private getDeleteObservable(type: string, ids: number[]) {
    switch (type) {
      case 'BTP': return this.cssMonitoringService.deleteBtpWhitelist(ids);
      case 'HANA_ACCESS_PRIVILEGE':
      case 'HANA_ROLE_WHITELIST': return this.cssMonitoringService.deleteAccessRuleWhitelist(ids);
      case 'HANA_AUDIT': return this.cssMonitoringService.deleteAuditRuleWhitelist(ids);
      case 'HANA_INI': return this.cssMonitoringService.deleteInitWhiteList(ids);
      case 'UME_USER': return this.cssMonitoringService.deleteUMEWhitelist(ids);
      case 'ACM_USERS_WHITELIST': return this.cssMonitoringService.deleteCssAcmViolationsWhitelist(ids);
      default: return null;
    }
  }
}
