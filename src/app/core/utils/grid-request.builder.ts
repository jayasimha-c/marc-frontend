import { TableQueryParams } from '../../shared/components/advanced-table/advanced-table.models';

/**
 * Shared utility to convert TableQueryParams (from app-advanced-table)
 * into the two backend request formats used across the application.
 */
export class GridRequestBuilder {

  /**
   * Convert to GridFilterRequest format (POST body).
   * Used by: ServiceNow, Identity Repository, CIS, Role Concept endpoints.
   *
   * Output: { page, size, sortField, sortDirection, filters: ColumnFilter[], globalFilter }
   */
  static toGridFilter(params: TableQueryParams, defaults?: { sortField?: string; sortDirection?: string; pageSize?: number }): any {
    const filters: any[] = [];
    if (params.filters) {
      for (const field of Object.keys(params.filters)) {
        const value = params.filters[field];
        if (value != null && typeof value === 'string' && value.trim()) {
          filters.push({ field, operator: 'CONTAINS', value: value.trim() });
        }
      }
    }

    return {
      page: (params.pageIndex ?? 1) - 1,
      size: params.pageSize ?? defaults?.pageSize ?? 20,
      sortField: params.sort?.field || defaults?.sortField || '',
      sortDirection: GridRequestBuilder.toSortDirection(params.sort?.direction, defaults?.sortDirection),
      filters,
      globalFilter: params.globalSearch || '',
    };
  }

  /**
   * Convert to legacy PrimeNG pagination format (GET query params).
   * Used by: analysis/violationResults, analysis/resultSummary, adhocAnalysis/results,
   *          analysis/simulationResultSummary, analysis/simulationRiskViolaitonGrid
   *
   * Output: { first, rows, sortOrder, sortField, filters: PrimeNG object, globalFilter }
   */
  static toLegacy(params: TableQueryParams): any {
    const pageSize = params.pageSize ?? 10;
    const pageIndex = params.pageIndex ?? 1;

    // Convert { field: 'value' } → { field: [{ value, matchMode: 'cn' }] }
    // Convert { field: ['v1','v2'] } → { field: [{ value: [...], matchMode: 'in' }] }
    const filters: any = {};
    if (params.filters) {
      for (const field of Object.keys(params.filters)) {
        const value = params.filters[field];
        if (Array.isArray(value) && value.length > 0) {
          filters[field] = [{ value, matchMode: 'in' }];
        } else if (value != null && typeof value === 'string' && value.trim()) {
          filters[field] = [{ value: value.trim(), matchMode: 'cn' }];
        }
      }
    }

    return {
      first: (pageIndex - 1) * pageSize,
      rows: pageSize,
      sortOrder: params.sort?.direction === 'descend' ? 1 : 0,
      sortField: params.sort?.field || '',
      filters,
      globalFilter: params.globalSearch || null,
    };
  }

  /**
   * Create a default legacy pagination event (for initial data load).
   */
  static defaultLegacy(pageSize = 10): any {
    return { first: 0, rows: pageSize, sortOrder: 0, sortField: '', filters: {}, globalFilter: null };
  }

  private static toSortDirection(direction?: 'ascend' | 'descend' | null, fallback?: string): string {
    if (direction === 'ascend') return 'ASC';
    if (direction === 'descend') return 'DESC';
    return fallback || 'ASC';
  }
}
