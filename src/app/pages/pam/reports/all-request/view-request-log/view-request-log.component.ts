import { Component, Inject, OnInit } from "@angular/core";
import { NZ_MODAL_DATA, NzModalRef } from "ng-zorro-antd/modal";
import { RequestService } from "../../../requests/request.service";
import { ApiResponse } from "../../../../../core/models/api-response";

@Component({
    standalone: false,
    selector: "app-view-request-log",
    templateUrl: "./view-request-log.component.html"
})
export class ViewRequestLogComponent implements OnInit {

    public tableColumns = [
        { field: "eventType", type: "text", header: "Event Type" },
        { field: "eventStatus", type: "statusTemplate", header: "Status", width: '120px' },
        { field: "logDesc", type: "text", header: "Description" },
        { field: "sapSystem", type: "text", header: "System", width: '120px' },
        { field: "durationMs", type: "text", header: "Duration (ms)", width: '120px' },
        { field: "updateTime", type: "time", header: "Timestamp", width: '160px' },
        { field: "updatedBy", type: "text", header: "Updated By", width: '140px' }
    ];

    public tableData: any[] = [];
    public totalRecords: number = 0;
    public loading: boolean = false;

    constructor(
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        public modal: NzModalRef,
        private _requestService: RequestService
    ) { }

    ngOnInit(): void {
        this._getTableData();
    }

    private _getTableData() {
        this.loading = true;
        this._requestService.getReqLogs(this.dialogData?.rowData?.id).subscribe((resp: ApiResponse) => {
            this.loading = false;
            if (resp && resp.data) {
                // Map epochs uniformly
                this.tableData = (resp.data || []).map((row: any) => {
                    const rowCopy = { ...row };
                    if (rowCopy.updateTime) {
                        rowCopy.updateTime = this.formatDateFromEpoch(rowCopy.updateTime);
                    }
                    return rowCopy;
                });
                this.totalRecords = this.tableData.length;
            }
        }, () => {
            this.loading = false;
        });
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
