import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { RisksService } from '../risks.service';

@Component({
  standalone: false,
  selector: 'app-consistency-check',
  templateUrl: './consistency-check.component.html',
})
export class ConsistencyCheckComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = true;
  data: any[] = [];

  columns = [
    { field: 'riskName', header: 'Risk Name', width: '140px' },
    { field: 'riskType', header: 'Risk Type', width: '100px' },
    { field: 'crossSystemDisplay', header: 'Cross System', width: '100px' },
    { field: 'enabledDisplay', header: 'Enabled', width: '80px' },
    { field: 'inconsistencies', header: 'Inconsistencies' },
  ];

  constructor(private risksService: RisksService) {}

  ngOnInit(): void {
    this.risksService.riskConsistency().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data = (res.data || []).map((item: any) => ({
          riskName: item.riskName,
          riskType: item.riskType,
          crossSystemDisplay: item.crossSystem ? 'Yes' : 'No',
          enabledDisplay: item.enabled ? 'Active' : 'Inactive',
          inconsistencies: item.inconsistencies?.join(', ') || '',
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
