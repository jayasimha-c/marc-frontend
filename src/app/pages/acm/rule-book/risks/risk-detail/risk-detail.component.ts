import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { RisksService } from '../risks.service';

@Component({
  standalone: false,
  selector: 'app-risk-detail',
  templateUrl: './risk-detail.component.html',
  styleUrls: ['./risk-detail.component.scss'],
})
export class RiskDetailComponent implements OnInit {
  loading = true;

  form!: FormGroup;

  rulesData: any[] = [];
  selectedRule: any = null;
  ruleObjects: any[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private risksService: RisksService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      riskName: [''],
      description: [''],
      riskCondition: [''],
      detailDescription: [''],
    });
  }

  ngOnInit(): void {
    this.risksService.riskDetail(this.dialogData.riskId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.form.patchValue({
            riskName: res.data.risk?.name,
            description: res.data.risk?.riskDescription,
            riskCondition: res.data.risk?.riskCondition,
            detailDescription: res.data.risk?.detailDesc,
          });
          this.form.disable();

          // Flatten ruleMap into table rows
          const ruleMap = res.data.ruleMap || {};
          Object.values(ruleMap).forEach((items: any) => {
            if (items?.length > 0) {
              const rule = items[0].rule;
              this.rulesData.push({
                ...rule,
                _objects: items,
              });
            }
          });
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onRuleClick(row: any): void {
    this.selectedRule = row;
    this.ruleObjects = row._objects || [];
  }
}
