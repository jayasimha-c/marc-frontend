import { Component, OnInit } from '@angular/core';
import { CentralUsersService } from '../../central-users.service';

@Component({
    standalone: false,
    selector: 'app-license-pivot-report',
    templateUrl: './pivot-report.component.html'
})
export class LicensePivotReportComponent implements OnInit {
    variantNames: string[] = [];
    selectedVariant = '';
    data: any[] = [];
    columns: string[] = [];
    loading = false;

    constructor(private centralUsersService: CentralUsersService) {}

    ngOnInit(): void {
        this.centralUsersService.getSysLicenseInfoPivot().subscribe((resp: any) => {
            if (resp.success && resp.data) {
                this.variantNames = resp.data || [];
            }
        });
    }

    loadData(): void {
        if (!this.selectedVariant) return;
        this.loading = true;
        this.centralUsersService.getPivotData(this.selectedVariant).subscribe({
            next: (resp: any) => {
                if (resp.success && resp.data) {
                    const raw = resp.data || [];
                    if (raw.length > 0) {
                        this.columns = Object.keys(raw[0]);
                        this.data = raw;
                    } else {
                        this.columns = [];
                        this.data = [];
                    }
                }
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }
}
