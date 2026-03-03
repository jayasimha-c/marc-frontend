import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RequestService } from '../../request.service';
import { ApiResponse } from '../../../../../core/models/api-response';
import { NotificationService } from '../../../../../core/services/notification.service';
import { AttachmentService } from '../../../../../core/services/attachment.service';
import { ApproveModalComponent } from '../../my-approval/approve-modal.component';
import { TableColumn, TableAction } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    standalone: false,
    selector: 'app-create-request',
    templateUrl: './create-request-modal.component.html',
    styleUrls: ['./create-request-modal.component.scss']
})
export class CreateRequestModalComponent implements OnInit {

    @ViewChild('txnTpl', { static: true }) txnTpl!: TemplateRef<any>;
    @ViewChild('noteTpl', { static: true }) noteTpl!: TemplateRef<any>;

    // Dropdowns
    sapSystemList: any[] = [];
    privIDList: any[] = [];
    reasonList: any[] = [];

    // Mode
    action = 'new';
    requestId: number | null = null;
    requestData: any = null;

    // Attachment
    fileName = '';
    selectedFile: File | null = null;
    dbAttachmentId: number | null = null;

    // Duration
    durationOptions = [
        { value: '1', label: '1 Hour' },
        { value: '2', label: '2 Hours' },
        { value: '4', label: '4 Hours' },
        { value: '8', label: '8 Hours' },
        { value: '24', label: '24 Hours' },
        { value: 'custom', label: 'Custom' }
    ];

    // Ticket integration
    ticketIntegrationEnabled = false;
    globalTicketIntegrationEnabled = false;
    ticketIntegrationType = 'ServiceNow';
    ticketValidating = false;
    ticketValidated = false;
    isSubmitting = false;

    // Form
    form: FormGroup;

    // TXN Table (review-rule inline editable pattern)
    txnColumns: TableColumn[] = [];
    txnActions: TableAction[] = [];
    txnData: any[] = [];
    selectedTxnRows = new Set<any>();

    constructor(
        private fb: FormBuilder,
        private requestService: RequestService,
        private notificationService: NotificationService,
        private nzModal: NzModalService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private attachmentService: AttachmentService
    ) {
        this.form = this.fb.group({
            status: [''],
            sapSystem: ['', [Validators.required]],
            privID: ['', [Validators.required]],
            validFrom: ['', [Validators.required]],
            duration: ['', [Validators.required]],
            validTo: [{ value: '', disabled: true }],
            reason: ['', [Validators.required]],
            justification: ['', [Validators.required]],
            attachment: [''],
            requesterName: [''],
            requestDate: [''],
            ticketNumber: ['']
        });
    }

    ngOnInit(): void {
        // Determine action from URL
        const url = this.router.url;
        if (url.includes('edit-request')) {
            this.action = 'edit';
        } else if (url.includes('approval-view')) {
            this.action = 'approval-view';
        } else if (url.includes('view-request')) {
            this.action = 'view';
        } else {
            this.action = 'new';
        }

        // Load route param
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.requestId = parseInt(params['id'], 10);
                this.loadRequestData(this.requestId);
            }
        });

        // Init TXN table
        this.initTxnTable();

        // Load dropdown data
        this.loadInfo();
        this.loadTicketIntegrationSettings();

        // SAP system change → reload privileges
        this.form.get('sapSystem')?.valueChanges.subscribe(val => {
            if (val) this.onSystemChange(val);
        });

        // Duration change: toggle validTo editable + auto-calculate
        this.form.get('duration')?.valueChanges.subscribe(dur => {
            if (dur === 'custom') {
                this.form.get('validTo')?.enable();
            } else {
                this.form.get('validTo')?.disable();
            }
            this.updateValidTo();
        });
        this.form.get('validFrom')?.valueChanges.subscribe(() => {
            if (this.form.get('duration')?.value !== 'custom') this.updateValidTo();
        });

        // Default values for new request
        if (this.action === 'new') {
            const defaultValidFrom = new Date();
            defaultValidFrom.setMinutes(defaultValidFrom.getMinutes() + 2);
            this.form.patchValue({ validFrom: defaultValidFrom });
            this.txnData = [{ txn: '', note: '' }];
        }
    }

    initTxnTable(): void {
        this.txnColumns = [
            { field: 'txn', header: 'Transaction', type: 'template', templateRef: this.txnTpl },
            { field: 'note', header: 'Notes', type: 'template', templateRef: this.noteTpl }
        ];

        if (!this.isReadOnly()) {
            this.txnActions = [
                { label: 'Add Row', icon: 'plus', type: 'dashed', command: () => this.addTxnRow() },
                { label: 'Delete Selected', icon: 'delete', type: 'default', danger: true, command: () => this.deleteSelectedTxn() }
            ];
        }
    }

    // --- Data Loading ---

    private loadRequestData(id: number): void {
        this.requestService.toEditRequest(id).subscribe((resp: ApiResponse) => {
            if (resp.success && resp.data) {
                this.requestData = resp.data.req;
                this.fileName = resp.data.filename || '';
                this.populateForm(this.requestData);
                this.loadDbAttachment(id);
            }
        });
    }

    private loadDbAttachment(requestId: number): void {
        this.attachmentService.listByEntity('PRIVILEGE_REQUEST', requestId).subscribe(
            (response: any) => {
                if (response.success && response.data?.length > 0) {
                    this.dbAttachmentId = response.data[0].id;
                    if (!this.fileName) this.fileName = response.data[0].originalName;
                }
            }
        );
    }

    private populateForm(data: any): void {
        const validFrom = data.validFrom ? new Date(data.validFrom) : null;
        const validTo = data.validTo ? new Date(data.validTo) : null;
        let durationValue = 'custom';

        if (validFrom && validTo) {
            const hours = Math.round((validTo.getTime() - validFrom.getTime()) / (1000 * 60 * 60));
            if ([1, 2, 4, 8, 24].includes(hours)) durationValue = hours.toString();
        }

        this.form.patchValue({
            status: data.status,
            sapSystem: data.system?.sapId,
            privID: data.system?.privilegeId,
            validFrom,
            validTo,
            duration: durationValue,
            reason: data.reason?.id,
            justification: data.justification,
            attachment: data.attachment,
            requesterName: data.requesterName,
            requestDate: data.requestDate ? new Date(parseInt(data.requestDate)).toISOString() : null,
            ticketNumber: data.ticketNumber || ''
        });

        // Load TXN rows
        this.loadTxnData(data.id);

        if (this.isReadOnly()) {
            this.form.disable();
        }
    }

    private loadTxnData(id: number): void {
        this.requestService.getRequestsTxn(id).subscribe((resp: ApiResponse) => {
            this.txnData = resp.data?.rows || resp.data || [];
        });
    }

    private loadInfo(): void {
        this.requestService.getInfoForRequests().subscribe((resp: ApiResponse) => {
            this.sapSystemList = resp.data?.sys || [];
            if (!this.requestData?.system?.sapId) this.privIDList = resp.data?.priv || [];
            this.reasonList = resp.data?.reasons || [];
        });
    }

    private loadTicketIntegrationSettings(): void {
        this.requestService.getPamIntegrationSettings().subscribe((resp: ApiResponse) => {
            if (resp.success && resp.data) {
                this.globalTicketIntegrationEnabled = resp.data.enabled || false;
                this.ticketIntegrationType = resp.data.integrationType || 'ServiceNow';
                this.updateTicketRequirement();
            }
        });

        this.form.get('privID')?.valueChanges.subscribe(() => this.updateTicketRequirement());
    }

    private updateTicketRequirement(): void {
        const selectedPrivId = this.form.get('privID')?.value;
        let privilegeRequiresTicket = false;

        if (selectedPrivId && this.privIDList?.length) {
            const selectedPriv = this.privIDList.find(p => p?.id === selectedPrivId);
            privilegeRequiresTicket = selectedPriv?.setting?.ticketValidate || false;
        }

        this.ticketIntegrationEnabled = this.globalTicketIntegrationEnabled && privilegeRequiresTicket;

        if (this.ticketIntegrationEnabled && !this.isReadOnly()) {
            this.form.get('ticketNumber')?.setValidators([Validators.required]);
        } else {
            this.form.get('ticketNumber')?.clearValidators();
        }
        this.form.get('ticketNumber')?.updateValueAndValidity();
        this.ticketValidated = false;
    }

    // --- TXN Table Operations (review-rule pattern) ---

    addTxnRow(): void {
        this.txnData = [...this.txnData, { txn: '', note: '' }];
    }

    deleteSelectedTxn(): void {
        if (this.selectedTxnRows.size === 0) {
            this.notificationService.error('Please select at least one row');
            return;
        }
        this.txnData = this.txnData.filter((_, i) => !this.selectedTxnRows.has(i));
        this.selectedTxnRows.clear();
    }

    onTxnSelectionChange(selected: Set<any>): void {
        this.selectedTxnRows = selected;
    }

    markModified(row: any): void {
        row.modified = true;
    }

    onTxnPaste(event: ClipboardEvent): void {
        const pastedText = event.clipboardData?.getData('text') || '';

        if (!pastedText.includes('\t') && !pastedText.includes('\n')) return;

        event.preventDefault();
        event.stopPropagation();

        const rows = pastedText.split(/\r\n|\n|\r/).filter(r => r.trim() !== '');
        const newEntries = rows.map(r => {
            const cols = r.split('\t');
            return { txn: cols[0]?.trim() || '', note: cols[1]?.trim() || '' };
        });

        this.txnData = [...this.txnData, ...newEntries];
        this.notificationService.success(`Pasted ${newEntries.length} rows`);
    }

    // --- Form Operations ---

    private onSystemChange(value: string): void {
        this.requestService.getPrivilegesForRequests(value).subscribe((resp: ApiResponse) => {
            this.privIDList = resp.data || [];
            this.updateTicketRequirement();
        });
    }

    updateValidTo(): void {
        const duration = this.form.get('duration')?.value;
        const validFrom = this.form.get('validFrom')?.value;

        if (duration && duration !== 'custom' && validFrom) {
            const validTo = new Date(validFrom);
            validTo.setHours(validTo.getHours() + parseInt(duration, 10));
            this.form.patchValue({ validTo }, { emitEvent: false });
        }
    }

    isCustomDuration(): boolean {
        return this.form.get('duration')?.value === 'custom';
    }

    isReadOnly(): boolean {
        return this.action === 'view' || this.action === 'approval-view';
    }

    navigateBack(): void {
        this.location.back();
    }

    getPageTitle(): string {
        switch (this.action) {
            case 'view': return 'View Privilege Request';
            case 'edit': return 'Edit Privilege Request';
            case 'approval-view': return 'Review Privilege Request';
            default: return 'New Privilege Request';
        }
    }

    // --- Ticket Validation ---

    private validateTicketAsync(): Promise<boolean> {
        return new Promise((resolve) => {
            const tk = this.form.get('ticketNumber')?.value;
            if (!tk?.trim()) {
                this.notificationService.error('Please enter a ticket number');
                return resolve(false);
            }
            this.ticketValidating = true;
            this.requestService.validateTicket(tk, this.ticketIntegrationType).subscribe({
                next: (resp: ApiResponse) => {
                    this.ticketValidating = false;
                    if (resp.success && resp.data) {
                        this.ticketValidated = true;
                        resolve(true);
                    } else {
                        this.notificationService.error(resp.message || 'Validation failed');
                        resolve(false);
                    }
                },
                error: () => { this.ticketValidating = false; resolve(false); }
            });
        });
    }

    // --- Submit ---

    async sendRequest(): Promise<void> {
        this.form.markAllAsTouched();
        if (!this.form.valid) return;

        this.isSubmitting = true;

        if (this.ticketIntegrationEnabled) {
            const isValid = await this.validateTicketAsync();
            if (!isValid) { this.isSubmitting = false; return; }
        }

        const txnList = this.txnData.filter(row => row?.txn?.toString().trim() !== '');

        const payload: any = {
            sapId: this.form.get('sapSystem')?.value,
            privilegeId: this.form.get('privID')?.value,
            validFrom: this.form.get('validFrom')?.value,
            validTo: this.form.get('validTo')?.value,
            reasonId: this.form.get('reason')?.value,
            justification: this.form.get('justification')?.value,
            attachment: this.form.get('attachment')?.value,
            ticketNumber: this.form.get('ticketNumber')?.value || null,
            txnList,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        let request = this.requestService.sendRequest(payload);
        if (this.action === 'edit' && this.requestId) {
            payload.id = this.requestId;
            request = this.requestService.updateRequest(payload);
        }

        request.subscribe({
            next: (resp: ApiResponse) => {
                const reqId = resp.data?.id || this.requestId;
                if (this.selectedFile && reqId) {
                    this.attachmentService.upload(this.selectedFile, 'PRIVILEGE_REQUEST', reqId).subscribe({
                        complete: () => {
                            this.isSubmitting = false;
                            this.notificationService.success(resp.message);
                            this.navigateBack();
                        }
                    });
                } else {
                    this.isSubmitting = false;
                    this.notificationService.success(resp.message);
                    this.navigateBack();
                }
            },
            error: (err) => {
                this.isSubmitting = false;
                this.notificationService.handleHttpError(err);
            }
        });
    }

    // --- Attachment ---

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        this.selectedFile = file;
        if (file) this.fileName = file.name;
    }

    removeAttachment(): void {
        this.form.get('attachment')?.setValue('');
        this.fileName = '';
        this.selectedFile = null;
        this.dbAttachmentId = null;
    }

    downloadAttachment(): void {
        if (this.dbAttachmentId) {
            this.attachmentService.download(this.dbAttachmentId, this.fileName);
        }
    }

    // --- Approval Actions ---

    approveRequest(): void {
        this.nzModal.create({
            nzTitle: 'Approve',
            nzContent: ApproveModalComponent,
            nzWidth: '30vw',
            nzData: { action: 'approve', title: 'Approve', data: this.requestData, page: 'approval' },
            nzFooter: null
        }).afterClose.subscribe(res => {
            if (res) this.navigateBack();
        });
    }

    rejectRequest(): void {
        this.nzModal.create({
            nzTitle: 'Reject',
            nzContent: ApproveModalComponent,
            nzWidth: '30vw',
            nzData: { action: 'reject', title: 'Reject', data: this.requestData, page: 'approval' },
            nzFooter: null
        }).afterClose.subscribe(res => {
            if (res) this.navigateBack();
        });
    }
}
