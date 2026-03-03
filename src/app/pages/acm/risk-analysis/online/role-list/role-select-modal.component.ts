import { Component, Inject, OnInit, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RiskAnalysisOnlineService } from '../../risk-analysis-online.service';
import { GridRequestBuilder } from '../../../../../core/utils/grid-request.builder';
import { TableQueryParams } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-role-select-modal',
  templateUrl: './role-select-modal.component.html',
})
export class RoleSelectModalComponent implements OnInit {
  preSelection: any;
  items: any[] = [];
  totalRecords = 0;
  selectedItems: any[] = [];
  currentPage = 1;
  pageSize = 10;
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
    const params: TableQueryParams = { pageIndex: this.currentPage, pageSize: this.pageSize, filters: {}, globalSearch: this.searchText || '' };
    const event = GridRequestBuilder.toLegacy(params);
    const selectedRoles = this.preSelection.formType === 'simulation' ? this.preSelection.selectedRoles : this.preSelection.selectedusers;
    const payload: any = {
      lazyEvent: event,
      selectedSAP: this.preSelection.selectedSAP,
      options: this.preSelection.options,
      selectedRoles: selectedRoles || [],
      roleSessionTables: this.preSelection.selectedRoleSessionTables || null,
    };

    const api = this.preSelection.formType === 'simulation'
      ? this.apiService.simulationsGetRolesListForSelection(payload, this.dialogData.simulationType)
      : this.apiService.findRoles(payload);

    api.subscribe((resp) => {
      this.items = resp.data?.gridData?.rows || resp.data?.rows || [];
      this.totalRecords = resp.data?.gridData?.records || resp.data?.records || 0;
      this.selectedItems = [];
      this.preSelection.selectedRoleSessionTables = resp.data?.roleSessionTables;
    });
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
    const ids = this.selectedItems.map((i) => i.name);
    this.dialogData.addSelectedEvent({ selectedRolesIds: ids });
    this.selectedItems = [];
    this.loadData();
  }

  saveAll(): void {
    const event = GridRequestBuilder.defaultLegacy(this.pageSize);
    const payload: any = {
      lazyEvent: event,
      selectedSAP: this.preSelection.selectedSAP,
      options: this.preSelection.options,
      selectedRoles: [],
      roleSessionTables: this.preSelection.selectedRoleSessionTables || null,
    };

    const api = this.preSelection.formType === 'simulation'
      ? this.apiService.simulationsFindAllRoles(payload, this.dialogData.simulationType)
      : this.apiService.findAllRoles(payload);

    api.subscribe((resp) => {
      this.dialogData.addSelectedEvent({ selectedRolesIds: resp.data?.selectedRoles });
      this.loadData();
    });
  }

  onItemChecked(item: any, checked: boolean): void {
    if (checked) { this.selectedItems = [...this.selectedItems, item]; }
    else { this.selectedItems = this.selectedItems.filter((i) => i.name !== item.name); }
  }

  isChecked(item: any): boolean { return this.selectedItems.some((i) => i.name === item.name); }
  onAllChecked(checked: boolean): void { this.selectedItems = checked ? [...this.items] : []; }
  get allChecked(): boolean { return this.items.length > 0 && this.selectedItems.length === this.items.length; }
}
