import { Component, Input, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RiskAnalysisOnlineService } from '../../risk-analysis-online.service';
import { UserSelectModalComponent } from './user-select-modal.component';
import { NotificationService } from '../../../../../core/services/notification.service';
import { GridRequestBuilder } from '../../../../../core/utils/grid-request.builder';
import { TableQueryParams } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-online-users',
  templateUrl: './user-list.component.html',
})
export class OnlineUserListComponent implements OnInit {
  @Input() header = 'User List';
  @Input() preSelection: any;
  @Input() simulationType = '';

  items: any[] = [];
  totalRecords = 0;
  selectedItems: any[] = [];
  currentPage = 1;
  pageSize = 10;
  searchText = '';

  cols = [
    { field: 'bname', header: 'User ID' },
    { field: 'userName', header: 'Name' },
    { field: 'ustyp', header: 'Type' },
    { field: 'clas', header: 'Group' },
    { field: 'uflag', header: 'Lock' },
    { field: 'gltgbInDateFmt', header: 'Valid To' },
  ];

  constructor(
    private nzModal: NzModalService,
    private apiService: RiskAnalysisOnlineService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.apiService.preSelectedData.subscribe((resp: any) => {
      this.preSelection = resp;
      if (!this.preSelection.selectedusers) this.preSelection.selectedusers = [];
      this.loadData();
    });
  }

  loadData(): void {
    if (!this.preSelection) return;
    const params: TableQueryParams = { pageIndex: this.currentPage, pageSize: this.pageSize, filters: {}, globalSearch: this.searchText || '' };
    const event = GridRequestBuilder.toLegacy(params);
    const payload = { lazyEvent: event, selectedSAP: this.preSelection.selectedSAP, selectedIds: this.preSelection.selectedusers };
    const api = this.preSelection?.formType === 'simulation'
      ? this.apiService.simulationsUserSelectedList(payload, this.simulationType)
      : this.apiService.userSelectedList(payload);
    api.subscribe((resp) => {
      if (resp.success && resp.data) {
        this.items = resp.data.rows || [];
        this.totalRecords = resp.data.records || 0;
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
    const removeIds = this.selectedItems.map((i) => i.bname || i.userId);
    this.preSelection.selectedusers = this.preSelection.selectedusers.filter((id: string) => !removeIds.includes(id));
    this.loadData();
  }

  removeAll(): void {
    this.preSelection.selectedusers = [];
    this.loadData();
  }

  openUserSelectDialog(): void {
    if (!this.preSelection?.selectedSAP) {
      this.notificationService.error('Please provide pre-selection');
      return;
    }
    this.nzModal.create({
      nzTitle: 'Select Users',
      nzContent: UserSelectModalComponent,
      nzWidth: '80vw',
      nzBodyStyle: { maxHeight: '80vh', overflow: 'auto' },
      nzClassName: 'updated-modal',
      nzFooter: null,
      nzData: {
        preSelection: this.preSelection,
        simulationType: this.simulationType,
        addSelectedEvent: (result: any) => this.addSelectedUsers(result),
      },
    });
  }

  private addSelectedUsers(result: any): void {
    if (result?.selectedUsersIds) {
      result.selectedUsersIds.forEach((p: string) => {
        if (this.preSelection.selectedusers.indexOf(p) < 0) {
          this.preSelection.selectedusers.push(p);
        }
      });
      this.preSelection.selectedSessionTables = result.selectedSessionTables;
      this.preSelection.sapUserRoles = result.sapUserRoles || [];
      this.loadData();
    }
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
