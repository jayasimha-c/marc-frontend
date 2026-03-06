import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ReportingUnitService } from '../../reporting-units.service';
import { ApiResponse } from '../../../../../core/models/api-response';

type SystemType = 'SAP' | 'BTP' | 'JIRA' | 'BOBJ' | 'SAPJava' | 'SECURITY_NOTE' | 'HANA_DATABASE' |
  'SPLUNK' | 'MICROSOFT_365' | 'SUCCESS_FACTORS' | 'SERVICENOW' | 'SAP_CLOUD_IDENTITY' | 'LDAP';

interface SystemTypeOption {
  value: SystemType;
  label: string;
  description: string;
  icon: string;
}

@Component({
  standalone: false,
  selector: 'app-add-system',
  templateUrl: './add-system.component.html',
  styleUrls: ['./add-system.component.scss'],
})
export class AddSystemComponent implements OnInit {
  currentStep = 0;
  selectedSystemType: SystemType | null = null;
  systemForm!: FormGroup;
  isEditMode = false;
  systemId: string | null = null;
  saving = false;
  errorList: string[] = [];

  timezones: any[] = [];
  systemRoles: any[] = [];
  languages: [string, string][] = [];

  systemTypes: SystemTypeOption[] = [
    { value: 'SAP', label: 'SAP', description: 'SAP ERP systems', icon: 'cluster' },
    { value: 'BTP', label: 'BTP', description: 'SAP BTP', icon: 'cloud' },
    { value: 'JIRA', label: 'JIRA', description: 'Atlassian JIRA', icon: 'branches' },
    { value: 'BOBJ', label: 'BOBJ', description: 'Business Objects', icon: 'database' },
    { value: 'SAPJava', label: 'SAPJava', description: 'SAP Java systems', icon: 'code' },
    { value: 'SECURITY_NOTE', label: 'Security Notes', description: 'Security Notes System', icon: 'safety' },
    { value: 'HANA_DATABASE', label: 'HANA DB', description: 'SAP HANA Database', icon: 'hdd' },
    { value: 'SUCCESS_FACTORS', label: 'Success Factors', description: 'SAP SuccessFactors', icon: 'team' },
    { value: 'SPLUNK', label: 'Splunk', description: 'Splunk Platform', icon: 'bar-chart' },
    { value: 'MICROSOFT_365', label: 'Microsoft 365', description: 'Microsoft 365 Suite', icon: 'windows' },
    { value: 'SERVICENOW', label: 'ServiceNow', description: 'ServiceNow ITSM', icon: 'customer-service' },
    { value: 'SAP_CLOUD_IDENTITY', label: 'SAP Cloud Identity', description: 'SAP Cloud Identity Services (IAS)', icon: 'key' },
    { value: 'LDAP', label: 'LDAP', description: 'LDAP / Active Directory', icon: 'apartment' },
  ];

  ldapAuthTypes = [
    { value: 'SIMPLE', label: 'Simple Bind' },
    { value: 'DIGEST-MD5', label: 'DIGEST-MD5' },
    { value: 'SASL', label: 'SASL/External TLS' },
    { value: 'PASSWORD-PLAIN', label: 'Password Compare (Plain)' },
    { value: 'PASSWORD-SHA', label: 'Password Compare (SHA)' },
    { value: 'PASSWORD-MD5', label: 'Password Compare (MD5)' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private reportingUnitService: ReportingUnitService,
  ) {
    this.systemForm = this.fb.group({
      systemType: [null],
      id: [''],
      destinationName: ['', [Validators.maxLength(12)]],
      description: [''],
      hostName: [''],
      userName: [''],
      password: [''],
      languageCode: [''],
      systemRole: [''],
      timeZone: [null],
      offline: [null],
      sysNr: [''],
      clientNumber: [''],
      SID: [''],
      portNo: [''],
      pooled: [false],
      poolCapacity: [''],
      peakLimit: [''],
      hanaSystem: [false],
      enableCam: [false],
      centralRepo: [false],
      customDbtablog: [false],
      licenseCheck: [false],
      hideInUserAdmin: [false],
      btpSubDomain: [''],
      name: [''],
      project: [''],
      issueTypeId: [''],
      expiryDate: [null],
      token: [''],
      tokenExpiryDate: [null],
      authType: ['oauth2'],
      ldapPort: [389],
      ldapUseSsl: [false],
      ldapAuthType: ['SIMPLE'],
      ldapBaseDn: [''],
      ldapSearchFilter: [''],
      ldapPriority: [0],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.systemId = params['id'];
        this.selectedSystemType = params['systemType'] as SystemType;
        this.currentStep = 1;
      }
    });

    this.loadDropdownData();

    this.route.queryParams.subscribe(qp => {
      if (qp['duplicate'] === 'true') {
        const data = sessionStorage.getItem('duplicateSystem');
        if (data) {
          const system = JSON.parse(data);
          this.selectedSystemType = system.systemType as SystemType;
          this.populateForm(system);
          this.updateValidators(this.selectedSystemType);
          this.currentStep = 1;
          sessionStorage.removeItem('duplicateSystem');
        }
      }
    });
  }

  private loadDropdownData(): void {
    let api$: Observable<ApiResponse>;
    if (this.systemId) {
      const isIntegration = this.selectedSystemType === 'JIRA' || this.selectedSystemType === 'SECURITY_NOTE';
      api$ = isIntegration
        ? this.reportingUnitService.getIntegrationSystemById(+this.systemId)
        : this.reportingUnitService.sapInitFormForUpdate(+this.systemId);
    } else {
      api$ = this.reportingUnitService.sapInitForm();
    }

    api$.subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.timezones = resp.data.timezones || [];
          this.systemRoles = resp.data.systemRoles || [];
          if (resp.data.languagMap) {
            this.languages = Object.entries(resp.data.languagMap) as [string, string][];
          }
          this.populateForm(resp.data.sapSystem ?? resp.data ?? {});
        }
      },
    });

    if (this.selectedSystemType) {
      this.updateValidators(this.selectedSystemType);
    }
  }

  selectSystemType(type: SystemType): void {
    this.selectedSystemType = type;
    this.systemForm.patchValue({ systemType: type });
    this.updateValidators(type);
    this.errorList = [];
  }

  goToStep(step: number): void {
    if (step === 1 && !this.selectedSystemType) return;
    this.currentStep = step;
  }

  nextStep(): void {
    if (this.currentStep === 0 && this.selectedSystemType) {
      this.currentStep = 1;
    } else if (this.currentStep === 1) {
      this.currentStep = 2;
    }
  }

  prevStep(): void {
    if (this.currentStep > 0 && !this.isEditMode) {
      this.currentStep--;
    }
  }

  getSystemTypeDisplayName(): string {
    return this.systemTypes.find(t => t.value === this.selectedSystemType)?.label || '';
  }

  getWizardTitle(): string {
    const action = this.isEditMode ? 'Edit' : 'Add';
    return this.selectedSystemType
      ? `${action} ${this.getSystemTypeDisplayName()} System`
      : `${action} System`;
  }

  onOfflineChange(offline: boolean): void {
    this.updateSapValidators(offline);
  }

  onSave(): void {
    if (!this.selectedSystemType) return;

    Object.values(this.systemForm.controls).forEach(c => {
      c.markAsDirty();
      c.updateValueAndValidity();
    });

    if (!this.systemForm.valid) {
      this.notificationService.error('Please fix validation errors in the form');
      this.currentStep = 1;
      return;
    }

    this.errorList = [];
    this.saving = true;

    if (this.selectedSystemType === 'JIRA') {
      this.saveIntegrationSystem();
    } else {
      this.saveSapSystem();
    }
  }

  onTestConnection(): void {
    if (!this.selectedSystemType) return;

    if (this.selectedSystemType === 'JIRA') {
      const request = {
        host: this.systemForm.get('hostName')!.value,
        username: this.systemForm.get('userName')!.value,
        password: this.systemForm.get('password')!.value,
        type: this.selectedSystemType,
      };
      this.reportingUnitService.testIntegrationSystemsBeforeSave(request).subscribe({
        next: (resp) => { this.notificationService.show(resp); },
        error: (err) => { this.notificationService.show(err.error); },
      });
    }
  }

  navigateBack(): void {
    history.back();
  }

  // ==================== Private helpers ====================

  private updateValidators(type: SystemType): void {
    Object.keys(this.systemForm.controls).forEach(key => {
      this.systemForm.get(key)?.clearValidators();
    });

    const req = (field: string) => this.systemForm.get(field)?.setValidators([Validators.required]);

    switch (type) {
      case 'SAP':
        this.systemForm.get('offline')?.setValidators([Validators.required]);
        break;
      case 'BTP':
        ['destinationName', 'description', 'hostName', 'userName', 'password', 'btpSubDomain'].forEach(req);
        break;
      case 'SAPJava':
        ['destinationName', 'description', 'hostName', 'userName', 'password', 'clientNumber'].forEach(req);
        break;
      case 'JIRA':
        ['destinationName', 'description', 'hostName', 'userName', 'project', 'token'].forEach(req);
        break;
      case 'BOBJ':
        ['destinationName', 'description', 'hostName', 'sysNr', 'userName', 'password'].forEach(req);
        break;
      case 'SECURITY_NOTE':
        ['destinationName', 'description', 'hostName', 'token', 'tokenExpiryDate'].forEach(req);
        break;
      case 'HANA_DATABASE':
        ['destinationName', 'description', 'hostName', 'sysNr', 'userName', 'password', 'languageCode', 'systemRole'].forEach(req);
        break;
      case 'SUCCESS_FACTORS':
        ['destinationName', 'description', 'hostName', 'password', 'languageCode', 'timeZone', 'systemRole'].forEach(req);
        break;
      case 'SPLUNK':
        ['destinationName', 'description', 'hostName', 'password', 'languageCode', 'timeZone', 'systemRole'].forEach(req);
        break;
      case 'MICROSOFT_365':
        ['destinationName', 'description', 'hostName', 'userName', 'password', 'languageCode', 'timeZone', 'systemRole'].forEach(req);
        break;
      case 'SERVICENOW':
        ['destinationName', 'description', 'hostName', 'userName', 'password'].forEach(req);
        break;
      case 'SAP_CLOUD_IDENTITY':
        ['destinationName', 'description', 'hostName', 'userName', 'password'].forEach(req);
        break;
      case 'LDAP':
        ['destinationName', 'description', 'hostName', 'userName', 'password', 'ldapBaseDn'].forEach(req);
        this.systemForm.get('ldapPort')?.setValidators([Validators.required, Validators.min(1), Validators.max(65535)]);
        break;
    }

    Object.keys(this.systemForm.controls).forEach(key => {
      this.systemForm.get(key)?.updateValueAndValidity();
    });
  }

  private updateSapValidators(offline: boolean): void {
    const sapFields = ['destinationName', 'description', 'SID', 'languageCode', 'clientNumber',
      'systemRole', 'hostName', 'sysNr', 'userName', 'password', 'timeZone', 'poolCapacity', 'peakLimit'];

    sapFields.forEach(f => this.systemForm.get(f)?.clearValidators());

    const req = (field: string) => this.systemForm.get(field)?.setValidators([Validators.required]);
    req('destinationName');
    req('description');

    if (offline) {
      ['SID', 'languageCode', 'clientNumber', 'systemRole'].forEach(req);
    } else {
      ['hostName', 'sysNr', 'userName', 'password', 'languageCode', 'clientNumber',
        'timeZone', 'systemRole', 'poolCapacity', 'peakLimit'].forEach(req);
    }

    sapFields.forEach(f => this.systemForm.get(f)?.updateValueAndValidity());
  }

  private populateForm(system: any): void {
    if (!system) return;
    this.selectedSystemType = system.systemType ?? system.type;

    const isIntegration = ['JIRA', 'SECURITY_NOTE'].includes(this.selectedSystemType!);

    if (isIntegration) {
      const projectAttr = system.attributes?.find((a: any) => a.name === 'project');
      const issueTypeAttr = system.attributes?.find((a: any) => a.name === 'issueTypeId');
      this.systemForm.patchValue({
        id: system.id,
        destinationName: system.destinationName,
        description: system.description,
        hostName: system.hostName,
        userName: system.userName,
        token: system.password,
        password: system.password,
        project: projectAttr?.value || '',
        issueTypeId: issueTypeAttr?.value || '',
        expiryDate: system.expiryDate ? new Date(system.expiryDate) : null,
      });
    } else if ('destinationName' in system) {
      this.systemForm.patchValue({
        id: system.id,
        destinationName: system.destinationName,
        description: system.description,
        hostName: system.hostName,
        SID: system.SID,
        sysNr: system.sysNr,
        clientNumber: system.clientNumber,
        userName: system.userName,
        languageCode: system.languageCode,
        systemRole: system.systemRole,
        offline: system.offline,
        timeZone: system.timeZone ? system.timeZone.id : null,
        pooled: system.pooled,
        poolCapacity: system.poolCapacity,
        peakLimit: system.peakLimit,
        hanaSystem: system.hanaSystem,
        hideInUserAdmin: system.hideInUserAdmin,
        centralRepo: system.centralRepo,
        customDbtablog: system.customDbtablog,
        licenseCheck: system.licenseCheck,
        btpSubDomain: system.btpSubDomain || null,
        ldapPort: system.ldapPort || 389,
        ldapUseSsl: system.ldapUseSsl || false,
        ldapAuthType: system.ldapAuthType || 'SIMPLE',
        ldapBaseDn: system.ldapBaseDn || '',
        ldapSearchFilter: system.ldapSearchFilter || '',
        ldapPriority: system.ldapPriority || 0,
      });
    }
  }

  private saveIntegrationSystem(): void {
    const f = this.systemForm;
    const baseRequest: any = {
      id: this.systemId || null,
      name: f.get('destinationName')!.value,
      description: f.get('description')!.value,
      host: f.get('hostName')!.value,
      username: f.get('userName')!.value,
      password: f.get('password')!.value,
      type: this.selectedSystemType,
      expiryDate: f.get('expiryDate')!.value,
    };

    if (this.selectedSystemType === 'JIRA') {
      baseRequest.password = f.get('token')!.value;
      baseRequest.attributes = [
        { name: 'project', value: f.get('project')!.value },
        { name: 'issueTypeId', value: f.get('issueTypeId')!.value },
      ];
    }

    this.reportingUnitService.saveJiraRepository(baseRequest).subscribe({
      next: (resp) => {
        this.saving = false;
        if (resp.success) {
          this.notificationService.show(resp);
          this.navigateBack();
        }
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.show(err.error);
      },
    });
  }

  private saveSapSystem(): void {
    const formValue = { ...this.systemForm.value };

    if (this.selectedSystemType !== 'BTP' && this.selectedSystemType !== 'SAPJava') {
      if (formValue.timeZone && this.timezones.length > 0) {
        formValue.timeZone = this.timezones.find(p => p.id === formValue.timeZone) || formValue.timeZone;
      } else if (formValue.timeZone) {
        formValue.timeZone = { name: formValue.timeZone };
      }
    }

    let httpRequest: Observable<ApiResponse>;
    if (this.systemId) {
      const payload = { ...this.systemForm.getRawValue(), systemType: this.selectedSystemType };
      httpRequest = this.reportingUnitService.sapUpdate(this.systemId, payload);
    } else {
      const payload = { ...formValue, systemType: this.selectedSystemType };
      httpRequest = this.reportingUnitService.save(payload);
    }

    httpRequest.subscribe({
      next: (resp) => {
        this.saving = false;
        if (resp.success) {
          this.notificationService.show(resp);
          this.navigateBack();
        } else {
          this.notificationService.error(resp.message || 'Failed to save system');
          if (resp.data) {
            this.errorList = Object.values(resp.data) as string[];
          }
        }
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.error('Please check validation errors');
        if (err.error?.data) {
          this.errorList = Object.values(err.error.data) as string[];
        }
      },
    });
  }
}
