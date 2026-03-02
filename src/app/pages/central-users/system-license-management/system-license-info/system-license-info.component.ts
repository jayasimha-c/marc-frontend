import { Component, OnInit } from '@angular/core';
import { CentralUsersService } from '../../central-users.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
    standalone: false,
    selector: 'app-system-license-info',
    templateUrl: './system-license-info.component.html'
})
export class SystemLicenseInfoComponent implements OnInit {
    data: any[] = [];
    editMode = false;
    loading = false;

    constructor(
        private centralUsersService: CentralUsersService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.centralUsersService.getSysLicenseInfo().subscribe({
            next: (resp: any) => {
                if (resp.success && resp.data) {
                    this.data = resp.data;
                }
                this.loading = false;
                this.editMode = false;
            },
            error: () => { this.loading = false; }
        });
    }

    toggleEdit(): void {
        this.editMode = true;
    }

    cancel(): void {
        this.loadData();
    }

    save(): void {
        const payload = this.data.map(item => ({
            licenseType: item.licenseType,
            description: item.description,
            purchased: item.purchased,
            licensePrice: item.licensePrice
        }));
        this.centralUsersService.saveSysLicenseInfo(payload).subscribe({
            next: () => {
                this.notificationService.success('Saved successfully');
                this.loadData();
            },
            error: () => this.notificationService.error('Failed to save')
        });
    }

    addRow(): void {
        this.data = [...this.data, { licenseType: '', description: '', purchased: '', licensePrice: '' }];
        this.editMode = true;
    }

    getTotalValue(row: any): number {
        return (Number(row.purchased) || 0) * (Number(row.licensePrice) || 0);
    }
}
