import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { CentralUsersService } from '../../central-users.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { InactiveUsersJobsViewDetailsComponent } from './view-details/view-details.component';

@Component({
    standalone: false,
    selector: 'app-inactive-users-jobs',
    templateUrl: './inactive-users-jobs.component.html',
})
export class InactiveUsersJobsComponent implements OnInit {
    data: any[] = [];
    totalRecords = 0;
    loading = false;
    selectedRow: any = null;
    pageIndex = 1;
    pageSize = 10;
    sortField = 'startedOnStr';
    sortOrder = 'descend';

    constructor(
        private centralUsersService: CentralUsersService,
        private nzModal: NzModalService,
        private notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        const request = {
            page: this.pageIndex,
            size: this.pageSize,
            sortField: this.sortField || 'startedOnStr',
            sortDirection: this.sortOrder === 'ascend' ? 'ASC' : 'DESC',
            filters: [],
            globalFilter: '',
        };

        this.centralUsersService.getCULockJobs(request).subscribe({
            next: (resp: any) => {
                if (resp.success && resp.data) {
                    this.data = resp.data.rows || [];
                    this.totalRecords = resp.data.records || 0;
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            },
        });
    }

    onQueryParamsChange(params: NzTableQueryParams): void {
        this.pageIndex = params.pageIndex;
        this.pageSize = params.pageSize;
        const currentSort = params.sort.find(item => item.value !== null);
        this.sortField = currentSort?.key || 'startedOnStr';
        this.sortOrder = currentSort?.value || 'descend';
        this.loadData();
    }

    runSimulation(): void {
        this.nzModal.confirm({
            nzTitle: 'Run Simulation',
            nzContent: 'Please confirm to run the job?',
            nzOnOk: () => {
                this.centralUsersService.checkOtherJobRunning().subscribe((resp: any) => {
                    if (resp.success) {
                        this.centralUsersService.runSimulation().subscribe((res: any) => {
                            this.notificationService.show(res);
                            this.loadData();
                        });
                    } else {
                        this.notificationService.show(resp);
                    }
                });
            },
        });
    }

    viewResults(): void {
        if (!this.selectedRow) {
            this.notificationService.error('Please select a row');
            return;
        }

        this.nzModal.create({
            nzTitle: 'Inactive User Details',
            nzContent: InactiveUsersJobsViewDetailsComponent,
            nzWidth: '90vw',
            nzData: { id: this.selectedRow.id },
            nzFooter: null,
            nzClassName: 'updated-modal',
        });
    }

    deleteJob(): void {
        if (!this.selectedRow) {
            this.notificationService.error('Please select a row');
            return;
        }

        this.nzModal.confirm({
            nzTitle: 'Delete',
            nzContent: 'Please Confirm Before Deleting.',
            nzOkDanger: true,
            nzOnOk: () => {
                this.centralUsersService.deleteCUJobs(this.selectedRow.id).subscribe((resp: any) => {
                    this.notificationService.show(resp);
                    this.selectedRow = null;
                    this.loadData();
                });
            },
        });
    }

    getStatusColor(status: string): string {
        if (!status) {
            return 'default';
        }

        switch (status.toUpperCase()) {
            case 'COMPLETED':
                return 'green';
            case 'RUNNING':
            case 'IN_PROGRESS':
                return 'blue';
            case 'FAILED':
            case 'ERROR':
                return 'red';
            default:
                return 'default';
        }
    }
}
