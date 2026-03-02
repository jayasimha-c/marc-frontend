import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, AfterViewInit } from "@angular/core";
import { NzModalService } from "ng-zorro-antd/modal";
import { SapAuditLogField } from "../../../sap-audit-log.model";
import { AuditValuesDialogComponent, AuditValuesDialogData } from "./audit-values-dialog.component";
import { getFieldMeta } from "./audit-rule-builder.constants";

@Component({
    standalone: false,
    selector: "audit-value-input",
    template: `
        <div class="value-input-container" (click)="openDialog()">
            <div class="chips-area" #chipsArea>
                <span *ngFor="let value of visibleValues" class="value-chip">
                    {{ getDisplayValue(value) }}
                </span>
                <span *ngIf="hiddenCount > 0" class="more-badge">
                    +{{ hiddenCount }} more
                </span>
                <span *ngIf="values.length === 0" class="placeholder-text">
                    {{ placeholder }}
                </span>
            </div>
            <button type="button" class="edit-btn" (click)="openDialog(); $event.stopPropagation()">
                <span nz-icon nzType="edit" nzTheme="outline"></span>
            </button>
        </div>
    `,
    styles: [`
        .value-input-container {
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 32px;
            padding: 4px 8px;
            border: 1px solid #f0f0f0;
            border-radius: 4px;
            background: #fff;
            cursor: pointer;
            transition: border-color 0.2s;
        }
        .value-input-container:hover {
            border-color: rgba(0,0,0,0.25);
        }
        .chips-area {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 4px;
            min-width: 0;
            overflow: hidden;
        }
        .value-chip {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            background: #fafafa;
            border: 1px solid #f0f0f0;
            border-radius: 3px;
            font-family: var(--font-code);
            font-size: 11px;
            color: rgba(0,0,0,0.85);
            white-space: nowrap;
            flex-shrink: 0;
        }
        .more-badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            background: #1890ff;
            color: #fff;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 500;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .placeholder-text {
            font-size: 12px;
            color: rgba(0,0,0,0.25);
        }
        .edit-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            padding: 0;
            border: none;
            border-radius: 4px;
            background: transparent;
            color: rgba(0,0,0,0.25);
            cursor: pointer;
            flex-shrink: 0;
            transition: all 0.15s;
        }
        .edit-btn:hover {
            background: #fafafa;
            color: rgba(0,0,0,0.85);
        }
        .edit-btn span[nz-icon] {
            font-size: 16px;
            width: 16px;
            height: 16px;
        }
    `]
})
export class AuditValueInputComponent implements OnInit, OnChanges, AfterViewInit {

    @ViewChild('chipsArea') chipsArea: ElementRef<HTMLDivElement>;

    @Input() values: string[] = [];
    @Input() field: SapAuditLogField = SapAuditLogField.EVENT;
    @Input() placeholder: string = "Click to add values...";
    @Input() eventSuggestions: string[] = [];
    @Input() clientSuggestions: { name: string; clientNo: string }[] = [];

    @Output() valuesChange = new EventEmitter<string[]>();

    visibleValues: string[] = [];
    hiddenCount: number = 0;

    private resizeObserver: ResizeObserver;

    constructor(private nzModal: NzModalService) {}

    ngOnInit(): void {
        this.calculateVisibleValues();
    }

    ngAfterViewInit(): void {
        // Observe container resize to recalculate visible chips
        this.resizeObserver = new ResizeObserver(() => {
            this.calculateVisibleValues();
        });
        if (this.chipsArea?.nativeElement) {
            this.resizeObserver.observe(this.chipsArea.nativeElement);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['values']) {
            this.calculateVisibleValues();
        }
    }

    ngOnDestroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    private calculateVisibleValues(): void {
        if (!this.values || this.values.length === 0) {
            this.visibleValues = [];
            this.hiddenCount = 0;
            return;
        }

        // Start with showing values and calculate how many fit
        // We use a simple heuristic based on estimated chip width
        const containerWidth = this.chipsArea?.nativeElement?.offsetWidth || 200;
        const avgChipWidth = 70; // Estimated average chip width
        const moreBadgeWidth = 60; // Width for "+X more" badge
        const availableWidth = containerWidth - moreBadgeWidth;

        let maxVisible = Math.floor(availableWidth / avgChipWidth);
        maxVisible = Math.max(1, Math.min(maxVisible, this.values.length));

        if (this.values.length <= maxVisible) {
            this.visibleValues = [...this.values];
            this.hiddenCount = 0;
        } else {
            this.visibleValues = this.values.slice(0, maxVisible);
            this.hiddenCount = this.values.length - maxVisible;
        }
    }

    openDialog(): void {
        const fieldMeta = getFieldMeta(this.field);
        const dialogData: AuditValuesDialogData = {
            title: `Edit ${fieldMeta.label} Values`,
            values: this.values || [],
            placeholder: `Enter ${fieldMeta.label.toLowerCase()} values...`
        };

        const modalRef = this.nzModal.create({
            nzTitle: dialogData.title,
            nzContent: AuditValuesDialogComponent,
            nzData: dialogData,
            nzClassName: 'audit-values-dialog-panel',
            nzFooter: null,
        });

        modalRef.afterClose.subscribe(result => {
            if (result !== undefined) {
                this.valuesChange.emit(result);
            }
        });
    }

    getDisplayValue(value: string): string {
        // For client numbers, try to show display name
        if (this.field === SapAuditLogField.CLIENT_NO && this.clientSuggestions?.length) {
            const client = this.clientSuggestions.find(c => c.clientNo === value);
            if (client) {
                return `${client.name} (${value})`;
            }
        }
        return value;
    }
}
