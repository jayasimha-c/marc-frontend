import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SelfServiceService } from '../services/self-service.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface SapSystemStatus {
  id: number;
  bname: string;
  userName: string;
  system: string;
  sapSystemId?: number;
  locked: boolean;
  uflag: number;
  lastLogin: string;
  validFrom: string;
  validTo: string;
  selected?: boolean;
}

@Component({
  standalone: false,
  selector: 'app-ss-user-actions',
  templateUrl: './user-actions.component.html',
  styleUrls: ['./user-actions.component.scss'],
})
export class SsUserActionsComponent implements OnInit {
  sapSystems: SapSystemStatus[] = [];
  selectedSystems: SapSystemStatus[] = [];
  private sapSystemsMap = new Map<string, number>();

  actionType: 'unlock' | 'reset-password' = 'unlock';
  isLoading = false;
  isSubmitting = false;

  constructor(
    private selfServiceService: SelfServiceService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    forkJoin([
      this.selfServiceService.getMySystemStatus(),
      this.selfServiceService.getSelfServiceInfo(),
    ]).subscribe({
      next: ([statusResp, infoResp]) => {
        this.isLoading = false;

        if (infoResp.success && infoResp.data?.saps) {
          for (const sap of infoResp.data.saps) {
            this.sapSystemsMap.set(sap.destinationName, sap.id);
            this.sapSystemsMap.set(sap.destinationName?.toLowerCase(), sap.id);
          }
        }

        if (statusResp.success && statusResp.data) {
          this.sapSystems = statusResp.data.map((item: any) => ({
            ...item,
            sapSystemId: this.sapSystemsMap.get(item.system) || this.sapSystemsMap.get(item.system?.toLowerCase()),
            selected: false,
          }));
        } else {
          this.notificationService.error(statusResp.message || 'Failed to load your SAP systems');
        }
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.error('Failed to load your SAP systems');
      },
    });
  }

  toggleSystem(system: SapSystemStatus): void {
    if (!system.sapSystemId) return;
    system.selected = !system.selected;
    this.selectedSystems = this.sapSystems.filter(s => s.selected);
  }

  canSubmit(): boolean {
    return this.selectedSystems.filter(s => s.sapSystemId).length > 0 && !this.isSubmitting;
  }

  submitRequest(): void {
    const valid = this.selectedSystems.filter(s => s.sapSystemId);
    if (valid.length === 0) {
      this.notificationService.error('Please select at least one SAP system');
      return;
    }

    this.isSubmitting = true;
    const first = valid[0];

    const obs$ = this.actionType === 'unlock'
      ? this.selfServiceService.unlockSelf(first.bname, first.sapSystemId!)
      : this.selfServiceService.resetPasswordSelf(first.bname, first.sapSystemId!);

    obs$.subscribe({
      next: (resp) => {
        this.isSubmitting = false;
        if (resp.success) {
          this.notificationService.success(resp.message || `${this.actionType === 'unlock' ? 'Unlock' : 'Password reset'} request submitted`);
          this.router.navigate(['/cam/self-service/requests']);
        } else {
          this.notificationService.error(resp.message || 'Request failed');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notificationService.handleHttpError(err);
      },
    });
  }

  resetForm(): void {
    this.sapSystems.forEach(s => s.selected = false);
    this.selectedSystems = [];
    this.actionType = 'unlock';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    try { return new Date(date).toLocaleDateString(); } catch { return date; }
  }

  hasValidId(system: SapSystemStatus): boolean {
    return !!system.sapSystemId;
  }
}
