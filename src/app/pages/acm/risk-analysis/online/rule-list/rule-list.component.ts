import { Component, Input, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RiskAnalysisOnlineService } from '../../risk-analysis-online.service';
import { RuleSelectModalComponent } from './rule-select-modal.component';

@Component({
  standalone: false,
  selector: 'app-online-rule-list',
  templateUrl: './rule-list.component.html',
})
export class RuleListComponent implements OnInit {
  @Input() header = 'Rule List';
  @Input() preSelection: any;

  items: any[] = [];
  displayItems: any[] = [];
  totalRecords = 0;
  selectedItems: any[] = [];
  currentPage = 1;
  pageSize = 10;
  searchText = '';

  constructor(
    private apiService: RiskAnalysisOnlineService,
    private nzModal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.apiService.preSelectedData.subscribe((resp: any) => {
      this.preSelection = resp;
      this.loadData();
    });
  }

  loadData(): void {
    if (this.preSelection.formType === 'sf') {
      this.apiService.getSfSelectedRules({ selectedRules: this.preSelection.selectedRules }).subscribe((resp) => {
        this.items = resp.data?.rows || [];
        this.totalRecords = resp.data?.records || 0;
        this.applyFilter();
      });
    } else {
      this.apiService.findRules(this.preSelection.favoriteIdStr).subscribe((resp) => {
        const tableData: any[] = [];
        if (resp?.data?.rows) {
          for (const row of resp.data.rows) {
            if (this.preSelection.selectedRules?.find((id: any) => id == row.id)) {
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

  remove(): void {
    const selectedIds = this.selectedItems.map((i) => i.id);
    this.preSelection.selectedRules = this.preSelection.selectedRules.filter(
      (id: any) => !selectedIds.includes(id)
    );
    this.selectedItems = [];
    this.loadData();
  }

  removeAll(): void {
    this.preSelection.selectedRules = [];
    this.selectedItems = [];
    this.loadData();
  }

  openRuleSelectDialog(): void {
    if (!this.preSelection) return;
    this.nzModal.create({
      nzTitle: 'Select Rules',
      nzContent: RuleSelectModalComponent,
      nzWidth: '90vw',
      nzClassName: 'updated-modal',
      nzFooter: null,
      nzData: {
        preSelection: this.preSelection,
        addSelectedEvent: (result: any) => {
          if (result.selectedRuleIds) {
            result.selectedRuleIds.forEach((id: any) => {
              if (!this.preSelection.selectedRules.includes(id)) {
                this.preSelection.selectedRules.push(id);
              }
            });
            this.loadData();
          }
        },
      },
    });
  }

  openDetail(rule: any): void {
    this.apiService.ruleDetail({ ruleId: rule.id }).subscribe((resp) => {
      if (resp.success && resp.data) {
        this.nzModal.create({
          nzTitle: 'Rule Detail',
          nzContent: RuleDetailModalContent,
          nzWidth: '90vw',
          nzClassName: 'updated-modal',
          nzFooter: null,
          nzData: { rule: resp.data },
        });
      }
    });
  }

  onItemChecked(item: any, checked: boolean): void {
    if (checked) { this.selectedItems = [...this.selectedItems, item]; }
    else { this.selectedItems = this.selectedItems.filter((i) => i.id !== item.id); }
  }

  isChecked(item: any): boolean { return this.selectedItems.some((i) => i.id === item.id); }
  onAllChecked(checked: boolean): void { this.selectedItems = checked ? [...this.items] : []; }
  get allChecked(): boolean { return this.items.length > 0 && this.selectedItems.length === this.items.length; }
}

// Simple inline rule detail modal
import { Inject, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  standalone: false,
  selector: 'app-rule-detail-modal-content',
  template: `
    <div style="padding: 0 16px; max-height: 65vh; overflow: auto;">
      <nz-descriptions nzBordered nzSize="small" [nzColumn]="2" style="margin-bottom: 16px;">
        <nz-descriptions-item nzTitle="Rule Name">{{ dialogData.rule?.ruleName }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Description">{{ dialogData.rule?.ruleDescription }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Business Process">{{ dialogData.rule?.businessProcess?.name }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Sub Process">{{ dialogData.rule?.businessProcess?.subProcessNames }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Rule Type">{{ dialogData.rule?.ruleType?.name }}</nz-descriptions-item>
      </nz-descriptions>
    </div>
    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Close</button>
    </div>
  `,
})
export class RuleDetailModalContent {
  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
    @Optional() public modal: NzModalRef,
  ) {}
}
