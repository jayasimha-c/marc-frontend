import { Component, Input } from '@angular/core';
import { GridRequestBuilder } from '../../../../core/utils/grid-request.builder';
import { TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

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

  private buildEvent(page: number, columnFilters: any, globalSearch: string): any {
    const params: TableQueryParams = {
      pageIndex: page,
      pageSize: this.pageSize,
      filters: columnFilters,
      globalSearch: globalSearch || '',
    };
    return GridRequestBuilder.toLegacy(params);
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
