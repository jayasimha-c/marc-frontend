---
description: Strict rule for migrating components to marc-frontend
---
# Migration Strict Rule: NG-ZORRO and API Integration

When migrating any component from the legacy `marcacm` angular project to the new `marc-frontend` application, the following rules MUST be strictly adhered to:

## 1. 100% Refactor to NG-ZORRO
- No legacy UI library components (e.g., AG-Grid, PrimeNG, legacy Bootstrap layers) should be carried over.
- Every UI element must be natively rewritten using pure NG-ZORRO equivalents (e.g., replace `nz-ag-grid-table` with standard `nz-table`).
- Ensure all styling aligns with the new layout, responsive constraints, and dark-mode compatibility (`:host-context(.dark)`).
- Utilize shared components from `src/app/shared/components` appropriately (such as `app-page-panel` instead of raw styled wraps/panels).

## 2. 100% API Integration
- The underlying service logic, Data Transfer Objects (DTOs), and endpoints must be fully preserved to match the backend expectations.
- Endpoints mapped in the previous service declarations must carry over without skipping any parameters.
- If pagination, sorting, and filtering state are extracted from legacy grids (like AG-Grid's `PaginationModel`), they must be mapped properly from the native NG-ZORRO table's `nzQueryParams` emission to ensure the server-side operations function exactly as they did in the old application.

*Rule automatically generated confirming the successful migration of user-search component parameters.*
