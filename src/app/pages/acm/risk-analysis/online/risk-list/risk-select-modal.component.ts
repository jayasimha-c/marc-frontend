import { Component, Inject, OnInit, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RiskAnalysisOnlineService } from '../../risk-analysis-online.service';

@Component({
  standalone: false,
  selector: 'app-risk-select-modal',
  templateUrl: './risk-select-modal.component.html',
})
export class RiskSelectModalComponent implements OnInit {
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
    const api = this.preSelection.formType === 'crossSystem'
      ? this.apiService.getCrossSystemRiskList({})
      : this.apiService.findRisks(this.preSelection.favoriteIdStr);

    api.subscribe((resp) => {
      const tableData: any[] = [];
      if (resp?.data?.rows) {
        for (const row of resp.data.rows) {
          const isSelected = this.preSelection.selectedRisks?.find((id: any) => id == row.id);
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
    if (this.preSelection.formType === 'crossSystem') {
      this.dialogData.addSelectedEvent({ selectedRisks: this.selectedItems });
      const selectedIds = new Set(this.selectedItems.map((r) => r.id));
      this.items = this.items.filter((item) => !selectedIds.has(item.id));
    } else {
      const ids = this.selectedItems.map((i) => i.id);
      this.dialogData.addSelectedEvent({ selectedRiskIds: ids });
      this.loadData();
    }
    this.selectedItems = [];
  }

  saveAll(): void {
    if (this.preSelection.formType === 'crossSystem') {
      this.dialogData.addSelectedEvent({ selectedRisks: this.items });
      this.items = [];
      this.modal.close();
    } else {
      const ids = this.items.map((i) => i.id);
      this.dialogData.addSelectedEvent({ selectedRiskIds: ids });
      this.loadData();
    }
  }

  applyFilter(): void {
    if (!this.searchText) {
      this.displayItems = [...this.items];
    } else {
      const search = this.searchText.toLowerCase();
      this.displayItems = this.items.filter((row) =>
        (row.name || '').toLowerCase().includes(search) ||
        (row.riskDescription || '').toLowerCase().includes(search) ||
        (row.businessProcess?.name || '').toLowerCase().includes(search) ||
        (row.businessProcess?.subProcessNames || '').toLowerCase().includes(search) ||
        (row.riskType?.name || '').toLowerCase().includes(search)
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
