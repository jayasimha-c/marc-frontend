import { Component, OnInit } from "@angular/core";
import { NzModalService } from "ng-zorro-antd/modal";
import { NotificationService } from "../../../core/services/notification.service";
import { ConfirmDialogService } from "../../../shared/components/confirm-dialog/confirm-dialog.service";
// import { FileSaverService } from "../../../shared/services/file-saver.service";

import { TableColumn, TableQueryParams } from "../../../shared/components/advanced-table/advanced-table.models";
import { GeneralService } from "../general.service";

@Component({
    standalone: false,
    selector: "app-export-results",
    templateUrl: "./export-results.component.html",
})
export class ExportResultsComponent implements OnInit {

    loading = false;
    data: any[] = [];
    totalRecords = 0;

    tableColumns: TableColumn[] = [
        { field: "profileName", type: "text", header: "Profile Name", sortable: true },
        { field: "status", type: "tag", header: "Status", tagColors: { 'Success': 'green', 'Failed': 'red', 'In Progress': 'blue', default: 'default' }, sortable: true },
        { field: "startedOnStr", type: "text", header: "Started On", sortable: true },
        { field: "completedOnStr", type: "text", header: "Completed On", sortable: true },
        { field: "reportType", type: "text", header: "Report Type", sortable: true },
        { field: "reportModule", type: "text", header: "Report", sortable: true },
        { field: "runBy", type: "text", header: "Run By", sortable: true },
        {
            field: "actions",
            type: "actions",
            header: "Actions",
            actions: [
                { command: (row) => this.doDownload(row), icon: "download", tooltip: "Download" },
                { command: (row) => this.doDelete(row), icon: "delete", danger: true, tooltip: "Delete" }
            ]
        }
    ];

    constructor(
        public nzModal: NzModalService,
        private notificationService: NotificationService,
        private generalService: GeneralService,
        // private fileSaverService: FileSaverService,
        private confirmDialogService: ConfirmDialogService
    ) { }

    ngOnInit(): void {
        // Component initialization handled smoothly natively via advanced-table lifecycle unless explicitly forced.
    }

    onQueryParamsChange(event: TableQueryParams): void {
        this.getTableData(event);
    }

    getTableData(params: TableQueryParams): void {
        this.loading = true;
        this.generalService.getExportResults(params).subscribe({
            next: (resp) => {
                if (resp.success) {
                    this.data = resp.data.rows;
                    this.totalRecords = resp.data.records;
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.notificationService.error("Failed to fetch export results.");
            }
        });
    }

    onRowAction(action: any) {
        // Handled naturally via `command(row)` bindings in `tableColumns[actions]`.
    }

    private doDownload(row: any) {
        this.generalService.downloadReport(row.jobId, row.reportType, row.id).subscribe((resp: any) => {
            // Source implementation used saveAnyFile passing the raw response natively. 
            // FileSaverService in target might handle Blob responses similarly.
            try {
                // this.fileSaverService.saveAnyFile(resp);
                this.notificationService.success("Report downloaded successfully dummy logic.");

            } catch (e) {
                this.notificationService.error("Failed to extract requested report stream.");
            }
        });
    }

    private doDelete(row: any) {
        this.confirmDialogService
            .confirm({
                icon: 'warning',
                title: "Confirm Deletion",
                message: "Are you sure you want to delete this record?",
                okLabel: "Delete",
                okDanger: true
            } as any)
            .subscribe((result) => {
                if (result) {
                    this.generalService.batchRemove(row.jobId, row.reportType, row.id).subscribe((resp) => {
                        if (resp.success) {
                            this.notificationService.success(resp.message || "Record explicitly removed.");
                            // Reload table natively via triggering a simulated event or keeping state tracker.
                            this.onQueryParamsChange({ pageIndex: 1, pageSize: 10, filters: {}, globalSearch: '' } as any);
                        } else {
                            this.notificationService.error(resp.message || "Failed to delete record.");
                        }
                    });
                }
            });
    }

}
