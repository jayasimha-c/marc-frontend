import { Component, Input, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RiskAnalysisOnlineService } from '../../risk-analysis-online.service';
import { RoleSelectModalComponent } from './role-select-modal.component';
import { RoleDetailModalComponent } from './role-detail-modal.component';
import { GridRequestBuilder } from '../../../../../core/utils/grid-request.builder';
import { TableQueryParams } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-online-roles',
  templateUrl: './role-list.component.html',
})
export class OnlineRoleListComponent implements OnInit {
  @Input() header = 'Role List';
  @Input() preSelection: any;
  @Input() simulationType = '';

  items: any[] = [];
  totalRecords = 0;
  selectedItems: any[] = [];
  currentPage = 1;
  pageSize = 10;
  searchText = '';

  constructor(
    private nzModal: NzModalService,
    private apiService: RiskAnalysisOnlineService,
  ) {}

  ngOnInit(): void {
    this.apiService.preSelectedData.subscribe((resp: any) => {
      this.preSelection = resp;
      if (this.preSelection.formType === 'simulation') {
        this.preSelection['selectedRoles'] = [];
      }
    });
  }

  loadData(): void {
    if (!this.preSelection) return;
    const params: TableQueryParams = { pageIndex: this.currentPage, pageSize: this.pageSize, filters: {}, globalSearch: this.searchText || '' };
    const event = GridRequestBuilder.toLegacy(params);
    const selectedIds = this.preSelection.formType === 'simulation' ? this.preSelection.selectedRoles || [] : this.preSelection.selectedusers || [];
    const payload = { lazyEvent: event, selectedSAP: this.preSelection.selectedSAP, selectedIds };

    const api = this.preSelection.formType === 'simulation'
      ? this.apiService.simulationsAdditionalRoles(payload, this.simulationType)
      : this.apiService.roleSelectedList(payload);

    api.subscribe((resp) => {
      if (resp.success || resp.data) {
        this.items = resp.data?.rows || [];
        this.totalRecords = resp.data?.records || 0;
        this.selectedItems = [];
      }
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

  remove(): void {
    const removeNames = this.selectedItems.map((i) => i.name);
    if (this.preSelection.formType === 'simulation') {
      this.preSelection.selectedRoles = this.preSelection.selectedRoles.filter((n: string) => !removeNames.includes(n));
    } else {
      this.preSelection.selectedusers = this.preSelection.selectedusers.filter((n: string) => !removeNames.includes(n));
    }
    this.loadData();
  }

  removeAll(): void {
    if (this.preSelection.formType === 'simulation') {
      this.preSelection.selectedRoles = [];
    } else {
      this.preSelection.selectedusers = [];
    }
    this.loadData();
  }

  openRoleSelectDialog(): void {
    if (!this.preSelection) return;
    this.nzModal.create({
      nzTitle: 'Select Roles',
      nzContent: RoleSelectModalComponent,
      nzWidth: '60vw',
      nzClassName: 'updated-modal',
      nzFooter: null,
      nzData: {
        preSelection: this.preSelection,
        simulationType: this.simulationType,
        addSelectedEvent: (result: any) => this.addSelectedRoles(result),
      },
    });
  }

  openDetail(data: any): void {
    this.nzModal.create({
      nzTitle: 'Role Detail',
      nzContent: RoleDetailModalComponent,
      nzWidth: '60vw',
      nzClassName: 'updated-modal',
      nzFooter: null,
      nzData: { roleId: data.name, sapId: this.preSelection.selectedSAP },
    });
  }

  private addSelectedRoles(result: any): void {
    if (result?.selectedRolesIds) {
      result.selectedRolesIds.forEach((p: string) => {
        if (this.preSelection.formType === 'simulation') {
          if ((this.preSelection.selectedRoles || []).indexOf(p) < 0) this.preSelection.selectedRoles.push(p);
        } else {
          if ((this.preSelection.selectedusers || []).indexOf(p) < 0) this.preSelection.selectedusers.push(p);
        }
      });
      this.loadData();
    }
  }

  onItemChecked(item: any, checked: boolean): void {
    if (checked) { this.selectedItems = [...this.selectedItems, item]; }
    else { this.selectedItems = this.selectedItems.filter((i) => i.name !== item.name); }
  }

  isChecked(item: any): boolean { return this.selectedItems.some((i) => i.name === item.name); }

  onAllChecked(checked: boolean): void { this.selectedItems = checked ? [...this.items] : []; }

  get allChecked(): boolean { return this.items.length > 0 && this.selectedItems.length === this.items.length; }
}
