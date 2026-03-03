import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { StepLibraryService, StepLibraryItem } from './step-library.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-step-library-picker-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzSpinModule, NzInputModule,
    NzCheckboxModule, NzTagModule, NzEmptyModule, NzDividerModule,
  ],
  template: `
    <div style="margin-bottom: 12px;">
      <nz-input-group nzSuffixIcon="search">
        <input nz-input [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Search by name, category, or tags" />
      </nz-input-group>
    </div>

    <div *ngIf="categories.length > 0" style="margin-bottom: 16px;">
      <nz-tag nzMode="checkable" [nzChecked]="!selectedCategory" (nzCheckedChange)="selectCategory(null)">All</nz-tag>
      <nz-tag *ngFor="let cat of categories" nzMode="checkable"
        [nzChecked]="selectedCategory === cat" (nzCheckedChange)="selectCategory(cat)">{{ cat }}</nz-tag>
    </div>

    <nz-divider></nz-divider>

    <div style="min-height: 300px; max-height: 50vh; overflow-y: auto;">
      <div *ngIf="loading" style="text-align: center; padding: 48px 0;">
        <nz-spin nzSimple></nz-spin>
        <p style="margin-top: 16px;">Loading library steps...</p>
      </div>

      <nz-empty *ngIf="!loading && filteredSteps.length === 0" nzNotFoundContent="No steps found"></nz-empty>

      <div *ngIf="!loading && filteredSteps.length > 0" class="picker-list">
        <div *ngFor="let step of filteredSteps" class="picker-step"
          [class.selected]="isSelected(step)" (click)="toggleSelection(step)">
          <label nz-checkbox [ngModel]="isSelected(step)"
            (click)="$event.stopPropagation()" (ngModelChange)="toggleSelection(step)"></label>
          <div style="flex: 1; min-width: 0;">
            <div style="margin-bottom: 4px;">
              <strong>{{ step.stepName }}</strong>
              <nz-tag *ngIf="step.category" style="margin-left: 8px;">{{ step.category }}</nz-tag>
            </div>
            <p *ngIf="step.stepDescription" style="margin: 0 0 4px; font-size: 13px;">
              {{ getPlainText(step.stepDescription) }}
            </p>
            <small>
              <span *ngIf="step.estimatedDurationMinutes">
                <span nz-icon nzType="clock-circle" nzTheme="outline"></span> {{ step.estimatedDurationMinutes }} min
              </span>
              <span *ngIf="step.evidenceRequired" style="margin-left: 12px;">
                <span nz-icon nzType="safety-certificate" nzTheme="outline"></span> Evidence Required
              </span>
              <span *ngIf="step.usageCount && step.usageCount > 0" style="margin-left: 12px;">
                <span nz-icon nzType="rise" nzTheme="outline"></span> Used {{ step.usageCount }}x
              </span>
            </small>
            <div *ngIf="step.tags" style="margin-top: 4px;">
              <nz-tag *ngFor="let tag of getTags(step.tags)" nzColor="default">{{ tag }}</nz-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <span *ngIf="selectedSteps.length > 0" style="margin-right: auto;">
        {{ selectedSteps.length }} step(s) selected
      </span>
      <button nz-button (click)="close()">Cancel</button>
      <button nz-button nzType="primary" [disabled]="selectedSteps.length === 0" (click)="addSelected()">
        Add Selected
      </button>
    </div>
  `,
  styles: [`
    .picker-list { display: flex; flex-direction: column; gap: 8px; }
    .picker-step {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px;
      border: 1px solid #d9d9d9;
      border-radius: 2px;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .picker-step:hover { border-color: #40a9ff; }
    .picker-step.selected { background: #e6f7ff; border-color: #1890ff; }
  `],
})
export class StepLibraryPickerDialogComponent implements OnInit {
  loading = true;
  allSteps: StepLibraryItem[] = [];
  filteredSteps: StepLibraryItem[] = [];
  selectedSteps: StepLibraryItem[] = [];
  categories: string[] = [];
  selectedCategory: string | null = null;
  searchTerm = '';

  constructor(
    @Inject(NZ_MODAL_DATA) public data: any,
    private modal: NzModalRef,
    private stepLibraryService: StepLibraryService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.stepLibraryService.getAll().subscribe({
      next: res => {
        if (res.success && res.data?.rows) {
          this.allSteps = res.data.rows;
          this.filteredSteps = [...this.allSteps];
          this.extractCategories();
        }
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load step library');
        this.loading = false;
      },
    });
  }

  extractCategories(): void {
    const categorySet = new Set<string>();
    this.allSteps.forEach(step => {
      if (step.category) categorySet.add(step.category);
    });
    this.categories = Array.from(categorySet).sort();
  }

  selectCategory(category: string | null): void {
    this.selectedCategory = category;
    this.filterSteps();
  }

  onSearch(): void {
    this.filterSteps();
  }

  filterSteps(): void {
    let filtered = [...this.allSteps];
    if (this.selectedCategory) {
      filtered = filtered.filter(s => s.category === this.selectedCategory);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.stepName.toLowerCase().includes(term) ||
        (s.category && s.category.toLowerCase().includes(term)) ||
        (s.tags && s.tags.toLowerCase().includes(term))
      );
    }
    this.filteredSteps = filtered;
  }

  isSelected(step: StepLibraryItem): boolean {
    return this.selectedSteps.some(s => s.id === step.id);
  }

  toggleSelection(step: StepLibraryItem): void {
    const index = this.selectedSteps.findIndex(s => s.id === step.id);
    if (index >= 0) {
      this.selectedSteps.splice(index, 1);
    } else {
      this.selectedSteps.push(step);
    }
  }

  getTags(tags: string): string[] {
    return tags.split(',').map(t => t.trim()).filter(t => t);
  }

  getPlainText(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  addSelected(): void {
    this.selectedSteps.forEach(step => {
      if (step.id) {
        this.stepLibraryService.incrementUsage(step.id).subscribe();
      }
    });
    this.modal.close({ steps: this.selectedSteps });
  }

  close(): void {
    this.modal.close();
  }
}
