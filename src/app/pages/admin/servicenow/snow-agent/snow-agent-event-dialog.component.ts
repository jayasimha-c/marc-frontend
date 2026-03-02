import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { ServiceNowService, SnowAgentEventLog } from '../servicenow.service';

const STEP_LABELS: { [key: string]: string } = {
  POLL_INITIATED: 'Poll Initiated',
  SNOW_FETCH: 'SNOW Fetch',
  DUPLICATE_CHECK: 'Duplicate Check',
  USER_EXTRACTED: 'User Extracted',
  IDENTITY_RESOLVED: 'Identity Resolved',
  ROLE_EXTRACTED: 'Role Extracted',
  CATALOGUE_LOOKUP: 'Catalogue Lookup',
  RISK_ANALYSIS: 'Risk Analysis',
  DECISION_MADE: 'Decision Made',
  PROVISIONING: 'Provisioning',
  SNOW_UPDATE: 'SNOW Update',
  REQUEST_COMPLETE: 'Request Complete',
  POLL_COMPLETE: 'Poll Complete'
};

@Component({
  standalone: false,
  selector: 'app-snow-agent-event-dialog',
  template: `
    <!-- Header -->
    <div class="event-dialog__header">
      <span nz-icon nzType="field-time" nzTheme="outline" class="event-dialog__header-icon"></span>
      <span>Event Timeline</span>
      <span class="event-dialog__request-id">{{ data.requestId }}</span>
    </div>

    <!-- Content -->
    <div class="event-dialog__content">
      <nz-spin *ngIf="loading" [nzSpinning]="true" style="min-height: 100px;"></nz-spin>

      <nz-empty *ngIf="!loading && events.length === 0" nzNotFoundContent="No events found for this request"></nz-empty>

      <div *ngIf="!loading && events.length > 0" class="timeline">
        <div *ngFor="let event of events; let i = index; let last = last"
          class="timeline__item"
          [class.timeline__item--failed]="event.status === 'FAILED'"
          [class.timeline__item--skipped]="event.status === 'SKIPPED'">

          <!-- Connector -->
          <div class="timeline__connector">
            <div class="timeline__dot" [ngClass]="getStatusClass(event.status)">
              <span nz-icon [nzType]="getStatusIcon(event.status)" nzTheme="outline"></span>
            </div>
            <div *ngIf="!last" class="timeline__line"
              [class.timeline__line--failed]="event.status === 'FAILED'"></div>
          </div>

          <!-- Body -->
          <div class="timeline__body">
            <div class="timeline__head">
              <span class="timeline__step-label">
                Step {{ event.stepNumber }}: {{ getStepLabel(event.eventType) }}
              </span>
              <nz-tag [nzColor]="getStatusTagColor(event.status)">{{ event.status }}</nz-tag>
              <span *ngIf="event.durationMs > 0" class="timeline__duration">{{ event.durationMs }}ms</span>
            </div>

            <p *ngIf="event.message" class="timeline__message">{{ event.message }}</p>

            <!-- Input/Output data -->
            <div *ngIf="event.inputData || event.outputData || event.errorDetail" class="timeline__data">
              <a *ngIf="event.inputData" nz-button nzType="link" nzSize="small" (click)="toggleData(i, 'input')">
                <span nz-icon [nzType]="expandedData[i + '_input'] ? 'up' : 'down'" nzTheme="outline"></span> Input
              </a>
              <pre *ngIf="event.inputData && expandedData[i + '_input']" class="timeline__data-block">{{ formatJson(event.inputData) }}</pre>

              <a *ngIf="event.outputData" nz-button nzType="link" nzSize="small" (click)="toggleData(i, 'output')">
                <span nz-icon [nzType]="expandedData[i + '_output'] ? 'up' : 'down'" nzTheme="outline"></span> Output
              </a>
              <pre *ngIf="event.outputData && expandedData[i + '_output']" class="timeline__data-block">{{ formatJson(event.outputData) }}</pre>

              <nz-alert *ngIf="event.errorDetail" nzType="error" [nzMessage]="event.errorDetail" nzShowIcon></nz-alert>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="event-dialog__footer">
      <button nz-button nzType="default" (click)="modalRef.close()">Close</button>
    </div>
  `,
  styles: [`
    .event-dialog__header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .event-dialog__header-icon {
      font-size: 18px;
      color: #1890ff;
    }
    .event-dialog__request-id {
      margin-left: auto;
      font-size: 12px;
      font-weight: normal;
      color: #8c8c8c;
      font-family: monospace;
    }
    .event-dialog__content {
      max-height: 60vh;
      overflow-y: auto;
    }
    .event-dialog__footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }

    .timeline__item {
      display: flex;
      gap: 12px;
      min-height: 48px;
    }
    .timeline__connector {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 24px;
    }
    .timeline__dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 14px;
    }
    .dot-success { color: #52c41a; }
    .dot-failed { color: #ff4d4f; }
    .dot-skipped { color: #8c8c8c; }
    .timeline__line {
      width: 2px;
      flex: 1;
      min-height: 16px;
      background: #d9d9d9;
    }
    .timeline__line--failed {
      background: rgba(255, 77, 79, 0.3);
    }
    .timeline__body {
      flex: 1;
      padding-bottom: 16px;
    }
    .timeline__head {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .timeline__step-label {
      font-weight: 600;
      font-size: 13px;
    }
    .timeline__duration {
      font-size: 11px;
      color: #8c8c8c;
      font-family: monospace;
    }
    .timeline__message {
      font-size: 13px;
      color: #595959;
      margin: 4px 0 0 0;
    }
    .timeline__data {
      margin-top: 6px;
    }
    .timeline__data-block {
      font-size: 11px;
      font-family: monospace;
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      padding: 8px;
      margin: 4px 0 8px 0;
      overflow-x: auto;
      max-height: 180px;
      white-space: pre-wrap;
      word-break: break-all;
    }
  `]
})
export class SnowAgentEventDialogComponent implements OnInit {
  events: SnowAgentEventLog[] = [];
  loading = true;
  expandedData: { [key: string]: boolean } = {};
  data: { requestId: string };

  constructor(
    @Inject(NZ_MODAL_DATA) modalData: any,
    public modalRef: NzModalRef,
    private servicenowService: ServiceNowService
  ) {
    this.data = modalData || {};
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.servicenowService.getAgentEvents(this.data.requestId).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.events = resp.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getStepLabel(eventType: string): string {
    return STEP_LABELS[eventType] || eventType;
  }

  getStatusIcon(status: string): string {
    if (status === 'SUCCESS') return 'check-circle';
    if (status === 'FAILED') return 'close-circle';
    return 'minus-circle';
  }

  getStatusClass(status: string): string {
    if (status === 'SUCCESS') return 'dot-success';
    if (status === 'FAILED') return 'dot-failed';
    return 'dot-skipped';
  }

  getStatusTagColor(status: string): string {
    if (status === 'SUCCESS') return 'success';
    if (status === 'FAILED') return 'error';
    return 'default';
  }

  toggleData(index: number, type: string): void {
    const key = index + '_' + type;
    this.expandedData[key] = !this.expandedData[key];
  }

  formatJson(jsonStr: string): string {
    if (!jsonStr) return '';
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  }
}
