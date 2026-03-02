import { Component, OnInit } from '@angular/core';
import { CentralUsersService } from '../../central-users.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
    standalone: false,
    selector: 'app-license-rules',
    templateUrl: './license-rules.component.html'
})
export class LicenseRulesComponent implements OnInit {
    data: any[] = [];
    editMode = false;
    loading = false;

    ruleDescriptions: string[] = [];
    licenseTypeDescriptions: string[] = [];
    favDescriptions: string[] = [];
    booleanValues = ['YES', 'NO'];

    constructor(
        private centralUsersService: CentralUsersService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadRuleData();
        this.loadTableData();
    }

    loadRuleData(): void {
        this.centralUsersService.getLicenseMgmtRules().subscribe((resp: any) => {
            if (resp.success && resp.data) {
                this.licenseTypeDescriptions = resp.data.licenseInfo || [];
                this.ruleDescriptions = resp.data.ruleDescriptions || [];
                this.favDescriptions = resp.data.favDescriptions || [];
            }
        });
    }

    loadTableData(): void {
        this.loading = true;
        this.centralUsersService.getLicenseRules().subscribe({
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
        this.loadTableData();
    }

    save(): void {
        const payload = this.data.map(item => ({
            description: item.description,
            value: item.value
        }));
        this.centralUsersService.saveLicenseRules(payload).subscribe({
            next: () => {
                this.notificationService.success('Saved successfully');
                this.loadTableData();
            },
            error: () => this.notificationService.error('Failed to save')
        });
    }

    addRow(): void {
        this.data = [...this.data, { description: '', value: '' }];
        this.editMode = true;
    }

    getValueOptions(description: string): string[] | null {
        if (!description) return null;
        if (description === 'Production Default Unassigned' ||
            description === 'Test Default Unassigned' ||
            description === 'Default License Type (No Write Access)') {
            return this.licenseTypeDescriptions;
        }
        if (description === 'Exclude Users Without Roles') {
            return this.booleanValues;
        }
        if (description === 'Authorization Validation' || description === 'MARC FUE Validation') {
            return this.favDescriptions;
        }
        return null;
    }

    onDescriptionChange(row: any): void {
        row.value = '';
    }
}
