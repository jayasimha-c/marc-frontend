import { Component, Input, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RiskAnalysisOnlineService } from '../../risk-analysis-online.service';
import { RiskSelectModalComponent } from './risk-select-modal.component';

@Component({
  standalone: false,
  selector: 'app-online-risk-list',
  templateUrl: './risk-list.component.html',
})
export class RiskListComponent implements OnInit {
  @Input() header = 'Risk List';
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
    if (!this.preSelection.selectedRisks) return;

    if (this.preSelection.formType === 'sf') {
      this.apiService.getSfSelectedRisks({ selectedRisks: this.preSelection.selectedRisks }).subscribe((resp) => {
        this.items = resp.data?.rows || [];
        this.totalRecords = resp.data?.records || 0;
        this.applyFilter();
      });
    } else {
      const api = this.preSelection.formType === 'crossSystem'
        ? this.apiService.getCrossSystemRiskList({})
        : this.apiService.findRisks(this.preSelection.favoriteIdStr);

      api.subscribe((resp) => {
        const tableData: any[] = [];
        if (resp?.data?.rows) {
          for (const row of resp.data.rows) {
            if (this.preSelection.selectedRisks?.find((id: any) => id == row.id)) {
              tableData.push(row);
            }
          }
        }
        this.preSelection.selectedRisks = tableData.map((r) => r.id);
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
        (row.name || '').toLowerCase().includes(search) ||
        (row.riskDescription || '').toLowerCase().includes(search) ||
        (row.businessProcess?.name || '').toLowerCase().includes(search) ||
        (row.businessProcess?.subProcessNames || '').toLowerCase().includes(search) ||
        (row.riskType?.name || '').toLowerCase().includes(search)
      );
    }
  }

  remove(): void {
    const selectedIds = this.selectedItems.map((i) => i.id);
    this.preSelection.selectedRisks = this.preSelection.selectedRisks.filter(
      (id: any) => !selectedIds.includes(id)
    );
    this.selectedItems = [];
    this.loadData();
  }

  removeAll(): void {
    this.preSelection.selectedRisks = [];
    this.selectedItems = [];
    this.loadData();
  }

  openRiskSelectDialog(): void {
    if (!this.preSelection) return;
    this.nzModal.create({
      nzTitle: 'Select Risks',
      nzContent: RiskSelectModalComponent,
      nzWidth: '90vw',
      nzClassName: 'updated-modal',
      nzFooter: null,
      nzData: {
        preSelection: this.preSelection,
        addSelectedEvent: (result: any) => {
          if (result.selectedRiskIds) {
            result.selectedRiskIds.forEach((id: any) => {
              if (!this.preSelection.selectedRisks.includes(id)) {
                this.preSelection.selectedRisks.push(id);
              }
            });
            this.loadData();
          }
        },
      },
    });
  }

  openDetail(risk: any): void {
    this.apiService.riskDetail({ riskId: risk.id }).subscribe((resp) => {
      if (resp.success && resp.data) {
        this.nzModal.create({
          nzTitle: 'Risk Detail',
          nzContent: RiskDetailModalContent,
          nzWidth: '90vw',
          nzClassName: 'updated-modal',
          nzFooter: null,
          nzData: { risk: resp.data },
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

// Simple inline risk detail modal
import { Inject, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  standalone: false,
  selector: 'app-risk-detail-modal-content',
  template: `
    <div style="padding: 0 16px; max-height: 65vh; overflow: auto;">
      <nz-descriptions nzBordered nzSize="small" [nzColumn]="2" style="margin-bottom: 16px;">
        <nz-descriptions-item nzTitle="Risk Name">{{ dialogData.risk?.name }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Description">{{ dialogData.risk?.riskDescription }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Business Process">{{ dialogData.risk?.businessProcess?.name }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Sub Process">{{ dialogData.risk?.businessProcess?.subProcessNames }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Risk Type">{{ dialogData.risk?.riskType?.name }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Risk Level">{{ dialogData.risk?.riskLevel }}</nz-descriptions-item>
      </nz-descriptions>
    </div>
    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Close</button>
    </div>
  `,
})
export class RiskDetailModalContent {
  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
    @Optional() public modal: NzModalRef,
  ) {}
}
