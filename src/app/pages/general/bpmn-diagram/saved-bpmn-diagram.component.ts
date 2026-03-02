import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, NzInputModule, NzIconModule, NzButtonModule, NzEmptyModule, NzModalModule, NzCardModule],
  selector: 'app-saved-bpmn-diagram',
  template: `
    <div class="saved-bpmn-dialog">
      <div class="search-bar">
        <nz-input-group [nzPrefix]="prefixIcon">
          <input nz-input [(ngModel)]="searchText" placeholder="Search diagrams..." />
        </nz-input-group>
        <ng-template #prefixIcon><span nz-icon nzType="search"></span></ng-template>
      </div>

      <div class="diagram-grid" *ngIf="filteredList.length > 0; else emptyTpl">
        <nz-card *ngFor="let bpmn of filteredList"
                 [nzHoverable]="true"
                 [nzBodyStyle]="{ padding: '0' }"
                 (click)="onSelectDiagram(bpmn)"
                 style="cursor: pointer;">
          <img [src]="bpmn.imageUrl" [alt]="bpmn.name" class="diagram-preview" />
          <div class="diagram-name">{{ bpmn.name }}</div>
        </nz-card>
      </div>

      <ng-template #emptyTpl>
        <nz-empty nzNotFoundImage="simple" nzNotFoundContent="No diagrams found"></nz-empty>
      </ng-template>

      <div class="dialog-footer">
        <button nz-button nzType="default" (click)="modal.close()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .saved-bpmn-dialog { display: flex; flex-direction: column; gap: 16px; }
    .search-bar { margin-bottom: 4px; }
    .diagram-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .diagram-preview {
      width: 100%;
      height: 100px;
      object-fit: cover;
      border-bottom: 1px solid #f0f0f0;
    }
    .diagram-name {
      padding: 8px 12px;
      text-align: center;
      font-size: 13px;
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }
    @media (max-width: 768px) {
      .diagram-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class SavedBpmnDiagramComponent {
  bpmnList: any[] = [];
  searchText = '';

  constructor(
    @Optional() public modal: NzModalRef,
    @Optional() @Inject(NZ_MODAL_DATA) public data: any,
  ) {
    if (data?.bpmnList) {
      this.bpmnList = data.bpmnList;
    }
  }

  get filteredList(): any[] {
    if (!this.searchText) return this.bpmnList;
    const term = this.searchText.toLowerCase();
    return this.bpmnList.filter((b: any) => b.name?.toLowerCase().includes(term));
  }

  onSelectDiagram(diagram: any): void {
    this.modal.close(diagram);
  }
}
