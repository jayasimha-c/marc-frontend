import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { IcmControlService } from '../../icm-control.service';

@Component({
  standalone: false,
  selector: 'app-control-rule-result',
  templateUrl: './control-rule-result.component.html',
})
export class ControlRuleResultComponent implements OnInit {
  loading = false;
  columns: { field: string; header: string }[] = [];
  data: any[] = [];
  totalRecords = 0;

  private ruleId: number | null;
  private revision: number | null;
  private stdControlId: number | null;
  private controlId: number;
  private metaCols: any[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modalRef: NzModalRef,
    private icmService: IcmControlService,
  ) {
    this.ruleId = this.dialogData?.data?.icmRule?.id ?? null;
    this.revision = this.dialogData?.data?.revision ?? null;
    this.stdControlId = this.dialogData?.data?.stdControl?.id ?? null;
    this.controlId = this.dialogData?.controlId;
  }

  ngOnInit(): void {
    this.loadColumnsAndData();
  }

  private loadColumnsAndData(): void {
    this.loading = true;

    if (this.stdControlId != null) {
      this.icmService.getStandardAutomatedRuleResultColumns(this.stdControlId, this.controlId, this.revision!).subscribe({
        next: (res) => {
          if (res.data?.rows) {
            this.buildColumns(res.data.rows);
            this.loadStandardData();
          } else {
            this.loading = false;
          }
        },
        error: () => { this.loading = false; },
      });
    } else if (this.ruleId != null) {
      this.icmService.getRuleResultColumns(this.ruleId, this.controlId).subscribe({
        next: (res) => {
          if (res.data?.rows) {
            this.buildColumns(res.data.rows);
            this.loadRuleData();
          } else {
            this.loading = false;
          }
        },
        error: () => { this.loading = false; },
      });
    } else {
      this.loading = false;
    }
  }

  private buildColumns(metaRows: any[]): void {
    this.metaCols = metaRows;
    this.columns = metaRows.map(col => ({
      field: col.canonicalName,
      header: col.desc || col.canonicalName,
    }));
  }

  private loadRuleData(): void {
    this.icmService.getRuleResult(this.ruleId!, this.revision!, this.controlId).subscribe({
      next: (res) => {
        this.data = this.mapData(res.data?.rows || []);
        this.totalRecords = res.data?.records || this.data.length;
        this.loading = false;
      },
      error: () => { this.data = []; this.loading = false; },
    });
  }

  private loadStandardData(): void {
    this.icmService.getStandardAutomatedRuleResult(this.stdControlId!, this.controlId, this.revision!).subscribe({
      next: (res) => {
        this.data = this.mapData(res.data?.rows || []);
        this.totalRecords = res.data?.records || this.data.length;
        this.loading = false;
      },
      error: () => { this.data = []; this.loading = false; },
    });
  }

  private mapData(rows: any[][]): any[] {
    return rows.map(row => {
      const mapped: any = {};
      this.metaCols.forEach((meta, idx) => {
        mapped[meta.canonicalName] = row[idx];
      });
      return mapped;
    });
  }
}
