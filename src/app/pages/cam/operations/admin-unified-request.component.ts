import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, takeUntil } from 'rxjs';
import { CamService } from '../cam.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiResponse } from '../../../core/models/api-response';

interface AdUser {
  id: number;
  samAccountName: string;
  firstName: string;
  lastName: string;
  email: string;
  manager: string;
  department: string;
  jobTitle: string;
}

interface SapSystem {
  id: string;
  destinationName: string;
  exist?: boolean;
  selected?: boolean;
}

interface Role {
  rolename: string;
  description: string;
  validFrom: string;
  validTo: string;
  destinationName?: string;
  sapSystemId?: number;
  catalogueId?: number;
  catalogueName?: string;
  oldRole?: boolean;
}

interface RoleCatalogue {
  id: number;
  roleName: string;
  businessProcess?: string;
  subBusinessProcess?: string;
  department?: string;
  division?: string;
  criticality?: string;
  sapSystem?: string;
  sapSystemId?: number;
}

@Component({
  standalone: false,
  selector: 'app-admin-unified-request',
  templateUrl: './admin-unified-request.component.html',
  styleUrls: ['./admin-unified-request.component.scss'],
})
export class AdminUnifiedRequestComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  requestForm!: FormGroup;
  isChangePage = false;

  // User search
  userSearchValue = '';
  selectedUser: AdUser | null = null;
  userSearchResults: AdUser[] = [];
  userSearching = false;

  // Systems
  sapSystems: SapSystem[] = [];

  // Catalogues & roles
  availableCatalogues: RoleCatalogue[] = [];
  selectedCatalogues: Record<string, RoleCatalogue[]> = {};
  selectedRoles: Record<string, Role[]> = {};
  selectedRoleList: Role[] = [];
  catalogueSearchValue = '';
  catalogueSearchResults: RoleCatalogue[] = [];

  // User groups
  availableUserGroups: any[] = [];
  selectedUserGroups: any[] = [];

  // Business process nodes
  dropDownList: any[] = [];

  // Risk analysis
  showRiskAnalysis = false;
  riskAnalysisResults: any = null;
  riskAnalysisData: any = null;
  selectedAnalysisTab = 0;

  // Submit
  isSubmitting = false;

  userTypeList = ['Dialog', 'System', 'Communication', 'Reference', 'Service'];

  private userSearchSubject = new Subject<string>();
  private catalogueSearchSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private camService: CamService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    this.isChangePage = this.router.url.includes('change');
  }

  ngOnInit(): void {
    this.initForm();
    this.setupSearches();
    this.loadSapSystems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const today = this.formatDate(new Date());
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    this.requestForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      accountNumber: [''],
      userType: ['Dialog', Validators.required],
      department: [''],
      function: [''],
      validFrom: [today, Validators.required],
      validTo: [this.formatDate(nextMonth), Validators.required],
      spoolDevice: [''],
      dateFormat: [''],
      timeFormat: [''],
      printParameter2: [''],
      printParameter3: [''],
      decimalNotation: [''],
      logonLanguage: [''],
      costCenter: [''],
      licenseType: [''],
    });
  }

  private setupSearches(): void {
    this.userSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(term => {
      if (term?.length >= 2) this.searchAdUsers(term);
      else this.userSearchResults = [];
    });

    this.catalogueSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(term => {
      if (term?.length >= 2) this.filterCatalogues(term);
      else this.catalogueSearchResults = [];
    });
  }

  private loadSapSystems(): void {
    const req = this.isChangePage
      ? this.camService.getChangeRequiredInfo()
      : this.camService.getRequiredInfo();
    req.subscribe(resp => {
      this.sapSystems = (resp.data?.saps || []).map((s: any) => ({ ...s, selected: false }));
    });
  }

  // ─── User Search ───────────────────────────────

  onUserSearch(value: string): void {
    this.userSearchValue = value;
    this.userSearchSubject.next(value);
  }

  private searchAdUsers(term: string): void {
    this.userSearching = true;
    const makeFilter = (field: string) => ({
      [field]: [{ value: term, matchMode: 'contains', operator: 'and' }],
    });
    const makeParams = (filters: any) => ({ first: 0, rows: 20, sortField: '', sortOrder: 1, filters });

    forkJoin([
      this.camService.findAdUser(makeParams(makeFilter('samAccountName'))),
      this.camService.findAdUser(makeParams(makeFilter('firstName'))),
      this.camService.findAdUser(makeParams(makeFilter('lastName'))),
      this.camService.findAdUser(makeParams(makeFilter('email'))),
    ]).subscribe({
      next: responses => {
        const all: AdUser[] = [];
        responses.forEach(r => { if (r?.data?.rows) all.push(...r.data.rows); });
        this.userSearchResults = all.filter((u, i, self) => i === self.findIndex(x => x.id === u.id));
        this.userSearching = false;
      },
      error: () => {
        this.userSearchResults = [];
        this.userSearching = false;
      },
    });
  }

  selectUser(user: AdUser): void {
    this.selectedUser = user;
    this.userSearchValue = `${user.firstName} ${user.lastName} (${user.samAccountName})`;
    this.userSearchResults = [];

    this.requestForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      function: user.jobTitle,
    });

    this.camService.sapSearch(user.samAccountName).subscribe(resp => {
      this.sapSystems = (resp.data?.saps || []).map((s: any) => ({ ...s, selected: false }));
    });
  }

  // ─── System Selection ──────────────────────────

  get selectedSystems(): SapSystem[] {
    return this.sapSystems.filter(s => s.selected);
  }

  onSystemToggle(system: SapSystem, checked: boolean): void {
    if (!this.selectedUser) {
      this.notificationService.error('Please select a user first');
      return;
    }

    if (checked) {
      this.camService.checkSapUserExistence(this.selectedUser.samAccountName, system.id).subscribe(resp => {
        if (this.isChangePage) {
          if (resp.data) {
            system.selected = true;
            this.getAssignedRoles(system);
            this.loadCataloguesForSystem(system);
            this.loadUserGroups();
            this.loadNodes();
          } else {
            this.notificationService.error(`User does not exist in ${system.destinationName}. Create the user first.`);
          }
        } else {
          if (!resp.data) {
            system.selected = true;
            this.loadCataloguesForSystem(system);
            this.loadUserGroups();
            this.loadNodes();
          } else {
            this.notificationService.error(`User already exists in ${system.destinationName}.`);
          }
        }
      });
    } else {
      system.selected = false;
      // Clean up catalogues, roles, user groups for this system
      const sysId = system.id;
      delete this.selectedCatalogues[sysId];
      delete this.selectedRoles[sysId];
      this.selectedRoleList = this.selectedRoleList.filter(r => r.sapSystemId?.toString() !== sysId);
      this.availableCatalogues = this.availableCatalogues.filter(c => c.sapSystemId?.toString() !== sysId);
      this.availableUserGroups = this.availableUserGroups.filter(g => g.sapDestination !== system.destinationName);
      this.selectedUserGroups = this.selectedUserGroups.filter(g => g.sapDestination !== system.destinationName);
      this.loadNodes();
    }
  }

  private getAssignedRoles(system: SapSystem): void {
    if (!this.selectedUser) return;
    this.camService.getUserAssignedRoles(this.selectedUser.samAccountName, system.id).subscribe(resp => {
      if (resp?.data) {
        const processed = resp.data.map((role: any) => ({
          ...role,
          validFrom: role.validFrom ? this.formatDate(new Date(parseInt(role.validFrom))) : this.formatDate(new Date()),
          validTo: role.validTo ? this.formatDate(new Date(parseInt(role.validTo))) : this.formatDate(new Date()),
          sapSystemId: parseInt(system.id),
          oldRole: true,
        }));
        this.selectedRoles[system.id] = processed;
        this.rebuildRoleList();
      }
    });
  }

  // ─── Catalogue Management ─────────────────────

  private loadCataloguesForSystem(system: SapSystem): void {
    this.camService.getRoleCatForReq(system.id).subscribe(resp => {
      if (!this.selectedRoles[system.id]) this.selectedRoles[system.id] = [];
      if (!this.selectedCatalogues[system.id]) this.selectedCatalogues[system.id] = [];
      if (resp.data) {
        const withSysId = resp.data.map((c: any) => ({
          ...c,
          sapSystemId: c.sapSystemId || parseInt(system.id),
        }));
        withSysId.forEach((c: RoleCatalogue) => {
          if (!this.availableCatalogues.find(x => x.id === c.id)) {
            this.availableCatalogues.push(c);
          }
        });
      }
    });
  }

  onCatalogueSearch(value: string): void {
    this.catalogueSearchValue = value;
    this.catalogueSearchSubject.next(value);
  }

  private filterCatalogues(term: string): void {
    const selectedIds = this.selectedSystems.map(s => s.id);
    const filtered = this.availableCatalogues.filter(c => {
      const sysMatch = selectedIds.includes(c.sapSystemId?.toString() || '');
      const textMatch = !term || [c.roleName, c.businessProcess, c.department, c.division]
        .some(f => f?.toLowerCase().includes(term.toLowerCase()));
      return sysMatch && textMatch;
    });
    this.catalogueSearchResults = filtered.slice(0, 15);
  }

  addCatalogue(catalogue: RoleCatalogue): void {
    const sysId = catalogue.sapSystemId?.toString();
    if (!sysId) return;
    if (!this.selectedSystems.find(s => s.id === sysId)) return;
    if (!this.selectedCatalogues[sysId]) this.selectedCatalogues[sysId] = [];
    if (this.selectedCatalogues[sysId].find(c => c.id === catalogue.id)) return;

    this.selectedCatalogues[sysId].push(catalogue);
    this.loadRolesForCatalogue(catalogue);
    this.catalogueSearchValue = '';
    this.catalogueSearchResults = [];
  }

  removeCatalogue(sysId: string, catalogueId: number): void {
    const cats = this.selectedCatalogues[sysId];
    if (!cats) return;
    this.selectedCatalogues[sysId] = cats.filter(c => c.id !== catalogueId);
    if (this.selectedRoles[sysId]) {
      this.selectedRoles[sysId] = this.selectedRoles[sysId].filter(r => r.catalogueId !== catalogueId);
    }
    this.rebuildRoleList();
  }

  private loadRolesForCatalogue(catalogue: RoleCatalogue): void {
    this.camService.getRoleCatalogueAllRoles(catalogue.id).subscribe(resp => {
      if (!resp.data) return;
      const sysId = catalogue.sapSystemId?.toString();
      if (!sysId) return;
      if (!this.selectedRoles[sysId]) this.selectedRoles[sysId] = [];

      const system = this.selectedSystems.find(s => s.id === sysId);
      const existing = this.selectedRoles[sysId].map(r => r.rolename);
      const today = this.formatDate(new Date());
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const newRoles = resp.data
        .filter((r: any) => !existing.includes(r.roleName || r.rolename))
        .map((r: any) => ({
          rolename: r.roleName || r.rolename,
          description: r.description || '',
          destinationName: system?.destinationName || '',
          sapSystemId: catalogue.sapSystemId,
          catalogueId: catalogue.id,
          catalogueName: catalogue.roleName,
          validFrom: today,
          validTo: this.formatDate(nextMonth),
          oldRole: false,
        }));

      if (newRoles.length > 0) {
        this.selectedRoles[sysId] = [...this.selectedRoles[sysId], ...newRoles];
        this.rebuildRoleList();
      }
    });
  }

  removeRole(role: Role, index: number): void {
    const sysId = role.sapSystemId?.toString();
    if (sysId && this.selectedRoles[sysId]) {
      this.selectedRoles[sysId] = this.selectedRoles[sysId].filter(
        r => !(r.rolename === role.rolename && r.sapSystemId === role.sapSystemId)
      );
    }
    this.rebuildRoleList();
  }

  private rebuildRoleList(): void {
    this.selectedRoleList = Object.values(this.selectedRoles).flat();
  }

  // ─── User Groups ──────────────────────────────

  private loadUserGroups(): void {
    this.camService.getAvailableGroups({
      sapIds: this.selectedSystems.map(s => s.id),
      selectedGroups: [],
    }).subscribe(resp => {
      const newGroups = resp.data?.rows || [];
      const all = [...this.availableUserGroups, ...newGroups];
      this.availableUserGroups = all.filter((g, i, self) =>
        i === self.findIndex(x => x.sapDestination === g.sapDestination && x.group === g.group)
      );
    });
  }

  onUserGroupToggle(group: any, checked: boolean): void {
    if (checked) {
      if (!this.selectedUserGroups.find(g => g.group === group.group && g.sapDestination === group.sapDestination)) {
        this.selectedUserGroups.push(group);
      }
    } else {
      this.selectedUserGroups = this.selectedUserGroups.filter(
        g => !(g.group === group.group && g.sapDestination === group.sapDestination)
      );
    }
  }

  isUserGroupSelected(group: any): boolean {
    return this.selectedUserGroups.some(g => g.group === group.group && g.sapDestination === group.sapDestination);
  }

  // ─── Business Process Nodes ───────────────────

  private loadNodes(): void {
    if (!this.selectedUser || this.selectedSystems.length === 0) {
      this.dropDownList = [];
      return;
    }
    const ids = this.selectedSystems.map(s => s.id);
    const req = this.isChangePage
      ? this.camService.changeSearchRequiredInfo(ids, this.selectedUser.samAccountName)
      : this.camService.searchRequiredInfo(ids, this.selectedUser.samAccountName);
    req.subscribe(resp => {
      this.processDropdown(resp.data?.nodes);
    });
  }

  private processDropdown(input: any): void {
    if (!input) { this.dropDownList = []; return; }
    const output: any[] = [];
    for (const val of Object.values(input) as any[]) {
      if (val?.length > 0) {
        output.push({ value: val, name: val[0].node?.name, selected: val[0].id });
      }
    }
    this.dropDownList = output;
  }

  // ─── Risk Analysis ────────────────────────────

  runRiskAnalysis(): void {
    if (!this.selectedUser || this.selectedSystems.length === 0) {
      this.notificationService.error('Please select user and systems first');
      return;
    }
    if (this.selectedRoleList.length === 0) {
      this.notificationService.error('Please select at least one role');
      return;
    }

    this.riskAnalysisResults = { status: 'running', message: 'Analysis in progress...' };
    this.camService.startSimulations({
      rolenames: this.selectedRoleList.map(r => r.rolename),
      sapIds: this.selectedSystems.map(s => s.id),
      userId: this.selectedUser.samAccountName,
      user: { firstName: this.selectedUser.firstName, lastName: this.selectedUser.lastName },
    }).subscribe({
      next: resp => {
        if (resp.success) {
          this.riskAnalysisData = resp.data;
          this.showRiskAnalysis = true;
          this.riskAnalysisResults = { status: 'complete', message: 'Analysis complete' };
          this.notificationService.success('Risk analysis completed');
        } else {
          this.notificationService.error(resp.message || 'Risk analysis failed');
          this.riskAnalysisResults = null;
        }
      },
      error: () => {
        this.notificationService.error('Risk analysis failed');
        this.riskAnalysisResults = null;
      },
    });
  }

  getSystemKeys(): string[] {
    return this.riskAnalysisData ? Object.keys(this.riskAnalysisData) : [];
  }

  // ─── Submit ────────────────────────────────────

  get canSubmit(): boolean {
    return !!this.selectedUser
      && this.selectedSystems.length > 0
      && this.selectedRoleList.length > 0
      && this.selectedUserGroups.length > 0
      && !this.isSubmitting;
  }

  submitRequest(): void {
    if (!this.selectedUser) {
      this.notificationService.error('Please select a user');
      return;
    }
    if (this.selectedSystems.length === 0) {
      this.notificationService.error('Please select at least one SAP system');
      return;
    }
    if (this.selectedRoleList.length === 0) {
      this.notificationService.error('Please select at least one role');
      return;
    }
    if (!this.requestForm.valid) {
      this.requestForm.markAllAsTouched();
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    this.isSubmitting = true;
    const f = this.requestForm.value;

    const payload: any = {
      user: {
        userId: this.selectedUser.samAccountName,
        firstName: f.firstName,
        lastName: f.lastName,
        email: f.email,
        accountNumber: f.accountNumber,
        department: f.department,
        function: f.function,
        userType: f.userType,
        validFrom: f.validFrom,
        validTo: f.validTo,
        licenseType: f.licenseType,
        spool: f.spoolDevice,
        dateFormat: f.dateFormat,
        timeFormat: f.timeFormat,
        spdb: f.printParameter2,
        spda: f.printParameter3,
        decimalFormat: f.decimalNotation,
        language: f.logonLanguage,
        costCenter: f.costCenter,
      },
      sapIds: this.selectedSystems.map(s => s.id),
      sapNames: this.selectedSystems.map(s => s.destinationName),
      rolenames: [] as string[],
      descriptions: [] as string[],
      validFroms: [] as number[],
      validTos: [] as number[],
      roleSapIds: [] as string[],
      catalogueIds: [] as (number | null)[],
      userGroups: this.selectedUserGroups.map(ug => ug.group),
      nodeIds: this.dropDownList.map(item => item.selected),
      copy: false,
      oldRoles: [] as boolean[],
    };

    for (const sysId in this.selectedRoles) {
      for (const role of this.selectedRoles[sysId]) {
        payload.rolenames.push(role.rolename);
        payload.descriptions.push(role.description || '');
        payload.validFroms.push(new Date(role.validFrom).getTime());
        payload.validTos.push(new Date(role.validTo).getTime());
        payload.roleSapIds.push(sysId);
        payload.catalogueIds.push(role.catalogueId || null);
        payload.oldRoles.push(role.oldRole || false);
      }
    }

    const req = this.isChangePage
      ? this.camService.submitChangeReq(payload)
      : this.camService.submitReq(payload);

    req.subscribe({
      next: resp => {
        this.isSubmitting = false;
        if (resp.success) {
          this.notificationService.success('Request submitted successfully');
          this.router.navigate(['/cam/workflow/my-requests']);
        } else {
          this.notificationService.error(resp.message || 'Failed to submit request');
        }
      },
      error: err => {
        this.isSubmitting = false;
        this.notificationService.error(err.error?.message || 'Failed to submit request');
      },
    });
  }

  resetForm(): void {
    this.requestForm.reset();
    this.selectedUser = null;
    this.userSearchValue = '';
    this.sapSystems.forEach(s => s.selected = false);
    this.selectedRoles = {};
    this.selectedRoleList = [];
    this.selectedCatalogues = {};
    this.availableCatalogues = [];
    this.catalogueSearchValue = '';
    this.catalogueSearchResults = [];
    this.availableUserGroups = [];
    this.selectedUserGroups = [];
    this.dropDownList = [];
    this.showRiskAnalysis = false;
    this.riskAnalysisResults = null;
    this.riskAnalysisData = null;
    this.initForm();
  }

  // ─── Helpers ──────────────────────────────────

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  getSystemName(sysId: string): string {
    return this.sapSystems.find(s => s.id === sysId)?.destinationName || sysId;
  }
}
