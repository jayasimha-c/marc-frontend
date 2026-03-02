import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { NzModalService, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Clipboard } from '@angular/cdk/clipboard';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import {
    RoleOrgValuesService,
    RoleSummary,
    PivotViewResponse,
    RolePivotData,
    OrgFieldValue
} from './role-org-values.service';

interface SapSystem { id: number; sid?: string; destinationName: string; }

@Component({
    selector: 'app-role-org-values',
    templateUrl: './role-org-values.component.html',
    styleUrls: ['./role-org-values.component.scss'],
    standalone: false,
})
export class RoleOrgValuesComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // SAP System
    sapSystems: SapSystem[] = [];
    selectedSystemId: number | null = null;
    loadingSystems = false;

    // Pivot data
    pivotData: PivotViewResponse | null = null;
    filteredRoles: RoleSummary[] = [];
    loading = false;

    // Selected role data
    selectedRole: RoleSummary | null = null;
    selectedRolePivot: RolePivotData | null = null;
    loadingRoleData = false;

    // Search / filter
    roleSearch = '';
    fieldFilter = '';
    private searchSubject = new Subject<string>();

    // Field descriptions (from pivotData)
    fieldDescriptions: { [key: string]: string } = {};

    constructor(
        private roleOrgValuesService: RoleOrgValuesService,
        private nzModal: NzModalService,
        private message: NzMessageService,
        private clipboard: Clipboard,
    ) {}

    ngOnInit(): void {
        this.loadSapSystems();
        this.searchSubject.pipe(
            debounceTime(300),
            takeUntil(this.destroy$)
        ).subscribe(value => {
            this.filterRoles(value || '');
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ─── SAP Systems ─────────────────────────────────
    loadSapSystems(): void {
        this.loadingSystems = true;
        this.roleOrgValuesService.getSapSystems()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: res => {
                    if (res.success && res.data) {
                        this.sapSystems = res.data;
                    }
                    this.loadingSystems = false;
                },
                error: () => {
                    this.loadingSystems = false;
                }
            });
    }

    onSystemChange(): void {
        if (this.selectedSystemId) {
            this.loadPivotData();
        } else {
            this.pivotData = null;
            this.filteredRoles = [];
            this.selectedRole = null;
            this.selectedRolePivot = null;
        }
    }

    // ─── Pivot Data ──────────────────────────────────
    loadPivotData(): void {
        if (!this.selectedSystemId) return;
        this.loading = true;
        this.selectedRole = null;
        this.selectedRolePivot = null;

        this.roleOrgValuesService.getPivotViewData(this.selectedSystemId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: res => {
                    if (res.success && res.data) {
                        this.pivotData = res.data;
                        this.filteredRoles = [...this.pivotData.roles];
                        this.fieldDescriptions = this.pivotData.fieldDescriptions || {};
                    } else {
                        this.message.error(res.message || 'Failed to load data');
                    }
                    this.loading = false;
                },
                error: () => {
                    this.message.error('Failed to load data');
                    this.loading = false;
                }
            });
    }

    onSearchChange(value: string): void {
        this.searchSubject.next(value);
    }

    private filterRoles(searchTerm: string): void {
        if (!this.pivotData) return;
        const term = searchTerm.toLowerCase().trim();
        if (!term) {
            this.filteredRoles = [...this.pivotData.roles];
        } else {
            this.filteredRoles = this.pivotData.roles.filter(role =>
                role.roleName.toLowerCase().includes(term) ||
                (role.roleDesc && role.roleDesc.toLowerCase().includes(term))
            );
        }
    }

    // ─── Role Selection ──────────────────────────────
    selectRole(role: RoleSummary): void {
        this.selectedRole = role;
        this.loadRolePivotData(role.roleName);
    }

    private loadRolePivotData(roleName: string): void {
        if (!this.selectedSystemId) return;
        this.loadingRoleData = true;

        this.roleOrgValuesService.getRolePivotData(this.selectedSystemId, roleName)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: res => {
                    if (res.success && res.data) {
                        this.selectedRolePivot = res.data;
                    }
                    this.loadingRoleData = false;
                },
                error: () => {
                    this.loadingRoleData = false;
                }
            });
    }

    // ─── Field Display / Filter ──────────────────────
    getFieldDescription(field: string): string {
        return this.fieldDescriptions[field] || field;
    }

    getFieldsForDisplay(): string[] {
        if (!this.selectedRolePivot?.fieldValues) return [];
        let fields = Object.keys(this.selectedRolePivot.fieldValues);
        if (this.fieldFilter) {
            const filter = this.fieldFilter.toLowerCase();
            fields = fields.filter(f =>
                f.toLowerCase().includes(filter) ||
                this.getFieldDescription(f).toLowerCase().includes(filter)
            );
        }
        return fields.sort();
    }

    getValueCount(field: string): number {
        return this.selectedRolePivot?.fieldValueDetails?.[field]?.length || 0;
    }

    // ─── Values Detail Modal ─────────────────────────
    openValuesModal(field: string): void {
        if (!this.selectedRolePivot?.fieldValueDetails?.[field]) return;
        const values = this.selectedRolePivot.fieldValueDetails[field];

        this.nzModal.create({
            nzTitle: `${this.selectedRole?.roleName} — ${field}`,
            nzContent: ValuesDetailContent,
            nzWidth: 500,
            nzBodyStyle: { maxHeight: '70vh', overflow: 'auto', padding: '0' },
            nzData: {
                fieldName: field,
                fieldDescription: this.getFieldDescription(field),
                values
            },
            nzFooter: null,
        });
    }

    // ─── Helpers ─────────────────────────────────────
    copyValue(value: string): void {
        this.clipboard.copy(value);
        this.message.success('Copied');
    }

    refresh(): void {
        this.loadPivotData();
    }
}

// ─── Values Detail Modal Content ─────────────────────
@Component({
    selector: 'app-values-detail-content',
    template: `
        <div class="vdc">
            <div class="vdc__header">
                <span class="vdc__field-name">{{ data.fieldName }}</span>
                <span class="vdc__field-desc">{{ data.fieldDescription }}</span>
                <button nz-button nzType="text" nzSize="small" (click)="copyAll()"
                        nz-tooltip nzTooltipTitle="Copy all values" style="margin-left: auto;">
                    <span nz-icon nzType="copy" nzTheme="outline"></span>
                </button>
            </div>
            <nz-table #valTable [nzData]="data.values" nzSize="small"
                      [nzShowPagination]="false" nzFrontPagination>
                <thead>
                    <tr>
                        <th>Value</th>
                        <th nzWidth="100px">Range End</th>
                        <th nzWidth="40px"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let v of valTable.data" [class.vdc__range-row]="v.range">
                        <td><code>{{ v.lowValue || '(empty)' }}</code></td>
                        <td>
                            <code *ngIf="v.range">{{ v.highValue }}</code>
                            <span *ngIf="!v.range" style="color: #bfbfbf;">-</span>
                        </td>
                        <td>
                            <button nz-button nzType="text" nzSize="small" nzShape="circle"
                                    (click)="copyOne(v)" nz-tooltip nzTooltipTitle="Copy">
                                <span nz-icon nzType="copy" nzTheme="outline"></span>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </nz-table>
            <div class="vdc__footer">{{ data.values.length }} value(s)</div>
        </div>
    `,
    styles: [`
        .vdc__header { display: flex; align-items: center; gap: 12px; padding: 10px 16px;
                       background: #f8fafc; border-bottom: 1px solid #f0f0f0; }
        .vdc__field-name { font-weight: 600; font-size: 13px; font-family: monospace; }
        .vdc__field-desc { font-size: 12px; color: #8c8c8c; }
        .vdc__range-row td { background: #f0f7ff; }
        .vdc__footer { padding: 8px 16px; font-size: 12px; color: #8c8c8c; border-top: 1px solid #f0f0f0; }
    `],
    standalone: false,
})
export class ValuesDetailContent {
    data: any;
    constructor(
        @Inject(NZ_MODAL_DATA) modalData: any,
        private clipboard: Clipboard,
        private msg: NzMessageService,
    ) {
        this.data = modalData;
    }

    copyOne(v: OrgFieldValue): void {
        const text = v.range ? `${v.lowValue}-${v.highValue}` : v.lowValue;
        this.clipboard.copy(text || '');
        this.msg.success('Copied');
    }

    copyAll(): void {
        const text = this.data.values
            .map((v: OrgFieldValue) => v.range ? `${v.lowValue}-${v.highValue}` : v.lowValue)
            .join('\n');
        this.clipboard.copy(text);
        this.msg.success('All values copied');
    }
}
