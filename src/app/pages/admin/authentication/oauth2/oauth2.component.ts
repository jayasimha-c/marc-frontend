import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { OAuth2Service } from './oauth2.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AddEditClientComponent } from './clients/add-edit-client/add-edit-client.component';
import { RegenerateSecretDialogComponent } from './clients/regenerate-secret-dialog/regenerate-secret-dialog.component';
import { AddEditScopeComponent } from './scopes/add-edit-scope/add-edit-scope.component';

@Component({
  standalone: false,
  selector: 'app-oauth2',
  templateUrl: './oauth2.component.html',
  styleUrls: ['./oauth2.component.scss'],
})
export class OAuth2Component implements OnInit {
  selectedTabIndex = 0;

  // ── Clients ──
  clientsData: any[] = [];
  clientsLoading = false;
  selectedClient: any = null;

  clientColumns: TableColumn[] = [
    { field: 'clientId', header: 'Client ID', sortable: true, filterable: true },
    { field: 'clientName', header: 'Client Name', sortable: true, filterable: true },
    { field: 'description', header: 'Description', sortable: true },
    { field: 'grantTypes', header: 'Grant Types', sortable: true },
    { field: 'scopes', header: 'Scopes', sortable: true },
    { field: 'enabled', header: 'Enabled', type: 'boolean', sortable: true, width: '90px', align: 'center' },
    { field: 'createdDate', header: 'Created At', type: 'date', sortable: true, width: '140px' },
  ];

  clientActions: TableAction[] = [
    { label: 'Add Client', icon: 'plus-circle', type: 'primary', command: () => this.addClient() },
    { label: 'Edit', icon: 'edit', command: () => this.editClient() },
    { label: 'Regenerate Secret', icon: 'reload', command: () => this.regenerateSecret() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.deleteClient() },
  ];

  // ── Scopes ──
  scopesData: any[] = [];
  scopesLoading = false;
  selectedScope: any = null;

  scopeColumns: TableColumn[] = [
    { field: 'scopeName', header: 'Scope Name', sortable: true, filterable: true },
    { field: 'description', header: 'Description', sortable: true, filterable: true },
  ];

  scopeActions: TableAction[] = [
    { label: 'Add Scope', icon: 'plus-circle', type: 'primary', command: () => this.addScope() },
    { label: 'Edit', icon: 'edit', command: () => this.editScope() },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.deleteScope() },
  ];

  // ── Tokens ──
  tokensData: any[] = [];
  tokensLoading = false;
  selectedToken: any = null;

  tokenColumns: TableColumn[] = [
    { field: 'clientName', header: 'Client', sortable: true, filterable: true },
    { field: 'clientId', header: 'Client ID', sortable: true, filterable: true },
    { field: 'scopes', header: 'Scopes', sortable: true },
    { field: 'issuedAt', header: 'Issued At', type: 'date', sortable: true, width: '140px' },
    { field: 'expiresAt', header: 'Expires At', type: 'date', sortable: true, width: '140px' },
    { field: 'expired', header: 'Status', type: 'boolean', sortable: true, width: '90px', align: 'center' },
  ];

  tokenActions: TableAction[] = [
    { label: 'Revoke', icon: 'stop', danger: true, command: () => this.revokeToken() },
  ];

  // ── Audit Logs ──
  auditData: any[] = [];
  auditLoading = false;

  auditColumns: TableColumn[] = [
    { field: 'createdDate', header: 'Created Date', type: 'date', sortable: true, width: '160px' },
    { field: 'eventType', header: 'Event Type', sortable: true, filterable: true },
    { field: 'clientId', header: 'Client ID', sortable: true, filterable: true },
    { field: 'userAgent', header: 'User', sortable: true, filterable: true },
    { field: 'ipAddress', header: 'IP Address', sortable: true, filterable: true },
    { field: 'errorMessage', header: 'Details', sortable: true },
  ];

  constructor(
    private oauth2Service: OAuth2Service,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadTabData();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.loadTabData();
  }

  loadTabData(): void {
    switch (this.selectedTabIndex) {
      case 0: this.loadClients(); break;
      case 1: this.loadScopes(); break;
      case 2: this.loadTokens(); break;
      case 3: this.loadAuditLogs(); break;
    }
  }

  // ── Clients ──

  loadClients(): void {
    this.clientsLoading = true;
    this.oauth2Service.getAllClients().subscribe({
      next: (resp) => {
        if (resp.success) {
          this.clientsData = Array.isArray(resp.data) ? resp.data : (resp.data?.rows || []);
        }
        this.clientsLoading = false;
      },
      error: () => { this.clientsLoading = false; },
    });
  }

  onClientRowClick(row: any): void { this.selectedClient = row; }

  addClient(): void {
    this.nzModal.create({
      nzTitle: 'Add OAuth2 Client',
      nzContent: AddEditClientComponent,
      nzWidth: '600px',
      nzData: { mode: 'add' },
      nzFooter: null,
      nzClassName: 'updated-modal',
    }).afterClose.subscribe((result) => {
      if (result) this.loadClients();
    });
  }

  editClient(): void {
    if (!this.selectedClient) {
      this.notificationService.error('Please select a client.');
      return;
    }
    this.nzModal.create({
      nzTitle: 'Edit OAuth2 Client',
      nzContent: AddEditClientComponent,
      nzWidth: '600px',
      nzData: { mode: 'edit', client: { ...this.selectedClient } },
      nzFooter: null,
      nzClassName: 'updated-modal',
    }).afterClose.subscribe((result) => {
      if (result) this.loadClients();
    });
  }

  regenerateSecret(): void {
    if (!this.selectedClient) {
      this.notificationService.error('Please select a client.');
      return;
    }
    this.confirmDialog
      .confirm({
        title: 'Regenerate Secret',
        message: `Are you sure you want to regenerate the secret for "${this.selectedClient.clientName}"? The old secret will be invalidated.`,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.oauth2Service.regenerateClientSecret(this.selectedClient.id).subscribe({
          next: (response: any) => {
            this.nzModal.create({
              nzTitle: 'Secret Regenerated Successfully',
              nzContent: RegenerateSecretDialogComponent,
              nzWidth: '600px',
              nzData: { secret: response.data.client_secret, clientName: this.selectedClient.clientName },
              nzMaskClosable: false,
              nzClosable: false,
              nzFooter: null,
              nzClassName: 'updated-modal',
            });
            this.loadClients();
          },
          error: () => {
            this.notificationService.error('Failed to regenerate secret');
          },
        });
      });
  }

  deleteClient(): void {
    if (!this.selectedClient) {
      this.notificationService.error('Please select a client.');
      return;
    }
    this.confirmDialog
      .confirm({ title: 'Delete', message: 'Are you sure you want to delete the selected client?' })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.oauth2Service.deleteClient(this.selectedClient.id).subscribe({
          next: (resp) => {
            this.notificationService.show(resp);
            this.selectedClient = null;
            this.loadClients();
          },
          error: (err) => { this.notificationService.handleHttpError(err); },
        });
      });
  }

  // ── Scopes ──

  loadScopes(): void {
    this.scopesLoading = true;
    this.oauth2Service.getAllScopes().subscribe({
      next: (resp) => {
        if (resp.success) {
          this.scopesData = Array.isArray(resp.data) ? resp.data : (resp.data?.rows || []);
        }
        this.scopesLoading = false;
      },
      error: () => { this.scopesLoading = false; },
    });
  }

  onScopeRowClick(row: any): void { this.selectedScope = row; }

  addScope(): void {
    this.nzModal.create({
      nzTitle: 'Add OAuth2 Scope',
      nzContent: AddEditScopeComponent,
      nzWidth: '600px',
      nzData: { mode: 'add' },
      nzFooter: null,
      nzClassName: 'updated-modal',
    }).afterClose.subscribe((result) => {
      if (result) this.loadScopes();
    });
  }

  editScope(): void {
    if (!this.selectedScope) {
      this.notificationService.error('Please select a scope.');
      return;
    }
    this.nzModal.create({
      nzTitle: 'Edit OAuth2 Scope',
      nzContent: AddEditScopeComponent,
      nzWidth: '600px',
      nzData: { mode: 'edit', scope: { ...this.selectedScope } },
      nzFooter: null,
      nzClassName: 'updated-modal',
    }).afterClose.subscribe((result) => {
      if (result) this.loadScopes();
    });
  }

  deleteScope(): void {
    if (!this.selectedScope) {
      this.notificationService.error('Please select a scope.');
      return;
    }
    this.confirmDialog
      .confirm({ title: 'Delete', message: 'Are you sure you want to delete the selected scope?' })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.oauth2Service.deleteScope(this.selectedScope.id).subscribe({
          next: (resp) => {
            this.notificationService.show(resp);
            this.selectedScope = null;
            this.loadScopes();
          },
          error: (err) => { this.notificationService.handleHttpError(err); },
        });
      });
  }

  // ── Tokens ──

  loadTokens(): void {
    this.tokensLoading = true;
    this.oauth2Service.getAllTokens().subscribe({
      next: (resp) => {
        if (resp.success) {
          this.tokensData = Array.isArray(resp.data) ? resp.data : (resp.data?.rows || []);
        }
        this.tokensLoading = false;
      },
      error: () => { this.tokensLoading = false; },
    });
  }

  onTokenRowClick(row: any): void { this.selectedToken = row; }

  revokeToken(): void {
    if (!this.selectedToken) {
      this.notificationService.error('Please select a token.');
      return;
    }
    this.confirmDialog
      .confirm({
        title: 'Revoke Token',
        message: `Are you sure you want to revoke this token for client "${this.selectedToken.clientName}"? This action cannot be undone.`,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.oauth2Service.revokeToken(this.selectedToken.id).subscribe({
          next: () => {
            this.notificationService.success('Token revoked successfully');
            this.selectedToken = null;
            this.loadTokens();
          },
          error: () => {
            this.notificationService.error('Failed to revoke token');
          },
        });
      });
  }

  // ── Audit Logs ──

  loadAuditLogs(): void {
    this.auditLoading = true;
    this.oauth2Service.getAuditLogs().subscribe({
      next: (resp) => {
        if (resp.success) {
          this.auditData = Array.isArray(resp.data) ? resp.data : (resp.data?.rows || []);
        }
        this.auditLoading = false;
      },
      error: () => { this.auditLoading = false; },
    });
  }
}
