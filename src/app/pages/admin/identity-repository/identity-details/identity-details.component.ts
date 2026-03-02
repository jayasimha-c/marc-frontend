import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiResponse } from '../../../../core/models/api-response';
import {
  IdentityRepositoryService,
  MarcIdentityVO,
  LinkedAccount
} from '../identity-repository.service';

type ViewMode = 'cards' | 'table';

interface FieldDef {
  key: string;
  label: string;
  mono?: boolean;
}

@Component({
  standalone: false,
  selector: 'app-identity-details',
  templateUrl: './identity-details.component.html',
  styleUrls: ['./identity-details.component.scss']
})
export class IdentityDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  identity: MarcIdentityVO | null = null;
  linkedAccounts: LinkedAccount[] = [];
  loading = true;
  accountsLoading = false;
  selectedTabIndex = 0;
  accountsViewMode: ViewMode = 'table';
  showConfidenceLegend = false;

  personalFields: FieldDef[] = [
    { key: 'displayName', label: 'Display Name' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'primaryEmail', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'location', label: 'Location' }
  ];

  employmentFields: FieldDef[] = [
    { key: 'employeeId', label: 'Employee ID', mono: true },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'department', label: 'Department' },
    { key: 'managerName', label: 'Manager' },
    { key: 'userType', label: 'User Type' }
  ];

  organizationFields: FieldDef[] = [
    { key: 'costCenter', label: 'Cost Center', mono: true },
    { key: 'companyCode', label: 'Company Code', mono: true }
  ];

  systemFields: FieldDef[] = [
    { key: 'sapBname', label: 'SAP BNAME', mono: true },
    { key: 'sapBtpUserId', label: 'SAP BTP User ID', mono: true },
    { key: 'sourceUsername', label: 'Source Username', mono: true },
    { key: 'sourceId', label: 'Source ID', mono: true }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private identityRepositoryService: IdentityRepositoryService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = +params['id'];
        if (id) {
          this.loadIdentity(id);
        } else {
          this.navigateBack();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadIdentity(id: number): void {
    this.loading = true;
    this.identityRepositoryService.getIdentityById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.identity = this.enrichIdentityForDisplay(resp.data);
            this.loadLinkedAccounts(id);
          } else {
            this.notificationService.error('Identity not found');
            this.navigateBack();
          }
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load identity details');
          this.loading = false;
          this.navigateBack();
        }
      });
  }

  private loadLinkedAccounts(identityId: number): void {
    this.accountsLoading = true;
    this.identityRepositoryService.getLinkedAccounts(identityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.linkedAccounts = resp.data.map((acc: LinkedAccount) => this.enrichAccountForDisplay(acc));
          }
          this.accountsLoading = false;
        },
        error: () => {
          this.accountsLoading = false;
        }
      });
  }

  private enrichIdentityForDisplay(identity: MarcIdentityVO): MarcIdentityVO {
    const sourceTypeMap: Record<string, string> = {
      'AZURE_AD': 'Azure AD',
      'ON_PREM_AD': 'On-Premises AD',
      'MANUAL_CSV': 'CSV Import'
    };
    identity.sourceTypeDisplay = sourceTypeMap[identity.sourceType] || identity.sourceType;
    identity.lastSyncedDisplay = identity.lastSyncedAt ? new Date(identity.lastSyncedAt).toLocaleString() : 'Never';
    return identity;
  }

  private enrichAccountForDisplay(account: LinkedAccount): LinkedAccount {
    account.lastSyncedDisplay = account.lastSyncedAt ? this.getRelativeTime(account.lastSyncedAt) : 'Never';
    account.statusLabel = (account.status === 'linked' || account.status === 'active') ? 'Active' : 'Inactive';
    return account;
  }

  hasValue(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  getFieldValue(key: string): any {
    return this.identity ? (this.identity as any)[key] : null;
  }

  getVisibleFields(fields: FieldDef[]): FieldDef[] {
    return fields.filter(f => this.hasValue(this.getFieldValue(f.key)));
  }

  hasSectionData(fields: FieldDef[]): boolean {
    return this.getVisibleFields(fields).length > 0;
  }

  navigateBack(): void {
    this.router.navigate(['/admin/identity-repository']);
  }

  viewAccountsTab(): void {
    this.selectedTabIndex = 1;
  }

  toggleConfidenceLegend(): void {
    this.showConfidenceLegend = !this.showConfidenceLegend;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAppAbbreviation(applicationType: string): string {
    if (!applicationType) return '?';
    const abbreviations: Record<string, string> = {
      'SAP_ECC': 'SAP', 'SAP': 'SAP', 'SAP_IPS': 'IPS',
      'ON_PREM_AD': 'AD', 'AZURE_AD': 'AAD',
      'SERVICENOW': 'SNOW', 'SERVICE_NOW': 'SNOW',
      'BTP': 'BTP', 'HANA_DATABASE': 'HANA',
      'SUCCESS_FACTORS': 'SF', 'MANUAL_CSV': 'CSV'
    };
    return abbreviations[applicationType.toUpperCase()] || applicationType.substring(0, 3).toUpperCase();
  }

  getTagColor(applicationType: string): string {
    if (!applicationType) return 'default';
    const type = applicationType.toLowerCase();
    if (type.includes('sap') && !type.includes('ips')) return 'blue';
    if (type.includes('ips')) return 'cyan';
    if (type.includes('azure') || type.includes('aad')) return 'geekblue';
    if (type.includes('ad')) return 'purple';
    if (type.includes('snow') || type.includes('servicenow')) return 'green';
    if (type.includes('btp')) return 'geekblue';
    if (type.includes('hana')) return 'gold';
    if (type.includes('sf') || type.includes('success')) return 'purple';
    if (type.includes('csv')) return 'default';
    return 'default';
  }

  getConfidenceColor(confidence: string): string {
    if (!confidence) return 'default';
    const conf = confidence.toLowerCase();
    if (conf === 'high' || conf === 'strong') return 'success';
    if (conf === 'medium') return 'warning';
    if (conf === 'low') return 'error';
    return 'default';
  }

  isAccountInactive(account: LinkedAccount): boolean {
    return account.status !== 'linked' && account.status !== 'active';
  }

  formatDate(timestamp: number): string {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  }

  getRelativeTime(timestamp: number): string {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  getLinkedAccountsGroupedByType(): Record<string, LinkedAccount[]> {
    const grouped: Record<string, LinkedAccount[]> = {};
    for (const account of this.linkedAccounts) {
      const type = account.applicationLabel || account.applicationType || 'Other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(account);
    }
    return grouped;
  }

  getGroupedAccountTypes(): string[] {
    return Object.keys(this.getLinkedAccountsGroupedByType());
  }
}
