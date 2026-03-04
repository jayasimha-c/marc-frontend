import { Component, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  standalone: false,
  selector: 'app-add-abap-rule-modal',
  templateUrl: './add-abap-rule-modal.component.html',
  styleUrls: ['./add-abap-rule-modal.component.scss'],
})
export class AddAbapRuleModalComponent {
  allRules: any[] = [];
  filteredRules: any[] = [];
  searchText = '';
  checkedRules = new Set<number>();
  allChecked = false;
  indeterminate = false;

  constructor(
    @Inject(NZ_MODAL_DATA) private dialogData: any,
    public modalRef: NzModalRef
  ) {
    this.allRules = this.dialogData.rules || [];
    this.filteredRules = [...this.allRules];
  }

  onSearch(): void {
    const term = this.searchText.trim().toLowerCase();
    if (!term) {
      this.filteredRules = [...this.allRules];
    } else {
      this.filteredRules = this.allRules.filter(
        (r) =>
          r.name?.toLowerCase().includes(term) ||
          r.category?.toLowerCase().includes(term) ||
          r.description?.toLowerCase().includes(term)
      );
    }
    this.refreshCheckState();
  }

  onAllChecked(checked: boolean): void {
    this.filteredRules.forEach((r) => {
      if (checked) {
        this.checkedRules.add(r.id);
      } else {
        this.checkedRules.delete(r.id);
      }
    });
    this.refreshCheckState();
  }

  onItemChecked(id: number, checked: boolean): void {
    if (checked) {
      this.checkedRules.add(id);
    } else {
      this.checkedRules.delete(id);
    }
    this.refreshCheckState();
  }

  private refreshCheckState(): void {
    const visible = this.filteredRules;
    this.allChecked = visible.length > 0 && visible.every((r) => this.checkedRules.has(r.id));
    this.indeterminate = visible.some((r) => this.checkedRules.has(r.id)) && !this.allChecked;
  }

  onAdd(): void {
    const selected = this.allRules.filter((r) => this.checkedRules.has(r.id));
    this.modalRef.close(selected);
  }

  onClose(): void {
    this.modalRef.close();
  }

  get hasSelection(): boolean {
    return this.checkedRules.size > 0;
  }
}
