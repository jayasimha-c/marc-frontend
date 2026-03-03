import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { SetupService } from '../../setup.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { GridRequestBuilder } from '../../../../../core/utils/grid-request.builder';

@Component({
    selector: 'app-privilege-wizard',
    templateUrl: './privilege-wizard.component.html',
    styleUrls: ['./privilege-wizard.component.scss'],
    standalone: false
})
export class PrivilegeWizardComponent implements OnInit {

    currentStep = 0;
    isEditMode = false;
    loading = false;
    saving = false;
    privilegeIdParam = '';

    // Step 1: Basic Info
    basicInfoForm!: FormGroup;

    // Step 2: Settings
    settingsForm!: FormGroup;

    // Step 3: Users
    allUsers: any[] = [];
    usersLoading = false;
    userSearchText = '';

    // Track selected user IDs
    approverIds: Set<number> = new Set();
    reviewerIds: Set<number> = new Set();
    requesterIds: Set<number> = new Set();

    // Step 4: SAP Systems
    sapSystems: any[] = [];
    selectedSystemIds: Set<number> = new Set();
    systemsLoading = false;

    // Step 5: Activation
    activateOnSave = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private fb: FormBuilder,
        private setupService: SetupService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.initForms();
        this.loadUsers();
        this.loadSapSystems();

        this.privilegeIdParam = this.route.snapshot.params['id'] || '';
        if (this.privilegeIdParam) {
            this.isEditMode = true;
            this.loadExistingPrivilege();
        }
    }

    initForms(): void {
        this.basicInfoForm = this.fb.group({
            privilegeId: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9_-]*$/)]],
            description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
        });

        this.settingsForm = this.fb.group({
            sendTxnLog: [false],
            sameApproverReviewer: [false],
            sameRequesterApprover: [false],
            setMaxDays: [false],
            maxDays: [null],
            ticketValidate: [false]
        });
    }

    // ─── Data Loading ───────────────────────────────────────────────
    loadUsers(): void {
        this.usersLoading = true;
        this.setupService.getAllUsers().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.allUsers = res.data.users || res.data || [];
                }
                this.usersLoading = false;
            },
            error: () => { this.usersLoading = false; }
        });
    }

    loadSapSystems(): void {
        this.systemsLoading = true;
        this.setupService.getSapMapping().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.sapSystems = res.data.saps || [];
                }
                this.systemsLoading = false;
            },
            error: () => { this.systemsLoading = false; }
        });
    }

    loadExistingPrivilege(): void {
        this.loading = true;
        const privId = this.privilegeIdParam;

        // Load basic privilege data
        const payload = GridRequestBuilder.defaultLegacy(1);
        this.setupService.getPrivilegeList(payload).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const allPrivs = res.data.content || res.data.rows || [];
                    const priv = allPrivs.find((p: any) => p.id === privId);
                    if (priv) {
                        this.basicInfoForm.patchValue({
                            privilegeId: priv.id,
                            description: priv.description
                        });
                        this.basicInfoForm.get('privilegeId')!.disable();
                        this.activateOnSave = priv.active || false;
                    }
                }
            }
        });

        // Load settings
        this.setupService.getPrivilegeSetting(privId).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const s = res.data;
                    this.settingsForm.patchValue({
                        sendTxnLog: s.sendTxnLog || false,
                        sameApproverReviewer: s.sameApproverReviewer || false,
                        sameRequesterApprover: s.sameRequesterApprover || false,
                        setMaxDays: s.maxDays != null,
                        maxDays: s.maxDays,
                        ticketValidate: s.ticketValidate || false
                    });
                }
            }
        });

        // Load existing users by type
        ['APPROVER', 'REVIEWER', 'REQUESTER'].forEach(type => {
            this.setupService.getPrivilegeUsers({ userType: type, privId }).subscribe({
                next: (res) => {
                    if (res.success && res.data?.privUsers) {
                        const ids = res.data.privUsers.map((u: any) => u.userId);
                        if (type === 'APPROVER') ids.forEach((id: number) => this.approverIds.add(id));
                        if (type === 'REVIEWER') ids.forEach((id: number) => this.reviewerIds.add(id));
                        if (type === 'REQUESTER') ids.forEach((id: number) => this.requesterIds.add(id));
                    }
                }
            });
        });

        // Load existing mappings
        this.setupService.getSapMapping(privId).subscribe({
            next: (res) => {
                if (res.success && res.data?.privMappings) {
                    res.data.privMappings.forEach((m: any) => {
                        this.selectedSystemIds.add(m.sapId);
                    });
                }
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    // ─── Step Navigation ────────────────────────────────────────────
    onNext(): void {
        if (this.canProceedToNext()) {
            this.currentStep++;
        }
    }

    onPrev(): void {
        if (this.currentStep > 0) this.currentStep--;
    }

    goToStep(step: number): void {
        // Only allow navigating to completed steps or one step ahead
        if (step <= this.currentStep) {
            this.currentStep = step;
        }
    }

    canProceedToNext(): boolean {
        switch (this.currentStep) {
            case 0: // Basic Info
                if (this.basicInfoForm.invalid) {
                    Object.values(this.basicInfoForm.controls).forEach(c => {
                        if (c.invalid) { c.markAsDirty(); c.updateValueAndValidity({ onlySelf: true }); }
                    });
                    return false;
                }
                return true;
            case 1: // Settings - always valid
                return true;
            case 2: // Users - need at least 1 approver and 1 reviewer
                if (this.approverIds.size === 0) {
                    this.notificationService.warn('Please select at least one approver');
                    return false;
                }
                if (this.reviewerIds.size === 0) {
                    this.notificationService.warn('Please select at least one reviewer');
                    return false;
                }
                return true;
            case 3: // Systems
                if (this.selectedSystemIds.size === 0) {
                    this.notificationService.warn('Please select at least one SAP system');
                    return false;
                }
                return true;
            default:
                return true;
        }
    }

    // ─── User Management (Step 3) ──────────────────────────────────
    get filteredUsers(): any[] {
        if (!this.userSearchText) return this.allUsers;
        const term = this.userSearchText.toLowerCase();
        return this.allUsers.filter(u =>
            (u.username || '').toLowerCase().includes(term) ||
            (u.displayName || '').toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term)
        );
    }

    toggleApprover(userId: number): void {
        if (this.approverIds.has(userId)) this.approverIds.delete(userId);
        else this.approverIds.add(userId);
        this.enforceUserConstraints(userId, 'approver');
    }

    toggleReviewer(userId: number): void {
        if (this.reviewerIds.has(userId)) this.reviewerIds.delete(userId);
        else this.reviewerIds.add(userId);
        this.enforceUserConstraints(userId, 'reviewer');
    }

    toggleRequester(userId: number): void {
        if (this.requesterIds.has(userId)) this.requesterIds.delete(userId);
        else this.requesterIds.add(userId);
    }

    enforceUserConstraints(userId: number, changedRole: string): void {
        const sameAR = this.settingsForm.value.sameApproverReviewer;
        const sameRA = this.settingsForm.value.sameRequesterApprover;

        if (!sameAR) {
            // Cannot be both approver and reviewer
            if (changedRole === 'approver' && this.approverIds.has(userId)) {
                this.reviewerIds.delete(userId);
            } else if (changedRole === 'reviewer' && this.reviewerIds.has(userId)) {
                this.approverIds.delete(userId);
            }
        }

        if (!sameRA) {
            // Cannot be both requester and approver
            if (changedRole === 'approver' && this.approverIds.has(userId)) {
                this.requesterIds.delete(userId);
            }
        }
    }

    // ─── System Selection (Step 4) ──────────────────────────────────
    toggleSystem(sysId: number): void {
        if (this.selectedSystemIds.has(sysId)) this.selectedSystemIds.delete(sysId);
        else this.selectedSystemIds.add(sysId);
    }

    isSystemSelected(sysId: number): boolean {
        return this.selectedSystemIds.has(sysId);
    }

    // ─── Review Helpers (Step 5) ────────────────────────────────────
    getApproverNames(): string[] {
        return this.allUsers.filter(u => this.approverIds.has(u.id)).map(u => u.username || u.displayName);
    }

    getReviewerNames(): string[] {
        return this.allUsers.filter(u => this.reviewerIds.has(u.id)).map(u => u.username || u.displayName);
    }

    getRequesterNames(): string[] {
        return this.allUsers.filter(u => this.requesterIds.has(u.id)).map(u => u.username || u.displayName);
    }

    getSelectedSystemNames(): string[] {
        return this.sapSystems.filter(s => this.selectedSystemIds.has(s.id)).map(s => s.destinationName || s.description);
    }

    // ─── Save ───────────────────────────────────────────────────────
    saveWizard(): void {
        this.saving = true;
        const basicInfo = this.basicInfoForm.getRawValue();
        const settings = this.settingsForm.value;

        const payload = {
            privilege: {
                id: basicInfo.privilegeId,
                description: basicInfo.description
            },
            setting: {
                sendTxnLog: settings.sendTxnLog,
                maxDays: settings.setMaxDays ? settings.maxDays : null,
                sameApproverReviewer: settings.sameApproverReviewer,
                sameRequesterApprover: settings.sameRequesterApprover,
                ticketValidate: settings.ticketValidate
            },
            approverIds: Array.from(this.approverIds),
            reviewerIds: Array.from(this.reviewerIds),
            requesterIds: Array.from(this.requesterIds),
            mapping: Array.from(this.selectedSystemIds).map(sapId => ({
                privilegeId: basicInfo.privilegeId,
                sapId,
                notes: ''
            })),
            activate: this.activateOnSave,
            newPrivilege: !this.isEditMode
        };

        this.setupService.saveFullPrivilege(payload).subscribe({
            next: (res) => {
                this.notificationService.show(res);
                if (res.success) {
                    this.router.navigate(['/pam/setup/privileges']);
                } else {
                    this.saving = false;
                }
            },
            error: (err) => {
                this.notificationService.handleHttpError(err);
                this.saving = false;
            }
        });
    }

    cancel(): void {
        this.router.navigate(['/pam/setup/privileges']);
    }
}
