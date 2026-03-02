import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CentralUsersService } from '../../central-users.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AddLicenseIndirectUsageComponent } from './add-license-indirect-usage/add-license-indirect-usage.component';

@Component({
    standalone: false,
    selector: 'app-license-indirect-usage',
    templateUrl: './license-indirect-usage.component.html'
})
export class LicenseIndirectUsageComponent implements OnInit {
    usageData: any[] = [];
    usersData: any[] = [];
    selectedUsage: any = null;
    editMode = false;
    loading = false;

    constructor(
        private nzModal: NzModalService,
        private centralUsersService: CentralUsersService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadUsageData();
    }

    loadUsageData(): void {
        this.loading = true;
        this.centralUsersService.getLicIndirectUsage().subscribe({
            next: (resp: any) => {
                if (resp.success && resp.data) {
                    this.usageData = resp.data;
                }
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    onUsageRowClick(row: any): void {
        this.selectedUsage = row;
        this.loadUsersData(row.id);
    }

    loadUsersData(usageId: number): void {
        this.centralUsersService.getIndirectUsageUsers(usageId).subscribe((resp: any) => {
            if (resp.success && resp.data) {
                this.usersData = resp.data;
            }
        });
    }

    addUsage(): void {
        this.nzModal.create({
            nzTitle: 'Add Indirect App Usage',
            nzContent: AddLicenseIndirectUsageComponent,
            nzWidth: '500px',
            nzData: { formType: 'Add' },
            nzFooter: null,
            nzClassName: 'updated-modal',
        }).afterClose.subscribe(result => {
            if (result) this.loadUsageData();
        });
    }

    editUsage(): void {
        if (!this.selectedUsage) {
            this.notificationService.error('Please select a row');
            return;
        }
        this.nzModal.create({
            nzTitle: 'Edit Indirect App Usage',
            nzContent: AddLicenseIndirectUsageComponent,
            nzWidth: '500px',
            nzData: { formType: 'Edit', data: this.selectedUsage },
            nzFooter: null,
            nzClassName: 'updated-modal',
        }).afterClose.subscribe(result => {
            if (result) this.loadUsageData();
        });
    }

    deleteUsage(): void {
        if (!this.selectedUsage) {
            this.notificationService.error('Please select a row');
            return;
        }
        this.nzModal.confirm({
            nzTitle: 'Delete',
            nzContent: 'Please Confirm Before Deleting.',
            nzOkDanger: true,
            nzOnOk: () => {
                this.centralUsersService.deleteIndirectUsage(this.selectedUsage.id).subscribe(() => {
                    this.notificationService.success('Deleted successfully');
                    this.loadUsageData();
                    this.usersData = [];
                    this.selectedUsage = null;
                });
            }
        });
    }

    // Users table actions
    toggleEditUsers(): void {
        this.editMode = true;
    }

    cancelEditUsers(): void {
        if (this.selectedUsage) {
            this.loadUsersData(this.selectedUsage.id);
        }
        this.editMode = false;
    }

    saveUsers(): void {
        if (!this.selectedUsage) {
            this.notificationService.error('Please select a usage row first');
            return;
        }
        const payload = {
            usageId: this.selectedUsage.id,
            userData: this.usersData.map(item => ({
                applicationId: item.applicationId,
                bname: item.bname,
                userName: item.userName,
                email: item.email,
                userGroup: item.userGroup,
            }))
        };
        this.centralUsersService.saveIndirectUsageUsers(payload).subscribe({
            next: () => {
                this.notificationService.success('Saved successfully');
                this.editMode = false;
            },
            error: () => this.notificationService.error('Failed to save')
        });
    }

    addUserRow(): void {
        if (!this.selectedUsage) {
            this.notificationService.error('Please select a usage row first');
            return;
        }
        this.usersData = [...this.usersData, { applicationId: '', bname: '', userName: '', email: '', userGroup: '' }];
        this.editMode = true;
    }
}
