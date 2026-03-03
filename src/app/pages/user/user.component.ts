import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user';
import { ApiResponse } from '../../core/models/api-response';
import { environment } from '../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-user-profile',
  templateUrl: './user.component.html',
})
export class UserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  user: User | null = null;
  loading = false;

  // Identity viewing mode
  identityId: number | null = null;
  isViewingOwnProfile = true;
  identityData: any = null;
  linkedAccounts: any[] = [];
  accountsLoading = false;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.identityId = +params['id'];
          this.isViewingOwnProfile = false;
          this.loadIdentityProfile(this.identityId);
        } else {
          this.identityId = null;
          this.isViewingOwnProfile = true;
        }
      });

    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => this.user = user);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadIdentityProfile(id: number): void {
    this.loading = true;
    this.http.get<ApiResponse>(`${environment.apiUrl}/user/identity/profile/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if (resp.success && resp.data) {
            this.identityData = resp.data;
            this.loadIdentityLinkedAccounts(id);
          } else {
            this.router.navigate(['/user']);
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/user']);
        },
      });
  }

  private loadIdentityLinkedAccounts(id: number): void {
    this.accountsLoading = true;
    this.http.get<ApiResponse>(`${environment.apiUrl}/user/identity/profile/${id}/linked-accounts`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if (resp.success && resp.data) {
            this.linkedAccounts = resp.data;
          }
          this.accountsLoading = false;
        },
        error: () => {
          this.accountsLoading = false;
        },
      });
  }

  get displayName(): string {
    if (!this.isViewingOwnProfile && this.identityData) {
      const first = this.identityData.firstName || '';
      const last = this.identityData.lastName || '';
      return (first + ' ' + last).trim() || this.identityData.displayName || 'Unknown';
    }
    return this.user?.name || this.user?.username || 'User';
  }

  get initials(): string {
    const parts = this.displayName.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return this.displayName.substring(0, 2).toUpperCase() || '?';
  }

  get isActive(): boolean {
    if (!this.isViewingOwnProfile && this.identityData) {
      return this.identityData.active;
    }
    return true;
  }

  formatRoleName(role: string): string {
    return role.replace(/^(DIS_|OP_)/, '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  getAppTypeLabel(appType: string): string {
    const labels: Record<string, string> = {
      SAP_ECC: 'SAP ECC', SAP: 'SAP', SAP_IPS: 'SAP IPS',
      ON_PREM_AD: 'Active Directory', AZURE_AD: 'Azure AD',
      SERVICENOW: 'ServiceNow', SERVICE_NOW: 'ServiceNow',
      BTP: 'SAP BTP', HANA_DATABASE: 'SAP HANA',
      SUCCESS_FACTORS: 'SuccessFactors', MANUAL_CSV: 'CSV Import',
    };
    return labels[appType] || appType || 'Unknown';
  }

  navigateBack(): void {
    this.router.navigate(['/admin/identity-repository']);
  }

  signOut(): void {
    this.router.navigate(['/sign-out']);
  }
}
