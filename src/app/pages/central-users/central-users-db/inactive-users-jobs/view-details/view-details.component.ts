import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { CentralUsersService } from '../../../central-users.service';

@Component({
    standalone: false,
    selector: 'app-view-details',
    templateUrl: './view-details.component.html',
})
export class InactiveUsersJobsViewDetailsComponent implements OnInit {
    data: any[] = [];
    totalRecords = 0;
    loading = false;
    pageIndex = 1;
    pageSize = 10;

    constructor(
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        public modal: NzModalRef,
        private centralUsersService: CentralUsersService,
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        const request = {
            page: this.pageIndex,
            size: this.pageSize,
            sortField: '',
            sortDirection: 'ASC',
            filters: [],
            globalFilter: '',
        };

        this.centralUsersService.getInactiveUserData(request, this.dialogData.id).subscribe({
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
        this.loadData();
    }
}
