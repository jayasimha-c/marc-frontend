import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CssDashboardService } from '../css-dashboard.service';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';

@Component({
  standalone: false,
  selector: 'app-security-event-logs',
  templateUrl: './security-event-logs.component.html',
  styleUrls: ['./security-event-logs.component.scss'],
  providers: [DatePipe],
})
export class SecurityEventLogsComponent implements OnInit, OnDestroy {
  @ViewChild('eventDetailPanel') eventDetailPanel!: SidePanelComponent;

  private destroy$ = new Subject<void>();
  private searchInput$ = new Subject<string>();

  loading = false;
  searchQuery = '';
  selectedEvent: any = null;

  // Filters
  sapSystems: any[] = [];
  selectedSystemId = '-1';
  dateRange: Date[] = [];
  activePreset: number | null = 90;
  readonly datePresets = [
    { label: '7d', days: 7 },
    { label: '1m', days: 30 },
    { label: '3m', days: 90 },
    { label: '1y', days: 365 },
  ];

  // Table
  eventData: any[] = [];
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;

  constructor(
    private cssDashboardService: CssDashboardService,
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.setPreset(90);
    this.loadSystems();

    // Apply query param pre-filters
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['systemName']) {
        // Find system by name once systems are loaded
        const found = this.sapSystems.find((s) => s.destinationName === params['systemName']);
        if (found) this.selectedSystemId = found.id + '';
      }
      if (params['severity']) {
        // Could add severity filter if needed
      }
      this.loadEventLogs();
    });

    // Search debounce
    this.searchInput$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((searchText) => {
      this.searchQuery = searchText;
      this.currentPage = 1;
      this.loadEventLogs();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -- Filters --

  private loadSystems(): void {
    this.cssDashboardService.getAllSystems().subscribe({
      next: (resp) => {
        if (resp.success) {
          this.sapSystems = resp.data || [];
          // Re-check query params after systems loaded
          const qp = this.route.snapshot.queryParams;
          if (qp['systemName']) {
            const found = this.sapSystems.find((s) => s.destinationName === qp['systemName']);
            if (found) {
              this.selectedSystemId = found.id + '';
              this.loadEventLogs();
            }
          }
        }
      },
    });
  }

  setPreset(days: number): void {
    this.activePreset = days;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    this.dateRange = [start, end];
    this.loadEventLogs();
  }

  onDateRangeChange(): void {
    this.activePreset = null;
    this.loadEventLogs();
  }

  onSystemChange(): void {
    this.currentPage = 1;
    this.loadEventLogs();
  }

  onSearchChange(value: string): void {
    this.searchInput$.next(value);
  }

  private getFromDate(): string {
    if (this.dateRange?.length === 2 && this.dateRange[0]) {
      return this.datePipe.transform(this.dateRange[0], 'MM/dd/yyyy') || '';
    }
    return '';
  }

  private getToDate(): string {
    if (this.dateRange?.length === 2 && this.dateRange[1]) {
      return this.datePipe.transform(this.dateRange[1], 'MM/dd/yyyy') || '';
    }
    return '';
  }

  // -- Data --

  loadEventLogs(): void {
    this.loading = true;
    const first = (this.currentPage - 1) * this.pageSize;
    this.cssDashboardService.getSecurityEventLogs(
      this.getFromDate(), this.getToDate(),
      this.selectedSystemId, 'ALL',
      first, this.pageSize, this.searchQuery,
    ).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.eventData = resp.data.rows || resp.data || [];
          this.totalRecords = resp.data.records || this.eventData.length;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadEventLogs();
  }

  // -- Side Panel --

  onRowClick(event: any): void {
    this.selectedEvent = event;
    this.eventDetailPanel?.open();
  }

  onSidePanelClosed(): void {
    this.selectedEvent = null;
  }

  // -- Navigation --

  goBack(): void {
    this.router.navigate(['/css/cyber-security-dashboard']);
  }

  // -- Helpers --

  getSeverityColor(severity: string): string {
    switch ((severity || '').toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'purple';
      case 'LOW': return 'green';
      default: return 'default';
    }
  }

  getStatusColor(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'todo': return 'red';
      case 'inprogress': return 'orange';
      case 'resolved': return 'green';
      case 'falsepositive': return 'default';
      default: return 'default';
    }
  }
}
