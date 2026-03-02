import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ControlFrameworkService } from './control-framework.service';
import { TableColumn, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-controls-details',
  templateUrl: './controls-details.component.html',
})
export class ControlsDetailsComponent implements OnInit {
  loading = false;
  statsLoading = true;

  totalControls = 0;
  uniqueFrameworks = 0;
  depthLevels = 0;
  avgControlsPerFramework = 0;

  @ViewChild('descriptionTpl', { static: true }) descriptionTpl!: TemplateRef<any>;

  columns: TableColumn[] = [];

  data: any[] = [];
  totalRecords = 0;

  constructor(private cfService: ControlFrameworkService) {}

  ngOnInit(): void {
    this.columns = [
      { field: 'name', header: 'Control Name', sortable: true, width: '180px' },
      { field: 'framework.name', header: 'Framework', sortable: true, width: '160px' },
      { field: 'depth', header: 'Level', sortable: true, type: 'number', width: '70px', align: 'center' },
      { field: 'refId', header: 'Reference ID', sortable: true, width: '160px' },
      { field: 'description', header: 'Description', type: 'template', templateRef: this.descriptionTpl },
      { field: 'updatedAt', header: 'Last Updated', sortable: true, type: 'date', width: '120px' },
    ];
    this.loadStats();
  }

  onQueryParamsChange(params: TableQueryParams): void {
    this.loading = true;
    this.cfService.getFrameworksRequirements(params).subscribe({
      next: (res) => {
        if (res?.data) {
          this.data = res.data.rows || [];
          this.totalRecords = res.data.records || 0;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadStats(): void {
    this.statsLoading = true;
    this.cfService.getControlStat().subscribe({
      next: (res) => {
        const stat = res?.data;
        if (stat) {
          this.totalControls = stat.totalControls || 0;
          this.uniqueFrameworks = stat.uniqueFramework || 0;
          this.depthLevels = stat.depthLevels || 0;
          this.avgControlsPerFramework = stat.avgControlsPerFramework || 0;
        }
        this.statsLoading = false;
      },
      error: () => { this.statsLoading = false; },
    });
  }
}
