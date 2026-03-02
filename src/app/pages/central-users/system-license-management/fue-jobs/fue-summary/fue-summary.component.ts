import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CentralUsersService } from '../../../central-users.service';
import { TableColumn } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    standalone: false,
    selector: 'app-fue-summary',
    templateUrl: './fue-summary.component.html'
})
export class FueSummaryComponent implements OnInit {
    jobId!: number;
    loading = false;

    columns: TableColumn[] = [
        { field: 'system', header: 'System' },
        { field: 'fueTypeName', header: 'FUE Tier' },
        { field: 'fueWeight', header: 'Weight' },
        { field: 'userCountSap', header: 'Users SAP' },
        { field: 'userCountMarc', header: 'Users MARC' },
        { field: 'fuesConsumedSap', header: 'FUEs SAP' },
        { field: 'fuesConsumedMarc', header: 'FUEs MARC' },
        { field: 'notCountedUsers', header: 'Not Counted' },
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
        this.centralUsersService.getFueMeasurementSummary(this.jobId).subscribe({
            next: (res: any) => {
                this.data = res.data || [];
                this.total = this.data.length;
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    goBack(): void {
        this.router.navigate(['/central-users/system-license-management/jobs']);
    }
}
