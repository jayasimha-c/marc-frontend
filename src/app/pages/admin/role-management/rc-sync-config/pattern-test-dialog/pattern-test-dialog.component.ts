import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RcSyncConfigService, PatternTestResult } from '../rc-sync-config.service';

export interface PatternTestDialogData {
    sapSystemId: number;
    pattern: string;
    patternType: string;
}

@Component({
    selector: 'app-pattern-test-dialog',
    template: `
        <div class="ptd__info">
            <div class="ptd__info-row">
                <span class="ptd__label">Pattern:</span>
                <span class="ptd__value ptd__value--code">{{ data.pattern }}</span>
            </div>
            <div class="ptd__info-row">
                <span class="ptd__label">Type:</span>
                <span class="ptd__value">{{ data.patternType }}</span>
            </div>
        </div>

        <div *ngIf="loading" class="ptd__loading">
            <nz-spin nzSimple></nz-spin>
        </div>

        <div *ngIf="error" class="ptd__error">
            <span nz-icon nzType="exclamation-circle" nzTheme="outline"></span>
            {{ error }}
        </div>

        <ng-container *ngIf="!loading && !error && result">
            <div class="ptd__summary" [class.ptd__summary--success]="result.count > 0">
                <span nz-icon [nzType]="result.count > 0 ? 'check-circle' : 'info-circle'" nzTheme="outline"></span>
                <span>{{ result.count }} role(s) match this pattern</span>
            </div>

            <div *ngIf="result.roles.length > 0" class="ptd__roles">
                <div *ngFor="let role of result.roles" class="ptd__role">
                    <span class="ptd__role-name">{{ role.name }}</span>
                    <span class="ptd__role-desc">{{ role.description || '-' }}</span>
                </div>
            </div>
        </ng-container>

        <div class="ptd__footer">
            <button nz-button nzType="default" (click)="modal.close()">Close</button>
        </div>
    `,
    styles: [`
        .ptd__info {
            background: #fafafa;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 16px;
        }
        .ptd__info-row {
            display: flex;
            gap: 8px;
            margin-bottom: 4px;
        }
        .ptd__info-row:last-child { margin-bottom: 0; }
        .ptd__label {
            color: #8c8c8c;
            font-size: 13px;
            min-width: 60px;
        }
        .ptd__value {
            font-weight: 500;
        }
        .ptd__value--code {
            font-family: monospace;
        }
        .ptd__loading {
            display: flex;
            justify-content: center;
            padding: 32px;
        }
        .ptd__error {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background: #fff2f0;
            border-radius: 6px;
            color: #ff4d4f;
        }
        .ptd__summary {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background: #fafafa;
            border-radius: 6px;
            margin-bottom: 16px;
            color: #8c8c8c;
        }
        .ptd__summary--success {
            color: #52c41a;
        }
        .ptd__roles {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #f0f0f0;
            border-radius: 6px;
        }
        .ptd__role {
            display: flex;
            flex-direction: column;
            padding: 10px 12px;
            border-bottom: 1px solid #f0f0f0;
        }
        .ptd__role:last-child { border-bottom: none; }
        .ptd__role-name {
            font-family: monospace;
            font-size: 13px;
            font-weight: 500;
        }
        .ptd__role-desc {
            font-size: 12px;
            color: #8c8c8c;
            margin-top: 2px;
        }
        .ptd__footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #f0f0f0;
        }
    `],
    standalone: false,
})
export class PatternTestDialogComponent implements OnInit {
    loading = false;
    error: string | null = null;
    result: PatternTestResult | null = null;

    constructor(
        public modal: NzModalRef,
        @Inject(NZ_MODAL_DATA) public data: PatternTestDialogData,
        private rcSyncService: RcSyncConfigService
    ) {}

    ngOnInit(): void {
        this.testPattern();
    }

    private testPattern(): void {
        this.loading = true;
        this.error = null;

        this.rcSyncService.testPattern(this.data.sapSystemId, this.data.pattern, this.data.patternType)
            .subscribe({
                next: (res) => {
                    this.loading = false;
                    if (res.success && res.data) {
                        this.result = res.data;
                    } else {
                        this.error = res.message || 'Failed to test pattern';
                    }
                },
                error: () => {
                    this.loading = false;
                    this.error = 'Failed to test pattern';
                }
            });
    }
}
