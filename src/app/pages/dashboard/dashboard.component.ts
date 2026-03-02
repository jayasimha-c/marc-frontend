import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  stats = [
    { title: 'Total Risks', value: 0, icon: 'warning', color: '#f5222d', bg: '#fff1f0' },
    { title: 'Active Rules', value: 0, icon: 'file-text', color: '#1890ff', bg: '#e6f7ff' },
    { title: 'Mitigations', value: 0, icon: 'safety-certificate', color: '#52c41a', bg: '#f6ffed' },
    { title: 'Open Violations', value: 0, icon: 'exception', color: '#faad14', bg: '#fffbe6' },
  ];

  recentAnalyses: any[] = [];
  loading = true;

  ngOnInit(): void {
    // Simulate loading dashboard data
    setTimeout(() => {
      this.stats = [
        { title: 'Total Risks', value: 247, icon: 'warning', color: '#f5222d', bg: '#fff1f0' },
        { title: 'Active Rules', value: 1_832, icon: 'file-text', color: '#1890ff', bg: '#e6f7ff' },
        { title: 'Mitigations', value: 156, icon: 'safety-certificate', color: '#52c41a', bg: '#f6ffed' },
        { title: 'Open Violations', value: 89, icon: 'exception', color: '#faad14', bg: '#fffbe6' },
      ];
      this.recentAnalyses = [
        { id: 1, system: 'SAP ERP PRD', type: 'SoD Analysis', status: 'Completed', date: '2026-02-27', violations: 45 },
        { id: 2, system: 'SAP S/4 HANA', type: 'Cross System', status: 'Running', date: '2026-02-26', violations: 0 },
        { id: 3, system: 'SAP BW', type: 'Simulation', status: 'Completed', date: '2026-02-25', violations: 12 },
        { id: 4, system: 'SAP GRC PRD', type: 'SoD Analysis', status: 'Completed', date: '2026-02-24', violations: 78 },
        { id: 5, system: 'SAP CRM', type: 'Impact Analysis', status: 'Completed', date: '2026-02-23', violations: 23 },
      ];
      this.loading = false;
    }, 500);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Completed': return 'green';
      case 'Running': return 'blue';
      case 'Failed': return 'red';
      default: return 'default';
    }
  }
}
