import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { SetupService } from '../setup.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

export interface ReviewRuleRow {
    id?: number;
    entryId?: string;
    objclass?: string;
    objid?: string;
    updatetype?: string;
    tabname?: string;
    fname?: string;
    condition?: string;
    modified?: boolean;
}

@Component({
    selector: 'app-pam-review-rule',
    templateUrl: './review-rule.component.html',
    styleUrls: ['./review-rule.component.scss'],
    standalone: false
})
export class ReviewRuleComponent implements OnInit {

    @ViewChild('transactionTpl', { static: true }) transactionTpl!: TemplateRef<any>;
    @ViewChild('objectValueTpl', { static: true }) objectValueTpl!: TemplateRef<any>;
    @ViewChild('changeTypeTpl', { static: true }) changeTypeTpl!: TemplateRef<any>;
    @ViewChild('tableNameTpl', { static: true }) tableNameTpl!: TemplateRef<any>;
    @ViewChild('fieldNameTpl', { static: true }) fieldNameTpl!: TemplateRef<any>;
    @ViewChild('conditionTpl', { static: true }) conditionTpl!: TemplateRef<any>;

    data: ReviewRuleRow[] = [];
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
            { field: 'entryId', header: 'Transaction', type: 'template', templateRef: this.transactionTpl },
            { field: 'objid', header: 'Object Value', type: 'template', templateRef: this.objectValueTpl },
            { field: 'updatetype', header: 'Change Type', type: 'template', templateRef: this.changeTypeTpl },
            { field: 'tabname', header: 'Table Name', type: 'template', templateRef: this.tableNameTpl },
            { field: 'fname', header: 'Field Name', type: 'template', templateRef: this.fieldNameTpl },
            { field: 'condition', header: 'Condition', type: 'template', templateRef: this.conditionTpl },
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
        this.setupService.getReviewRule().subscribe({
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
                entryId: '',
                objid: '',
                updatetype: '',
                tabname: '',
                fname: '',
                condition: '',
                modified: true
            }
        ];
    }

    markModified(row: ReviewRuleRow): void {
        row.modified = true;
    }

    save(): void {
        const newRecords = this.data
            .filter(i => (i.modified || (!i.id || !this.originalDataIds.includes(i.id))) && i.entryId && i.tabname)
            .map(i => ({
                id: i.id, // Include ID if it exists so backend can update if supported (though original code excluded it for some reason during save payloads) 
                entryId: i.entryId,
                tabname: i.tabname,
                fname: i.fname,
                objclass: i.objclass || '',
                objid: i.objid,
                condition: i.condition,
                updatetype: i.updatetype
            }));

        if (newRecords.length === 0) {
            this.notificationService.info('No new valid or modified rows to save. Make sure Transaction and Table Name are provided.');
            return;
        }

        this.loading = true;
        this.setupService.saveReviewRule(newRecords).subscribe({
            next: (res) => {
                if (res.success) {
                    this.notificationService.success('Rules saved successfully');
                    this.loadData();
                } else {
                    this.notificationService.error(res.message || 'Error saving rules');
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

        // Deleting the first selected row with an ID which respects original code logic
        const selectedIdsArray = Array.from(this.selectedRows);
        const rowIdToDelete = selectedIdsArray.find(id => id); // get truthy ID

        if (!rowIdToDelete) {
            // Just an unsaved row, remove locally
            this.data = this.data.filter(i => !this.selectedRows.has(i.id));
            this.selectedRows.clear();
            return;
        }

        this.confirmDialogService.confirm({
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this item?'
        }).subscribe(confirmed => {
            if (confirmed && rowIdToDelete) {
                this.loading = true;
                this.setupService.deleteReviewRule(rowIdToDelete).subscribe({
                    next: (res) => {
                        if (res.success) {
                            this.notificationService.success('Rule deleted successfully');
                            this.loadData();
                        } else {
                            this.notificationService.error(res.message || 'Error deleting rule');
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

        // Check if there are tabs or newlines indicating copied Excel data
        if (!pastedText.includes('\t') && !pastedText.includes('\n')) {
            // Let normal single-cell pasting behavior occur
            return;
        }

        // It is Excel/Grid data! Prevent default pasting into the current selected input box.
        event.preventDefault();
        event.stopPropagation();

        // Parse TSV (Tab-Separated Values) commonly generated when copying from Excel
        const rows = pastedText.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');

        if (rows.length === 0) {
            return;
        }

        const newEntries: ReviewRuleRow[] = [];

        for (const row of rows) {
            const columns = row.split('\t');

            // Expected mapping based on table layout:
            // [0] Transaction (entryId)
            // [1] Object Value (objid)
            // [2] Change Type (updatetype)
            // [3] Table Name (tabname)
            // [4] Field Name (fname)
            // [5] Condition (condition)

            // Only add if we have at least Transaction (minimum valid)
            if (columns.length > 0 && columns[0].trim() !== '') {
                newEntries.push({
                    entryId: columns[0] ? columns[0].trim() : '',
                    objid: columns[1] ? columns[1].trim() : '',
                    updatetype: columns[2] ? columns[2].trim() : '',
                    tabname: columns[3] ? columns[3].trim() : '',
                    fname: columns[4] ? columns[4].trim() : '',
                    condition: columns[5] ? columns[5].trim() : '',
                    modified: true
                });
            }
        }

        if (newEntries.length > 0) {
            // Append new entries to existing data
            this.data = [...this.data, ...newEntries];
            this.notificationService.success(`Pasted ${newEntries.length} rows successfully.`);
        } else {
            this.notificationService.info('No valid rows found in clipboard data to paste.');
        }
    }
}

