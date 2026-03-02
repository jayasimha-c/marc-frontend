import { Component, OnInit } from '@angular/core';
import { CentralUsersService } from '../../central-users.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface LockParam {
    description: string;
    value: string;
    paramDescription: string;
}

const BOOLEAN_PARAMS = ['Dialog Users', 'Service Users', 'Run Locking Users Job'];

const DEFAULT_LOCK_PARAMS: LockParam[] = [
    { description: 'Dialog Users', value: 'YES', paramDescription: 'Lock dialog users' },
    { description: 'Service Users', value: 'NO', paramDescription: 'Lock service users' },
    { description: 'Run Locking Users Job', value: 'NO', paramDescription: 'Enable locking users job' },
    { description: 'Inactive Days', value: '90', paramDescription: 'Days of inactivity before locking' },
    { description: 'Valid To Days', value: '30', paramDescription: 'Days until validity expires' },
];

@Component({
    standalone: false,
    selector: 'app-lock-parameters',
    templateUrl: './lock-parameters.component.html',
})
export class LockParametersComponent implements OnInit {
    data: LockParam[] = [];
    editMode = false;
    paramDescriptions: string[] = [];

    private originalData: LockParam[] = [];

    constructor(
        private centralUsersService: CentralUsersService,
        private notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        this.loadRequiredInfo();
        this.loadData();
    }

    loadRequiredInfo(): void {
        this.centralUsersService.getRequiredInfo().subscribe({
            next: (resp: any) => {
                if (resp.success && resp.data) {
                    this.paramDescriptions = resp.data.paramDescriptions || resp.data || [];
                }
            },
        });
    }

    loadData(): void {
        this.centralUsersService.getLockParams().subscribe({
            next: (resp: any) => {
                if (resp.success && resp.data) {
                    this.data = resp.data;
                    this.originalData = this.cloneData(this.data);
                }
            },
        });
    }

    toggleEdit(): void {
        if (!this.editMode) {
            this.originalData = this.cloneData(this.data);
        }
        this.editMode = !this.editMode;
    }

    cancel(): void {
        this.data = this.cloneData(this.originalData);
        this.editMode = false;
    }

    save(): void {
        const payload = this.data.map(row => ({
            description: row.description,
            value: row.value,
            paramDescription: row.paramDescription,
        }));

        this.centralUsersService.saveLockParams(payload).subscribe({
            next: (resp: any) => {
                this.notificationService.show(resp);
                if (resp.success) {
                    this.editMode = false;
                    this.loadData();
                }
            },
            error: (err: any) => {
                this.notificationService.handleHttpError(err);
            },
        });
    }

    addRow(): void {
        this.data = [...this.data, { description: '', value: '', paramDescription: '' }];
        this.editMode = true;
    }

    initializeDefaults(): void {
        this.data = this.cloneData(DEFAULT_LOCK_PARAMS);
        this.editMode = true;
    }

    isBooleanParam(description: string): boolean {
        return BOOLEAN_PARAMS.includes(description);
    }

    private cloneData(source: LockParam[]): LockParam[] {
        return source.map(row => ({ ...row }));
    }
}
