import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { ConditionGroups, AuditRuleThreshold } from "./audit-rule-builder.model";
import { PURPOSE_CONFIG, getFieldMeta, getOperators, TIME_UNITS, PurposeConfig } from "./audit-rule-builder.constants";

@Component({
    standalone: false,
    selector: "audit-rule-preview",
    template: `
        <div class="preview-container">
            <div class="preview-header">
                <span class="preview-title">Rule Summary</span>
            </div>
            <div class="preview-body">
                <div class="preview-content">
                    <span nz-icon nzType="eye" nzTheme="outline" class="preview-icon"></span>
                    <p class="preview-text">{{ summary }}</p>
                </div>
                <div class="preview-stats">
                    <span *ngFor="let stat of stats"
                          class="stat-item"
                          [class.active]="stat.count > 0"
                          [style.--stat-color]="stat.color">
                        <span class="stat-dot"></span>
                        {{ stat.label }}: {{ stat.count }}
                    </span>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .preview-container {
            background: #fff;
            border: 1px solid #f0f0f0;
            border-radius: 4px;
            overflow: hidden;
        }
        .preview-header {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            background: rgba(0, 0, 0, 0.02);
            border-bottom: 1px solid #f0f0f0;
        }
        .preview-title {
            font-size: 13px;
            font-weight: 600;
            color: rgba(0,0,0,0.85);
        }
        .preview-body {
            padding: 14px;
        }
        .preview-content {
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        .preview-icon {
            color: rgba(0,0,0,0.25);
            font-size: 15px;
            width: 15px;
            height: 15px;
            margin-top: 2px;
            flex-shrink: 0;
        }
        .preview-text {
            flex: 1;
            font-size: 13px;
            line-height: 1.5;
            color: rgba(0,0,0,0.45);
            margin: 0;
        }
        .preview-stats {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #f0f0f0;
        }
        .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            font-weight: 500;
            color: rgba(0,0,0,0.25);
        }
        .stat-item.active {
            color: var(--stat-color);
        }
        .stat-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(0,0,0,0.25);
        }
        .stat-item.active .stat-dot {
            background: var(--stat-color);
        }
    `]
})
export class AuditRulePreviewComponent implements OnChanges {

    @Input() groups: ConditionGroups;
    @Input() groupBy: string[] = [];
    @Input() threshold: AuditRuleThreshold;

    summary: string = "No conditions defined yet.";
    stats: { label: string; count: number; color: string }[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        this.updateSummary();
        this.updateStats();
    }

    private updateSummary(): void {
        if (!this.groups) {
            this.summary = "No conditions defined yet.";
            return;
        }

        const parts: string[] = [];
        const detect = this.groups.detect || [];
        const whitelist = this.groups.whitelist || [];
        const blacklist = this.groups.blacklist || [];
        const reset = this.groups.reset || [];

        if (detect.length > 0) {
            const condParts = detect.map(c => {
                const field = getFieldMeta(c.field).label;
                const ops = getOperators(getFieldMeta(c.field).type);
                const op = ops.find(o => o.value === c.conditionType)?.label || c.conditionType;
                const vals = c.values.join(", ") || "...";
                return `${field} ${op} ${vals}`;
            });
            parts.push("Detect when " + condParts.join(" AND "));
        }

        if (whitelist.length > 0) {
            const condParts = whitelist.map(c => {
                const field = getFieldMeta(c.field).label;
                const vals = c.values.join(", ") || "...";
                return `${field} = ${vals}`;
            });
            parts.push("Skip if " + condParts.join(" OR "));
        }

        if (blacklist.length > 0) {
            const condParts = blacklist.map(c => {
                const field = getFieldMeta(c.field).label;
                const vals = c.values.join(", ") || "...";
                return `${field} = ${vals}`;
            });
            parts.push("Immediate alert if " + condParts.join(" OR "));
        }

        if (this.groupBy?.length > 0) {
            parts.push("Grouped by " + this.groupBy.join(", "));
        }

        if (this.threshold?.amount && this.threshold?.interval) {
            const unit = TIME_UNITS.find(u => u.value === this.threshold.unit);
            const unitLabel = unit?.label.toLowerCase() || 'days';
            parts.push(`Alert after ${this.threshold.amount} occurrence${this.threshold.amount > 1 ? "s" : ""} in ${this.threshold.interval} ${unitLabel}`);
        }

        if (reset.length > 0) {
            const condParts = reset.map(c => {
                const field = getFieldMeta(c.field).label;
                const vals = c.values.join(", ") || "...";
                return `${field} = ${vals}`;
            });
            parts.push("Counter resets when " + condParts.join(" OR "));
        }

        this.summary = parts.length > 0 ? parts.join(". ") + "." : "No conditions defined yet.";
    }

    private updateStats(): void {
        this.stats = PURPOSE_CONFIG.map(p => ({
            label: p.label,
            count: this.groups?.[p.key]?.length || 0,
            color: p.color
        }));
    }
}
