import { Component, OnInit } from '@angular/core';
import { CentralUsersService } from '../../central-users.service';

interface DataSetOption {
    id: number;
    name: string;
}

@Component({
    standalone: false,
    selector: 'app-central-user-pivot-report',
    templateUrl: './pivot-report.component.html',
})
export class CentralUserPivotReportComponent implements OnInit {
    loading = false;
    dataSets: DataSetOption[] = [];
    selectedDataSet: number = 1;
    pivotData: any[] = [];

    constructor(private centralUsersService: CentralUsersService) {}

    ngOnInit(): void {
        this.loadVariants();
        this.loadData();
    }

    loadVariants(): void {
        this.centralUsersService.getVariantNames().subscribe({
            next: (resp: any) => {
                if (resp.success && resp.data?.variants) {
                    this.dataSets = Object.entries(resp.data.variants).map(
                        ([id, name]) => ({ id: +id, name: name as string }),
                    );
                }
            },
        });
    }

    loadData(): void {
        this.loading = true;
        this.centralUsersService.getVariantData(this.selectedDataSet).subscribe({
            next: (resp: any) => {
                if (resp.success) {
                    this.pivotData = resp.data || [];
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            },
        });
    }

    onDataSetChange(value: number): void {
        this.selectedDataSet = value;
        this.loadData();
    }

    getKeys(obj: any): string[] {
        return obj ? Object.keys(obj) : [];
    }
}
