import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RoleConceptService, EntityVersion, RoleConceptTemplate, RoleConceptSegment } from './role-concept.service';

interface SegmentChange {
    segmentName: string;
    segmentOrder: number;
    type: 'added' | 'removed' | 'modified';
    oldValue?: Partial<RoleConceptSegment>;
    newValue?: Partial<RoleConceptSegment>;
    changes?: string[];
}

interface PropertyChange {
    property: string;
    oldValue: any;
    newValue: any;
}

interface VersionChanges {
    properties: PropertyChange[];
    segments: SegmentChange[];
    summary: string;
}

@Component({
    selector: 'app-version-timeline',
    standalone: false,
    template: `
        <div class="version-timeline">
            <div class="timeline-header">
                <h4>Version History</h4>
                <button nz-button nzType="text" nzShape="circle" (click)="loadVersionHistory()" [disabled]="loading" nz-tooltip nzTooltipTitle="Refresh">
                    <span nz-icon nzType="reload" nzTheme="outline"></span>
                </button>
            </div>

            <ng-container *ngIf="loading">
                <div class="loading-spinner">
                    <nz-spin nzSimple [nzSize]="'small'"></nz-spin>
                </div>
            </ng-container>

            <ng-container *ngIf="!loading && versions.length === 0">
                <div class="no-versions">
                    <span nz-icon nzType="history" nzTheme="outline" class="text-hint"></span>
                    <p>No version history available</p>
                </div>
            </ng-container>

            <ng-container *ngIf="!loading && versions.length > 0">
                <div class="timeline">
                    <ng-container *ngFor="let version of versions; let i = index; let first = first">
                        <div class="timeline-item"
                             [class.expanded]="expandedVersion?.version === version.version"
                             (click)="toggleVersion(version)">
                            <div class="timeline-marker" [ngClass]="getChangeTypeClass(version.changeType)">
                                <span nz-icon [nzType]="getChangeTypeIcon(version.changeType)" nzTheme="outline"></span>
                            </div>
                            <div class="timeline-content">
                                <div class="version-header">
                                    <div class="version-info">
                                        <span class="version-number">v{{ version.version }}</span>
                                        <span class="change-type" [ngClass]="getChangeTypeClass(version.changeType)">
                                            {{ version.changeType }}
                                        </span>
                                        <span *ngIf="first" class="current-badge">Current</span>
                                    </div>
                                    <span nz-icon class="expand-icon" [nzType]="expandedVersion?.version === version.version ? 'up' : 'down'" nzTheme="outline"></span>
                                </div>
                                <div class="version-meta">
                                    <span *ngIf="version.changedBy" class="changed-by">
                                        <span nz-icon nzType="user" nzTheme="outline" class="small-icon"></span>
                                        {{ version.changedBy }}
                                    </span>
                                    <span *ngIf="version.changedDate" class="changed-date">
                                        <span nz-icon nzType="clock-circle" nzTheme="outline" class="small-icon"></span>
                                        {{ formatDate(version.changedDate) }}
                                    </span>
                                </div>

                                <!-- Expanded content -->
                                <div *ngIf="expandedVersion?.version === version.version && expandedVersion?.snapshotJson" class="version-details" (click)="$event.stopPropagation()">
                                    <!-- Changes summary -->
                                    <div *ngIf="versionChanges" class="changes-section">
                                        <div class="changes-header">
                                            <span nz-icon nzType="swap" nzTheme="outline" class="text-secondary"></span>
                                            <span>{{ versionChanges.summary }}</span>
                                        </div>

                                        <!-- Property changes -->
                                        <div *ngIf="versionChanges.properties.length > 0" class="property-changes">
                                            <h6>Template Changes</h6>
                                            <div *ngFor="let prop of versionChanges.properties" class="property-change">
                                                <span class="prop-name">{{ formatPropertyName(prop.property) }}:</span>
                                                <ng-container *ngIf="prop.oldValue !== undefined && prop.oldValue !== null">
                                                    <span class="prop-old">{{ formatPropertyValue(prop.property, prop.oldValue) }}</span>
                                                    <span nz-icon nzType="right" nzTheme="outline" class="arrow-icon"></span>
                                                </ng-container>
                                                <span class="prop-new">{{ formatPropertyValue(prop.property, prop.newValue) }}</span>
                                            </div>
                                        </div>

                                        <!-- Segment changes -->
                                        <div *ngIf="versionChanges.segments.length > 0" class="segment-changes">
                                            <h6>Segment Changes</h6>
                                            <div *ngFor="let seg of versionChanges.segments" class="segment-change" [ngClass]="seg.type">
                                                <div class="segment-header">
                                                    <span nz-icon class="segment-icon" [nzType]="seg.type === 'added' ? 'plus-circle' : seg.type === 'removed' ? 'minus-circle' : 'edit'" nzTheme="outline"></span>
                                                    <span class="segment-order">#{{ seg.segmentOrder }}</span>
                                                    <span class="segment-name">{{ seg.segmentName }}</span>
                                                    <span *ngIf="seg.newValue?.segmentType || seg.oldValue?.segmentType" class="segment-type-badge">
                                                        {{ seg.newValue?.segmentType || seg.oldValue?.segmentType }}
                                                    </span>
                                                </div>
                                                <div *ngIf="seg.changes && seg.changes.length > 0" class="segment-details">
                                                    <span *ngFor="let change of seg.changes" class="change-item">{{ change }}</span>
                                                </div>
                                                <div *ngIf="seg.type === 'added' && seg.newValue" class="segment-details">
                                                    <span class="change-item added">
                                                        Type: {{ seg.newValue.segmentType }}
                                                        <ng-container *ngIf="seg.newValue.length">, Length: {{ seg.newValue.length }}</ng-container>
                                                        <ng-container *ngIf="seg.newValue.isRequired">, Required</ng-container>
                                                    </span>
                                                </div>
                                                <div *ngIf="seg.type === 'removed' && seg.oldValue" class="segment-details">
                                                    <span class="change-item removed">
                                                        Was: {{ seg.oldValue.segmentType }}
                                                        <ng-container *ngIf="seg.oldValue.length">, Length: {{ seg.oldValue.length }}</ng-container>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div *ngIf="versionChanges.properties.length === 0 && versionChanges.segments.length === 0" class="no-changes-detail">
                                            <span nz-icon nzType="info-circle" nzTheme="outline"></span>
                                            <span>No detailed changes available for comparison</span>
                                        </div>
                                    </div>

                                    <!-- Current snapshot summary -->
                                    <div *ngIf="currentSnapshot" class="snapshot-summary">
                                        <h6>Snapshot at this version</h6>
                                        <div class="snapshot-info">
                                            <div class="info-row">
                                                <span class="label">Name:</span>
                                                <span class="value">{{ currentSnapshot.name }}</span>
                                            </div>
                                            <div *ngIf="currentSnapshot.description" class="info-row">
                                                <span class="label">Description:</span>
                                                <span class="value">{{ currentSnapshot.description }}</span>
                                            </div>
                                            <div class="info-row">
                                                <span class="label">Format:</span>
                                                <span class="value format-badge">{{ currentSnapshot.formatType }}</span>
                                            </div>
                                            <div *ngIf="currentSnapshot.roleType" class="info-row">
                                                <span class="label">Role Type:</span>
                                                <span class="value">{{ currentSnapshot.roleType }}</span>
                                            </div>
                                            <div class="info-row">
                                                <span class="label">Status:</span>
                                                <span class="value" [class.active]="currentSnapshot.isActive" [class.inactive]="!currentSnapshot.isActive">
                                                    {{ currentSnapshot.isActive ? 'Active' : 'Inactive' }}
                                                </span>
                                            </div>
                                            <div *ngIf="currentSnapshot.segments && currentSnapshot.segments.length > 0" class="segments-summary">
                                                <span class="label">Segments ({{ currentSnapshot.segments.length }}):</span>
                                                <div class="segments-list">
                                                    <div *ngFor="let seg of currentSnapshot.segments" class="segment-summary-item">
                                                        <span class="seg-order">#{{ seg.segmentOrder }}</span>
                                                        <span class="seg-name">{{ seg.segmentName }}</span>
                                                        <span class="seg-type">{{ seg.segmentType }}</span>
                                                        <span *ngIf="seg.length" class="seg-length">({{ seg.length }} chars)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ng-container>
                </div>
            </ng-container>
        </div>
    `,
    styles: [`
        .version-timeline {
            padding: 16px;
            background: #fff;
            border-radius: 8px;
            max-height: 600px;
            overflow-y: auto;
        }

        .timeline-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f0f0f0;

            h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }
        }

        .loading-spinner {
            display: flex;
            justify-content: center;
            padding: 24px;
        }

        .no-versions {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px;
            color: rgba(0,0,0,0.25);

            span[nz-icon] {
                font-size: 32px;
                width: 32px;
                height: 32px;
                margin-bottom: 8px;
            }

            p {
                margin: 0;
                font-size: 13px;
            }
        }

        .timeline {
            position: relative;
            padding-left: 28px;

            &::before {
                content: '';
                position: absolute;
                left: 11px;
                top: 12px;
                bottom: 12px;
                width: 2px;
                background: #f0f0f0;
            }
        }

        .timeline-item {
            position: relative;
            margin-bottom: 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;

            &:hover {
                background: rgba(0, 0, 0, 0.02);
                border-color: #f0f0f0;
            }

            &.expanded {
                background: rgba(0, 0, 0, 0.03);
                border-color: #f0f0f0;
            }
        }

        .timeline-marker {
            position: absolute;
            left: -28px;
            top: 12px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            border: 2px solid #f0f0f0;
            z-index: 1;

            span[nz-icon] {
                font-size: 14px;
                width: 14px;
                height: 14px;
            }

            &.created {
                border-color: #16a34a;
                color: #16a34a;
                background: rgba(22, 163, 74, 0.1);
            }

            &.updated {
                border-color: #1890ff;
                color: #1890ff;
                background: rgba(24, 144, 255, 0.1);
            }

            &.deleted {
                border-color: #dc2626;
                color: #dc2626;
                background: rgba(220, 38, 38, 0.1);
            }
        }

        .timeline-content {
            padding: 12px;

            .version-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;

                .version-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .version-number {
                    font-weight: 600;
                    font-size: 13px;
                }

                .change-type {
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    font-weight: 500;

                    &.created {
                        background: rgba(22, 163, 74, 0.1);
                        color: #16a34a;
                    }

                    &.updated {
                        background: rgba(24, 144, 255, 0.1);
                        color: #1890ff;
                    }

                    &.deleted {
                        background: rgba(220, 38, 38, 0.1);
                        color: #dc2626;
                    }
                }

                .current-badge {
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: rgba(22, 163, 74, 0.1);
                    color: #16a34a;
                    font-weight: 500;
                }

                .expand-icon {
                    color: rgba(0,0,0,0.25);
                    font-size: 20px;
                    width: 20px;
                    height: 20px;
                }
            }

            .version-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                font-size: 12px;
                color: rgba(0,0,0,0.45);

                span {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .small-icon {
                    font-size: 14px;
                    width: 14px;
                    height: 14px;
                }
            }
        }

        .version-details {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #f0f0f0;
        }

        .changes-section {
            .changes-header {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                font-weight: 500;
                margin-bottom: 12px;
                color: rgba(0,0,0,0.85);

                span[nz-icon] {
                    font-size: 18px;
                    width: 18px;
                    height: 18px;
                }
            }
        }

        .property-changes, .segment-changes {
            margin-bottom: 16px;

            h6 {
                margin: 0 0 8px 0;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: rgba(0,0,0,0.25);
            }
        }

        .property-change {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            background: #fafafa;
            border-radius: 4px;
            margin-bottom: 4px;
            font-size: 12px;

            .prop-name {
                font-weight: 500;
                color: rgba(0,0,0,0.45);
            }

            .prop-old {
                color: #dc2626;
                text-decoration: line-through;
            }

            .arrow-icon {
                font-size: 14px;
                width: 14px;
                height: 14px;
                color: rgba(0,0,0,0.25);
            }

            .prop-new {
                color: #16a34a;
                font-weight: 500;
            }
        }

        .segment-change {
            padding: 8px;
            background: #fafafa;
            border-radius: 6px;
            margin-bottom: 8px;
            border-left: 3px solid transparent;

            &.added {
                border-left-color: #16a34a;
            }

            &.removed {
                border-left-color: #dc2626;
            }

            &.modified {
                border-left-color: #1890ff;
            }

            .segment-header {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;

                .segment-icon {
                    font-size: 16px;
                    width: 16px;
                    height: 16px;
                }

                .segment-order {
                    font-size: 11px;
                    font-weight: 600;
                    color: rgba(0,0,0,0.25);
                }

                .segment-name {
                    font-weight: 600;
                    font-size: 12px;
                }

                .segment-type-badge {
                    font-size: 10px;
                    padding: 1px 4px;
                    border-radius: 3px;
                    background: rgba(0, 0, 0, 0.08);
                    color: rgba(0,0,0,0.45);
                }
            }

            &.added .segment-icon { color: #16a34a; }
            &.removed .segment-icon { color: #dc2626; }
            &.modified .segment-icon { color: #1890ff; }

            .segment-details {
                padding-left: 22px;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }

            .change-item {
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 3px;
                background: rgba(0, 0, 0, 0.05);
                color: rgba(0,0,0,0.45);

                &.added {
                    background: rgba(22, 163, 74, 0.1);
                    color: #16a34a;
                }

                &.removed {
                    background: rgba(220, 38, 38, 0.1);
                    color: #dc2626;
                    text-decoration: line-through;
                }
            }
        }

        .no-changes-detail {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background: #fafafa;
            border-radius: 6px;
            font-size: 12px;
            color: rgba(0,0,0,0.45);

            span[nz-icon] {
                font-size: 18px;
                width: 18px;
                height: 18px;
            }
        }

        .snapshot-summary {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px dashed #f0f0f0;

            h6 {
                margin: 0 0 12px 0;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: rgba(0,0,0,0.25);
            }

            .snapshot-info {
                .info-row {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 6px;
                    font-size: 12px;

                    .label {
                        font-weight: 500;
                        color: rgba(0,0,0,0.45);
                        min-width: 80px;
                    }

                    .value {
                        color: rgba(0,0,0,0.85);

                        &.active {
                            color: #16a34a;
                        }

                        &.inactive {
                            color: #dc2626;
                        }

                        &.format-badge {
                            font-size: 11px;
                            padding: 1px 4px;
                            background: rgba(0, 0, 0, 0.08);
                            border-radius: 3px;
                        }
                    }
                }

                .segments-summary {
                    margin-top: 12px;

                    > .label {
                        display: block;
                        font-weight: 500;
                        color: rgba(0,0,0,0.45);
                        margin-bottom: 8px;
                        font-size: 12px;
                    }

                    .segments-list {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .segment-summary-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 4px 8px;
                        background: #fafafa;
                        border-radius: 4px;
                        font-size: 11px;

                        .seg-order {
                            font-weight: 600;
                            color: rgba(0,0,0,0.25);
                            min-width: 20px;
                        }

                        .seg-name {
                            font-weight: 500;
                            color: rgba(0,0,0,0.85);
                        }

                        .seg-type {
                            font-size: 10px;
                            padding: 1px 4px;
                            background: rgba(0, 0, 0, 0.08);
                            border-radius: 3px;
                            color: rgba(0,0,0,0.45);
                        }

                        .seg-length {
                            color: rgba(0,0,0,0.25);
                        }
                    }
                }
            }
        }
    `]
})
export class VersionTimelineComponent implements OnChanges {
    @Input() templateId: number | null = null;

    versions: EntityVersion[] = [];
    expandedVersion: EntityVersion | null = null;
    loading = false;
    versionChanges: VersionChanges | null = null;
    currentSnapshot: RoleConceptTemplate | null = null;

    private datePipe = new DatePipe('en-US');

    constructor(
        private roleConceptService: RoleConceptService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['templateId'] && this.templateId) {
            this.loadVersionHistory();
        }
    }

    loadVersionHistory(): void {
        if (!this.templateId) return;

        this.loading = true;
        this.versions = [];
        this.expandedVersion = null;
        this.versionChanges = null;

        this.roleConceptService.getTemplateVersionHistory(this.templateId).subscribe({
            next: (response) => {
                this.loading = false;
                if (response.success && response.data) {
                    this.versions = (response.data as EntityVersion[]).sort((a, b) => b.version - a.version);
                }
            },
            error: (err) => {
                this.loading = false;
            }
        });
    }

    toggleVersion(version: EntityVersion): void {
        if (this.expandedVersion?.version === version.version) {
            this.expandedVersion = null;
            this.versionChanges = null;
            this.currentSnapshot = null;
            return;
        }

        if (!this.templateId) return;

        this.roleConceptService.getTemplateVersionWithComparison(this.templateId, version.version).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.expandedVersion = response.data as EntityVersion;
                    this.parseVersionChanges(response.data as EntityVersion);
                }
            },
            error: (err) => { }
        });
    }

    private parseVersionChanges(version: EntityVersion): void {
        try {
            this.currentSnapshot = version.snapshotJson ? JSON.parse(version.snapshotJson) : null;
            const previousSnapshot = version.previousSnapshotJson ? JSON.parse(version.previousSnapshotJson) : null;

            this.versionChanges = this.calculateChanges(this.currentSnapshot, previousSnapshot, version.changeType);
        } catch (e) {
            this.versionChanges = null;
        }
    }

    private calculateChanges(current: any, previous: any, changeType: string): VersionChanges {
        const changes: VersionChanges = {
            properties: [],
            segments: [],
            summary: ''
        };

        if (changeType === 'CREATED' || !previous) {
            changes.summary = 'Initial version created';
            if (current?.segments?.length > 0) {
                for (const seg of current.segments) {
                    changes.segments.push({
                        segmentName: seg.segmentName,
                        segmentOrder: seg.segmentOrder,
                        type: 'added',
                        newValue: seg
                    });
                }
            }
            return changes;
        }

        const propsToCompare = ['name', 'description', 'formatType', 'roleType', 'delimiter', 'totalLength', 'isActive'];
        for (const prop of propsToCompare) {
            if (current?.[prop] !== previous?.[prop]) {
                changes.properties.push({
                    property: prop,
                    oldValue: previous?.[prop],
                    newValue: current?.[prop]
                });
            }
        }

        const currentSegments = current?.segments || [];
        const previousSegments = previous?.segments || [];

        const currentMap = new Map<string, any>();
        const previousMap = new Map<string, any>();

        for (const seg of currentSegments) {
            currentMap.set(`${seg.segmentOrder}_${seg.segmentName}`, seg);
        }
        for (const seg of previousSegments) {
            previousMap.set(`${seg.segmentOrder}_${seg.segmentName}`, seg);
        }

        for (const [key, seg] of currentMap) {
            if (!previousMap.has(key)) {
                changes.segments.push({
                    segmentName: seg.segmentName,
                    segmentOrder: seg.segmentOrder,
                    type: 'added',
                    newValue: seg
                });
            }
        }

        for (const [key, seg] of previousMap) {
            if (!currentMap.has(key)) {
                changes.segments.push({
                    segmentName: seg.segmentName,
                    segmentOrder: seg.segmentOrder,
                    type: 'removed',
                    oldValue: seg
                });
            }
        }

        for (const [key, currentSeg] of currentMap) {
            const prevSeg = previousMap.get(key);
            if (prevSeg) {
                const segChanges = this.compareSegments(prevSeg, currentSeg);
                if (segChanges.length > 0) {
                    changes.segments.push({
                        segmentName: currentSeg.segmentName,
                        segmentOrder: currentSeg.segmentOrder,
                        type: 'modified',
                        oldValue: prevSeg,
                        newValue: currentSeg,
                        changes: segChanges
                    });
                }
            }
        }

        changes.segments.sort((a, b) => a.segmentOrder - b.segmentOrder);

        const parts: string[] = [];
        if (changes.properties.length > 0) {
            parts.push(`${changes.properties.length} property change${changes.properties.length > 1 ? 's' : ''}`);
        }
        const addedSegs = changes.segments.filter(s => s.type === 'added').length;
        const removedSegs = changes.segments.filter(s => s.type === 'removed').length;
        const modifiedSegs = changes.segments.filter(s => s.type === 'modified').length;

        if (addedSegs > 0) parts.push(`${addedSegs} segment${addedSegs > 1 ? 's' : ''} added`);
        if (removedSegs > 0) parts.push(`${removedSegs} segment${removedSegs > 1 ? 's' : ''} removed`);
        if (modifiedSegs > 0) parts.push(`${modifiedSegs} segment${modifiedSegs > 1 ? 's' : ''} modified`);

        changes.summary = parts.length > 0 ? parts.join(', ') : 'No changes detected';

        return changes;
    }

    private compareSegments(prev: any, curr: any): string[] {
        const changes: string[] = [];
        const propsToCompare = [
            'segmentType', 'startPosition', 'length', 'allowedValues',
            'minLength', 'maxLength', 'regexPattern', 'isRequired', 'errorMessage'
        ];

        for (const prop of propsToCompare) {
            if (prev[prop] !== curr[prop]) {
                const propName = this.formatPropertyName(prop);
                if (prev[prop] && curr[prop]) {
                    changes.push(`${propName}: ${prev[prop]} → ${curr[prop]}`);
                } else if (curr[prop]) {
                    changes.push(`${propName}: ${curr[prop]}`);
                } else {
                    changes.push(`${propName}: removed`);
                }
            }
        }

        return changes;
    }

    formatPropertyName(prop: string): string {
        const names: { [key: string]: string } = {
            'name': 'Name',
            'description': 'Description',
            'formatType': 'Format',
            'roleType': 'Role Type',
            'delimiter': 'Delimiter',
            'totalLength': 'Total Length',
            'isActive': 'Status',
            'segmentType': 'Type',
            'startPosition': 'Start Position',
            'length': 'Length',
            'allowedValues': 'Allowed Values',
            'minLength': 'Min Length',
            'maxLength': 'Max Length',
            'regexPattern': 'Pattern',
            'isRequired': 'Required',
            'errorMessage': 'Error Message'
        };
        return names[prop] || prop;
    }

    formatPropertyValue(prop: string, value: any): string {
        if (value === null || value === undefined) return '-';
        if (prop === 'isActive') return value ? 'Active' : 'Inactive';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return String(value);
    }

    getChangeTypeClass(changeType: string): string {
        switch (changeType?.toUpperCase()) {
            case 'CREATED': return 'created';
            case 'UPDATED': return 'updated';
            case 'DELETED': return 'deleted';
            default: return 'updated';
        }
    }

    getChangeTypeIcon(changeType: string): string {
        switch (changeType?.toUpperCase()) {
            case 'CREATED': return 'plus-circle';
            case 'UPDATED': return 'edit';
            case 'DELETED': return 'minus-circle';
            default: return 'edit';
        }
    }

    formatDate(timestamp: number): string {
        if (!timestamp) return '';
        return this.datePipe.transform(new Date(timestamp), 'MMM d, y HH:mm') || '';
    }
}
