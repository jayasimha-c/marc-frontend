import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CamService } from '../../cam.service';
import { ApiResponse } from '../../../../core/models/api-response';
import { TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';

interface StatusCounts {
  totalUsers: any[];
  hold: any[];
  rejected: any[];
  approved: any[];
  unReviewed: any[];
  expired: any[];
}

@Component({
  standalone: false,
  selector: 'app-review-user-batch',
  templateUrl: './review-user-batch.component.html',
})
export class ReviewUserBatchComponent implements OnInit {
  loading = false;
  batchID: string | null = null;

  dashboard: StatusCounts = {
    totalUsers: [],
    hold: [],
    rejected: [],
    approved: [],
    unReviewed: [],
    expired: [],
  };

  groupData: any[] = [];

  groupColumns: TableColumn[] = [
    { field: 'name', header: 'Group Name', sortable: true, filterable: true },
    { field: 'hold', header: 'Hold', width: '80px', align: 'center' },
    { field: 'rejected', header: 'Rejected', width: '90px', align: 'center' },
    { field: 'approved', header: 'Approved', width: '90px', align: 'center' },
    { field: 'unreviewed', header: 'Unreviewed', width: '100px', align: 'center' },
    { field: 'expired', header: 'Expired', width: '80px', align: 'center' },
  ];

  private readonly statusMap: Record<number, string> = {
    0: 'unreviewed',
    1: 'approved',
    [-1]: 'rejected',
    2: 'hold',
    3: 'expired',
  };

  constructor(
    private camService: CamService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation() || history.state;
    this.batchID = nav?.batchID || history.state?.batchID || null;

    if (!this.batchID) {
      this.back();
      return;
    }
    this.loadData();
  }

  private loadData(): void {
    if (!this.batchID) return;
    this.loading = true;
    this.camService.getUserBatch(this.batchID).subscribe({
      next: (resp: ApiResponse) => {
        const users = resp.data || [];
        this.dashboard.totalUsers = users;
        this.dashboard.unReviewed = users.filter((u: any) => u.status === 0);
        this.dashboard.approved = users.filter((u: any) => u.status === 1);
        this.dashboard.rejected = users.filter((u: any) => u.status === -1);
        this.dashboard.hold = users.filter((u: any) => u.status === 2);
        this.dashboard.expired = users.filter((u: any) => u.status === 3);
        this.buildGroupData(users);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private buildGroupData(users: any[]): void {
    const groups: Record<string, Record<string, number>> = {};

    users.forEach(u => {
      const group = u.group || 'Unknown';
      const status = this.statusMap[u.status] || 'unreviewed';
      if (!groups[group]) {
        groups[group] = { hold: 0, rejected: 0, approved: 0, unreviewed: 0, expired: 0 };
      }
      groups[group][status]++;
    });

    this.groupData = Object.entries(groups).map(([name, counts]) => ({
      name,
      ...counts,
    }));
  }

  pct(type: string): string {
    const total = this.dashboard.totalUsers.length;
    if (total === 0) return '0%';
    const count = (this.dashboard as any)[type]?.length || 0;
    return Math.round((count / total) * 100) + '%';
  }

  count(type: string): number {
    return (this.dashboard as any)[type]?.length || 0;
  }

  back(): void {
    history.back();
  }
}
