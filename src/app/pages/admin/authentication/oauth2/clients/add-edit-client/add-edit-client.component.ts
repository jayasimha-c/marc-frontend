import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { OAuth2Service } from '../../oauth2.service';
import { OAuth2Scope } from '../../oauth2.models';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-edit-client',
  templateUrl: './add-edit-client.component.html',
})
export class AddEditClientComponent implements OnInit {
  clientForm!: FormGroup;
  mode: 'add' | 'edit';
  availableScopes: OAuth2Scope[] = [];
  grantTypeOptions = [
    { label: 'Client Credentials', value: 'client_credentials' },
  ];
  generatedSecret: string | null = null;
  minExpiryDate: Date;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private oauth2Service: OAuth2Service,
    private notificationService: NotificationService,
    public modal: NzModalRef,
    @Inject(NZ_MODAL_DATA) public data: any,
  ) {
    this.mode = data.mode;
    this.minExpiryDate = new Date();
    this.minExpiryDate.setDate(this.minExpiryDate.getDate() + 1);

    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

    this.clientForm = this.fb.group({
      clientId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
      clientName: ['', Validators.required],
      description: [''],
      grantTypes: ['client_credentials', Validators.required],
      scopes: [[], Validators.required],
      tokenExpiryDate: [defaultExpiry, Validators.required],
      enabled: [true],
    });
  }

  ngOnInit(): void {
    this.loadScopes();

    if (this.mode === 'edit' && this.data.client) {
      const clientData = { ...this.data.client };
      if (typeof clientData.scopes === 'string') {
        clientData.scopes = clientData.scopes.split(' ').filter((s: string) => s);
      }
      if (clientData.accessTokenValiditySeconds) {
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + clientData.accessTokenValiditySeconds);
        clientData.tokenExpiryDate = expiryDate;
      }
      this.clientForm.patchValue(clientData);
      this.clientForm.get('clientId')?.disable();
    }
  }

  private calculateValiditySeconds(): number {
    const expiryDate = this.clientForm.get('tokenExpiryDate')?.value;
    if (!expiryDate) return 3600;
    const diffMs = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.max(Math.floor(diffMs / 1000), 60);
  }

  getValidityDisplay(): string {
    const expiryDate = this.clientForm.get('tokenExpiryDate')?.value;
    if (!expiryDate) return '';
    const diffMs = new Date(expiryDate).getTime() - new Date().getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 365) {
      const years = Math.floor(days / 365);
      const rem = days % 365;
      return `~${years} year${years > 1 ? 's' : ''} ${rem > 0 ? rem + ' days' : ''}`;
    } else if (days > 30) {
      const months = Math.floor(days / 30);
      return `~${months} month${months > 1 ? 's' : ''}`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? hours + 'h' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return 'Less than 1 hour';
  }

  loadScopes(): void {
    this.oauth2Service.getAllScopes().subscribe({
      next: (resp: any) => {
        this.availableScopes = resp.data || [];
      },
      error: () => {
        this.notificationService.error('Failed to load scopes');
      },
    });
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.clientForm.getRawValue();
    const payload = {
      ...formValue,
      scopeNames: formValue.scopes,
      accessTokenValiditySeconds: this.calculateValiditySeconds(),
    };
    delete payload.scopes;
    delete payload.tokenExpiryDate;

    if (this.mode === 'add') {
      this.oauth2Service.createClient(payload).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.generatedSecret = response.data.clientSecret;
          this.notificationService.success('Client created successfully. Please save the secret securely.');
        },
        error: (err: any) => {
          this.loading = false;
          this.notificationService.error(err.error?.message || 'Failed to create client');
        },
      });
    } else {
      this.oauth2Service.updateClient(this.data.client.id, payload).subscribe({
        next: () => {
          this.loading = false;
          this.notificationService.success('Client updated successfully');
          this.modal.close(true);
        },
        error: () => {
          this.loading = false;
          this.notificationService.error('Failed to update client');
        },
      });
    }
  }

  copySecret(): void {
    if (this.generatedSecret) {
      navigator.clipboard.writeText(this.generatedSecret);
      this.notificationService.success('Secret copied to clipboard');
    }
  }

  closeDialog(): void {
    this.modal.close(this.mode === 'add' && this.generatedSecret ? true : false);
  }
}
