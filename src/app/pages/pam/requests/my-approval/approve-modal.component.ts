import { Component, Inject } from "@angular/core";
import { NZ_MODAL_DATA, NzModalRef } from "ng-zorro-antd/modal";
import { RequestService } from "../request.service";
import { NotificationService } from "../../../../core/services/notification.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ApiResponse } from "../../../../core/models/api-response";

@Component({
    standalone: false,
    selector: "app-approve-modal",
    templateUrl: `./approve-modal.component.html`,
    styleUrls: [`./approve-modal.component.scss`]
})
export class ApproveModalComponent {
    public title: string = 'Approve';

    public form!: FormGroup;

    constructor(
        public modal: NzModalRef,
        private _requestService: RequestService,
        private notificationService: NotificationService,
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        private formBuilder: FormBuilder
    ) {
        this.title = this.dialogData.title;

        this.form = this.formBuilder.group({
            comments: ["", [Validators.required]],
            validFrom: [""],
            validTo: [""]
        });

        if (this.dialogData.data?.validFrom && this.dialogData.data?.validTo) {
            this.form.patchValue({
                validFrom: new Date(this.dialogData.data.validFrom),
                validTo: new Date(this.dialogData.data.validTo),
            });
        }

        // Always disabled - just for review
        this.form.get('validFrom')?.disable();
    }

    performAction() {
        this.form.markAllAsTouched();
        if (!this.form.valid) return;

        const comments = this.form.get("comments")?.value || '';
        const id = this.dialogData.data?.id;

        if (this.dialogData.page == 'reviewPage') {
            const api = this.dialogData.action == 'approve'
                ? this._requestService.approveReview(id, comments)
                : this._requestService.rejectReview(id, comments);

            api.subscribe((resp: ApiResponse) => {
                this.notificationService.success(resp.message);
                this.modal.close(true);
            }, (err) => {
                this.notificationService.error(err.error?.message || "Error processing review");
            });
        } else {
            let validFrom = "";
            let validTo = "";

            if (this.form.get('validFrom')?.value) {
                validFrom = new Date(this.form.get('validFrom')?.value).toISOString();
            }
            if (this.form.get('validTo')?.value) {
                validTo = new Date(this.form.get('validTo')?.value).toISOString();
            }

            const api = this.dialogData.action == 'approve'
                ? this._requestService.approveRequest(id, validFrom, validTo, comments)
                : this._requestService.rejectRequest(id, comments);

            api.subscribe((resp: ApiResponse) => {
                this.notificationService.success(resp.message);
                this.modal.close(true);
            }, (err) => {
                this.notificationService.error(err.error?.message || "Error processing request approval");
            });
        }
    }
}
