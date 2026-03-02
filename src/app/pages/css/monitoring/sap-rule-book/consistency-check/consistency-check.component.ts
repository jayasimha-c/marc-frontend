import { Component, OnInit, Optional } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { CssMonitoringService } from '../../css-monitoring.service';
import { CssRuleInconsistency } from '../../css-monitoring.model';

@Component({
  standalone: false,
  selector: 'app-css-consistency-check',
  templateUrl: './consistency-check.component.html',
})
export class CssConsistencyCheckComponent implements OnInit {
  data: any[] = [];
  loading = false;

  constructor(
    private cssMonitoringService: CssMonitoringService,
    @Optional() public modal: NzModalRef,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cssMonitoringService.cssRuleConsistencyCheck().subscribe({
      next: (res) => {
        const items = res.data || [];
        this.data = items.map((item: CssRuleInconsistency) => ({
          ruleId: item.ruleId,
          ruleCode: item.ruleCode,
          ruleName: item.ruleName,
          ruleType: item.ruleType,
          parameterType: item.parameterType,
          severity: item.severity,
          checkSeverity: item.checkSeverity,
          inconsistencies: item.inconsistencies?.join('; ') || '',
        }));
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  getSeverityColor(severity: string): string {
    if (!severity) return 'default';
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'gold';
      case 'LOW': return 'blue';
      case 'ERROR': return 'red';
      case 'WARNING': return 'orange';
      case 'INFO': return 'blue';
      default: return 'default';
    }
  }
}
