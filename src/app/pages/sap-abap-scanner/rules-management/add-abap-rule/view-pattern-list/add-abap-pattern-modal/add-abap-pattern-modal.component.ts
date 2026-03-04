import { Component, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  standalone: false,
  selector: 'app-add-abap-pattern-modal',
  templateUrl: './add-abap-pattern-modal.component.html',
  styleUrls: ['./add-abap-pattern-modal.component.scss'],
})
export class AddAbapPatternModalComponent {
  allPatterns: any[] = [];
  filteredPatterns: any[] = [];
  searchText = '';
  checkedPatterns = new Set<number>();
  allChecked = false;
  indeterminate = false;

  constructor(
    @Inject(NZ_MODAL_DATA) private dialogData: any,
    public modalRef: NzModalRef
  ) {
    this.allPatterns = this.dialogData.patterns || [];
    this.filteredPatterns = [...this.allPatterns];
  }

  onSearch(): void {
    const term = this.searchText.trim().toLowerCase();
    if (!term) {
      this.filteredPatterns = [...this.allPatterns];
    } else {
      this.filteredPatterns = this.allPatterns.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }
    this.refreshCheckState();
  }

  onAllChecked(checked: boolean): void {
    this.filteredPatterns.forEach((p) => {
      if (checked) {
        this.checkedPatterns.add(p.id);
      } else {
        this.checkedPatterns.delete(p.id);
      }
    });
    this.refreshCheckState();
  }

  onItemChecked(id: number, checked: boolean): void {
    if (checked) {
      this.checkedPatterns.add(id);
    } else {
      this.checkedPatterns.delete(id);
    }
    this.refreshCheckState();
  }

  private refreshCheckState(): void {
    const visible = this.filteredPatterns;
    this.allChecked = visible.length > 0 && visible.every((p) => this.checkedPatterns.has(p.id));
    this.indeterminate = visible.some((p) => this.checkedPatterns.has(p.id)) && !this.allChecked;
  }

  formatPatternCount(patterns: any[]): string {
    if (!patterns || !Array.isArray(patterns)) return '0 patterns';
    return patterns.length === 1 ? '1 pattern' : `${patterns.length} patterns`;
  }

  onAdd(): void {
    const selected = this.allPatterns.filter((p) => this.checkedPatterns.has(p.id));
    this.modalRef.close(selected);
  }

  onClose(): void {
    this.modalRef.close();
  }

  get hasSelection(): boolean {
    return this.checkedPatterns.size > 0;
  }
}
