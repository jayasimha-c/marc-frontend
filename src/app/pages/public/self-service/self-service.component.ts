import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PublicService } from '../public.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-self-service',
  templateUrl: './self-service.component.html',
})
export class SelfServiceComponent implements OnInit {
  isLoading = true;
  isSuccess = false;
  errorMessage: string | null = null;

  confirmation: any = null;
  branding: any = null;
  details: any = null;

  private id = '';
  private ruId = '';

  constructor(private route: ActivatedRoute, private publicService: PublicService) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.ruId = this.route.snapshot.queryParamMap.get('ruId') || '';

    forkJoin([
      this.publicService.getPublicBranding(),
      this.publicService.getSelfServiceDetails(this.id, this.ruId),
    ]).subscribe({
      next: ([brandingResp, detailsResp]) => {
        this.isLoading = false;
        if (brandingResp.success && brandingResp.data) {
          this.branding = brandingResp.data;
        }
        this.details = detailsResp;
        if (detailsResp.success) {
          this.isSuccess = true;
          this.confirmation = detailsResp.data;
        } else {
          this.errorMessage = detailsResp.message || 'An error occurred';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to process your request. Please try again later.';
      },
    });
  }

  get logoUrl(): string {
    if (this.branding?.logoResourceId) {
      return `${environment.apiUrl}/download?resourceId=${this.branding.logoResourceId}`;
    }
    return 'assets/images/logo/marc.svg';
  }

  get appName(): string {
    return this.branding?.appName || 'MARC';
  }

  get title(): string {
    return this.confirmation?.operationTitle || (this.isSuccess ? 'Request Processed' : 'Request Failed');
  }

  get description(): string {
    return this.confirmation?.operationDescription || this.details?.message || '';
  }

  get nextSteps(): string {
    return this.confirmation?.nextSteps || 'Please check your email for further instructions.';
  }

  get systemInfo(): string {
    return this.confirmation?.systemName ? `System: ${this.confirmation.systemName}` : '';
  }

  get icon(): string {
    if (!this.isSuccess) return 'close-circle';
    if (this.confirmation?.operationType === 'unlock') return 'unlock';
    if (this.confirmation?.operationType === 'reset-password') return 'key';
    return 'check-circle';
  }

  get iconColor(): string {
    return this.isSuccess ? '#52c41a' : '#ff4d4f';
  }

  goToLogin(): void {
    window.location.href = '/sign-in';
  }
}
