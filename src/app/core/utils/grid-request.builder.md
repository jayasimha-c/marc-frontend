# GridRequestBuilder

Shared utility that converts `TableQueryParams` (emitted by `app-advanced-table` or built manually) into the two backend request formats used across the application.

**File:** `core/utils/grid-request.builder.ts`

## TableQueryParams

```typescript
interface TableQueryParams {
  pageIndex: number;
  pageSize: number;
  sort?: { field: string; direction: 'ascend' | 'descend' | null };
  filters: Record<string, string | string[]>;
  globalSearch: string;
}
```

`filters` accepts:
- `string` — single value, converted to a contains/text match
- `string[]` — array of values, converted to an IN match (bulk filtering)

## Methods

### `toLegacy(params)` — PrimeNG / LazyEvent format

Used by endpoints that expect the legacy PrimeNG pagination object (risk analysis, simulations, adhoc analysis).

```
Input                              Output
─────                              ──────
{ pageIndex: 1, pageSize: 10 }  →  { first: 0, rows: 10 }
{ filters: { bname: 'FOO' } }   →  { filters: { bname: [{ value: 'FOO', matchMode: 'cn' }] } }
{ filters: { bname: ['A','B'] } → { filters: { bname: [{ value: ['A','B'], matchMode: 'in' }] } }
{ globalSearch: 'test' }        →  { globalFilter: 'test' }
```

### `toGridFilter(params, defaults?)` — GridFilterRequest format

Used by endpoints that expect the Spring `GridFilterRequest` object (ServiceNow, Identity Repository, Role Concept).

```
Input                              Output
─────                              ──────
{ pageIndex: 2, pageSize: 20 }  →  { page: 1, size: 20 }
{ filters: { name: 'foo' } }    →  { filters: [{ field: 'name', operator: 'CONTAINS', value: 'foo' }] }
{ sort: { field: 'id',          →  { sortField: 'id', sortDirection: 'ASC' }
    direction: 'ascend' } }
```

### `defaultLegacy(pageSize?)` — Empty initial event

Returns a zeroed-out legacy event for first-load scenarios where no filters or sorting are needed.

## Usage Patterns

### With app-advanced-table (standard)
```typescript
onQuery(params: TableQueryParams) {
  const req = GridRequestBuilder.toGridFilter(params);
  this.api.search(req).subscribe(...);
}
```

### Manual construction (e.g. user-select-modal)
```typescript
const params: TableQueryParams = {
  pageIndex: this.currentPage,
  pageSize: this.pageSize,
  filters: { bname: this.bulkUserIds, class: this.filterGroup },
  globalSearch: this.searchText,
};
const event = GridRequestBuilder.toLegacy(params);
```
