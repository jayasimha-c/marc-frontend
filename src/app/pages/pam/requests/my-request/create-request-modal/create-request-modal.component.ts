import { Component, OnInit, Optional, Inject, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { RequestService } from "../../request.service";
import { ApiResponse } from "../../../../../core/models/api-response";
import { NotificationService } from "../../../../../core/services/notification.service";
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { ApproveModalComponent } from "../../my-approval/approve-modal.component";
import { AdvancedTableComponent } from "../../../../../shared/components/advanced-table/advanced-table.component";
import { PaginationModel } from "../../../../../core/models/pagination.model";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { AttachmentService } from "../../../../../core/services/attachment.service";

@Component({
    standalone: false,
    selector: "app-create-request-modal",
    templateUrl: "./create-request-modal.component.html",
    styleUrls: ["./create-request-modal.component.scss"]
})
export class CreateRequestModalComponent implements OnInit {
    @ViewChild('txnGrid') txnGrid!: AdvancedTableComponent;

    public sapSystemList: any[] = [];
    public privIDList: any[] = [];
    public reasonList: any[] = [];
    public fileName: string = '';
    public action: string = '';
    public requestId: number | null = null;
    public requestData: any = null;

    private selectedFile: File | null = null;
    public dbAttachmentId: number | null = null;
    public isFullPage: boolean = false;

    public durationOptions = [
        { value: '1', label: '1 Hour' },
        { value: '2', label: '2 Hours' },
        { value: '4', label: '4 Hours' },
        { value: '8', label: '8 Hours' },
        { value: '24', label: '24 Hours' },
        { value: 'custom', label: 'Custom' }
    ];

    public ticketIntegrationEnabled = false;
    public globalTicketIntegrationEnabled = false;
    public ticketIntegrationType = 'ServiceNow';
    public ticketValidating = false;
    public ticketValidated = false;
    public isSubmitting = false;

    public form: FormGroup;
    public table2: any;

    constructor(
        @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
        @Optional() public modal: NzModalRef,
        private formBuilder: FormBuilder,
        private _requestService: RequestService,
        private notificationService: NotificationService,
        private nzModal: NzModalService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private attachmentService: AttachmentService
    ) {
        this.form = this.formBuilder.group({
            status: [""],
            sapSystem: ["", [Validators.required]],
            privID: ["", [Validators.required]],
            validFrom: ["", [Validators.required]],
            duration: ["", [Validators.required]],
            validTo: [{ value: "", disabled: true }],
            reason: ["", [Validators.required]],
            justification: ["", [Validators.required]],
            attachment: [""],
            requesterName: [""],
            requestDate: [""],
            ticketNumber: [{ value: "", disabled: false }]
        });

        this.isFullPage = !this.dialogData;

        if (this.isFullPage) {
            const url = this.router.url;
            if (url.includes('create-request')) {
                this.action = 'new';
            } else if (url.includes('edit-request')) {
                this.action = 'edit';
            } else if (url.includes('view-request')) {
                this.action = 'view';
            }
            this.route.params.subscribe(params => {
                if (params['id']) {
                    this.requestId = parseInt(params['id'], 10);
                    this._loadRequestData(this.requestId);
                }
            });
        } else {
            this.action = this.dialogData?.action || 'new';
            if (this.dialogData?.data) {
                this.requestData = this.dialogData.data;
                this.requestId = this.dialogData.data.id;
            }
        }

        this._getInfo();
        this._loadTicketIntegrationSettings();
        this.initTxnGrid();

        if (this.requestData && (this.action == 'edit' || this.action == "view" || this.action == "approval-view")) {
            this._populateFormWithData(this.requestData);
        }
    }

    private initTxnGrid(): void {
        const isReadOnly = this.action == "view" || this.action == "approval-view";
        this.table2 = {
            column: [
                { field: "txn", header: "TXN", type: "text", editable: !isReadOnly, readOnly: isReadOnly },
                { field: "note", header: "Notes", type: "text", editable: !isReadOnly, readOnly: isReadOnly }
            ],
            data: []
        };
    }

    private _loadRequestData(id: number): void {
        this._requestService.toEditRequest(id).subscribe((resp: ApiResponse) => {
            if (resp.success && resp.data) {
                this.requestData = resp.data.req;
                this.fileName = resp.data.filename || '';
                this._populateFormWithData(this.requestData);
                this.initTxnGrid();
                this._loadDbAttachment(id);
            }
        });
    }

    private _loadDbAttachment(requestId: number): void {
        this.attachmentService.listByEntity('PRIVILEGE_REQUEST', requestId).subscribe(
            (response: any) => {
                if (response.success && response.data && response.data.length > 0) {
                    this.dbAttachmentId = response.data[0].id;
                    if (!this.fileName) {
                        this.fileName = response.data[0].originalName;
                    }
                }
            }
        );
    }

    private _populateFormWithData(data: any): void {
        const validFrom = data.validFrom ? new Date(data.validFrom) : null;
        const validTo = data.validTo ? new Date(data.validTo) : null;
        let durationValue = 'custom';

        if (validFrom && validTo) {
            const diffMs = validTo.getTime() - validFrom.getTime();
            const hours = Math.round(diffMs / (1000 * 60 * 60));
            if ([1, 2, 4, 8, 24].includes(hours)) durationValue = hours.toString();
        }

        this.form.patchValue({
            status: data.status,
            sapSystem: data.system?.sapId,
            privID: data.system?.privilegeId,
            validFrom: validFrom,
            validTo: validTo,
            duration: durationValue,
            reason: data.reason?.id,
            justification: data.justification,
            attachment: data.attachment,
            requesterName: data.requesterName,
            requestDate: data.requestDate ? new Date(parseInt(data.requestDate)).toISOString() : null,
            ticketNumber: data.ticketNumber || ''
        });

        this.getRequestsTxn(data.id);

        if (this.action == "view" || this.action == "approval-view") {
            this.form.disable();
        }

        if (data.system?.sapId) {
            this.onSystemChange(data.system.sapId);
        }
    }

    ngOnInit(): void {
        if (!this.action || this.action === 'new') {
            const defaultValidFrom = new Date();
            defaultValidFrom.setMinutes(defaultValidFrom.getMinutes() + 2);
            this.form.patchValue({ validFrom: defaultValidFrom });
            this.table2.data = [{ txn: '', note: '' }];
        }

        this.form.get('duration')?.valueChanges.subscribe(dur => this.updateValidTo());
        this.form.get('validFrom')?.valueChanges.subscribe(() => {
            if (this.form.get('duration')?.value !== 'custom') this.updateValidTo();
        });
    }

    public navigateBack(): void {
        if (this.isFullPage) this.location.back();
        else this.modal.close(false);
    }

    private _loadTicketIntegrationSettings(): void {
        this._requestService.getPamIntegrationSettings().subscribe(
            (resp: ApiResponse) => {
                if (resp.success && resp.data) {
                    this.globalTicketIntegrationEnabled = resp.data.enabled || false;
                    this.ticketIntegrationType = resp.data.integrationType || 'ServiceNow';
                    this._updateTicketRequirement();
                }
            }
        );

        this.form.get('privID')?.valueChanges.subscribe(() => this._updateTicketRequirement());
    }

    private _updateTicketRequirement(): void {
        const selectedPrivId = this.form.get('privID')?.value;
        let privilegeRequiresTicket = false;

        if (selectedPrivId && this.privIDList?.length) {
            const selectedPriv = this.privIDList.find(p => p?.id === selectedPrivId);
            privilegeRequiresTicket = selectedPriv?.setting?.ticketValidate || false;
        }

        this.ticketIntegrationEnabled = this.globalTicketIntegrationEnabled && privilegeRequiresTicket;

        if (this.ticketIntegrationEnabled && this.action !== 'view' && this.action !== 'approval-view') {
            this.form.get('ticketNumber')?.setValidators([Validators.required]);
        } else {
            this.form.get('ticketNumber')?.clearValidators();
        }
        this.form.get('ticketNumber')?.updateValueAndValidity();
        this.ticketValidated = false;
    }

    public updateValidTo(): void {
        const duration = this.form.get('duration')?.value;
        const validFrom = this.form.get('validFrom')?.value;

        if (duration && duration !== 'custom' && validFrom) {
            const validTo = new Date(validFrom);
            validTo.setHours(validTo.getHours() + parseInt(duration, 10));
            this.form.patchValue({ validTo: validTo }, { emitEvent: false });
        }
    }

    public isCustomDuration(): boolean {
        return this.form.get('duration')?.value === 'custom';
    }

    private validateTicketAsync(): Promise<boolean> {
        return new Promise((resolve) => {
            const tk = this.form.get('ticketNumber')?.value;
            if (!tk || tk.trim() === '') {
                this.notificationService.error('Please enter a ticket number');
                return resolve(false);
            }
            this.ticketValidating = true;
            this._requestService.validateTicket(tk, this.ticketIntegrationType).subscribe(
                (resp: ApiResponse) => {
                    this.ticketValidating = false;
                    if (resp.success && resp.data) {
                        this.ticketValidated = true;
                        resolve(true);
                    } else {
                        this.notificationService.error(resp.message || 'Validation failed');
                        resolve(false);
                    }
                },
                error => {
                    this.ticketValidating = false;
                    resolve(false);
                }
            );
        });
    }

    private _getInfo() {
        this._requestService.getInfoForRequests().subscribe((resp: ApiResponse) => {
            this.sapSystemList = resp.data.sys || [];
            if (!this.requestData?.system?.sapId) this.privIDList = resp.data.priv || [];
            this.reasonList = resp.data.reasons || [];
        });
    }

    public onSystemChange(value: string) {
        this._requestService.getPrivilegesForRequests(value).subscribe((resp: ApiResponse) => {
            this.privIDList = resp.data || [];
            this._updateTicketRequirement();
        });
    }

    public async sendRequest() {
        this.form.markAllAsTouched();
        if (!this.form.valid) return;

        this.isSubmitting = true;

        if (this.ticketIntegrationEnabled) {
            const isTkValid = await this.validateTicketAsync();
            if (!isTkValid) {
                this.isSubmitting = false;
                return;
            }
        }

        let txnList = this.table2.data.filter((row: any) => row?.txn && row.txn.toString().trim() !== '');

        const payload: any = {
            sapId: this.form.get("sapSystem")?.value,
            privilegeId: this.form.get("privID")?.value,
            validFrom: this.form.get("validFrom")?.value,
            validTo: this.form.get("validTo")?.value,
            reasonId: this.form.get("reason")?.value,
            justification: this.form.get("justification")?.value,
            attachment: this.form.get("attachment")?.value,
            ticketNumber: this.form.get("ticketNumber")?.value || null,
            txnList: txnList,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        let request = this._requestService.sendRequest(payload);
        if (this.action == 'edit' && this.requestId) {
            payload.id = this.requestId;
            request = this._requestService.updateRequest(payload);
        }

        request.subscribe((resp: ApiResponse) => {
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
        });
    }

    public getRequestsTxn(id: number): void {
        this._requestService.getRequestsTxn(id).subscribe((resp: ApiResponse) => {
            this.table2.data = resp.data.rows || [];
        });
    }

    public addNewRow(): void {
        this.table2.data = [...this.table2.data, { txn: '', note: '' }];
    }

    public onFileSelected(event: any) {
        const file = event.target.files[0];
        this.selectedFile = file;
        if (file) {
            this.fileName = file.name;
        }
    }

    public removeAttachment(): void {
        this.form.get('attachment')?.setValue('');
        this.fileName = '';
        this.selectedFile = null;
        this.dbAttachmentId = null;
    }

    public approveRequest() {
        this.nzModal.create({
            nzTitle: 'Approve',
            nzContent: ApproveModalComponent,
            nzWidth: '30vw',
            nzData: { action: 'approve', title: 'Approve', data: this.requestData, page: 'approval' },
            nzFooter: null
        }).afterClose.subscribe((res) => {
            if (res) this.navigateBack();
        });
    }

    public rejectRequest() {
        this.nzModal.create({
            nzTitle: 'Reject',
            nzContent: ApproveModalComponent,
            nzWidth: '30vw',
            nzData: { action: 'reject', title: 'Reject', data: this.requestData, page: 'approval' },
            nzFooter: null
        }).afterClose.subscribe((res) => {
            if (res) this.navigateBack();
        });
    }

    public getPageTitle(): string {
        switch (this.action) {
            case 'view': return 'View Privilege Request';
            case 'edit': return 'Edit Privilege Request';
            case 'approval-view': return 'Review Privilege Request';
            default: return 'New Privilege Request';
        }
    }

    public downloadAttachment(): void {
        if (this.dbAttachmentId) {
            this.attachmentService.download(this.dbAttachmentId, this.fileName);
        }
    }
}
