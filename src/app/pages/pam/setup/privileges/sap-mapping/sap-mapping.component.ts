import { Component, Inject, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { SetupService } from '../../setup.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction } from '../../../../../shared/components/advanced-table/advanced-table.models';
import { AddSapMappingComponent } from './add-sap-mapping/add-sap-mapping.component';

@Component({
    selector: 'app-sap-mapping',
    templateUrl: './sap-mapping.component.html',
    standalone: false
})
export class SapMappingComponent implements OnInit {

    @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
    @ViewChild('operationsTpl', { static: true }) operationsTpl!: TemplateRef<any>;

    privilegeId = '';
    sapSysList: any[] = [];
    data: any[] = [];
    loading = false;

    columns: TableColumn[] = [];
    tableActions: TableAction[] = [];

    constructor(
        public modal: NzModalRef,
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        private nzModal: NzModalService,
        private setupService: SetupService,
        private notificationService: NotificationService,
        private confirmDialogService: ConfirmDialogService
    ) { }

    ngOnInit(): void {
        this.privilegeId = this.dialogData?.data?.id || '';
        this.initTable();
        this.loadData();
    }

    initTable(): void {
        this.columns = [
            { field: 'sapName', header: 'SAP System' },
            { field: 'notes', header: 'Notes' },
            { field: 'active', header: 'Status', type: 'template', templateRef: this.statusTpl },
            { field: 'operations', header: 'Operations', type: 'template', templateRef: this.operationsTpl, width: '200px' }
        ];

        this.tableActions = [
            { label: 'Add Mapping', icon: 'plus-circle', type: 'primary', command: () => this.openAddMapping() }
        ];
    }

    loadData(): void {
        this.loading = true;
        this.setupService.getSapMapping(this.privilegeId).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.sapSysList = res.data.saps || [];
                    this.data = res.data.privMappings || [];
                }
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    openAddMapping(): void {
        this.nzModal.create({
            nzTitle: 'Add SAP Mapping',
            nzContent: AddSapMappingComponent,
            nzWidth: '500px',
            nzFooter: null,
            nzData: { privilegeId: this.privilegeId, sapSystems: this.sapSysList }
        }).afterClose.subscribe(res => { if (res) this.loadData(); });
    }

    editMapping(row: any): void {
        this.nzModal.create({
            nzTitle: 'Edit SAP Mapping',
            nzContent: AddSapMappingComponent,
            nzWidth: '500px',
            nzFooter: null,
            nzData: { formType: 'Edit', sapSystems: this.sapSysList, data: row }
        }).afterClose.subscribe(res => { if (res) this.loadData(); });
    }

    deleteMapping(row: any): void {
        this.confirmDialogService.confirm({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete mapping for "${row.sapName}"?`
        }).subscribe(confirmed => {
            if (confirmed) {
                this.setupService.deleteMapping(row.id).subscribe({
                    next: (res) => {
                        this.notificationService.show(res);
                        if (res.success) this.loadData();
                    },
                    error: (err) => this.notificationService.handleHttpError(err)
                });
            }
        });
    }

    switchStatus(row: any): void {
        this.setupService.mappingSwitchStatus(row.id).subscribe({
            next: (res) => {
                this.notificationService.show(res);
                if (res.success) this.loadData();
            },
            error: (err) => this.notificationService.handleHttpError(err)
        });
    }
}
