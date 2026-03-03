import { Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { IcmControlService } from '../icm-control.service';

@Component({
  standalone: true,
  imports: [CommonModule, NzModalModule, NzTabsModule, NzButtonModule, NzTableModule, NzEmptyModule, NzSpinModule],
  selector: 'app-rule-audit-logs-dialog',
  template: `
    <nz-tabset [nzAnimated]="false">
      <nz-tab nzTitle="Dynamic Controls">
        <nz-spin [nzSpinning]="dynamicLoading">
          <nz-table #dynamicTable
                    [nzData]="dynamicData"
                    [nzTotal]="dynamicTotal"
                    [nzPageSize]="20"
                    [nzFrontPagination]="false"
                    nzSize="small"
                    nzShowSizeChanger
                    (nzPageIndexChange)="loadDynamic($event)"
                    [nzShowTotal]="totalTpl">
            <thead>
              <tr>
                <th>Control</th>
                <th>Modified By</th>
                <th>Modified Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of dynamicTable.data">
                <td>{{ row.name }}</td>
                <td>{{ row.modifiedBy }}</td>
                <td>{{ row.modifyDateStr }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-spin>
      </nz-tab>
      <nz-tab nzTitle="Standard Controls">
        <nz-spin [nzSpinning]="standardLoading">
          <nz-table #standardTable
                    [nzData]="standardData"
                    [nzTotal]="standardTotal"
                    [nzPageSize]="20"
                    [nzFrontPagination]="false"
                    nzSize="small"
                    nzShowSizeChanger
                    (nzPageIndexChange)="loadStandard($event)"
                    [nzShowTotal]="totalTpl">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Description</th>
                <th>Modified By</th>
                <th>Modified Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of standardTable.data">
                <td>{{ row.ruleName }}</td>
                <td>{{ row.description }}</td>
                <td>{{ row.modifiedBy }}</td>
                <td>{{ row.modifyDateStr }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-spin>
      </nz-tab>
    </nz-tabset>
    <ng-template #totalTpl let-total>Total {{ total }} items</ng-template>
    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal?.close()">Close</button>
    </div>
  `,
})
export class RuleAuditLogsDialogComponent implements OnInit {
  dynamicData: any[] = [];
  dynamicTotal = 0;
  dynamicLoading = false;

  standardData: any[] = [];
  standardTotal = 0;
  standardLoading = false;

  constructor(
    @Optional() public modal: NzModalRef,
    private controlService: IcmControlService,
  ) {}

  ngOnInit(): void {
    this.loadDynamic(1);
    this.loadStandard(1);
  }

  loadDynamic(page: number): void {
    this.dynamicLoading = true;
    const first = (page - 1) * 20;
    this.controlService.getDynamicControls(first, 20, 1, '', encodeURIComponent('null')).subscribe({
      next: (res) => {
        if (res.success !== false) {
          this.dynamicData = res.data?.rows || [];
          this.dynamicTotal = res.data?.records || 0;
        }
        this.dynamicLoading = false;
      },
      error: () => {
        this.dynamicData = [];
        this.dynamicLoading = false;
      },
    });
  }

  loadStandard(page: number): void {
    this.standardLoading = true;
    const first = (page - 1) * 20;
    this.controlService.getStandardControls(first, 20, 1, '', encodeURIComponent('null')).subscribe({
      next: (res) => {
        if (res.success !== false) {
          this.standardData = res.data?.rows || [];
          this.standardTotal = res.data?.records || 0;
        }
        this.standardLoading = false;
      },
      error: () => {
        this.standardData = [];
        this.standardLoading = false;
      },
    });
  }
}
