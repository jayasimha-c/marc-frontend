import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { RisksService } from '../risks.service';
import { RulesService } from '../../rules/rules.service';

@Component({
  standalone: false,
  selector: 'app-risk-detail',
  templateUrl: './risk-detail.component.html',
  styleUrls: ['./risk-detail.component.scss'],
})
export class RiskDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  rulesLoading = true;
  rulesData: any[] = [];

  selectedRule: any = null;
  objectsLoading = false;
  ruleObjects: any[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private risksService: RisksService,
    private rulesService: RulesService,
  ) {}

  ngOnInit(): void {
    this.loadRules();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRules(): void {
    this.rulesLoading = true;
    this.risksService.getRiskRules(this.dialogData.riskId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.rulesData = (res?.data?.rows || []).map((r: any) => ({
          ...r,
          businessProcessName: r.businessProcess?.name || '',
          subProcName: r.subProc?.name || '',
          ruleTypeName: r.ruleType?.name || '',
        }));
        this.rulesLoading = false;
      },
      error: () => { this.rulesData = []; this.rulesLoading = false; },
    });
  }

  toggleRule(row: any): void {
    if (this.selectedRule?.id === row.id) {
      this.selectedRule = null;
      this.ruleObjects = [];
      return;
    }
    this.selectedRule = row;
    this.objectsLoading = true;
    this.ruleObjects = [];
    const systemType = row.systemType || 'SAP';
    this.rulesService.getRuleObjects(row.id, systemType).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.ruleObjects = res?.data?.rows || [];
        this.objectsLoading = false;
      },
      error: () => { this.ruleObjects = []; this.objectsLoading = false; },
    });
  }
}
