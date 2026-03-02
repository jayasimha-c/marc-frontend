import { Component, Inject, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
    standalone: false,
    selector: 'app-request-message-modal',
    templateUrl: './request-message-modal.component.html',
    styleUrls: ['./request-message-modal.component.scss']
})
export class RequestMessageModalComponent {

    public status: string = '';
    public title: string = 'Request Message';
    public message: string = '';

    constructor(
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        @Optional() public modal: NzModalRef
    ) {
        this.status = dialogData.status;
        this.title = dialogData.title;
        this.message = dialogData.message;
    }

}
