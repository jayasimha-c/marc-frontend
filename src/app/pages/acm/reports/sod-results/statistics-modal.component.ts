import { Component, Inject, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

interface StatisticsCard {
  title: string;
  value: string | number;
  subTitle: string;
  icon: string;
}

@Component({
  standalone: false,
  selector: 'app-statistics-modal',
  template: `
    <div style="padding: 16px;">
      <div nz-row [nzGutter]="[16, 16]">
        <div nz-col [nzSpan]="8" *ngFor="let card of cards">
          <app-statistics-card
            [title]="card.title"
            [value]="card.value"
            [description]="card.subTitle"
            [icon]="card.icon"
          ></app-statistics-card>
        </div>
      </div>

      <nz-divider></nz-divider>

      <h4>Risk Type Summary</h4>
      <nz-table
        #statsTable
        [nzData]="riskTypeDetails"
        nzSize="small"
        [nzFrontPagination]="false"
        [nzShowPagination]="false"
      >
        <thead>
          <tr>
            <th>Risk Type</th>
            <th>Users</th>
            <th>Risks</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of statsTable.data">
            <td>{{ row.riskType }}</td>
            <td>{{ row.targets }}</td>
            <td>{{ row.risks }}</td>
          </tr>
        </tbody>
      </nz-table>
    </div>

    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Close</button>
    </div>
  `,
})
export class StatisticsModalComponent {
  cards: StatisticsCard[] = [];
  riskTypeDetails: any[] = [];

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
    @Optional() public modal: NzModalRef,
  ) {
    const resultData = this.dialogData?.data?.data?.resultData || {};
    this.riskTypeDetails = resultData.riskTypeDetails || [];
    this.cards = this.buildCards(resultData);
  }

  private buildCards(rd: any): StatisticsCard[] {
    const allUsers = rd.allUsers || 0;
    const targetWithRisks = rd.targetWithRisks || 0;
    const riskPercent = allUsers > 0
      ? Math.round((targetWithRisks / allUsers) * 100) + '%'
      : '0%';

    return [
      {
        title: 'Users in System',
        value: allUsers,
        subTitle: `Selected: ${rd.activeUsers || 0}`,
        icon: 'team',
      },
      {
        title: 'Users with Risks',
        value: targetWithRisks,
        subTitle: `Without: ${rd.targetWithoutRisks || 0}`,
        icon: 'warning',
      },
      {
        title: 'Risk Violations',
        value: rd.riskViolations || 0,
        subTitle: `Unique: ${rd.uniqueRiskViolations || 0}`,
        icon: 'exclamation-circle',
      },
      {
        title: 'Rules in Rulebook',
        value: rd.rules || 0,
        subTitle: `Selected: ${rd.selectedRisks || 0}`,
        icon: 'book',
      },
      {
        title: 'Mitigations',
        value: rd.mitigations || 0,
        subTitle: 'Controls',
        icon: 'safety-certificate',
      },
      {
        title: 'Risk %',
        value: riskPercent,
        subTitle: 'Users with risks',
        icon: 'pie-chart',
      },
    ];
  }
}
