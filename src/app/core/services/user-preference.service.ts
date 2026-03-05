import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response';
import {
    UserPreference,
    GridPreferences,
    DEFAULT_GRID_PREFERENCES,
    cloneGridPreferences,
    mergeGridPreferences,
    parseGridPreferences,
    isValidContextKey,
    buildGridContextKey
} from '../models/user-preference.model';

interface CacheEntry {
    preferences: GridPreferences;
    timestamp: number;
    dirty: boolean;
}

interface PendingSave {
    contextKey: string;
    preferences: GridPreferences;
}

@Injectable({
    providedIn: 'root'
})
export class UserPreferenceService implements OnDestroy {

    private readonly BASE_URL = 'user-preferences';
    private readonly CACHE_TTL = 5 * 60 * 1000;
    private readonly SAVE_DEBOUNCE_MS = 500;

    private cache: Map<string, CacheEntry> = new Map();
    private saveSubject = new Subject<PendingSave>();
    private destroy$ = new Subject<void>();
    private preferencesUpdated$ = new BehaviorSubject<{ contextKey: string; preferences: GridPreferences } | null>(null);

    constructor(private http: HttpClient) {
        this.initSaveSubscription();
    }

    ngOnDestroy(): void {
        this.flushDirtyPreferences();
        this.destroy$.next();
        this.destroy$.complete();
    }

    // =========================================================================
    // Public API - Get Preferences
    // =========================================================================

    getGridPreferences(gridId: string): Observable<GridPreferences> {
        const contextKey = buildGridContextKey(gridId);
        return this.getPreferences(contextKey);
    }

    getPreferences(contextKey: string): Observable<GridPreferences> {
        const cached = this.cache.get(contextKey);
        if (cached && !this.isCacheExpired(cached)) {
            return of(cloneGridPreferences(cached.preferences));
        }

        return this.http.get<ApiResponse>(`${this.BASE_URL}/grid/${contextKey}`).pipe(
            map(response => {
                if (response.success && response.data) {
                    return response.data as GridPreferences;
                }
                return cloneGridPreferences(DEFAULT_GRID_PREFERENCES);
            }),
            tap(prefs => this.updateCache(contextKey, prefs, false)),
            catchError(() => {
                return of(cloneGridPreferences(DEFAULT_GRID_PREFERENCES));
            })
        );
    }

    getAllPreferences(prefix?: string): Observable<UserPreference[]> {
        let url = this.BASE_URL;
        if (prefix) {
            url += `?prefix=${encodeURIComponent(prefix)}`;
        }

        return this.http.get<ApiResponse>(url).pipe(
            map(response => {
                if (response.success && response.data) {
                    return response.data as UserPreference[];
                }
                return [];
            }),
            catchError(() => of([]))
        );
    }

    // =========================================================================
    // Public API - Save Preferences
    // =========================================================================

    saveGridPreferences(gridId: string, preferences: GridPreferences): void {
        const contextKey = buildGridContextKey(gridId);
        this.savePreferences(contextKey, preferences);
    }

    savePreferences(contextKey: string, preferences: GridPreferences): void {
        if (!isValidContextKey(contextKey)) {
            return;
        }

        this.updateCache(contextKey, preferences, true);
        this.saveSubject.next({ contextKey, preferences });
    }

    mergeGridPreferences(gridId: string, partial: Partial<GridPreferences>): void {
        const contextKey = buildGridContextKey(gridId);

        const cached = this.cache.get(contextKey);
        const current = cached ? cached.preferences : cloneGridPreferences(DEFAULT_GRID_PREFERENCES);

        const merged = mergeGridPreferences(current, partial);
        this.savePreferences(contextKey, merged);
    }

    // =========================================================================
    // Public API - Convenience Methods
    // =========================================================================

    updateColumnWidth(gridId: string, field: string, width: number): void {
        this.mergeGridPreferences(gridId, {
            columns: {
                widths: { [field]: width }
            }
        });
    }

    updateColumnOrder(gridId: string, order: string[]): void {
        this.mergeGridPreferences(gridId, {
            columns: { order }
        });
    }

    updateVisibleColumns(gridId: string, visible: string[]): void {
        this.mergeGridPreferences(gridId, {
            columns: { visible }
        });
    }

    updatePageSize(gridId: string, pageSize: number): void {
        this.mergeGridPreferences(gridId, {
            pagination: { pageSize }
        });
    }

    // =========================================================================
    // Public API - Delete Preferences
    // =========================================================================

    resetGridPreferences(gridId: string): Observable<boolean> {
        const contextKey = buildGridContextKey(gridId);
        return this.deletePreferences(contextKey);
    }

    deletePreferences(contextKey: string): Observable<boolean> {
        this.cache.delete(contextKey);

        return this.http.delete<ApiResponse>(`${this.BASE_URL}/${contextKey}`).pipe(
            map(response => response.success),
            tap(success => {
                if (success) {
                    this.preferencesUpdated$.next({
                        contextKey,
                        preferences: cloneGridPreferences(DEFAULT_GRID_PREFERENCES)
                    });
                }
            }),
            catchError(() => of(false))
        );
    }

    // =========================================================================
    // Public API - Observables
    // =========================================================================

    onPreferencesUpdated(): Observable<{ contextKey: string; preferences: GridPreferences }> {
        return this.preferencesUpdated$.pipe(
            filter(update => update !== null),
            map(update => update!)
        );
    }

    // =========================================================================
    // Public API - Cache Management
    // =========================================================================

    clearCache(contextKey?: string): void {
        if (contextKey) {
            this.cache.delete(contextKey);
        } else {
            this.cache.clear();
        }
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    private initSaveSubscription(): void {
        this.saveSubject.pipe(
            debounceTime(this.SAVE_DEBOUNCE_MS),
            switchMap(pending => this.performSave(pending.contextKey, pending.preferences)),
            takeUntil(this.destroy$)
        ).subscribe();
    }

    private performSave(contextKey: string, preferences: GridPreferences): Observable<boolean> {
        return this.http.put<ApiResponse>(`${this.BASE_URL}/grid/${contextKey}`, preferences).pipe(
            map(response => response.success),
            tap(success => {
                if (success) {
                    const cached = this.cache.get(contextKey);
                    if (cached) {
                        cached.dirty = false;
                    }
                    this.preferencesUpdated$.next({ contextKey, preferences });
                }
            }),
            catchError(() => of(false))
        );
    }

    private updateCache(contextKey: string, preferences: GridPreferences, dirty: boolean): void {
        this.cache.set(contextKey, {
            preferences: cloneGridPreferences(preferences),
            timestamp: Date.now(),
            dirty
        });
    }

    private isCacheExpired(entry: CacheEntry): boolean {
        return Date.now() - entry.timestamp > this.CACHE_TTL;
    }

    private flushDirtyPreferences(): void {
        this.cache.forEach((entry, contextKey) => {
            if (entry.dirty) {
                this.http.put(`${this.BASE_URL}/grid/${contextKey}`, entry.preferences)
                    .subscribe({ error: () => {} });
            }
        });
    }
}
