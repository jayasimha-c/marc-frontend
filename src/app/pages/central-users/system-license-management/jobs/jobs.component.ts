import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CentralUsersService } from '../../central-users.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { JobsDetailsComponent } from './jobs-details/jobs-details.component';
import { LicenseJobChooserComponent } from './license-job-chooser.component';
import { RunFueMeasurementComponent } from '../fue-jobs/run-fue-measurement/run-fue-measurement.component';
import { FueJobLogsDialogComponent } from '../fue-jobs/fue-job-logs-dialog/fue-job-logs-dialog.component';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    standalone: false,
    selector: 'app-license-jobs',
    templateUrl: './jobs.component.html'
})
export class LicenseJobsComponent implements OnInit {
    columns: TableColumn[] = [
        { field: 'status', header: 'Status', type: 'tag', tagColors: { 'COMPLETED': 'green', 'RUNNING': 'blue', 'FAILED': 'red', 'PENDING': 'orange' } },
        { field: 'type', header: 'Type', type: 'tag', tagColors: { 'FUE': 'blue', 'Legacy': 'default' } },
        { field: 'startedOn', header: 'Started On' },
        { field: 'completedOn', header: 'Completed On' },
        { field: 'runBy', header: 'Run By' },
    ];
    data: any[] = [];
    total = 0;
    loading = false;
    selectedRow: any = null;

    actions: TableAction[] = [
        { label: 'License Job', icon: 'caret-right', command: () => this.onAction('measure') },
        { label: 'View Logs', icon: 'file-text', command: () => this.onAction('view-logs') },
        { label: 'View Results', icon: 'eye', command: () => this.onAction('view-results') },
        { label: 'View Summary', icon: 'bar-chart', command: () => this.onAction('view-summary') },
        { label: 'Delete', icon: 'delete', danger: true, command: () => this.onAction('delete') },
    ];

    constructor(
        private router: Router,
        private nzModal: NzModalService,
        private centralUsersService: CentralUsersService,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        forkJoin({
            legacy: this.centralUsersService.getLicenseMgmtJobs().pipe(catchError(() => of({ data: { rows: [] } }))),
            fue: this.centralUsersService.getFueMeasurementJobs().pipe(catchError(() => of({ data: [] })))
        }).subscribe({
            next: ({ legacy, fue }: any) => {
                const legacyRows = (legacy.data?.rows || []).map((r: any) => ({
                    ...r, type: 'Legacy',
                    startedOn: r.startedOnStr || r.startedOn,
                    completedOn: r.completedOnStr || r.completedOn,
                }));
                const fueRows = (fue.data || []).map((r: any) => ({
                    ...r, type: 'FUE',
                    startedOn: r.startedOn || '',
                    completedOn: r.completedOn || '',
                }));
                const merged = [...legacyRows, ...fueRows];
                merged.sort((a, b) => this.parseTime(b.startedOn) - this.parseTime(a.startedOn));
                this.data = merged;
                this.total = merged.length;
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    onRowClick(row: any): void {
        this.selectedRow = row;
    }

    onAction(action: string): void {
        if (action === 'measure') {
            this.nzModal.create({
                nzTitle: 'Select Measurement Type',
                nzContent: LicenseJobChooserComponent,
                nzWidth: '380px',
                nzFooter: null,
                nzClassName: 'updated-modal',
            }).afterClose.subscribe(choice => {
                if (choice === 'fue') {
                    this.nzModal.create({
                        nzTitle: 'Run FUE Measurement',
                        nzContent: RunFueMeasurementComponent,
                        nzWidth: '500px',
                        nzFooter: null,
                        nzClassName: 'updated-modal',
                    }).afterClose.subscribe(result => {
                        if (result) this.loadData();
                    });
                } else if (choice === 'legacy') {
                    this.nzModal.confirm({
                        nzTitle: 'Confirm',
                        nzContent: 'Please Confirm To Perform Legacy License Measure',
                        nzOnOk: () => {
                            this.centralUsersService.checkIfOtherJobRunning().subscribe((res: any) => {
                                if (res.success) {
                                    this.centralUsersService.updateLicMgmt().subscribe((res2: any) => {
                                        this.notificationService.success(res2.message);
                                        this.loadData();
                                    });
                                }
                            });
                        }
                    });
                }
            });
            return;
        }

        if (!this.selectedRow) {
            this.notificationService.error('Please select a row');
            return;
        }

        const row = this.selectedRow;

        if (action === 'view-logs') {
            if (row.type !== 'FUE') {
                this.notificationService.error('Logs are only available for FUE jobs');
                return;
            }
            this.nzModal.create({
                nzTitle: 'FUE Job Logs',
                nzContent: FueJobLogsDialogComponent,
                nzWidth: '750px',
                nzData: { job: row },
                nzFooter: null,
                nzClassName: 'updated-modal',
            });
        }

        if (action === 'view-results') {
            if (row.type === 'FUE') {
                this.router.navigate(['/central-users/system-license-management/fue-results', row.id]);
            } else {
                this.nzModal.create({
                    nzTitle: 'License Management Details',
                    nzContent: JobsDetailsComponent,
                    nzWidth: '90vw',
                    nzData: { data: row },
                    nzFooter: null,
                    nzClassName: 'updated-modal',
                });
            }
        }

        if (action === 'view-summary') {
            if (row.type !== 'FUE') {
                this.notificationService.error('Summary is only available for FUE jobs');
                return;
            }
            this.router.navigate(['/central-users/system-license-management/fue-summary', row.id]);
        }

        if (action === 'delete') {
            this.nzModal.confirm({
                nzTitle: 'Delete',
                nzContent: 'Please Confirm Before Deleting.',
                nzOkDanger: true,
                nzOnOk: () => {
                    const delete$ = row.type === 'FUE'
                        ? this.centralUsersService.deleteFueMeasurementJob(row.id)
                        : this.centralUsersService.deleteJobs(row.id);
                    delete$.subscribe((res: any) => {
                        this.notificationService.success(res.message || 'Deleted');
                        this.loadData();
                    });
                }
            });
        }
    }

    private parseTime(val: any): number {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const ts = Date.parse(val);
        return isNaN(ts) ? 0 : ts;
    }
}
