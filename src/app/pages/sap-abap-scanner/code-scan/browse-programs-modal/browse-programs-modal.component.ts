import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { AbapService } from '../../abap.service';
import { TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-browse-programs-modal',
  templateUrl: './browse-programs-modal.component.html',
  styleUrls: ['./browse-programs-modal.component.scss'],
})
export class BrowseProgramsModalComponent implements OnInit {
  sapSystemId: any;
  sapSystemName = '';

  loading = false;
  programs: any[] = [];
  totalRecords = 0;
  pageIndex = 1;
  pageSize = 20;
  searchText = '';

  checkedPrograms = new Set<string>();
  allChecked = false;
  indeterminate = false;

  constructor(
    @Inject(NZ_MODAL_DATA) private dialogData: any,
    public modalRef: NzModalRef,
    private abapService: AbapService
  ) {
    this.sapSystemId = this.dialogData.sapSystemId;
    this.sapSystemName = this.dialogData.sapSystemName || '';
  }

  ngOnInit(): void {
    this.loadPrograms();
  }

  loadPrograms(): void {
    this.loading = true;
    const params: TableQueryParams = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      sort: { field: 'name', direction: 'ascend' },
      filters: {},
      globalSearch: this.searchText.trim() || '',
    };

    this.abapService.browsePrograms(params, this.sapSystemId).subscribe({
      next: (res) => {
        this.programs = res.data?.rows || [];
        this.totalRecords = res.data?.records || 0;
        this.loading = false;
        this.refreshCheckState();
      },
      error: () => {
        this.programs = [];
        this.totalRecords = 0;
        this.loading = false;
      },
    });
  }

  onPageIndexChange(index: number): void {
    this.pageIndex = index;
    this.loadPrograms();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadPrograms();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadPrograms();
  }

  onAllChecked(checked: boolean): void {
    this.programs.forEach((p) => {
      if (checked) {
        this.checkedPrograms.add(p.name || p.objName);
      } else {
        this.checkedPrograms.delete(p.name || p.objName);
      }
    });
    this.refreshCheckState();
  }

  onItemChecked(name: string, checked: boolean): void {
    if (checked) {
      this.checkedPrograms.add(name);
    } else {
      this.checkedPrograms.delete(name);
    }
    this.refreshCheckState();
  }

  private refreshCheckState(): void {
    const visible = this.programs;
    this.allChecked =
      visible.length > 0 &&
      visible.every((p) => this.checkedPrograms.has(p.name || p.objName));
    this.indeterminate =
      visible.some((p) => this.checkedPrograms.has(p.name || p.objName)) && !this.allChecked;
  }

  onAdd(): void {
    const selected = Array.from(this.checkedPrograms);
    this.modalRef.close(selected);
  }

  onClose(): void {
    this.modalRef.close();
  }

  get hasSelection(): boolean {
    return this.checkedPrograms.size > 0;
  }
}
