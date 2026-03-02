import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../../../core/services/notification.service';

interface SimFueType {
    code: string;
    name: string;
    fueWeight: number;
    usersPerFue: number;
    tierPriority: number;
}

interface SimUserRow {
    userId: string;
    system: string;
    ruleType: string;
    marcRuleType: string;
    tcodeCount: string;
    expired: string;
    inactive: string;
    currentLicense: string;
    sapTier: string;
    marcTier: string;
    fueWeightSap: string;
    fueWeightMarc: string;
    fueSavings: string;
    optimizable: string;
    reason: string;
}

@Component({
    standalone: false,
    selector: 'app-fue-simulator',
    templateUrl: './fue-simulator.component.html'
})
export class FueSimulatorComponent implements OnInit {
    typesData: SimFueType[] = [];
    usersData: SimUserRow[] = [];
    selectedTypeRow: SimFueType | null = null;
    selectedUserRow: SimUserRow | null = null;

    ruleOptions = ['', 'GBSS', 'GCCU', 'GBAU', 'GDEV'];
    yesNoOptions = ['No', 'Yes'];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.typesData = [
            { code: 'GBSS', name: 'Self-Service Use', fueWeight: 0.033, usersPerFue: 30, tierPriority: 1 },
            { code: 'GCCU', name: 'Core Use', fueWeight: 0.2, usersPerFue: 5, tierPriority: 2 },
            { code: 'GBAU', name: 'Advanced Use', fueWeight: 1, usersPerFue: 1, tierPriority: 3 },
            { code: 'GDEV', name: 'Developer', fueWeight: 2, usersPerFue: 0.5, tierPriority: 4 },
        ];
    }

    goBack(): void {
        this.router.navigate(['../fue-types'], { relativeTo: this.route });
    }

    // Types tab
    addTypeRow(): void {
        this.typesData = [...this.typesData, { code: '', name: '', fueWeight: 0, usersPerFue: 0, tierPriority: 0 }];
    }

    deleteTypeRow(): void {
        if (!this.selectedTypeRow) {
            this.notificationService.error('Select a row to delete');
            return;
        }
        this.typesData = this.typesData.filter(r => r !== this.selectedTypeRow);
        this.selectedTypeRow = null;
    }

    // Users tab
    addUserRow(): void {
        const empty: SimUserRow = {
            userId: '', system: '', ruleType: '', marcRuleType: '', tcodeCount: '',
            expired: 'No', inactive: 'No', currentLicense: '',
            sapTier: '', marcTier: '', fueWeightSap: '', fueWeightMarc: '',
            fueSavings: '', optimizable: '', reason: ''
        };
        this.usersData = [...this.usersData, empty];
    }

    addTestData(): void {
        const e = { sapTier: '', marcTier: '', fueWeightSap: '', fueWeightMarc: '', fueSavings: '', optimizable: '', reason: '' };
        const testRows: SimUserRow[] = [
            { userId: 'JSMITH', system: 'ERP-100', ruleType: 'GBAU', marcRuleType: 'GCCU', tcodeCount: '45', expired: 'No', inactive: 'No', currentLicense: 'GBAU', ...e },
            { userId: 'JSMITH', system: 'ERP-200', ruleType: 'GCCU', marcRuleType: 'GCCU', tcodeCount: '12', expired: 'No', inactive: 'No', currentLicense: 'GCCU', ...e },
            { userId: 'JSMITH', system: 'BW-300', ruleType: 'GBSS', marcRuleType: 'GBSS', tcodeCount: '3', expired: 'No', inactive: 'No', currentLicense: 'GBSS', ...e },
            { userId: 'AGARCIA', system: 'ERP-100', ruleType: 'GDEV', marcRuleType: 'GDEV', tcodeCount: '80', expired: 'No', inactive: 'No', currentLicense: 'GDEV', ...e },
            { userId: 'AGARCIA', system: 'ERP-200', ruleType: 'GCCU', marcRuleType: 'GCCU', tcodeCount: '20', expired: 'No', inactive: 'No', currentLicense: 'GCCU', ...e },
            { userId: 'AGARCIA', system: 'BW-300', ruleType: '', marcRuleType: '', tcodeCount: '0', expired: 'Yes', inactive: 'No', currentLicense: 'GBSS', ...e },
            { userId: 'BWILSON', system: 'ERP-100', ruleType: '', marcRuleType: '', tcodeCount: '5', expired: 'No', inactive: 'No', currentLicense: 'GBSS', ...e },
            { userId: 'BWILSON', system: 'ERP-200', ruleType: '', marcRuleType: '', tcodeCount: '2', expired: 'No', inactive: 'No', currentLicense: 'GBSS', ...e },
            { userId: 'CLEE', system: 'ERP-100', ruleType: 'GCCU', marcRuleType: 'GBSS', tcodeCount: '0', expired: 'No', inactive: 'Yes', currentLicense: 'GCCU', ...e },
        ];
        this.usersData = [...this.usersData, ...testRows];
        this.notificationService.success('Added 9 test rows');
    }

    clearUsers(): void {
        this.usersData = [];
    }

    calculate(): void {
        const typeLookup = new Map<string, SimFueType>();
        for (const t of this.typesData) {
            if (t.code) {
                typeLookup.set(t.code.toUpperCase().trim(), {
                    ...t,
                    fueWeight: Number(t.fueWeight) || 0,
                    usersPerFue: Number(t.usersPerFue) || 0,
                    tierPriority: Number(t.tierPriority) || 0
                });
            }
        }

        const rows: SimUserRow[] = this.usersData.map(r => ({ ...r }));
        if (rows.length === 0) {
            this.notificationService.error('Add user rows first');
            return;
        }

        const userGroups = new Map<string, SimUserRow[]>();

        for (const row of rows) {
            const uid = (row.userId || '').trim().toUpperCase();
            if (!uid) {
                row.sapTier = '';
                row.marcTier = '';
                row.reason = 'Missing user ID';
                continue;
            }
            if (!userGroups.has(uid)) userGroups.set(uid, []);
            userGroups.get(uid)!.push(row);

            const isExpired = row.expired?.trim().toLowerCase() === 'yes';
            const isInactive = row.inactive?.trim().toLowerCase() === 'yes';

            if (isExpired) { this.markNotCounted(row, 'EXPIRED'); continue; }
            if (isInactive) { this.markNotCounted(row, 'INACTIVE'); continue; }

            const sapCode = (row.ruleType || '').trim().toUpperCase();
            const sapType = sapCode ? typeLookup.get(sapCode) : null;
            const marcCode = (row.marcRuleType || '').trim().toUpperCase();
            const marcType = marcCode ? typeLookup.get(marcCode) : null;

            if (!sapType && !marcType) { this.markNotCounted(row, 'NO_VIOLATIONS'); continue; }

            const gbss = typeLookup.get('GBSS');

            if (sapType) {
                row.sapTier = `${sapType.code} — ${sapType.name}`;
                row.fueWeightSap = sapType.fueWeight.toString();
            } else {
                row.sapTier = gbss ? `${gbss.code} — ${gbss.name}` : 'GBSS';
                row.fueWeightSap = gbss ? gbss.fueWeight.toString() : '0.033';
            }

            if (marcType) {
                row.marcTier = `${marcType.code} — ${marcType.name}`;
                row.fueWeightMarc = marcType.fueWeight.toString();
            } else {
                row.marcTier = gbss ? `${gbss.code} — ${gbss.name}` : 'GBSS';
                row.fueWeightMarc = gbss ? gbss.fueWeight.toString() : '0.033';
            }

            row.reason = `SAP: ${sapCode || 'none'}, MARC: ${marcCode || 'none'}`;
        }

        // Cross-system consolidation
        for (const [, userRows] of userGroups) {
            const countedRows = userRows.filter(r => !r.reason.startsWith('Not Counted'));
            if (countedRows.length === 0) continue;

            let maxSapPri = 0, maxSapWeight = 0, maxMarcPri = 0, maxMarcWeight = 0;
            for (const row of countedRows) {
                const sapCode = (row.ruleType || '').trim().toUpperCase();
                const sapType = sapCode ? typeLookup.get(sapCode) : typeLookup.get('GBSS');
                const marcCode = (row.marcRuleType || '').trim().toUpperCase();
                const marcType = marcCode ? typeLookup.get(marcCode) : typeLookup.get('GBSS');

                if (sapType && sapType.tierPriority > maxSapPri) {
                    maxSapPri = sapType.tierPriority;
                    maxSapWeight = sapType.fueWeight;
                }
                if (marcType && marcType.tierPriority > maxMarcPri) {
                    maxMarcPri = marcType.tierPriority;
                    maxMarcWeight = marcType.fueWeight;
                }
            }

            const isOptimizable = maxSapPri > maxMarcPri;
            const savings = isOptimizable ? Number((maxSapWeight - maxMarcWeight).toFixed(3)) : 0;

            for (const row of countedRows) {
                row.optimizable = isOptimizable ? 'Yes' : 'No';
                row.fueSavings = savings.toString();
            }
        }

        this.usersData = rows;
        this.notificationService.success(`Calculated ${userGroups.size} user(s) across ${rows.length} row(s)`);
    }

    private markNotCounted(row: SimUserRow, reason: string): void {
        row.sapTier = 'Not Counted';
        row.marcTier = 'Not Counted';
        row.fueWeightSap = '0';
        row.fueWeightMarc = '0';
        row.fueSavings = '0';
        row.optimizable = '';
        row.reason = `Not Counted — ${reason}`;
    }

    exportResults(): void {
        if (this.usersData.length === 0) {
            this.notificationService.error('No data to export');
            return;
        }
        const headers = ['User', 'System', 'SAP Rule Type', 'MARC Rule Type', 'T-code Count', 'Expired', 'Inactive', 'Current License', 'SAP Tier', 'MARC Tier', 'Weight SAP', 'Weight MARC', 'FUE Savings', 'Optimizable', 'Reason'];
        const fields: (keyof SimUserRow)[] = ['userId', 'system', 'ruleType', 'marcRuleType', 'tcodeCount', 'expired', 'inactive', 'currentLicense', 'sapTier', 'marcTier', 'fueWeightSap', 'fueWeightMarc', 'fueSavings', 'optimizable', 'reason'];
        let csv = headers.join(',') + '\n';
        this.usersData.forEach(row => {
            csv += fields.map(f => `"${(row[f] || '').replace(/"/g, '""')}"`).join(',') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fue_simulation_results.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
