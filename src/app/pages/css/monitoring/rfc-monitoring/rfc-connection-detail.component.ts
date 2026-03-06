import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { RfcMonitoringService, RfcConnectionVO } from './rfc-monitoring.service';

@Component({
  standalone: false,
  selector: 'app-rfc-connection-detail',
  templateUrl: './rfc-connection-detail.component.html',
})
export class RfcConnectionDetailComponent implements OnChanges {
  @Input() connection!: RfcConnectionVO;

  revisionHistory: RfcConnectionVO[] = [];
  loadingHistory = false;
  showHistory = false;

  typeLabels: { [key: string]: string } = {
    '3': 'RFC', 'H': 'HTTP', 'G': 'HTTP_EXT', 'T': 'TCP/IP',
    'L': 'Logical', 'I': 'Internal', 'X': 'ABAP/CPI',
  };

  constructor(private rfcMonitoringService: RfcMonitoringService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['connection'] && this.connection) {
      this.revisionHistory = [];
      this.showHistory = false;
    }
  }

  loadHistory(): void {
    if (!this.connection || this.revisionHistory.length > 0) return;
    this.loadingHistory = true;
    this.rfcMonitoringService.getConnectionHistory(
      this.connection.sapSystemId,
      this.connection.connectionName,
    ).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.revisionHistory = resp.data;
        }
        this.loadingHistory = false;
      },
      error: () => { this.loadingHistory = false; },
    });
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
    if (this.showHistory && this.revisionHistory.length === 0) {
      this.loadHistory();
    }
  }

  getRiskColor(riskLevel: string): string {
    switch (riskLevel?.toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'volcano';
      case 'MEDIUM': return 'orange';
      case 'LOW': return 'green';
      default: return 'default';
    }
  }

  getIndicatorColor(indicator: string): string {
    switch (indicator?.toUpperCase()) {
      case 'TRUSTED': return 'orange';
      case 'NO_SNC': return 'red';
      case 'SNC': return 'green';
      case 'EXTERNAL': return 'volcano';
      default: return 'default';
    }
  }

  formatDate(epochMs: number): string {
    if (!epochMs) return '-';
    return new Date(epochMs).toLocaleString();
  }

  getTypeLabel(type: string): string {
    return this.typeLabels[type] || type;
  }
}
