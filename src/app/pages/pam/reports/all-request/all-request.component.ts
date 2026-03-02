import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { NzModalService } from "ng-zorro-antd/modal";
import { RequestService } from "../../requests/request.service";
import { PaginationModel } from "../../../../core/models/pagination.model";
import { CreateRequestModalComponent } from "../../requests/my-request/create-request-modal/create-request-modal.component";
import { ViewTxnLogComponent } from "./view-txn-log/view-txn-log.component";
import { ViewRequestLogComponent } from "./view-request-log/view-request-log.component";
import { RequestMessageModalComponent } from "../../../../shared/components/request-message-modal/request-message-modal.component";
import { ApiResponse } from "../../../../core/models/api-response";
import { NotificationService } from "../../../../core/services/notification.service";

@Component({
    standalone: false,
    selector: "app-all-request",
    templateUrl: `./all-request.component.html`,
    styleUrls: ['./all-request.component.css']
})
export class AllRequestsComponent implements OnInit {

    public statusList: Array<string> = [];
    public form: FormGroup = new FormGroup({
        id: new FormControl(""),
        privilegeId: new FormControl(""),
        description: new FormControl(""),
        requesterName: new FormControl(""),
        requestDate: new FormControl(null),
        sapName: new FormControl(""),
        from: new FormControl(null),
        to: new FormControl(null),
        status: new FormControl(""),
        justification: new FormControl(""),
        transaction: new FormControl(""),
    });

    public tableColumns = [
        { field: "id", type: "text", header: "Request No" },
        { field: "system.privilegeId", type: "text", header: "Privilege ID" },
        { field: "approverName", type: "text", header: "Approved By" },
        { field: "requesterName", type: "text", header: "Requested By" },
        { field: "system.sapName", type: "text", header: "System" },
        { field: "validFrom", type: "time", header: "Valid From" },
        { field: "validTo", type: "time", header: "Valid To" },
        { field: "status", type: "statusTemplate", header: "Status" },
        { field: "operations", type: "operationsTemplate", header: "Operations", width: '250px' }
    ];

    public tableData: any[] = [];
    public totalRecords: number = 0;
    public loading: boolean = false;
    private currentPaginationEvent: PaginationModel;

    constructor(
        private nzModal: NzModalService,
        private _requestService: RequestService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.search();
    }

    public getTableData(event?: PaginationModel) {
        this.loading = true;

        const pagination: PaginationModel = event || {
            first: 0,
            rows: 10,
            sortField: '',
            sortOrder: 1,
            filters: {}
        };
        this.currentPaginationEvent = pagination;

        let requestBody: any = {};
        let formValue = this.form.value;

        for (let field in formValue) {
            if (formValue[field]) {
                if (field == 'requestDate') {
                    requestBody['requestDateStr'] = this.formatDateYYYYMMDD(formValue[field]);
                } else if (field == 'from' || field == 'to') {
                    requestBody[field] = this.formatDateYYYYMMDD(formValue[field]);
                } else {
                    requestBody[field] = formValue[field];
                }
            }
        }

        this._requestService.getAllRequests(pagination, requestBody).subscribe((resp: ApiResponse) => {
            this.loading = false;
            if (resp && resp.data) {
                // Formatting intercepted epoch objects
                const mappedContent = (resp.data.page?.content || []).map((row: any) => {
                    const rowCopy = { ...row };
                    if (rowCopy.requestDate) rowCopy.requestDate = this.formatDateFromEpoch(rowCopy.requestDate);
                    if (rowCopy.validFrom) rowCopy.validFrom = this.formatDateFromEpoch(rowCopy.validFrom);
                    if (rowCopy.validTo) rowCopy.validTo = this.formatDateFromEpoch(rowCopy.validTo);
                    return rowCopy;
                });

                this.tableData = mappedContent;
                this.totalRecords = resp.data.page?.totalElements || 0;
                this.statusList = resp.data.statuses || [];
            }
        }, () => {
            this.loading = false;
        });
    }

    public search() {
        this.getTableData({
            first: 0,
            rows: 10,
            sortField: '',
            sortOrder: 1,
            filters: {}
        });
    }

    public resetForm() {
        this.form.reset();
        this.search();
    }

    public export() {
        if (!this.currentPaginationEvent) return;
        this._requestService.exportPrivRequests(this.currentPaginationEvent).subscribe((resp: any) => {
            const blob = new Blob([resp.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            this.saveFileLocally(blob, 'All_Privilege_Requests.xlsx');
            this.notificationService.success("Successfully downloaded All Requests");
        });
    }

    public openDetail(action: string, rowData: any) {
        if (action == "view") {
            this.nzModal.create({
                nzTitle: 'Request Detail',
                nzContent: CreateRequestModalComponent,
                nzWidth: '90vw',
                nzClassName: 'updated-modal',
                nzData: { action: 'view', data: rowData },
                nzFooter: null,
            });
        }

        if (action == "viewTxn") {
            this.nzModal.create({
                nzTitle: "Transaction Log",
                nzContent: ViewTxnLogComponent,
                nzWidth: "90vw",
                nzClassName: "updated-modal",
                nzData: { rowData, page: "reportPage" },
                nzFooter: null,
            });
        }

        if (action == "viewRequest") {
            this.nzModal.create({
                nzTitle: "Request Log",
                nzContent: ViewRequestLogComponent,
                nzWidth: "90vw",
                nzClassName: "updated-modal",
                nzData: { rowData },
                nzFooter: null,
            });
        }

        if (action == 'reset') {
            this._requestService.requestReset(rowData?.id).subscribe((resp: ApiResponse) => {
                this.notificationService.success(resp.message);
                this.search();
            }, (err) => {
                this.notificationService.error(err.error.message);
            });
        }

        if (action == 'end') {
            this._requestService.endRequest(rowData?.id).subscribe((resp: ApiResponse) => {
                this.notificationService.success(resp.message);
                this.search();
            }, (err) => {
                this.notificationService.error(err.error.message);
            });
        }
    }

    public showRequestMessage(data: any) {
        if (data.message) {
            this.nzModal.create({
                nzTitle: 'Request Message',
                nzContent: RequestMessageModalComponent,
                nzWidth: '40vw',
                nzClassName: 'updated-modal',
                nzData: {
                    title: "Request Message",
                    status: data.status,
                    message: data.message,
                    statusClass: data.status
                },
                nzFooter: null,
            });
        }
    }

    private formatDateYYYYMMDD(date: Date | string): string {
        if (!date) return '';
        const d = new Date(date);
        const month = '' + (d.getMonth() + 1);
        const day = '' + d.getDate();
        const year = d.getFullYear();

        return [
            year,
            month.length < 2 ? '0' + month : month,
            day.length < 2 ? '0' + day : day
        ].join('-');
    }

    private formatDateFromEpoch(epoch: any): string {
        if (!epoch) return '';
        let timeInt = epoch;
        if (typeof epoch === 'string') {
            timeInt = parseInt(epoch, 10);
            if (isNaN(timeInt)) return epoch;
        }

        const d = new Date(timeInt);
        const day = ('0' + d.getDate()).slice(-2);
        const month = ('0' + (d.getMonth() + 1)).slice(-2);
        const year = d.getFullYear();
        const hours = ('0' + d.getHours()).slice(-2);
        const minutes = ('0' + d.getMinutes()).slice(-2);

        return `${day}-${month}-${year} ${hours}:${minutes}`;
    }

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
