import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AbapService } from '../abap.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-whitelist-management',
  templateUrl: './whitelist-management.component.html',
  styleUrls: ['./whitelist-management.component.scss'],
})
export class WhitelistManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  filterForm!: FormGroup;
  whiteListCount: any = {};

  // Whitelist entries table
  whitelistData: any[] = [];
  selectedRow: any = null;

  // Violation whitelist table
  violationData: any[] = [];
  violationTotal = 0;
  violationSelectedRow: any = null;
  violationLoading = false;
  private lastViolationParams: TableQueryParams | null = null;

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

  violationActions: TableAction[] = [
    { label: 'View Details', icon: 'eye', type: 'primary', command: () => this.openViolationDetail() },
  ];

  constructor(
    private fb: FormBuilder,
    private abapService: AbapService,
    private router: Router,
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
    this.loadWhitelistCount();
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

  loadWhitelistCount(): void {
    this.abapService.getWhitelistCount().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) this.whiteListCount = res.data || {};
      },
    });
  }

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

  // CRUD Actions
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
          this.loadWhitelistCount();
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
              this.loadWhitelistCount();
            } else {
              this.notification.error(res.message || 'Delete failed');
            }
          },
          error: (err) => this.notification.error(err.error?.message || 'Delete failed'),
        });
      },
    });
  }

  onWhitelistRowClick(row: any): void {
    this.selectedRow = row;
  }

  onViolationRowClick(row: any): void {
    this.violationSelectedRow = row;
  }

  openViolationDetail(): void {
    if (!this.violationSelectedRow) {
      this.notification.warn('Please select a row first');
      return;
    }
    const type = this.violationSelectedRow.whitelistType;
    switch (type) {
      case 'BTP':
        this.router.navigate(['/sap-abap-scanner/whitelist-details/btp']);
        break;
      case 'HANA_ACCESS_PRIVILEGE':
        this.router.navigate(['/sap-abap-scanner/whitelist-details/hana'], {
          queryParams: { subType: 'ACCESS_RULES', hasRole: false },
        });
        break;
      case 'HANA_ROLE_WHITELIST':
        this.router.navigate(['/sap-abap-scanner/whitelist-details/hana'], {
          queryParams: { subType: 'ACCESS_RULES', hasRole: true },
        });
        break;
      case 'UME_USER':
        this.router.navigate(['/sap-abap-scanner/whitelist-details/ume']);
        break;
      case 'HANA_AUDIT':
        this.router.navigate(['/sap-abap-scanner/whitelist-details/hana'], {
          queryParams: { subType: 'AUDIT_RULES', parameterName: this.violationSelectedRow.whitelistSource },
        });
        break;
      case 'HANA_INI':
        this.router.navigate(['/sap-abap-scanner/whitelist-details/hana'], {
          queryParams: { subType: 'INI_FILE', parameterName: this.violationSelectedRow.whitelistSource },
        });
        break;
      case 'ACM_USERS_WHITELIST':
        this.router.navigate(['/sap-abap-scanner/whitelist-details/acm']);
        break;
    }
  }
}
