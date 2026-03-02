import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SetupService } from '../../setup.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction } from '../../../../../shared/components/advanced-table/advanced-table.models';
import { CreateSchedulersComponent } from './create-schedulers/create-schedulers.component';

@Component({
    selector: 'app-pam-schedulers',
    templateUrl: './schedulers.component.html',
    standalone: false
})
export class PamSchedulersComponent implements OnInit {

    @ViewChild('sapNamesTpl', { static: true }) sapNamesTpl!: TemplateRef<any>;
    @ViewChild('operationsTpl', { static: true }) operationsTpl!: TemplateRef<any>;

    sapSystemList: any[] = [];
    data: any[] = [];
    loading = false;
    totalRecords = 0;
    pageSize = 10;
    pageIndex = 1;

    columns: TableColumn[] = [];
    tableActions: TableAction[] = [];

    constructor(
        private setupService: SetupService,
        private nzModal: NzModalService,
        private notificationService: NotificationService,
        private confirmDialogService: ConfirmDialogService
    ) { }

    ngOnInit(): void {
        this.initTable();
        this.loadData();
    }

    initTable(): void {
        this.columns = [
            { field: 'sapNames', header: 'Sap system', type: 'template', templateRef: this.sapNamesTpl },
            { field: 'startDate', header: 'Start Time', type: 'date' },
            { field: 'endDate', header: 'End Time', type: 'date' },
            { field: 'lastExecutionTime', header: 'Execution Time', type: 'date' },
            { field: 'nextExecutionTime', header: 'Next Execution Time', type: 'date' },
            { field: 'operations', header: 'Operations', type: 'template', templateRef: this.operationsTpl }
        ];

        this.tableActions = [
            { label: 'Create', icon: 'plus-circle', type: 'primary', command: () => this.openCreateModal() }
        ];
    }

    loadData(): void {
        this.loading = true;
        this.setupService.getPrivSchedule().subscribe({
            next: (res: any) => {
                if (res && res.data) {
                    this.sapSystemList = res.data.saps || [];

                    this.data = (res.data.list || []).map((i: any) => {
                        if (!i) return { sapNames: '' };
                        const sapIds = Array.isArray(i.sapIds) ? i.sapIds : [];
                        const sapNames = sapIds.map(s => {
                            const sys = this.sapSystemList.find(j => Number(j.id) === Number(s));
                            return sys?.destinationName || `Unknown(${s})`;
                        }).join(', ');
                        return { ...i, sapNames };
                    });

                    this.totalRecords = res.data.list?.length || 0;
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    onPageIndexChange(index: number): void {
        this.pageIndex = index;
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.pageIndex = 1;
    }

    openCreateModal(): void {
        this.nzModal.create({
            nzTitle: 'Create Scheduler',
            nzContent: CreateSchedulersComponent,
            nzWidth: '700px',
            nzFooter: null,
            nzData: { sapSystem: this.sapSystemList }
        }).afterClose.subscribe((res) => {
            if (res) this.loadData();
        });
    }

    openDetail(action: string, row: any): void {
        if (action === 'edit') {
            this.nzModal.create({
                nzTitle: 'Edit Scheduler',
                nzContent: CreateSchedulersComponent,
                nzWidth: '700px',
                nzFooter: null,
                nzData: { formType: 'Edit', sapSystem: this.sapSystemList, data: row }
            }).afterClose.subscribe((res) => {
                if (res) this.loadData();
            });
        } else if (action === 'delete') {
            this.confirmDialogService.confirm({
                title: 'Confirm Delete',
                message: 'Are you sure you want to delete this scheduler?'
            }).subscribe(confirmed => {
                if (confirmed) {
                    this.setupService.deletePrivSchedule(row.id).subscribe({
                        next: (resp: any) => {
                            this.notificationService.success(resp.message || 'Deleted successfully');
                            this.loadData();
                        },
                        error: (err: any) => {
                            this.notificationService.error(err.error?.message || 'Error deleting scheduler');
                        }
                    });
                }
            });
        }
    }
}
