import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CentralUsersService } from '../../../central-users.service';
import { TableColumn, TableQueryParams } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    standalone: false,
    selector: 'app-view-license-management',
    templateUrl: './view-license-management.component.html'
})
export class ViewLicenseManagementComponent implements OnInit {
    formType = '';
    licenseTypes: string[] = [];
    form: FormGroup;

    // Transactions table
    columns: TableColumn[] = [
        { field: 'txnId', header: 'Transaction' },
        { field: 'txnDesc', header: 'Description' },
        { field: 'txnDate', header: 'Last Used Date' },
        { field: '_count', header: 'Count' },
    ];
    data: any[] = [];
    total = 0;
    loading = false;

    constructor(
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        private fb: FormBuilder,
        private centralUsersService: CentralUsersService,
        public modal: NzModalRef
    ) {
        this.formType = dialogData.formType;
        this.form = this.fb.group({
            license: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        this.centralUsersService.getSysLicenseMgmt().subscribe((resp: any) => {
            if (resp.success && resp.data) {
                this.licenseTypes = Object.values(resp.data.licenseTypes || {}) as string[];
            }
        });

        if (this.formType === 'Transactions') {
            this.loadTransactions({ page: 1, size: 20, sortField: '', sortDirection: 'ASC', filters: [], globalFilter: '' });
        }
    }

    save(): void {
        this.form.markAllAsTouched();
        if (!this.form.valid) return;
        const ids = [this.dialogData.data.id];
        this.centralUsersService.changeLicType(ids, this.form.value.license).subscribe(() => {
            this.modal.close(true);
        });
    }

    loadTransactions(request: any): void {
        this.loading = true;
        this.centralUsersService.getTransactions(request, this.dialogData.data.id).subscribe({
            next: (resp: any) => {
                const txnColumns = ['txnId', 'txnDesc', 'txnDate', '_count'];
                this.total = resp.data?.records || 0;
                this.data = (resp.data?.rows || []).map((row: any[]) => {
                    const obj: any = {};
                    txnColumns.forEach((col, i) => obj[col] = row[i]);
                    return obj;
                });
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    onQueryParamsChange(params: TableQueryParams): void {
        this.loadTransactions({
            page: params.pageIndex,
            size: params.pageSize,
            sortField: params.sort?.field || '',
            sortDirection: params.sort?.direction === 'descend' ? 'DESC' : 'ASC',
            filters: [],
            globalFilter: params.globalSearch || ''
        });
    }
}
