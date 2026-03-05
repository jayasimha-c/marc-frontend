/**
 * User Preferences Models
 *
 * TypeScript interfaces and classes for managing user-specific view settings.
 * These models map directly to the backend UserPreference entity and GridPreferencesDTO.
 *
 * Context key convention:
 * - grid.{gridId} - AG Grid preferences
 * - page.{route} - Page-level preferences
 * - global.{setting} - Global application settings
 */

// ============================================================================
// User Preference Entity
// ============================================================================

/**
 * User preference entity matching backend UserPreferenceVO.
 */
export interface UserPreference {
    /** Primary key */
    id?: number;

    /** User ID this preference belongs to */
    userId: number;

    /** Context key identifying what the preferences are for */
    contextKey: string;

    /** Preferences JSON string */
    preferences?: string;

    /** Version for optimistic locking */
    version?: number;

    /** Creation timestamp (epoch milliseconds) */
    createdOn?: number;

    /** Modification timestamp (epoch milliseconds) */
    modifiedOn?: number;

    /** ISO 8601 formatted creation date string */
    createdOnStr?: string;

    /** ISO 8601 formatted modification date string */
    modifiedOnStr?: string;

    /** Username who created this preference */
    createdBy?: string;

    /** Username who last modified this preference */
    modifiedBy?: string;
}

// ============================================================================
// Grid Preferences DTO
// ============================================================================

/**
 * Column preferences - visibility, order, and widths.
 */
export interface ColumnPreferences {
    /** List of visible column field names, in display order */
    visible?: string[];

    /** List of all column field names in their display order */
    order?: string[];

    /** Map of column field names to their widths in pixels */
    widths?: { [field: string]: number };

    /** Map of column field names to their pinned state ('left', 'right', or null) */
    pinned?: { [field: string]: string | null };
}

/**
 * Pagination preferences.
 */
export interface PaginationPreferences {
    /** Number of rows per page (default: 25, min: 5, max: 500) */
    pageSize?: number;
}

/**
 * Single sort column for multi-sort.
 */
export interface SortColumn {
    field: string;
    direction: 'asc' | 'desc';
}

/**
 * Sorting preferences.
 */
export interface SortingPreferences {
    /** The field name to sort by */
    field?: string;

    /** The sort direction */
    direction?: 'asc' | 'desc';

    /** List of multi-sort columns (for advanced sorting) */
    multiSort?: SortColumn[];
}

/**
 * A saved filter configuration.
 */
export interface SavedFilter {
    /** User-defined name for the filter */
    name: string;

    /** The filter criteria (AG Grid's filter model) */
    criteria: { [field: string]: any };
}

/**
 * Filter preferences.
 */
export interface FilterPreferences {
    /** List of saved filters */
    savedFilters?: SavedFilter[];

    /** Name of the default filter to apply on load */
    defaultFilter?: string;

    /** Quick filter text (the global search text) */
    quickFilter?: string;
}

/**
 * View density options.
 */
export type ViewDensity = 'compact' | 'comfortable' | 'spacious';

/**
 * View preferences.
 */
export interface ViewPreferences {
    /** The grid density */
    density?: ViewDensity;

    /** Whether row selection is enabled */
    rowSelection?: boolean;

    /** Whether to show row numbers */
    showRowNumbers?: boolean;
}

/**
 * Complete grid preferences structure.
 * Matches the backend GridPreferencesDTO.
 */
export interface GridPreferences {
    /** Column preferences (visibility, order, widths) */
    columns?: ColumnPreferences;

    /** Pagination preferences (page size) */
    pagination?: PaginationPreferences;

    /** Sorting preferences (field, direction) */
    sorting?: SortingPreferences;

    /** Filter preferences (saved filters, default filter) */
    filters?: FilterPreferences;

    /** View preferences (density) */
    view?: ViewPreferences;
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default grid preferences.
 */
export const DEFAULT_GRID_PREFERENCES: GridPreferences = {
    columns: {
        visible: [],
        order: [],
        widths: {},
        pinned: {}
    },
    pagination: {
        pageSize: 25
    },
    sorting: {
        field: undefined,
        direction: 'asc'
    },
    filters: {
        savedFilters: [],
        defaultFilter: undefined,
        quickFilter: undefined
    },
    view: {
        density: 'comfortable',
        rowSelection: true,
        showRowNumbers: false
    }
};

/**
 * Default page sizes available for selection.
 */
export const DEFAULT_PAGE_SIZES: number[] = [10, 25, 50, 100, 200];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a deep copy of grid preferences.
 */
export function cloneGridPreferences(prefs: GridPreferences): GridPreferences {
    return JSON.parse(JSON.stringify(prefs));
}

/**
 * Merge partial preferences with existing preferences (deep merge).
 */
export function mergeGridPreferences(
    existing: GridPreferences,
    partial: Partial<GridPreferences>
): GridPreferences {
    const result = cloneGridPreferences(existing);

    if (partial.columns) {
        result.columns = { ...result.columns, ...partial.columns };
    }
    if (partial.pagination) {
        result.pagination = { ...result.pagination, ...partial.pagination };
    }
    if (partial.sorting) {
        result.sorting = { ...result.sorting, ...partial.sorting };
    }
    if (partial.filters) {
        result.filters = { ...result.filters, ...partial.filters };
    }
    if (partial.view) {
        result.view = { ...result.view, ...partial.view };
    }

    return result;
}

/**
 * Check if preferences are equal (deep comparison).
 */
export function arePreferencesEqual(a: GridPreferences, b: GridPreferences): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Parse preferences JSON string to GridPreferences object.
 */
export function parseGridPreferences(json: string | undefined | null): GridPreferences {
    if (!json) {
        return cloneGridPreferences(DEFAULT_GRID_PREFERENCES);
    }
    try {
        const parsed = JSON.parse(json);
        return mergeGridPreferences(DEFAULT_GRID_PREFERENCES, parsed);
    } catch (e) {
        return cloneGridPreferences(DEFAULT_GRID_PREFERENCES);
    }
}

/**
 * Stringify GridPreferences to JSON string.
 */
export function stringifyGridPreferences(prefs: GridPreferences): string {
    return JSON.stringify(prefs);
}

// ============================================================================
// Context Key Helpers
// ============================================================================

/**
 * Context key prefix constants.
 */
export const CONTEXT_KEY_PREFIX = {
    GRID: 'grid.',
    PAGE: 'page.',
    GLOBAL: 'global.'
} as const;

/**
 * Build a grid context key from a grid ID.
 */
export function buildGridContextKey(gridId: string): string {
    return `${CONTEXT_KEY_PREFIX.GRID}${gridId}`;
}

/**
 * Build a page context key from a route.
 */
export function buildPageContextKey(route: string): string {
    const normalizedRoute = route.replace(/\//g, '.').replace(/^\./, '');
    return `${CONTEXT_KEY_PREFIX.PAGE}${normalizedRoute}`;
}

/**
 * Build a global context key from a setting name.
 */
export function buildGlobalContextKey(setting: string): string {
    return `${CONTEXT_KEY_PREFIX.GLOBAL}${setting}`;
}

/**
 * Extract the grid ID from a grid context key.
 */
export function extractGridId(contextKey: string): string | null {
    if (contextKey.startsWith(CONTEXT_KEY_PREFIX.GRID)) {
        return contextKey.substring(CONTEXT_KEY_PREFIX.GRID.length);
    }
    return null;
}

/**
 * Check if a context key is valid.
 */
export function isValidContextKey(contextKey: string): boolean {
    if (!contextKey || contextKey.length === 0 || contextKey.length > 255) {
        return false;
    }
    return /^[a-zA-Z0-9._-]+$/.test(contextKey);
}
