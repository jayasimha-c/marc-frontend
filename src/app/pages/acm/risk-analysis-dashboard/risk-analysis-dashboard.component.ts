import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { ReportService } from '../reports/report.service';

@Component({
  standalone: false,
  selector: 'app-risk-analysis-dashboard',
  templateUrl: './risk-analysis-dashboard.component.html',
  styleUrls: ['./risk-analysis-dashboard.component.scss'],
})
export class RiskAnalysisDashboardComponent implements OnInit {
  selectedTabIndex = 0;
  sapSystems: any[] = [];
  selectedSystemId: number | null = null;
  dateRange: Date[] = [];
  selectedPreset = '30d';

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.setDatePreset('30d');
    this.loadSapSystems();
  }

  private loadSapSystems(): void {
    this.reportService.getSapSystems().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.sapSystems = resp.data;
          if (this.sapSystems.length > 0) {
            this.selectedSystemId = this.sapSystems[0].id;
          }
        }
      },
    });
  }

  setDatePreset(preset: string): void {
    this.selectedPreset = preset;
    const end = new Date();
    const start = new Date();
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    start.setDate(start.getDate() - (daysMap[preset] || 30));
    this.dateRange = [start, end];
  }

  onDateRangeChange(): void {
    this.selectedPreset = '';
  }

  get startDateStr(): string {
    return this.dateRange?.[0] ? formatDate(this.dateRange[0], 'MM/dd/yyyy', 'en-US') : '';
  }

  get endDateStr(): string {
    return this.dateRange?.[1] ? formatDate(this.dateRange[1], 'MM/dd/yyyy', 'en-US') : '';
  }
}
