import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../../../../../core/services/notification.service';
import { CommunicationService } from '../../communication.service';

@Component({
  standalone: false,
  selector: 'app-email-settings',
  templateUrl: './settings-section.component.html',
  styleUrls: ['./settings-section.component.scss'],
})
export class SettingsSectionComponent implements OnInit {
  mailSettingForm!: FormGroup;
  authTypeList: string[] = ['ANONYMOUS', 'DEFAULT', 'TLS', 'SSL', 'ANONYMOUS_TLS'];

  showTestEmailModal = false;
  testEmailRecipient = '';

  // UI state
  connectionStatus: 'connected' | 'disconnected' | 'testing' | 'unknown' = 'unknown';
  lastTestTime: Date | null = null;
  hidePassword = true;
  showAuthFields = true;

  // Loading states
  isLoading = false;
  isTestingConnection = false;
  isSaving = false;
  isSendingTest = false;

  constructor(
    private fb: FormBuilder,
    private communicationService: CommunicationService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.mailSettingForm = this.fb.group({
      host: ['', [Validators.required]],
      port: ['', [Validators.required, Validators.min(1), Validators.max(65535)]],
      authType: ['', [Validators.required]],
      username: [''],
      password: [''],
      sender: ['', [Validators.required, Validators.email]],
    });
    this.loadFormData();
  }

  loadFormData(): void {
    this.communicationService.getMailForm().subscribe((resp: any) => {
      if (resp?.data) {
        this.authTypeList = resp.data.eauthtypes || this.authTypeList;
        const info = resp.data.mailInfo;
        if (info) {
          this.mailSettingForm.patchValue({
            host: info.ehost,
            port: info.eport,
            authType: info.eauthtype,
            username: info.eusername,
            password: info.epassword,
            sender: info.esender,
          });
          if (info.eauthtype) {
            this.onAuthTypeChange(info.eauthtype);
          }
        }
      }
    });
  }

  onTest(): void {
    this.isTestingConnection = true;
    this.connectionStatus = 'testing';
    this.isLoading = true;

    this.communicationService.testMail().subscribe({
      next: () => {
        this.connectionStatus = 'connected';
        this.lastTestTime = new Date();
        this.notificationService.success('SMTP connection test successful!');
      },
      error: (error) => {
        this.connectionStatus = 'disconnected';
        this.notificationService.error('SMTP connection failed: ' + (error?.message || 'Unknown error'));
      },
      complete: () => {
        this.isTestingConnection = false;
        this.isLoading = false;
      },
    });
  }

  onTestMessage(): void {
    this.showTestEmailModal = true;
    this.testEmailRecipient = '';
  }

  onSendTestMail(): void {
    if (!this.testEmailRecipient?.trim()) {
      this.notificationService.error('Please enter a valid email address');
      return;
    }

    this.isSendingTest = true;
    this.isLoading = true;

    this.communicationService.testMessage(this.testEmailRecipient.trim()).subscribe({
      next: () => {
        this.notificationService.success('Test email queued successfully!');
        this.showTestEmailModal = false;
        this.testEmailRecipient = '';
      },
      error: (error) => {
        this.notificationService.error('Failed to send test email: ' + (error?.message || 'Unknown error'));
      },
      complete: () => {
        this.isSendingTest = false;
        this.isLoading = false;
      },
    });
  }

  onSave(): void {
    this.mailSettingForm.markAllAsTouched();
    if (!this.mailSettingForm.valid) {
      this.notificationService.error('Please fix all validation errors before saving');
      return;
    }

    this.isSaving = true;
    this.isLoading = true;

    const v = this.mailSettingForm.value;
    this.communicationService.saveMail({
      ehost: v.host,
      eport: parseInt(v.port, 10),
      eauthtype: v.authType,
      eusername: v.username || '',
      epassword: v.password || '',
      esender: v.sender,
    }).subscribe({
      next: (resp: any) => {
        if (resp.success !== false) {
          this.notificationService.success('SMTP settings saved successfully!');
          this.connectionStatus = 'unknown';
        } else {
          this.notificationService.error(resp.message || 'Failed to save settings');
        }
      },
      error: (error) => {
        this.notificationService.error('Error saving settings: ' + (error?.message || 'Unknown error'));
      },
      complete: () => {
        this.isSaving = false;
        this.isLoading = false;
      },
    });
  }

  onAuthTypeChange(authType: string): void {
    const username = this.mailSettingForm.get('username');
    const password = this.mailSettingForm.get('password');

    if (authType === 'ANONYMOUS' || authType === 'ANONYMOUS_TLS') {
      this.showAuthFields = false;
      username?.clearValidators();
      password?.clearValidators();
      username?.setValue('');
      password?.setValue('');
    } else {
      this.showAuthFields = true;
      username?.setValidators([Validators.required]);
      password?.setValidators([Validators.required]);
    }

    username?.updateValueAndValidity();
    password?.updateValueAndValidity();
  }

  getAuthDescription(authType: string): string {
    const map: Record<string, string> = {
      ANONYMOUS: 'No authentication required',
      DEFAULT: 'Basic authentication',
      TLS: 'Transport Layer Security',
      SSL: 'Secure Sockets Layer',
      ANONYMOUS_TLS: 'TLS without authentication',
    };
    return map[authType] || 'Authentication method';
  }
}
