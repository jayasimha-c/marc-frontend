import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { SelfServiceService } from '../services/self-service.service';
import { NotificationService } from '../../../../core/services/notification.service';

export interface Role {
  id: string;
  name: string;
  description: string;
  system: string;
  systemId: string;
  module: string;
  userCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  selected?: boolean;
  validityDays?: number;
  catalogueId?: string;
  catalogueName?: string;
}

@Component({
  standalone: false,
  selector: 'app-ss-access-request',
  templateUrl: './access-request.component.html',
  styleUrls: ['./access-request.component.scss'],
})
export class SsAccessRequestComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  searchQuery = '';
  allRoles: Role[] = [];
  filteredRoles: Role[] = [];
  selectedRoles: Role[] = [];
  availableSystems: any[] = [];
  selectedSystem = '';
  isLoading = false;
  maxRolesPerRequest = 10;
  defaultValidityDays = 30;
  submitting = false;

  private userId: number;

  constructor(
    private selfServiceService: SelfServiceService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('userData') || '{}');
    this.userId = Number(user.id);
  }

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(query => this.performSearch(query));
    this.loadAvailableSystems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAvailableSystems(): void {
    this.selfServiceService.sapSearch(this.userId).subscribe({
      next: (resp) => {
        this.availableSystems = resp.data?.saps || [];
      },
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  private performSearch(query: string): void {
    if (!query.trim()) {
      this.filteredRoles = this.selectedSystem ? [...this.allRoles] : [];
      return;
    }
    this.isLoading = true;
    this.selfServiceService.getRoleCatalogueProfiles(this.selectedSystem || undefined, query).subscribe({
      next: (resp) => {
        this.filteredRoles = (resp.data || []).map((r: any) => this.mapApiRole(r));
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.error('Failed to search roles');
        this.isLoading = false;
      },
    });
  }

  filterBySystem(systemId: string): void {
    this.selectedSystem = systemId;
    if (!systemId) {
      this.allRoles = [];
      this.filteredRoles = [];
      return;
    }
    this.isLoading = true;
    this.selfServiceService.getRoleCatalogueProfiles(systemId).subscribe({
      next: (resp) => {
        this.allRoles = (resp.data || []).map((r: any) => this.mapApiRole(r));
        this.filteredRoles = [...this.allRoles];
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load roles');
        this.isLoading = false;
      },
    });
  }

  private mapApiRole(apiRole: any): Role {
    const id = apiRole.id?.toString() || apiRole.roleName;
    return {
      id,
      name: apiRole.roleName,
      description: [apiRole.businessProcess, apiRole.subBusinessProcess].filter(Boolean).join(' - ') || '',
      system: apiRole.sapSystem,
      systemId: apiRole.sapSystemId,
      module: apiRole.department || apiRole.division || 'General',
      userCount: apiRole.roleCount || 0,
      riskLevel: this.mapCriticality(apiRole.criticality),
      selected: this.selectedRoles.some(r => r.catalogueId === id),
      validityDays: this.defaultValidityDays,
    };
  }

  toggleRole(role: Role): void {
    const catalogueId = role.id;
    const isAlreadySelected = this.selectedRoles.some(r => r.catalogueId === catalogueId);

    if (isAlreadySelected) {
      this.selectedRoles = this.selectedRoles.filter(r => r.catalogueId !== catalogueId);
      role.selected = false;
      return;
    }

    role.selected = true;
    this.isLoading = true;
    this.selfServiceService.getRoleCatalogueRoles(catalogueId).subscribe({
      next: (resp) => {
        const mapped = (resp.data || []).map((r: any) => ({
          id: r.id?.toString() || r.roleName,
          name: r.roleName || r.rolename,
          description: r.description || '',
          system: role.system,
          systemId: role.systemId,
          module: role.module,
          userCount: 0,
          riskLevel: role.riskLevel,
          selected: true,
          validityDays: this.defaultValidityDays,
          catalogueId,
          catalogueName: role.name,
        } as Role));

        if (this.selectedRoles.length + mapped.length > this.maxRolesPerRequest) {
          this.notificationService.error(`Adding these roles would exceed maximum ${this.maxRolesPerRequest} roles per request`);
          role.selected = false;
          this.isLoading = false;
          return;
        }

        this.selectedRoles.push(...mapped);
        this.notificationService.success(`Added ${mapped.length} roles from ${role.name}`);
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load roles from catalogue');
        role.selected = false;
        this.isLoading = false;
      },
    });
  }

  removeSelectedRole(role: Role): void {
    this.selectedRoles = this.selectedRoles.filter(r => r.id !== role.id);
    const original = this.allRoles.find(r => r.id === role.id);
    if (original) original.selected = false;
  }

  clearSelection(): void {
    this.selectedRoles = [];
    this.allRoles.forEach(r => r.selected = false);
    this.filteredRoles.forEach(r => r.selected = false);
  }

  submitRequest(): void {
    if (this.selectedRoles.length === 0) {
      this.notificationService.error('Please select at least one role');
      return;
    }

    this.submitting = true;
    const payload = { roleIds: [...new Set(this.selectedRoles.map(r => Number(r.id)))] };

    this.selfServiceService.submitAccessRequest(payload).subscribe({
      next: (resp) => {
        this.submitting = false;
        if (resp.success) {
          this.notificationService.success('Request submitted successfully');
          this.router.navigate(['/cam/self-service/requests']);
        } else {
          this.notificationService.error(resp.message || 'Failed to submit request');
        }
      },
      error: (err) => {
        this.submitting = false;
        this.notificationService.handleHttpError(err);
      },
    });
  }

  get selectedSystemCount(): number {
    return [...new Set(this.selectedRoles.map(r => r.system))].length;
  }

  getRiskColor(level: string): string {
    return { low: 'green', medium: 'orange', high: 'red' }[level] || 'default';
  }

  private mapCriticality(c: string): 'low' | 'medium' | 'high' {
    if (!c) return 'medium';
    const l = c.toLowerCase();
    if (l === 'low') return 'low';
    if (l === 'high' || l === 'critical') return 'high';
    return 'medium';
  }
}
