import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { SetupService } from '../setup.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

export interface PamReasonRow {
    id?: number;
    userCode?: string;
    description?: string;
    modified?: boolean;
}

@Component({
    selector: 'app-pam-reason',
    templateUrl: './reason.component.html',
    styleUrls: ['./reason.component.scss'],
    standalone: false
})
export class PamReasonComponent implements OnInit {

    @ViewChild('userCodeTpl', { static: true }) userCodeTpl!: TemplateRef<any>;
    @ViewChild('descriptionTpl', { static: true }) descriptionTpl!: TemplateRef<any>;

    data: PamReasonRow[] = [];
    originalDataIds: number[] = [];
    loading = false;

    selectedRows: Set<any> = new Set();

    columns: TableColumn[] = [];
    tableActions: TableAction[] = [];

    constructor(
        private setupService: SetupService,
        private notificationService: NotificationService,
        private confirmDialogService: ConfirmDialogService
    ) { }

    ngOnInit(): void {
        this.initTable();
        this.loadData();
    }

    initTable(): void {
        this.columns = [
            { field: 'userCode', header: 'User Code', type: 'template', templateRef: this.userCodeTpl },
            { field: 'description', header: 'Description', type: 'template', templateRef: this.descriptionTpl }
        ];

        this.tableActions = [
            { label: 'Save', icon: 'save', type: 'primary', command: () => this.save() },
            { label: 'Add Row', icon: 'plus-circle', command: () => this.addRow() },
            { label: 'Delete', icon: 'delete', danger: true, command: () => this.deleteSelected() },
            { label: 'Cancel', icon: 'close-circle', command: () => this.cancel() }
        ];
    }

    loadData(): void {
        this.loading = true;
        this.setupService.getPamReason().subscribe({
            next: (res) => {
                if (res.success) {
                    this.data = (res.data || []).map((row: any) => ({ ...row, modified: false }));
                    this.originalDataIds = this.data.map(i => i.id).filter(id => id != null) as number[];
                }
                this.selectedRows.clear();
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    addRow(): void {
        this.data = [
            ...this.data,
            {
                userCode: '',
                description: '',
                modified: true
            }
        ];
    }

    markModified(row: PamReasonRow): void {
        row.modified = true;
    }

    save(): void {
        const newRecords = this.data
            .filter(i => (i.modified || (!i.id || !this.originalDataIds.includes(i.id))) && i.userCode && i.description)
            .map(i => ({
                // Intentionally matching original code which explicitly omitted the ID from the returned payload
                userCode: i.userCode,
                description: i.description
            }));

        if (newRecords.length === 0) {
            this.notificationService.info('No new valid or modified rows to save. Make sure User Code and Description are provided.');
            return;
        }

        this.loading = true;
        this.setupService.savePamReason(newRecords).subscribe({
            next: (res) => {
                if (res.success) {
                    this.notificationService.success('Reasons saved successfully');
                    this.loadData();
                } else {
                    this.notificationService.error(res.message || 'Error saving reasons');
                    this.loading = false;
                }
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    onSelectionChange(selectedIds: Set<any>): void {
        this.selectedRows = selectedIds;
    }

    deleteSelected(): void {
        if (this.selectedRows.size === 0) {
            this.notificationService.error('Please select at least one row to delete');
            return;
        }

        const selectedIdsArray = Array.from(this.selectedRows);
        const rowIdToDelete = selectedIdsArray.find(id => id);

        if (!rowIdToDelete) {
            this.data = this.data.filter(i => !this.selectedRows.has(i.id));
            this.selectedRows.clear();
            return;
        }

        this.confirmDialogService.confirm({
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this reason?'
        }).subscribe(confirmed => {
            if (confirmed && rowIdToDelete) {
                this.loading = true;
                this.setupService.deletePamReason(rowIdToDelete).subscribe({
                    next: (res) => {
                        if (res.success) {
                            this.notificationService.success('Reason deleted successfully');
                            this.loadData();
                        } else {
                            this.notificationService.error(res.message || 'Error deleting reason');
                            this.loading = false;
                        }
                    },
                    error: () => {
                        this.loading = false;
                    }
                });
            }
        });
    }

    cancel(): void {
        this.loadData();
    }

    onPaste(event: ClipboardEvent): void {
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
            return;
        }

        const pastedText = clipboardData.getData('text');
        if (!pastedText) {
            return;
        }

        if (!pastedText.includes('\t') && !pastedText.includes('\n')) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const rows = pastedText.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');

        if (rows.length === 0) {
            return;
        }

        const newEntries: PamReasonRow[] = [];

        for (const row of rows) {
            const columns = row.split('\t');

            // Expected mapping based on reason table layout:
            // [0] User Code
            // [1] Description

            if (columns.length > 0 && columns[0].trim() !== '') {
                newEntries.push({
                    userCode: columns[0] ? columns[0].trim() : '',
                    description: columns[1] ? columns[1].trim() : '',
                    modified: true
                });
            }
        }

        if (newEntries.length > 0) {
            this.data = [...this.data, ...newEntries];
            this.notificationService.success(`Pasted ${newEntries.length} reason rows successfully.`);
        } else {
            this.notificationService.info('No valid rows found in clipboard data to paste.');
        }
    }
}
