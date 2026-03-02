import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CentralUserAdminService } from '../central-user-admin.service';

interface ColumnDef {
    field: string;
    header: string;
    index: number;
}

@Component({
    standalone: false,
    selector: 'app-std-control-results',
    templateUrl: './std-control-results.component.html'
})
export class StdControlResultsComponent implements OnInit {

    columns: ColumnDef[] = [];
    data: any[] = [];
    loading = true;

    constructor(
        private adminService: CentralUserAdminService,
        @Inject(NZ_MODAL_DATA) public dialogData: { id: number; userId: number; columns: ColumnDef[] },
        public modal: NzModalRef
    ) {
        this.columns = this.dialogData.columns || [];
    }

    ngOnInit(): void {
        this.adminService.getSODControlDetails(this.dialogData.userId, this.dialogData.id).subscribe({
            next: (resp) => {
                if (resp.success && resp.data) {
                    const rawData = resp.data.aaData || resp.data.rows || resp.data || [];
                    // Transform array rows into objects using column definitions
                    this.data = rawData.map((row: any) => {
                        if (Array.isArray(row)) {
                            const obj: any = {};
                            this.columns.forEach((col, index) => {
                                obj[col.field] = row[index];
                            });
                            return obj;
                        }
                        return row;
                    });
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    copyToClipboard(): void {
        if (this.data.length === 0) return;

        const headers = this.columns.map(c => c.header);
        const rows = this.data.map(row =>
            this.columns.map(c => row[c.field] ?? '').join('\t')
        );
        const text = [headers.join('\t'), ...rows].join('\n');

        navigator.clipboard.writeText(text).catch(() => {});
    }
}
