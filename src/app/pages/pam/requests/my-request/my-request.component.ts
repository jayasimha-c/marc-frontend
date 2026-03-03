import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PaginationModel } from '../../../../core/models/pagination.model';
import { RequestService } from '../request.service';
import { ApiResponse } from '../../../../core/models/api-response';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { RequestMessageModalComponent } from '../../../../shared/components/request-message-modal/request-message-modal.component';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    standalone: false,
    selector: 'app-my-request',
    templateUrl: './my-request.component.html',
    styleUrls: ['./my-request.component.css']
})
export class MyRequestComponent implements OnInit {

    @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
    @ViewChild('operationsTpl', { static: true }) operationsTpl!: TemplateRef<any>;

    // Dashboard
    metrics = {
        totalRequests: 0,
        pendingCount: 0,
        approvedCount: 0,
        activeCount: 0,
        expiringSoonCount: 0,
        avgProcessingTime: 0
    };
    metricsLoading = false;

    // Table
    columns: TableColumn[] = [];
    tableActions: TableAction[] = [];
    tableData: any[] = [];
    totalRecords = 0;
    loading = false;
    pageSize = 10;
    pageIndex = 1;

    // Filter
    activeFilter = '';

    constructor(
        private router: Router,
        private nzModal: NzModalService,
        private requestService: RequestService,
        private notificationService: NotificationService,
        private confirmDialogService: ConfirmDialogService
    ) { }

    ngOnInit(): void {
        this.initTable();
        this.loadData();
        this.loadMetrics();
    }

    initTable(): void {
        this.columns = [
            { field: 'id', header: 'Request No', width: '100px', sortable: true },
            { field: 'system.privilegeId', header: 'Privilege ID' },
            { field: 'description', header: 'Description', ellipsis: true },
            { field: 'approverName', header: 'Approved By' },
            { field: 'requestDate', header: 'Request Date', width: '140px' },
            { field: 'system.sapName', header: 'System' },
            { field: 'validFrom', header: 'Valid From', width: '140px' },
            { field: 'validTo', header: 'Valid To', width: '140px' },
            { field: 'status', header: 'Status', type: 'template', templateRef: this.statusTpl, width: '120px' },
            { field: 'operations', header: 'Operations', type: 'template', templateRef: this.operationsTpl, width: '120px' }
        ];

        this.tableActions = [
            { label: 'New Request', icon: 'plus', type: 'primary', command: () => this.createRequest() }
        ];
    }

    loadMetrics(): void {
        this.metricsLoading = true;
        this.requestService.getMyRequestSummary().subscribe({
            next: (res: ApiResponse) => {
                if (res.success && res.data) {
                    this.metrics = { ...this.metrics, ...res.data };
                }
                this.metricsLoading = false;
            },
            error: () => { this.metricsLoading = false; }
        });
    }

    loadData(): void {
        this.loading = true;
        const pagination: PaginationModel = {
            first: (this.pageIndex - 1) * this.pageSize,
            rows: this.pageSize,
            sortField: '',
            sortOrder: 1,
            filters: {}
        };

        this.requestService.getRequests(pagination).subscribe({
            next: (res: ApiResponse) => {
                if (res.success && res.data) {
                    const content = res.data.page?.content || res.data.content || [];
                    this.tableData = content.map((row: any) => ({
                        ...row,
                        requestDate: this.formatEpoch(row.requestDate),
                        validFrom: this.formatEpoch(row.validFrom),
                        validTo: this.formatEpoch(row.validTo)
                    }));
                    this.totalRecords = res.data.page?.totalElements || res.data.totalElements || 0;
                }
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    onPageChange(params: any): void {
        this.pageIndex = params.pageIndex || 1;
        this.pageSize = params.pageSize || 10;
        this.loadData();
    }

    // Actions
    createRequest(): void {
        this.router.navigate(['/pam/requests/create-request']);
    }

    viewRequest(row: any): void {
        this.router.navigate(['/pam/requests/view-request', row.id]);
    }

    editRequest(row: any): void {
        this.router.navigate(['/pam/requests/edit-request', row.id]);
    }

    endRequest(row: any): void {
        this.confirmDialogService.confirm({
            title: 'End Request',
            message: `End privilege request #${row.id}?`
        }).subscribe(confirmed => {
            if (confirmed) {
                this.requestService.toEndRequest(row.id).subscribe({
                    next: (res: ApiResponse) => {
                        this.notificationService.show(res);
                        if (res.success) { this.loadData(); this.loadMetrics(); }
                    },
                    error: (err) => this.notificationService.handleHttpError(err)
                });
            }
        });
    }

    showMessage(row: any): void {
        if (row.message) {
            this.nzModal.create({
                nzContent: RequestMessageModalComponent,
                nzWidth: '40vw',
                nzData: { title: 'Request Message', status: row.status, message: row.message, statusClass: row.status },
                nzFooter: null
            });
        }
    }

    onMetricClick(type: string): void {
        this.activeFilter = this.activeFilter === type ? '' : type;
        this.loadData();
    }

    // Helpers
    private formatEpoch(value: any): string {
        if (!value) return '';
        let ts = value;
        if (typeof value === 'string') {
            ts = parseInt(value, 10);
            if (isNaN(ts)) return value;
        }
        const d = new Date(ts);
        const dd = ('0' + d.getDate()).slice(-2);
        const mm = ('0' + (d.getMonth() + 1)).slice(-2);
        const yyyy = d.getFullYear();
        const hh = ('0' + d.getHours()).slice(-2);
        const min = ('0' + d.getMinutes()).slice(-2);
        return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
    }

    canEdit(row: any): boolean {
        return ['New', 'Pending'].includes(row.status);
    }

    canEnd(row: any): boolean {
        return ['InUse', 'Approved', 'Active'].includes(row.status);
    }
}
