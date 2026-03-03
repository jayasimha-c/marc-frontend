import { Component, Inject, OnInit, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { Observable } from 'rxjs';
import { RiskAnalysisOnlineService } from '../../risk-analysis-online.service';
import { GridRequestBuilder } from '../../../../../core/utils/grid-request.builder';
import { TableQueryParams } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-user-select-modal',
  templateUrl: './user-select-modal.component.html',
})
export class UserSelectModalComponent implements OnInit {
  preSelection: any;
  items: any[] = [];
  totalRecords = 0;
  selectedItems: any[] = [];
  currentPage = 1;
  pageSize = 10;
  searchText = '';

  // Filter panel state
  bulkUserIdsText = '';
  bulkUserIds: string[] = [];
  filterGroup = '';
  filterType = '';

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
    const filters: Record<string, string | string[]> = {};
    if (this.bulkUserIds.length > 0) {
      filters['bname'] = this.bulkUserIds;
    }
    if (this.filterGroup?.trim()) {
      filters['class'] = this.filterGroup.trim();
    }
    if (this.filterType?.trim()) {
      filters['ustyp'] = this.filterType.trim();
    }
    const params: TableQueryParams = {
      pageIndex: this.currentPage,
      pageSize: this.pageSize,
      filters,
      globalSearch: this.searchText || '',
    };
    const event = GridRequestBuilder.toLegacy(params);
    const payload: any = {
      lazyEvent: event,
      selectedSAP: this.preSelection.selectedSAP,
      options: this.preSelection.options,
      selectedusers: this.preSelection.selectedusers || [],
      userSessionTables: this.preSelection.selectedSessionTables || null,
    };

    let api: Observable<any>;
    if (this.preSelection.formType === 'simulation') {
      api = this.apiService.simulationsFindUsers(payload, this.dialogData.simulationType);
    } else if (this.preSelection.formType === 'crossSystem') {
      payload['sapSystemId2'] = this.preSelection.sapSystemId2;
      api = this.apiService.findCrossSystemUsers(payload);
    } else {
      api = this.apiService.findUsers(payload);
    }

    api.subscribe((resp) => {
      if (resp.success || resp.data) {
        this.items = resp.data?.gridData?.rows || resp.data?.rows || [];
        this.totalRecords = resp.data?.gridData?.records || resp.data?.records || 0;
        this.preSelection.selectedSessionTables = resp.data?.userSessionTables;
        this.selectedItems = [];
      }
    });
  }

  onBulkUserIdsChange(): void {
    if (!this.bulkUserIdsText.trim()) {
      this.bulkUserIds = [];
      return;
    }
    const items = this.bulkUserIdsText.split(/[\n,;\t]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    this.bulkUserIds = [...new Set(items)];
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadData();
  }

  clearFilters(): void {
    this.bulkUserIdsText = '';
    this.bulkUserIds = [];
    this.filterGroup = '';
    this.filterType = '';
    this.currentPage = 1;
    this.loadData();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadData();
  }

  saveSelected(): void {
    const ids = this.selectedItems.map((item) => item.bname || item.userId);
    this.dialogData.addSelectedEvent({
      selectedUsersIds: ids,
      selectedSessionTables: this.preSelection.selectedSessionTables,
    });
    this.selectedItems = [];
    this.loadData();
  }

  saveAll(): void {
    const payload = {
      lazyEvent: GridRequestBuilder.defaultLegacy(this.pageSize),
      selectedSAP: this.preSelection?.selectedSAP,
      options: this.preSelection?.options,
    };
    let api: Observable<any>;
    api = this.preSelection.formType === 'simulation'
      ? this.apiService.simulationsFindAllUsers(payload, this.dialogData.simulationType)
      : this.apiService.findAllUsers(payload);
    api.subscribe((resp) => {
      this.dialogData.addSelectedEvent({
        selectedUsersIds: resp.data?.selectedusers || resp.data?.selectedIds,
        selectedSessionTables: this.preSelection?.selectedSessionTables,
        sapUserRoles: resp.data?.sapuserRoles,
      });
    });
  }

  onItemChecked(item: any, checked: boolean): void {
    if (checked) {
      this.selectedItems = [...this.selectedItems, item];
    } else {
      this.selectedItems = this.selectedItems.filter((i) => i.bname !== item.bname);
    }
  }

  isChecked(item: any): boolean {
    return this.selectedItems.some((i) => i.bname === item.bname);
  }

  onAllChecked(checked: boolean): void {
    this.selectedItems = checked ? [...this.items] : [];
  }

  get allChecked(): boolean {
    return this.items.length > 0 && this.selectedItems.length === this.items.length;
  }
}
