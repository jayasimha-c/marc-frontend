import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CssMonitoringService } from '../css-monitoring.service';
import { RfcMonitoringService, RfcNetworkGraphVO, RfcConnectionVO } from './rfc-monitoring.service';

@Component({
  standalone: false,
  selector: 'app-rfc-network-graph-page',
  templateUrl: './rfc-network-graph-page.component.html',
})
export class RfcNetworkGraphPageComponent implements OnInit {
  systems: any[] = [];
  selectedSystem = new FormControl(null);
  loading = false;

  graphData: RfcNetworkGraphVO | null = null;
  graphConnections: RfcConnectionVO[] = [];

  constructor(
    private rfcMonitoringService: RfcMonitoringService,
    private cssMonitoringService: CssMonitoringService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSystems();
    this.loadGraphData();
  }

  loadSystems(): void {
    this.cssMonitoringService.getSystemList(null).subscribe({
      next: (resp) => {
        if (resp.success) this.systems = resp.data;
      },
      error: () => { this.systems = []; },
    });
  }

  loadGraphData(): void {
    this.loading = true;
    const filter = this.selectedSystem.value ? { sapSystemId: this.selectedSystem.value } : {};

    forkJoin({
      graphData: this.rfcMonitoringService.getNetworkGraphData(filter).pipe(
        catchError(() => of({ success: false, data: null }))
      ),
      connections: this.rfcMonitoringService.getConnections(filter as any).pipe(
        catchError(() => of({ success: false, data: [] }))
      ),
    }).pipe(
      finalize(() => this.loading = false),
    ).subscribe({
      next: (results: any) => {
        if (results.graphData?.success) {
          this.graphData = results.graphData.data;
        }
        if (results.connections?.success) {
          const connData = results.connections.data;
          this.graphConnections = Array.isArray(connData) ? connData : (connData?.content || []);
        }
      },
    });
  }

  onSystemFilterChange(): void {
    this.loadGraphData();
  }

  onNodeClick(event: any): void {
    this.router.navigate(['/css/monitoring/rfc-monitoring/connections'], {
      queryParams: event || {},
    });
  }

  goBack(): void {
    this.router.navigate(['/css/monitoring/rfc-monitoring']);
  }
}
