import { Component, OnInit, Inject } from '@angular/core';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: false,
  selector: 'app-rule-detail',
  templateUrl: './rule-detail.component.html',
  styleUrls: ['./rule-detail.component.scss'],
})
export class RuleDetailComponent implements OnInit {
  loading = true;
  ruleName = '';
  ruleDescription = '';
  tableData: any[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) private dialogData: any,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.loadDetail();
  }

  private loadDetail(): void {
    this.loading = true;
    this.http.get(`riskAnalysis/ruleDetail?ruleId=${this.dialogData.ruleId}`).subscribe({
      next: (res: any) => {
        if (res.success && res.data?.length) {
          this.ruleName = res.data[0]?.rule?.ruleName || '';
          this.ruleDescription = res.data[0]?.rule?.ruleDescription || '';
          this.tableData = res.data;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
