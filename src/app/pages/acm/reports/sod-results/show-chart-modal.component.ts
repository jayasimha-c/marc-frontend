import { Component, Inject, OnInit, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { ReportService } from '../report.service';
import { ChartOptions } from '../../../../shared/models/chart.model';

interface TreemapDataPoint {
  x: string;
  y: number;
  source: string;
  target: string;
}

@Component({
  standalone: false,
  selector: 'app-show-chart-modal',
  template: `
    <div style="padding: 16px;">
      <section *ngIf="chartData.length > 0" style="height: 500px;">
        <common-apx-chart
          [loading]="loading"
          [chartOptions]="chartOptions"
        ></common-apx-chart>
      </section>

      <nz-empty *ngIf="!loading && chartData.length === 0" nzNotFoundContent="No chart data available"></nz-empty>

      <section style="margin-top: 16px;">
        <h4>Authorization Details</h4>
        <nz-table
          #detailTable
          [nzData]="tableData"
          nzSize="small"
          [nzScroll]="{ x: '1200px' }"
          [nzPageSize]="10"
        >
          <thead>
            <tr>
              <th>Risk</th>
              <th>Risk Desc</th>
              <th>Risk Type</th>
              <th>Rule</th>
              <th>Rule Desc</th>
              <th>Role</th>
              <th>Role Desc</th>
              <th>Auth</th>
              <th>Object</th>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of detailTable.data">
              <td>{{ row.riskName }}</td>
              <td>{{ row.riskDescription }}</td>
              <td>{{ row.riskType }}</td>
              <td>{{ row.ruleName }}</td>
              <td>{{ row.ruleDescription }}</td>
              <td>{{ row.role }}</td>
              <td>{{ row.roleDesc }}</td>
              <td>{{ row.autn }}</td>
              <td>{{ row.ruleObjName }}</td>
              <td>{{ row.field }}</td>
              <td>{{ row.von }}</td>
            </tr>
          </tbody>
        </nz-table>
      </section>
    </div>

    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Close</button>
    </div>
  `,
})
export class ShowChartModalComponent implements OnInit {
  loading = false;
  chartData: TreemapDataPoint[] = [];
  tableData: any[] = [];
  chartOptions: Partial<ChartOptions> = {};

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
    @Optional() public modal: NzModalRef,
    private reportService: ReportService,
  ) {}

  ngOnInit(): void {
    this.initChartOptions();
    this.loadChartData();
  }

  private initChartOptions(): void {
    this.chartOptions = {
      chart: {
        type: 'treemap',
        height: 450,
        toolbar: { show: false },
      },
      series: [],
      title: {
        text: 'Risk Chart',
        align: 'left',
        style: { fontSize: '16px', color: '#666' },
      },
      plotOptions: {
        treemap: {
          enableShades: true,
          shadeIntensity: 0.5,
          reverseNegativeShade: true,
          colorScale: {
            ranges: [
              { from: -6, to: 0, color: '#CD363A' },
              { from: 0.001, to: 6, color: '#52B12C' },
            ],
          },
        },
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '12px', fontWeight: 'bold', colors: ['#fff'] },
        offsetY: -4,
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: function (val: number): string {
            return val + ' risks';
          },
        },
      },
    };
  }

  private loadChartData(): void {
    const data = this.dialogData?.data;
    if (!data) return;

    this.loading = true;
    this.reportService
      .getSankeyChartData({
        jobId: data.id,
        name: data.userName,
        simulation: data.simulation || false,
      })
      .subscribe({
        next: (resp) => {
          if (resp.success && resp.data) {
            this.tableData = resp.data.tableData || [];

            if (resp.data.roleToRuleMap) {
              this.addMapToChartData(resp.data.roleToRuleMap);
            }
            if (resp.data.ruleToRiskMap) {
              this.addMapToChartData(resp.data.ruleToRiskMap);
            }

            this.updateChartSeries();
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  private addMapToChartData(mapObject: Record<string, Record<string, number>>): void {
    for (const [source, targets] of Object.entries(mapObject)) {
      for (const [target, value] of Object.entries(targets)) {
        this.chartData.push({
          x: `${source} -> ${target}`,
          y: (value as number) || 1,
          source,
          target,
        });
      }
    }
  }

  private updateChartSeries(): void {
    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: 'Risk Flow',
          data: this.chartData,
        },
      ],
      tooltip: {
        enabled: true,
        custom: function ({ seriesIndex, dataPointIndex, w }: any): string {
          const point = w.config.series[seriesIndex].data[dataPointIndex];
          return `
            <div style="padding: 8px;">
              <strong>Source:</strong> ${point.source}<br/>
              <strong>Target:</strong> ${point.target}<br/>
              <strong>Risk Count:</strong> ${point.y}
            </div>
          `;
        },
      },
    };
  }
}
