import { Component, Inject, OnInit, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RiskAnalysisOnlineService } from '../../risk-analysis-online.service';

@Component({
  standalone: false,
  selector: 'app-rule-select-modal',
  templateUrl: './rule-select-modal.component.html',
})
export class RuleSelectModalComponent implements OnInit {
  preSelection: any;
  items: any[] = [];
  displayItems: any[] = [];
  totalRecords = 0;
  selectedItems: any[] = [];
  searchText = '';

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
    @Optional() public modal: NzModalRef,
    private apiService: RiskAnalysisOnlineService,
  ) {}

  ngOnInit(): void {
    this.preSelection = this.dialogData.preSelection;
    this.loadData();
  }

  loadData(): void {
    this.apiService.findRules(this.preSelection.favoriteIdStr).subscribe((resp) => {
      const tableData: any[] = [];
      if (resp?.data?.rows) {
        for (const row of resp.data.rows) {
          const isSelected = this.preSelection.selectedRules?.find((id: any) => id == row.id);
          if (!isSelected) {
            tableData.push(row);
          }
        }
      }
      this.items = tableData;
      this.totalRecords = tableData.length;
      this.selectedItems = [];
      this.applyFilter();
    });
  }

  saveSelected(): void {
    const ids = this.selectedItems.map((i) => i.id);
    this.dialogData.addSelectedEvent({ selectedRuleIds: ids });
    this.selectedItems = [];
    this.loadData();
  }

  saveAll(): void {
    const ids = this.items.map((i) => i.id);
    this.dialogData.addSelectedEvent({ selectedRuleIds: ids });
    this.loadData();
  }

  applyFilter(): void {
    if (!this.searchText) {
      this.displayItems = [...this.items];
    } else {
      const search = this.searchText.toLowerCase();
      this.displayItems = this.items.filter((row) =>
        (row.ruleName || '').toLowerCase().includes(search) ||
        (row.ruleDescription || '').toLowerCase().includes(search) ||
        (row.businessProcess?.name || '').toLowerCase().includes(search) ||
        (row.businessProcess?.subProcessNames || '').toLowerCase().includes(search) ||
        (row.ruleType?.name || '').toLowerCase().includes(search)
      );
    }
  }

  onItemChecked(item: any, checked: boolean): void {
    if (checked) { this.selectedItems = [...this.selectedItems, item]; }
    else { this.selectedItems = this.selectedItems.filter((i) => i.id !== item.id); }
  }

  isChecked(item: any): boolean { return this.selectedItems.some((i) => i.id === item.id); }
  onAllChecked(checked: boolean): void { this.selectedItems = checked ? [...this.items] : []; }
  get allChecked(): boolean { return this.items.length > 0 && this.selectedItems.length === this.items.length; }
}
