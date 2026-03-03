# User Select Modal — Advanced Filter Panel

## Overview

The user-select modal in the online risk analysis module supports a dual-panel layout for filtering SAP users. A left-side filter panel allows bulk User ID paste, User Group, and User Type filtering. The right side displays the paginated users table with a sticky User ID column.

## Layout

```
┌─ Modal ──────────────────────────────────────────────────────────┐
│ Available Users                    [Add Selected] [Add All] [↻]  │
│                                                                   │
│ ┌── Filters (25%) ──┐ ┌── Users Table (75%) ──────────────────┐ │
│ │ User IDs           │ │ [Search users...]  [🔍]               │ │
│ │ ┌────────────────┐ │ │                                       │ │
│ │ │ USER001        │ │ │ ☐ │ User ID │ Name │ Type │ ...      │ │
│ │ │ USER002        │ │ │ ☐ │ USER001 │ John │ A    │ ...      │ │
│ │ └────────────────┘ │ │                                       │ │
│ │ ✓ 200 parsed       │ │                          Page 1 of N  │ │
│ │                    │ └───────────────────────────────────────┘ │
│ │ User Group         │                                           │
│ │ [____________]     │                                           │
│ │ User Type          │                                           │
│ │ [____________]     │                                           │
│ │ [Clear] [Apply]    │                                           │
│ └────────────────────┘                                           │
│                                                          [Close] │
└──────────────────────────────────────────────────────────────────┘
```

## Filter Fields

| Filter     | Property          | Backend field | matchMode    | Notes                                      |
|------------|-------------------|---------------|--------------|---------------------------------------------|
| User IDs   | `bulkUserIds`     | `bname`       | `in`         | Array of strings, parsed from textarea      |
| User Group | `filterGroup`     | `class`       | `cn`         | Single string, contains match               |
| User Type  | `filterType`      | `ustyp`       | `cn`         | Single string, contains match               |
| Search bar | `searchText`      | —             | `globalFilter` | Separate from panel, applies independently |

## Data Flow

```
Filter Panel State                    GridRequestBuilder              Backend
─────────────────                     ──────────────────              ───────
bulkUserIds: string[]  ──┐
filterGroup: string    ──┤  TableQueryParams
filterType: string     ──┤  { filters, pageIndex,    toLegacy()     lazyEvent
searchText: string     ──┘    pageSize, globalSearch } ──────────► { first, rows,
                                                                      filters: {
                                                                        bname: [{ value: [...], matchMode: 'in' }],
                                                                        class: [{ value: '...', matchMode: 'cn' }]
                                                                      },
                                                                      globalFilter }
```

## Bulk User ID Parsing

The textarea accepts user IDs separated by newlines, commas, semicolons, or tabs. On each keystroke:

1. Split by `/[\n,;\t]+/`
2. Trim and uppercase each entry
3. Remove blanks
4. Deduplicate via `Set`

The parsed count displays below the textarea (e.g. "✓ 200 parsed").

## Key Behaviors

- **Apply** resets to page 1 and reloads with current filter state
- **Clear** resets all filter fields and reloads
- **Enter** on Group/Type inputs triggers Apply
- **Enter** on global search triggers search independently
- Filters persist across pagination — changing page keeps filters active
- User ID column uses `[nzLeft]="true"` (sticky) for horizontal scroll
- Table horizontal scroll set to `{ x: '900px', y: '50vh' }`

## Files

| File | Role |
|------|------|
| `user-select-modal.component.ts` | Filter state, parsing, `loadData()` with `GridRequestBuilder.toLegacy()` |
| `user-select-modal.component.html` | Dual-panel layout, filter inputs, table with sticky column |
