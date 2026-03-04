import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CssMonitoringService } from '../../css/monitoring/css-monitoring.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-whitelist-details',
  templateUrl: './whitelist-details.component.html',
  styleUrls: ['./whitelist-details.component.scss'],
})
export class WhitelistDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  whitelistType = ''; // btp, hana, ume, acm
  subType = ''; // ACCESS_RULES, AUDIT_RULES, INI_FILE
  hasRole = false;
  parameterName = '';
  parameterId: number | null = null;

  pageTitle = 'Whitelist Details';
  loading = false;
  data: any[] = [];
  selectedRows: any[] = [];
  selectedRow: any = null;

  columns: TableColumn[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cssMonitoringService: CssMonitoringService,
    private notification: NotificationService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.whitelistType = params['type'] || '';
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.subType = params['subType'] || '';
      this.hasRole = params['hasRole'] === 'true';
      this.parameterName = params['parameterName'] || '';
      this.parameterId = params['parameterId'] ? +params['parameterId'] : null;

      this.setupColumns();
      this.setPageTitle();
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setPageTitle(): void {
    switch (this.whitelistType) {
      case 'btp':
        this.pageTitle = 'BTP Whitelist Details';
        break;
      case 'hana':
        if (this.subType === 'ACCESS_RULES') {
          this.pageTitle = this.hasRole ? 'HANA Role Whitelist' : 'HANA Access Privilege Whitelist';
        } else if (this.subType === 'AUDIT_RULES') {
          this.pageTitle = 'HANA Audit Policy Whitelist';
        } else {
          this.pageTitle = 'HANA INI Configuration Whitelist';
        }
        break;
      case 'ume':
        this.pageTitle = 'UME User Whitelist';
        break;
      case 'acm':
        this.pageTitle = 'ACM Users Whitelist';
        break;
    }
  }

  private setupColumns(): void {
    switch (this.whitelistType) {
      case 'btp':
        this.columns = [
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
      case 'hana':
        if (this.subType === 'INI_FILE') {
          this.columns = [
            { field: 'sapSystemName', header: 'SAP System', sortable: false },
            { field: 'key', header: 'Parameter', sortable: false },
            { field: 'fileName', header: 'Type', sortable: false, width: '100px' },
            { field: 'value', header: 'Actual Value', sortable: false },
            { field: 'ruleName', header: 'Rule', sortable: false, width: '120px' },
            { field: 'whitelistReason', header: 'Reason', sortable: false },
            { field: 'createdAt', header: 'Whitelisted', type: 'date', sortable: false, width: '140px' },
            { field: 'createdBy', header: 'By', sortable: false, width: '100px' },
          ];
        } else if (this.subType === 'AUDIT_RULES') {
          this.columns = [
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
        } else if (this.hasRole) {
          this.columns = [
            { field: 'sapSystemName', header: 'SAP System', sortable: false },
            { field: 'role', header: 'Role', sortable: false },
            { field: 'grantee', header: 'Grantee', sortable: false, width: '120px' },
            { field: 'grantor', header: 'Grantor', sortable: false, width: '120px' },
            { field: 'ruleName', header: 'Rule', sortable: false, width: '120px' },
            { field: 'whitelistReason', header: 'Reason', sortable: false },
            { field: 'createdAt', header: 'Whitelisted', type: 'date', sortable: false, width: '140px' },
            { field: 'createdBy', header: 'By', sortable: false, width: '100px' },
          ];
        } else {
          this.columns = [
            { field: 'sapSystemName', header: 'SAP System', sortable: false },
            { field: 'privilege', header: 'Privilege', sortable: false },
            { field: 'grantee', header: 'Grantee', sortable: false, width: '120px' },
            { field: 'grantor', header: 'Grantor', sortable: false, width: '120px' },
            { field: 'ruleName', header: 'Rule', sortable: false, width: '120px' },
            { field: 'whitelistReason', header: 'Reason', sortable: false },
            { field: 'createdAt', header: 'Whitelisted', type: 'date', sortable: false, width: '140px' },
            { field: 'createdBy', header: 'By', sortable: false, width: '100px' },
          ];
        }
        break;
      case 'ume':
        this.columns = [
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
      case 'acm':
        this.columns = [
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

  loadData(): void {
    this.loading = true;
    let data$;

    switch (this.whitelistType) {
      case 'btp':
        data$ = this.cssMonitoringService.getBtpWhitelist();
        break;
      case 'hana':
        if (this.subType === 'INI_FILE') {
          data$ = this.parameterName
            ? this.cssMonitoringService.getInitWhiteListByParameterName(this.parameterName)
            : this.cssMonitoringService.getInitWhiteList(this.parameterId || undefined);
        } else if (this.subType === 'AUDIT_RULES') {
          data$ = this.parameterName
            ? this.cssMonitoringService.getAuditRuleWhitelistByParameterName(this.parameterName)
            : this.cssMonitoringService.getAuditRuleWhitelist(this.parameterId || undefined);
        } else {
          data$ = this.cssMonitoringService.getAccessRuleWhitelist(this.hasRole);
        }
        break;
      case 'ume':
        data$ = this.cssMonitoringService.getAllUMEWhitelist();
        break;
      case 'acm':
        data$ = this.cssMonitoringService.getCssAcmViolationsWhitelist();
        break;
      default:
        this.loading = false;
        return;
    }

    data$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.data = res.data?.rows || (Array.isArray(res.data) ? res.data : []);
        }
      },
      error: () => {
        this.loading = false;
        this.data = [];
      },
    });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  removeFromWhitelist(): void {
    if (!this.selectedRow) {
      this.notification.warn('Please select a row first');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Delete Confirmation',
      nzContent: 'Are you sure you want to remove from whitelist?',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        const ids = [this.selectedRow.id];
        let delete$;

        switch (this.whitelistType) {
          case 'btp':
            delete$ = this.cssMonitoringService.deleteBtpWhitelist(ids);
            break;
          case 'hana':
            if (this.subType === 'INI_FILE') {
              delete$ = this.cssMonitoringService.deleteInitWhiteList(ids);
            } else if (this.subType === 'AUDIT_RULES') {
              delete$ = this.cssMonitoringService.deleteAuditRuleWhitelist(ids);
            } else {
              delete$ = this.cssMonitoringService.deleteAccessRuleWhitelist(ids);
            }
            break;
          case 'ume':
            delete$ = this.cssMonitoringService.deleteUMEWhitelist(ids);
            break;
          case 'acm':
            delete$ = this.cssMonitoringService.deleteCssAcmViolationsWhitelist(ids);
            break;
          default:
            return;
        }

        delete$.pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Removed from whitelist');
              this.selectedRow = null;
              this.loadData();
            } else {
              this.notification.error(res.message || 'Remove failed');
            }
          },
          error: () => this.notification.error('Failed to remove from whitelist'),
        });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/sap-abap-scanner/whitelist-management']);
  }
}
