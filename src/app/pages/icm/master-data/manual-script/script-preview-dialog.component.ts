import { Component, Inject, OnInit, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { ManualScriptService } from './manual-script.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { EVIDENCE_TYPES } from './script-editor.component';

@Component({
  selector: 'app-script-preview-dialog',
  standalone: true,
  imports: [
    CommonModule, NzButtonModule, NzIconModule, NzSpinModule,
    NzToolTipModule, NzTagModule, NzDescriptionsModule, NzEmptyModule, NzDividerModule,
  ],
  template: `
    <nz-spin [nzSpinning]="loading">
      <div *ngIf="script" style="max-height: 60vh; overflow-y: auto;">
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px;">
            {{ script.scriptName }}
            <nz-tag [nzColor]="script.isActive ? 'green' : 'default'" style="margin-left: 8px;">
              {{ script.isActive ? 'Active' : 'Inactive' }}
            </nz-tag>
          </h4>
          <p *ngIf="script.scriptDescription" style="margin: 0 0 8px;">{{ script.scriptDescription }}</p>
          <nz-tag *ngIf="script.attachmentName">
            <span nz-icon nzType="paper-clip" nzTheme="outline"></span> {{ script.attachmentName }}
          </nz-tag>
        </div>

        <nz-descriptions nzBordered nzSize="small" [nzColumn]="2" style="margin-bottom: 16px;">
          <nz-descriptions-item nzTitle="Total Steps">{{ script.steps?.length || 0 }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="Total Duration">{{ totalDuration > 0 ? totalDuration + ' min' : '-' }}</nz-descriptions-item>
        </nz-descriptions>

        <nz-divider nzText="Steps" nzOrientation="left"></nz-divider>

        <nz-empty *ngIf="!script.steps?.length" nzNotFoundContent="No steps defined"></nz-empty>

        <div *ngFor="let step of sortedSteps"
          style="padding: 12px; border: 1px solid #d9d9d9; border-radius: 2px; margin-bottom: 8px;"
          [style.opacity]="step.isActive ? 1 : 0.6">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <nz-tag nzColor="blue">{{ step.stepOrder }}</nz-tag>
            <strong>{{ step.stepName }}</strong>
            <nz-tag *ngIf="!step.isActive">Inactive</nz-tag>
            <span *ngIf="step.evidenceRequired" nz-icon nzType="safety-certificate" nzTheme="outline"
              nz-tooltip nzTooltipTitle="Evidence Required"></span>
          </div>

          <nz-descriptions *ngIf="step.stepDescription || step.stepInstructions || step.expectedOutcome"
            nzSize="small" [nzColumn]="1">
            <nz-descriptions-item *ngIf="step.stepDescription" nzTitle="Description">
              <div *ngIf="isHtmlContent(step.stepDescription)" [innerHTML]="sanitizeHtml(step.stepDescription)"></div>
              <span *ngIf="!isHtmlContent(step.stepDescription)">{{ step.stepDescription }}</span>
            </nz-descriptions-item>
            <nz-descriptions-item *ngIf="step.stepInstructions" nzTitle="Instructions">
              <div *ngIf="isHtmlContent(step.stepInstructions)" [innerHTML]="sanitizeHtml(step.stepInstructions)"></div>
              <span *ngIf="!isHtmlContent(step.stepInstructions)" style="white-space: pre-wrap;">{{ step.stepInstructions }}</span>
            </nz-descriptions-item>
            <nz-descriptions-item *ngIf="step.expectedOutcome" nzTitle="Expected Outcome">
              {{ step.expectedOutcome }}
            </nz-descriptions-item>
          </nz-descriptions>

          <div *ngIf="step.estimatedDurationMinutes || (step.evidenceType && step.evidenceType !== 'ANY') || step.referenceUrl"
            style="display: flex; gap: 16px; margin-top: 8px;">
            <small *ngIf="step.estimatedDurationMinutes">
              <span nz-icon nzType="clock-circle" nzTheme="outline"></span> {{ step.estimatedDurationMinutes }} min
            </small>
            <small *ngIf="step.evidenceType && step.evidenceType !== 'ANY'">
              <span nz-icon nzType="paper-clip" nzTheme="outline"></span> {{ getEvidenceTypeLabel(step.evidenceType) }}
            </small>
            <a *ngIf="step.referenceUrl" [href]="step.referenceUrl" target="_blank" style="font-size: 12px;">
              <span nz-icon nzType="link" nzTheme="outline"></span> Reference
            </a>
          </div>
        </div>
      </div>
    </nz-spin>

    <div class="modal-footer">
      <button nz-button (click)="close()">Close</button>
      <button nz-button nzType="primary" (click)="edit()">
        <span nz-icon nzType="edit" nzTheme="outline"></span> Edit Script
      </button>
    </div>
  `,
})
export class ScriptPreviewDialogComponent implements OnInit {
  loading = true;
  script: any = null;
  evidenceTypes = EVIDENCE_TYPES;

  constructor(
    @Inject(NZ_MODAL_DATA) public data: { scriptId: number },
    private modal: NzModalRef,
    private scriptService: ManualScriptService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadScript();
  }

  loadScript(): void {
    this.loading = true;
    this.scriptService.getManualScripts().subscribe({
      next: res => {
        const rows = res.data?.rows || res.data || [];
        this.script = rows.find((s: any) => s.id === this.data.scriptId);
        if (!this.script) this.notificationService.error('Script not found');
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load script');
        this.loading = false;
      },
    });
  }

  get sortedSteps(): any[] {
    if (!this.script?.steps) return [];
    return [...this.script.steps].sort((a: any, b: any) => a.stepOrder - b.stepOrder);
  }

  get totalDuration(): number {
    if (!this.script?.steps) return 0;
    return this.script.steps
      .filter((s: any) => s.isActive && s.estimatedDurationMinutes)
      .reduce((sum: number, s: any) => sum + (s.estimatedDurationMinutes || 0), 0);
  }

  getEvidenceTypeLabel(value: string): string {
    return this.evidenceTypes.find(t => t.value === value)?.label || value;
  }

  sanitizeHtml(content: string): SafeHtml {
    if (!content) return '';
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, content) || '';
    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }

  isHtmlContent(content: string): boolean {
    return content ? /<[a-z][\s\S]*>/i.test(content) : false;
  }

  edit(): void {
    this.modal.close({ action: 'edit', scriptId: this.data.scriptId });
  }

  close(): void {
    this.modal.close();
  }
}
