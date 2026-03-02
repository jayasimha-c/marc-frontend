import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CentralUserAdminService, AggregatedUser } from '../central-user-admin.service';

export interface UserRoleComparisonDialogData {
    selectedUsers: AggregatedUser[];
}

@Component({
    standalone: false,
    selector: 'app-user-role-comparison',
    templateUrl: './user-role-comparison.component.html'
})
export class UserRoleComparisonComponent implements OnInit {

    loading = true;
    searchTerm = '';
    showDifferencesOnly = false;
    selectedSystem = '';
    dataSource: 'local' | 'realtime' = 'local';

    allData: any[] = [];
    filteredData: any[] = [];
    userFields: string[] = [];
    selectedUsers: AggregatedUser[] = [];

    constructor(
        private adminService: CentralUserAdminService,
        private message: NzMessageService,
        @Inject(NZ_MODAL_DATA) public dialogData: UserRoleComparisonDialogData,
        public modal: NzModalRef
    ) {
        this.selectedUsers = this.dialogData.selectedUsers || [];
        this.userFields = this.selectedUsers.map(u => u.sapBname);
    }

    get systems(): string[] {
        const systemSet = new Set<string>();
        this.allData.forEach(row => {
            if (row.system) systemSet.add(row.system);
        });
        return Array.from(systemSet).sort();
    }

    ngOnInit(): void {
        this.loadData();
    }

    onDataSourceChange(): void {
        this.loadData();
    }

    private loadData(): void {
        this.loading = true;
        this.allData = [];
        this.filteredData = [];

        const userIds = this.selectedUsers.map(u => u.identityId);

        this.adminService.compareUserRoles(userIds, this.dataSource === 'realtime').subscribe({
            next: (resp) => {
                const rowData: any[] = [];
                const rawRows = resp.data?.aaData || resp.data || [];
                rawRows.forEach((items: any) => {
                    if (Array.isArray(items)) {
                        const row: any = {};
                        row['system'] = items[0];
                        row['roleName'] = items[1];
                        this.userFields.forEach((field, index) => {
                            row[field] = items[index + 2];
                        });
                        rowData.push(row);
                    }
                });
                this.allData = rowData;
                this.applyFilters();
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.message.error('Failed to load role comparison data');
            }
        });
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    onFilterChange(): void {
        this.applyFilters();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.applyFilters();
    }

    private applyFilters(): void {
        let data = [...this.allData];

        if (this.selectedSystem) {
            data = data.filter(row => row.system === this.selectedSystem);
        }

        if (this.searchTerm?.trim()) {
            const term = this.searchTerm.toLowerCase().trim();
            data = data.filter(row => row.roleName?.toLowerCase().includes(term));
        }

        if (this.showDifferencesOnly) {
            data = data.filter(row => this.hasDifference(row));
        }

        this.filteredData = data;
    }

    private hasDifference(row: any): boolean {
        if (this.userFields.length < 2) return false;
        const firstValue = row[this.userFields[0]];
        for (let i = 1; i < this.userFields.length; i++) {
            if (row[this.userFields[i]] !== firstValue) return true;
        }
        return false;
    }

    isAssigned(value: any): boolean {
        return value === 'Y' || value === true;
    }

    copyDifferencesToClipboard(): void {
        const differences = this.allData.filter(row => this.hasDifference(row));

        if (differences.length === 0) {
            this.message.info('No differences found between selected users');
            return;
        }

        const headers = ['System', 'Role Name', ...this.userFields];
        const rows = differences.map(row =>
            [row.system, row.roleName, ...this.userFields.map(field => row[field])].join('\t')
        );
        const clipboardText = [headers.join('\t'), ...rows].join('\n');

        navigator.clipboard.writeText(clipboardText).then(() => {
            this.message.success(`${differences.length} difference(s) copied to clipboard`);
        }).catch(() => {
            this.message.error('Failed to copy to clipboard');
        });
    }
}
