import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { AiIntegrationService } from './ai-integration.service';
import { SidePanelComponent } from '../../../shared/components/side-panel/side-panel.component';
import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-admin-ai-integration',
  templateUrl: './ai-integration.component.html',
  styleUrls: ['./ai-integration.component.scss'],
})
export class AiIntegrationComponent implements OnInit {

  configForm!: FormGroup;

  providerList: { value: string; label: string }[] = [
    { value: 'ANTHROPIC', label: 'Anthropic' },
  ];

  modelList: { value: string; label: string; description: string }[] = [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', description: 'Best balance of speed and intelligence' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4', description: 'Most capable model for complex tasks' },
    { value: 'claude-haiku-4-20250514', label: 'Claude Haiku 4', description: 'Fastest model for simple tasks' },
  ];

  dataControls: { formKey: string; label: string; detail: string }[] = [
    { formKey: 'includeCodeSnippet', label: 'Code Snippet', detail: 'Matched ABAP code lines from scan findings' },
    { formKey: 'includeProgramName', label: 'Program Name', detail: 'Program name, type, and package' },
    { formKey: 'includeSystemName', label: 'System Name', detail: 'SAP system identifier' },
    { formKey: 'includeRuleMetadata', label: 'Rule Metadata', detail: 'Rule name, description, CWE ID, fix examples' },
  ];

  featureControls: { formKey: string; label: string; detail: string }[] = [
    { formKey: 'featureRiskSummary', label: 'AI Risk Summary', detail: 'Program-level risk assessment with prioritized remediation order' },
    { formKey: 'featureRemediationPlan', label: 'AI Remediation Plan', detail: 'Step-by-step fix plan across all violations in a program' },
    { formKey: 'featureWhitelistJustification', label: 'AI Whitelist Justification', detail: 'Auto-generate justification when ignoring violations' },
    { formKey: 'featureIssueDescription', label: 'AI Issue Description', detail: 'AI-enhanced Jira descriptions with root cause and fix recommendation' },
    { formKey: 'featurePatternImprovement', label: 'AI Pattern Improvement', detail: 'Suggest regex pattern refinements to reduce false positives' },
    { formKey: 'featureMitigationCreation', label: 'AI Mitigation Creation', detail: 'AI-generated mitigation control name and description from risk context' },
  ];

  connectionStatus: 'connected' | 'disconnected' | 'testing' | 'unknown' = 'unknown';
  lastTestTime: Date | null = null;
  hideApiKey = true;
  maskedApiKey = '';
  hasExistingKey = false;
  responseTimeMs: number | null = null;

  private static readonly STORAGE_KEY = 'ai_connection_status';

  isLoading = false;
  isTestingConnection = false;
  isSaving = false;

  activeTabIndex = 0;
  auditColumns: TableColumn[] = [];
  auditData: any[] = [];
  auditTotal = 0;
  auditLoading = false;
  @ViewChild('auditDetailPanel') auditDetailPanel!: SidePanelComponent;
  selectedAuditLog: any = null;

  constructor(
    private aiIntegrationService: AiIntegrationService,
    private notificationService: NotificationService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initAuditColumns();
    this.restoreConnectionStatus();
    this.loadConfiguration();
  }

  private initForm(): void {
    this.configForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      provider: ['ANTHROPIC', [Validators.required]],
      apiKey: ['', [Validators.required]],
      model: ['claude-sonnet-4-20250514', [Validators.required]],
      enabled: [false],
      maxTokens: [4096, [Validators.required, Validators.min(1), Validators.max(200000)]],
      temperature: [0.7, [Validators.required, Validators.min(0), Validators.max(1)]],
      includeCodeSnippet: [true],
      includeProgramName: [true],
      includeSystemName: [false],
      includeRuleMetadata: [true],
      featureRiskSummary: [true],
      featureRemediationPlan: [true],
      featureWhitelistJustification: [true],
      featureIssueDescription: [true],
      featurePatternImprovement: [false],
      featureMitigationCreation: [true],
    });
  }

  private initAuditColumns(): void {
    this.auditColumns = [
      { field: 'createdAt', header: 'Time', type: 'date', sortable: true, width: '170px' },
      { field: 'username', header: 'User', sortable: true, filterable: true, width: '140px' },
      { field: 'feature', header: 'Feature', sortable: true, filterable: true, width: '160px' },
      { field: 'model', header: 'Model', sortable: true, width: '160px' },
      { field: 'success', header: 'Success', type: 'boolean', sortable: true, width: '90px' },
      { field: 'responseTimeMs', header: 'Response (ms)', sortable: true, width: '120px' },
      { field: 'dataControlViolated', header: 'Violation', type: 'boolean', sortable: true, width: '90px' },
      { field: 'ipAddress', header: 'IP Address', width: '130px' },
    ];
  }

  loadConfiguration(): void {
    this.isLoading = true;
    this.aiIntegrationService.getConfiguration().subscribe({
      next: (resp: any) => {
        if (resp?.data) {
          const config = resp.data;
          this.configForm.patchValue({
            name: config.name || '',
            provider: config.provider || 'ANTHROPIC',
            model: config.model || 'claude-sonnet-4-20250514',
            enabled: config.enabled || false,
            maxTokens: config.maxTokens || 4096,
            temperature: config.temperature ?? 0.7,
            includeCodeSnippet: config.includeCodeSnippet ?? true,
            includeProgramName: config.includeProgramName ?? true,
            includeSystemName: config.includeSystemName ?? false,
            includeRuleMetadata: config.includeRuleMetadata ?? true,
            featureRiskSummary: config.featureRiskSummary ?? true,
            featureRemediationPlan: config.featureRemediationPlan ?? true,
            featureWhitelistJustification: config.featureWhitelistJustification ?? true,
            featureIssueDescription: config.featureIssueDescription ?? true,
            featurePatternImprovement: config.featurePatternImprovement ?? false,
            featureMitigationCreation: config.featureMitigationCreation ?? true,
          });

          if (config.maskedApiKey) {
            this.maskedApiKey = config.maskedApiKey;
            this.hasExistingKey = true;
            this.configForm.get('apiKey')?.setValue(config.maskedApiKey);
            this.configForm.get('apiKey')?.clearValidators();
            this.configForm.get('apiKey')?.updateValueAndValidity();
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  onTest(): void {
    this.isTestingConnection = true;
    this.connectionStatus = 'testing';
    this.responseTimeMs = null;

    const payload = this.buildPayload();
    this.aiIntegrationService.testConnection(payload).subscribe({
      next: (resp: any) => {
        if (resp?.data?.success) {
          this.connectionStatus = 'connected';
          this.lastTestTime = new Date();
          this.responseTimeMs = resp.data.responseTime || null;
          this.notificationService.success('Anthropic API connection successful!');
        } else {
          this.connectionStatus = 'disconnected';
          this.notificationService.error(resp?.data?.message || resp?.message || 'Connection failed');
        }
        this.persistConnectionStatus();
        this.isTestingConnection = false;
      },
      error: () => {
        this.connectionStatus = 'disconnected';
        this.persistConnectionStatus();
        this.isTestingConnection = false;
      },
    });
  }

  onSave(): void {
    this.configForm.markAllAsTouched();

    const nameValue = this.configForm.get('name')?.value;
    if (!nameValue || nameValue.trim() === '') {
      this.notificationService.error('Please enter a configuration name');
      return;
    }

    const apiKeyValue = this.configForm.get('apiKey')?.value;
    if (!this.hasExistingKey && (!apiKeyValue || apiKeyValue.trim() === '')) {
      this.notificationService.error('Please enter an API key');
      return;
    }

    this.isSaving = true;

    const payload = this.buildPayload();
    this.aiIntegrationService.saveConfiguration(payload).subscribe({
      next: (resp: any) => {
        if (resp.success !== false) {
          this.notificationService.success('AI configuration saved successfully!');
          this.connectionStatus = 'unknown';
          this.persistConnectionStatus();
          this.loadConfiguration();
        } else {
          this.notificationService.error(resp.message || 'Failed to save configuration');
        }
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  onApiKeyFocus(): void {
    if (this.hasExistingKey && this.configForm.get('apiKey')?.value === this.maskedApiKey) {
      this.configForm.get('apiKey')?.setValue('');
    }
  }

  onApiKeyBlur(): void {
    const value = this.configForm.get('apiKey')?.value;
    if (this.hasExistingKey && (!value || value.trim() === '')) {
      this.configForm.get('apiKey')?.setValue(this.maskedApiKey);
    }
  }

  getModelDescription(modelValue: string): string {
    const model = this.modelList.find((m) => m.value === modelValue);
    return model?.description || '';
  }

  private buildPayload(): any {
    const formValues = this.configForm.value;
    return {
      name: formValues.name,
      provider: formValues.provider,
      apiKey: formValues.apiKey === this.maskedApiKey ? this.maskedApiKey : formValues.apiKey,
      model: formValues.model,
      enabled: formValues.enabled,
      maxTokens: formValues.maxTokens,
      temperature: formValues.temperature,
      includeCodeSnippet: formValues.includeCodeSnippet,
      includeProgramName: formValues.includeProgramName,
      includeSystemName: formValues.includeSystemName,
      includeRuleMetadata: formValues.includeRuleMetadata,
      featureRiskSummary: formValues.featureRiskSummary,
      featureRemediationPlan: formValues.featureRemediationPlan,
      featureWhitelistJustification: formValues.featureWhitelistJustification,
      featureIssueDescription: formValues.featureIssueDescription,
      featurePatternImprovement: formValues.featurePatternImprovement,
      featureMitigationCreation: formValues.featureMitigationCreation,
    };
  }

  private persistConnectionStatus(): void {
    try {
      localStorage.setItem(AiIntegrationComponent.STORAGE_KEY, JSON.stringify({
        status: this.connectionStatus,
        time: this.lastTestTime?.getTime() || null,
        responseTimeMs: this.responseTimeMs,
      }));
    } catch { /* localStorage unavailable */ }
  }

  private restoreConnectionStatus(): void {
    try {
      const raw = localStorage.getItem(AiIntegrationComponent.STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.status === 'connected' || saved.status === 'disconnected') {
        this.connectionStatus = saved.status;
      }
      if (saved.time) {
        this.lastTestTime = new Date(saved.time);
      }
      if (saved.responseTimeMs) {
        this.responseTimeMs = saved.responseTimeMs;
      }
    } catch { /* ignore corrupt data */ }
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    if (index === 1 && this.auditData.length === 0) {
      this.loadAuditLogs();
    }
  }

  onAuditQueryChange(params: TableQueryParams): void {
    const filtersArray: any[] = [];
    if (params.filters) {
      for (const key of Object.keys(params.filters)) {
        if (params.filters[key] !== null && params.filters[key] !== '') {
          filtersArray.push({ field: key, operator: 'CONTAINS', value: params.filters[key] });
        }
      }
    }

    this.loadAuditLogs({
      page: params.pageIndex - 1,
      size: params.pageSize,
      sortField: params.sort?.field || 'createdAt',
      sortDirection: params.sort?.direction === 'ascend' ? 'ASC' : 'DESC',
      filters: filtersArray,
      globalFilter: params.globalSearch || null,
    });
  }

  loadAuditLogs(request?: any): void {
    this.auditLoading = true;
    const payload = request || { page: 0, size: 10, sortField: 'createdAt', sortDirection: 'DESC', filters: [] };
    this.aiIntegrationService.getAuditLogs(payload).subscribe({
      next: (resp: any) => {
        if (resp?.data) {
          this.auditData = resp.data.rows || [];
          this.auditTotal = resp.data.records || 0;
        }
        this.auditLoading = false;
      },
      error: () => {
        this.auditLoading = false;
      },
    });
  }

  onAuditRowSelect(row: any): void {
    this.selectedAuditLog = row;
    this.auditDetailPanel?.open();
  }

  onAuditPanelClosed(): void {
    this.selectedAuditLog = null;
  }
}
