import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CentralUsersService } from '../../../central-users.service';
import { TableColumn } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    standalone: false,
    selector: 'app-fue-results',
    templateUrl: './fue-results.component.html'
})
export class FueResultsComponent implements OnInit {
    jobId!: number;
    systemFilter = '';
    systems: string[] = [];
    loading = false;

    columns: TableColumn[] = [
        { field: 'system', header: 'System' },
        { field: 'bname', header: 'User ID' },
        { field: 'userName', header: 'Name' },
        { field: 'violatedRules', header: 'Auth Validation' },
        { field: 'sapFueTypeName', header: 'SAP Tier' },
        { field: 'marcViolatedRules', header: 'MARC FUE Validation' },
        { field: 'tcodeCount', header: 'No Txn in Period' },
        { field: 'expired', header: 'Expired', type: 'boolean' },
        { field: 'inactive', header: 'Last Login > xx Days', type: 'boolean' },
        { field: 'marcFueTypeName', header: 'MARC Tier' },
        { field: 'marcClassificationSource', header: 'Reason' },
        { field: 'fueWeightSap', header: 'Weight SAP' },
        { field: 'fueWeightMarc', header: 'Weight MARC' },
        { field: 'fueSavings', header: 'FUE Savings' },
        { field: 'optimizable', header: 'Optimizable', type: 'boolean' },
    ];
    data: any[] = [];
    total = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private centralUsersService: CentralUsersService
    ) {}

    ngOnInit(): void {
        this.jobId = +this.route.snapshot.params['jobId'];
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.centralUsersService.getFueMeasurementResults(this.jobId, this.systemFilter || undefined).subscribe({
            next: (res: any) => {
                const d = res.data || [];
                this.data = d;
                this.total = d.length;
                if (this.systems.length === 0) {
                    const systemSet = new Set<string>();
                    d.forEach((r: any) => { if (r.system) systemSet.add(r.system); });
                    this.systems = Array.from(systemSet).sort();
                }
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    onSystemFilterChange(): void {
        this.loadData();
    }

    goBack(): void {
        this.router.navigate(['/central-users/system-license-management/jobs']);
    }
}
