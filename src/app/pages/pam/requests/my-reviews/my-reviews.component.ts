import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { NzModalService } from "ng-zorro-antd/modal";
import { RequestService } from "../request.service";
import { PaginationModel } from "../../../../core/models/pagination.model";
import { RequestMessageModalComponent } from "../../../../shared/components/request-message-modal/request-message-modal.component";
import { ViewTxnLogComponent } from "../../reports/all-request/view-txn-log/view-txn-log.component";
import { ApiResponse } from "../../../../core/models/api-response";

@Component({
    standalone: false,
    selector: "app-my-reviews",
    templateUrl: `./my-reviews.component.html`,
    styleUrls: ['./my-reviews.component.css']
})
export class MyReviewsComponent implements OnInit {

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
        justification: new FormControl("")
    });

    public tableColumns = [
        { field: "id", type: "text", header: "Request No" },
        { field: "system.privilegeId", type: "text", header: "Privilege ID" },
        { field: "description", type: "text", header: "Description" },
        { field: "requesterName", type: "text", header: "Requested By" },
        { field: "requestDate", type: "time", header: "Request Date" },
        { field: "system.sapName", type: "text", header: "System" },
        { field: "validFrom", type: "time", header: "Valid From", hide: true },
        { field: "validTo", type: "time", header: "Valid To", hide: true },
        { field: "status", type: "statusTemplate", header: "Status" },
        { field: "txnCount1", type: "text", header: "Txn Count" },
        { field: "operations", type: "operationsTemplate", header: "Operations", width: '150px' }
    ];

    public tableData: any[] = [];
    public totalRecords: number = 0;
    public loading: boolean = false;

    constructor(
        private router: Router,
        private nzModal: NzModalService,
        private _requestService: RequestService
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

        this._requestService.getReviews(pagination, requestBody).subscribe((resp: ApiResponse) => {
            this.loading = false;
            if (resp && resp.data) {
                // Formatting intercepted epoch objects into clean structures
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

    public openDetail(action: string, rowData: any) {
        if (action == 'view') {
            this.router.navigate(['/pam/requests/view-request', rowData.id]);
        }
    }

    public viewTxnLog(rowData: any) {
        this.nzModal.create({
            nzTitle: 'Transaction Log',
            nzContent: ViewTxnLogComponent,
            nzWidth: '90vw',
            nzData: { rowData, page: 'reviewPage' },
            nzFooter: null,
            nzClassName: 'updated-modal',
        }).afterClose.subscribe((resp) => {
            if (resp) {
                this.search();
            }
        });
    }

    public showRequestMessage(data: any) {
        if (data.message) {
            this.nzModal.create({
                nzTitle: 'Request Message',
                nzContent: RequestMessageModalComponent,
                nzWidth: '40vw',
                nzData: {
                    title: "Request Message",
                    status: data.status,
                    message: data.message,
                    statusClass: data.status
                },
                nzFooter: null,
                nzClassName: 'updated-modal',
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
}
