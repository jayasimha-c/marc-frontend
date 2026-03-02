import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-analysis-result',
  templateUrl: './analysis-result.component.html',
})
export class AnalysisResultComponent {
  @Input() analysisMenuList: any[] = [];
  @Input() analysisComplete = false;
  @Input() violationsData: any[] = [];
  @Input() violationsTotal = 0;
  @Input() summaryData: any[] = [];
  @Input() summaryTotal = 0;
  @Input() detailedData: any[] = [];
  @Input() detailedTotal = 0;
  @Input() violationsCols: any[] = [];
  @Input() summaryCols: any[] = [];
  @Input() detailedCols: any[] = [];
  @Input() showDetailedTab = true;

  // Pagination state for each tab
  violationsPage = 1;
  summaryPage = 1;
  detailedPage = 1;
  pageSize = 10;

  // Global search per tab
  violationsSearch = '';
  summarySearch = '';
  detailedSearch = '';

  // Column filters per tab: { [field]: string }
  violationsFilters: any = {};
  summaryFilters: any = {};
  detailedFilters: any = {};

  @Input() onViolationsPageChange: (event: any) => void = () => {};
  @Input() onSummaryPageChange: (event: any) => void = () => {};
  @Input() onDetailedPageChange: (event: any) => void = () => {};
  @Input() onSummaryRowSelect: (row: any) => void = () => {};

  summarySelectedRow: any = null;

  selectSummaryRow(row: any): void {
    this.summarySelectedRow = row;
    this.onSummaryRowSelect(row);
  }

  // Build filter event in the format the backend expects
  private buildEvent(page: number, columnFilters: any, globalSearch: string): any {
    const filters: any = {};
    for (const field of Object.keys(columnFilters)) {
      const value = columnFilters[field];
      if (value && value.trim()) {
        filters[field] = [{ value: value.trim(), matchMode: 'cn' }];
      }
    }
    return {
      first: (page - 1) * this.pageSize,
      rows: this.pageSize,
      page,
      sortOrder: 1,
      sortField: '',
      filters,
      globalFilter: globalSearch ? { value: globalSearch } : null,
    };
  }

  // Violations tab
  onViolationsFilterChange(): void {
    this.violationsPage = 1;
    this.onViolationsPageChange(this.buildEvent(1, this.violationsFilters, this.violationsSearch));
  }

  onViolationsPageNav(page: number): void {
    this.violationsPage = page;
    this.onViolationsPageChange(this.buildEvent(page, this.violationsFilters, this.violationsSearch));
  }

  // Summary tab
  onSummaryFilterChange(): void {
    this.summaryPage = 1;
    this.onSummaryPageChange(this.buildEvent(1, this.summaryFilters, this.summarySearch));
  }

  onSummaryPageNav(page: number): void {
    this.summaryPage = page;
    this.onSummaryPageChange(this.buildEvent(page, this.summaryFilters, this.summarySearch));
  }

  // Detailed tab
  onDetailedFilterChange(): void {
    this.detailedPage = 1;
    this.onDetailedPageChange(this.buildEvent(1, this.detailedFilters, this.detailedSearch));
  }

  onDetailedPageNav(page: number): void {
    this.detailedPage = page;
    this.onDetailedPageChange(this.buildEvent(page, this.detailedFilters, this.detailedSearch));
  }
}
