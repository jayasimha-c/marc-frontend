import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CssMonitoringService } from '../css-monitoring.service';
import { RfcMonitoringService, RfcStatisticsVO } from './rfc-monitoring.service';

@Component({
  standalone: false,
  selector: 'app-rfc-monitoring-dashboard',
  templateUrl: './rfc-monitoring-dashboard.component.html',
  styleUrls: ['./rfc-monitoring-dashboard.component.scss'],
})
export class RfcMonitoringDashboardComponent implements OnInit {
  systems: any[] = [];
  selectedSystem = new FormControl(null);

  stats: RfcStatisticsVO = {
    totalConnections: 0,
    activeConnections: 0,
    systemsWithConnections: 0,
    connectionsWithPassword: 0,
    trustedRfcCount: 0,
    noSncCount: 0,
    connectionsByType: {},
    connectionsBySystem: {},
  };

  recentChanges: any[] = [];
  scanStatus: any[] = [];
  loading = false;
  initialLoadComplete = false;

  typeLabels: { [key: string]: string } = {
    '3': 'RFC', 'H': 'HTTP', 'G': 'HTTP_EXT', 'T': 'TCP/IP',
    'L': 'Logical', 'I': 'Internal', 'X': 'ABAP/CPI',
  };

  typeColors: { [key: string]: string } = {
    '3': 'red', 'H': 'blue', 'G': 'green', 'T': 'orange',
    'L': 'purple', 'I': 'cyan', 'X': 'magenta',
  };

  connectionsByTypeList: { type: string; label: string; count: number; color: string }[] = [];
  connectionsBySystemList: { system: string; count: number }[] = [];

  constructor(
    private rfcMonitoringService: RfcMonitoringService,
    private cssMonitoringService: CssMonitoringService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSystems();
    this.loadDashboardData();
  }

  loadSystems(): void {
    this.cssMonitoringService.getSystemList(null).subscribe({
      next: (response) => {
        if (response.success) {
          this.systems = response.data;
        }
      },
      error: () => { this.systems = []; },
    });
  }

  loadDashboardData(): void {
    this.loading = true;
    const filter = this.selectedSystem.value ? { sapSystemId: this.selectedSystem.value } : {};

    forkJoin({
      stats: this.rfcMonitoringService.getStatistics(filter).pipe(
        catchError(() => of({ success: false, data: null }))
      ),
      recentChanges: this.rfcMonitoringService.getRecentChanges(7, 10).pipe(
        catchError(() => of({ success: false, data: [] }))
      ),
      scanStatus: this.rfcMonitoringService.getScanStatus().pipe(
        catchError(() => of({ success: false, data: [] }))
      ),
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.initialLoadComplete = true;
      })
    ).subscribe({
      next: (results: any) => {
        if (results.stats?.success && results.stats?.data) {
          this.stats = results.stats.data;
          this.updateChartData();
        }
        if (results.recentChanges?.success) {
          this.recentChanges = results.recentChanges.data || [];
        }
        if (results.scanStatus?.success) {
          this.scanStatus = results.scanStatus.data || [];
        }
      },
    });
  }

  updateChartData(): void {
    if (this.stats.connectionsByType) {
      this.connectionsByTypeList = Object.entries(this.stats.connectionsByType).map(([type, count]) => ({
        type,
        label: this.typeLabels[type] || type,
        count: count as number,
        color: this.typeColors[type] || 'default',
      }));
    }
    if (this.stats.connectionsBySystem) {
      this.connectionsBySystemList = Object.entries(this.stats.connectionsBySystem)
        .map(([system, count]) => ({ system, count: count as number }))
        .sort((a, b) => b.count - a.count);
    }
  }

  onSystemFilterChange(): void {
    this.loadDashboardData();
  }

  navigateToNetworkGraph(): void {
    this.router.navigate(['/css/monitoring/rfc-monitoring/network-graph']);
  }

  navigateToConnections(params?: any): void {
    this.router.navigate(['/css/monitoring/rfc-monitoring/connections'], {
      queryParams: params || {},
    });
  }

  navigateToRules(): void {
    this.router.navigate(['/css/monitoring/rfc-monitoring/rules']);
  }

  getTypeLabel(type: string): string {
    return this.typeLabels[type] || type;
  }

  getChangeTagColor(changeType: any): string {
    const type = String(changeType || '').toUpperCase();
    switch (type) {
      case 'NEW': return 'green';
      case 'UPDATED': case 'MODIFIED': return 'blue';
      case 'REMOVED': case 'DELETED': return 'red';
      default: return 'default';
    }
  }

  getChangeTypeLabel(changeType: any): string {
    return changeType ? String(changeType).toUpperCase() : 'UNKNOWN';
  }

  formatDate(epochMs: number): string {
    if (!epochMs) return '-';
    return new Date(epochMs).toLocaleString();
  }

  formatRelativeTime(epochMs: number): string {
    if (!epochMs) return '';
    const diff = Date.now() - epochMs;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  getScanStatusColor(status: any): string {
    if (status.isRunning) return 'processing';
    if (status.failedScans > 0) return 'warning';
    return 'success';
  }

  getScanStatusIcon(status: any): string {
    if (status.isRunning) return 'sync';
    if (status.failedScans > 0) return 'warning';
    return 'check-circle';
  }
}
