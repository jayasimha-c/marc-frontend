import { Component, Inject, OnInit } from "@angular/core";
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { NotificationService } from "../../../../../core/services/notification.service";
import { RequestService } from "../../../requests/request.service";
import { ApproveModalComponent } from "../../../requests/my-approval/approve-modal.component";
import { ApiResponse } from "../../../../../core/models/api-response";

@Component({
    standalone: false,
    selector: "view-request-detail",
    templateUrl: "./view-txn-log.component.html",
})
export class ViewTxnLogComponent implements OnInit {

    public riskTableColumns = [
        { field: "riskName", type: "text", header: "Risk Name" },
        { field: "riskDesc", type: "text", header: "Risk Description" },
        { field: "ruleName", type: "text", header: "Rule Name" },
        { field: "tcodes", type: "text", header: "Transaction" }
    ];

    public transactionTableColumns = [
        { field: "privilegeId", type: "text", header: "Privilege ID" },
        { field: "startDate", type: "time", header: "Date" },
        { field: "entryId", type: "text", header: "Transaction" },
        { field: "txnType", type: "text", header: "Type" },
        { field: "decription", type: "text", header: "Description" }
    ];

    public reviewTableColumns = [
        { field: "requesterName", type: "text", header: "Requested By" },
        { field: "justification", type: "text", header: "Justification" },
        { field: "approverName", type: "text", header: "Approved By" },
        { field: "comments", type: "text", header: "Approver Comment" }
    ];

    public reviewTableData: any[] = [];
    public transactionTableData: any[] = [];
    public riskTableData: any[] = [];

    public actionBtnList: any[] = [];

    constructor(
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        private nzModalService: NzModalService,
        public modal: NzModalRef,
        private _requestService: RequestService,
        private notificationService: NotificationService
    ) { }

    public ngOnInit(): void {
        this._getTableData();
        this.actionBtnList = this.getActionList();
    }

    public onClickOfActionMenu(action: string): void {
        if (action == 'excel') {
            let privilegeId = this.dialogData?.rowData?.system?.privilegeId;
            if (!privilegeId) {
                privilegeId = "txnLog";
            }
            this._requestService.exportTxnLogs(this.dialogData?.rowData?.id).subscribe((resp: any) => {
                const blob = new Blob([resp.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                this.saveFileLocally(blob, `${privilegeId}.xlsx`);
                this.notificationService.success("Successfully downloaded Transaction Logs");
            });
        } else if (action == 'approve' || action == 'reject') {
            this.nzModalService.create({
                nzTitle: action == 'approve' ? 'Approve' : 'Reject',
                nzContent: ApproveModalComponent,
                nzWidth: '30vw',
                nzClassName: 'updated-modal',
                nzData: {
                    action: action,
                    title: action == 'approve' ? 'Approve' : 'Reject',
                    data: this.dialogData.rowData,
                    page: 'reviewPage'
                },
                nzFooter: null,
            }).afterClose.subscribe((resp) => {
                if (resp) {
                    this.modal.close(true);
                }
            });
        }
    }

    private _getTableData() {
        this._requestService.getTxnLogs(this.dialogData?.rowData?.id).subscribe((resp: ApiResponse) => {
            if (resp && resp.data) {
                this.reviewTableData = resp.data.request ? [resp.data.request] : [];
                this.transactionTableData = resp.data.reports || [];
                this.riskTableData = resp.data.risks || [];
            }
        });
    }

    getActionList() {
        if (this.dialogData.page == 'reviewPage' && this.dialogData.rowData.status == 'Expired') {
            return [
                {
                    label: "Approve",
                    command: () => this.onClickOfActionMenu("approve"),
                },
                {
                    label: "Reject",
                    command: () => this.onClickOfActionMenu("reject"),
                },
                {
                    label: "Export To Excel",
                    command: () => this.onClickOfActionMenu("excel"),
                },
            ];
        } else {
            return [
                {
                    label: "Export To Excel",
                    command: () => this.onClickOfActionMenu("excel"),
                },
            ];
        }
    }

    /**
     * Native DOM trigger to circumvent file-saver
     */
    private saveFileLocally(blob: Blob, fileName: string): void {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
    }
}
