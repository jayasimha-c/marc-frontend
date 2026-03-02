import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ViolationGroup } from '../rule-violations.component';
import { getRuleTypeLabel } from '../../../btp/btp.model';
import { ChartOptions } from '../../../../../shared/models/chart.model';

@Component({
  standalone: false,
  selector: 'app-violation-detail-panel',
  templateUrl: './violation-detail-panel.component.html',
  styleUrls: ['./violation-detail-panel.component.scss'],
})
export class ViolationDetailPanelComponent implements OnChanges {
  @Input() selectedGroup!: ViolationGroup;
  @Input() selectedViolation: any;
  @Input() violationDetail: any;
  @Input() detailLoading = false;

  @Output() viewFullDetail = new EventEmitter<void>();
  @Output() createIssue = new EventEmitter<void>();
  @Output() createIssueForViolation = new EventEmitter<any>();
  @Output() bulkCreateIssues = new EventEmitter<void>();
  @Output() violationSelected = new EventEmitter<{ violation: any; group: ViolationGroup }>();

  systemsChartOptions: Partial<ChartOptions> | null = null;

  private readonly SYSTEM_COLORS = [
    '#1890ff', '#722ed1', '#fa541c', '#13c2c2', '#52c41a',
    '#eb2f96', '#f5222d', '#faad14', '#2f54eb', '#a0d911',
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedGroup'] && this.selectedGroup) {
      this.buildSystemsChart();
    }
  }

  get systemsWithIssues(): number {
    return this.selectedGroup?.violations.filter((v) => v.issueName).length || 0;
  }

  get systemsWithoutIssues(): number {
    return this.selectedGroup?.violations.filter((v) => !v.issueName).length || 0;
  }

  // -- Chart --

  private buildSystemsChart(): void {
    const violations = this.selectedGroup.violations;
    if (!violations.length) return;

    const dates = violations
      .map((v) => (v.createdDate ? new Date(v.createdDate) : null))
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

    if (!dates.length) { this.systemsChartOptions = null; return; }

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const rangeDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000) + 1;

    const interval = rangeDays <= 30 ? 'day' : rangeDays <= 90 ? 'week' : rangeDays <= 365 ? 'month' : 'quarter';

    const bucketEntries = this.buildTimeBuckets(minDate, maxDate, interval);
    const sortedKeys = Array.from(bucketEntries.keys()).sort();
    const categories = sortedKeys.map((k) => bucketEntries.get(k)!);

    const systemSet = new Set<string>();
    for (const v of violations) systemSet.add(v.sapSystemName || 'Unknown');
    const systemNames = Array.from(systemSet).sort();

    const matrix = new Map<string, Map<string, number>>();
    for (const sys of systemNames) {
      const row = new Map<string, number>();
      for (const key of sortedKeys) row.set(key, 0);
      matrix.set(sys, row);
    }

    for (const v of violations) {
      const d = v.createdDate ? new Date(v.createdDate) : null;
      if (!d || isNaN(d.getTime())) continue;
      const bucketKey = this.getBucketKey(d, interval);
      const sys = v.sapSystemName || 'Unknown';
      const row = matrix.get(sys);
      if (row && row.has(bucketKey)) row.set(bucketKey, row.get(bucketKey)! + 1);
    }

    const series = systemNames.map((sys) => ({
      name: sys,
      data: sortedKeys.map((k) => matrix.get(sys)!.get(k)!),
    }));

    this.systemsChartOptions = {
      series,
      chart: { type: 'bar', height: 200, stacked: true, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: false, columnWidth: categories.length <= 5 ? '40%' : '70%', borderRadius: 2 } },
      dataLabels: { enabled: false },
      xaxis: { categories, labels: { style: { fontSize: '10px' }, rotate: categories.length > 8 ? -45 : 0 } },
      yaxis: { show: true, labels: { style: { fontSize: '10px' } } },
      colors: systemNames.map((_, i) => this.SYSTEM_COLORS[i % this.SYSTEM_COLORS.length]),
      legend: { position: 'bottom', fontSize: '11px' },
      grid: { borderColor: '#f0f0f0', strokeDashArray: 3 },
      tooltip: { shared: true, intersect: false },
    } as Partial<ChartOptions>;
  }

  private buildTimeBuckets(min: Date, max: Date, interval: string): Map<string, string> {
    const buckets = new Map<string, string>();
    const current = new Date(min);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (interval === 'week') current.setDate(current.getDate() - current.getDay());
    else if (interval === 'month') current.setDate(1);
    else if (interval === 'quarter') current.setMonth(Math.floor(current.getMonth() / 3) * 3, 1);

    while (current <= max || buckets.size === 0) {
      const key = this.getBucketKey(current, interval);
      if (!buckets.has(key)) {
        const y = current.getFullYear(), m = current.getMonth(), d = current.getDate();
        let label = '';
        if (interval === 'day') label = `${months[m]} ${d}`;
        else if (interval === 'week') label = `${months[m]} ${d}`;
        else if (interval === 'month') label = `${months[m]} ${y}`;
        else label = `Q${Math.floor(m / 3) + 1} ${y}`;
        buckets.set(key, label);
      }
      if (interval === 'day') current.setDate(current.getDate() + 1);
      else if (interval === 'week') current.setDate(current.getDate() + 7);
      else if (interval === 'month') current.setMonth(current.getMonth() + 1);
      else current.setMonth(current.getMonth() + 3);
    }
    return buckets;
  }

  private getBucketKey(date: Date, interval: string): string {
    const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
    if (interval === 'day') return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (interval === 'week') {
      const ws = new Date(date);
      ws.setDate(ws.getDate() - ws.getDay());
      return `${ws.getFullYear()}-${String(ws.getMonth() + 1).padStart(2, '0')}-${String(ws.getDate()).padStart(2, '0')}`;
    }
    if (interval === 'month') return `${y}-${String(m + 1).padStart(2, '0')}`;
    return `${y}-Q${Math.floor(m / 3) + 1}`;
  }

  // -- Helpers --

  getTypeLabel(type: string): string { return getRuleTypeLabel(type); }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      SAP_PARAMETER: 'control', AUDIT_LOG: 'file-text', BTP: 'cloud',
      HANA_DATABASE: 'database', SAP_UME: 'user', SAP_ABAP: 'code',
    };
    return map[type] || 'audit';
  }

  getSeverityColor(severity: string): string {
    switch ((severity || '').toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'gold';
      case 'LOW': return 'green';
      default: return 'default';
    }
  }

  getIssueColor(violation: any): string {
    if (!violation.issueName) return 'default';
    const status = (violation.issueStatus || '').toLowerCase();
    if (status === 'resolved' || status === 'closed') return 'green';
    return 'blue';
  }

  getIssueLabel(violation: any): string {
    return violation.issueName || 'No Issue';
  }

  isViolationSelected(violation: any): boolean {
    return this.selectedViolation === violation;
  }

  onSelectViolation(violation: any): void {
    this.violationSelected.emit({ violation, group: this.selectedGroup });
  }
}
