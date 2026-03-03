import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { IcmControlService } from '../icm-control.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-control-deficiency',
  templateUrl: './control-deficiency.component.html',
})
export class ControlDeficiencyComponent implements OnInit {
  searchExpanded = false;
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  pageIndex = 1;
  pageSize = 20;

  form: FormGroup;

  columns: TableColumn[] = [
    { field: 'controlName', header: 'Control Name', sortable: true, ellipsis: true },
    { field: 'ruleName', header: 'Rule Name', sortable: true, ellipsis: true },
    { field: 'scriptName', header: 'Script Name', sortable: true, ellipsis: true },
    { field: 'sapDestinationName', header: 'SAP System', sortable: true, width: '140px' },
    { field: 'bpName', header: 'Business Process', sortable: true, ellipsis: true },
    { field: 'sbpName', header: 'Sub-Process', sortable: true, ellipsis: true },
    { field: 'created', header: 'Created', type: 'date', sortable: true, width: '140px' },
    { field: 'lastExecutedDate', header: 'Last Executed', type: 'date', sortable: true, width: '140px' },
    {
      field: 'statusLabel', header: 'Status', type: 'tag', width: '130px', sortable: true,
      tagColors: { 'Open': 'orange', 'In progress': 'blue', 'Not applicable': 'default', 'Closed': 'green' },
    },
  ];

  tableActions: TableAction[] = [];

  dropdownData: { [key: string]: any[] } = {
    sapSystemList: [],
    bpList: [],
    sbpList: [],
  };

  deficiencyStatusOptions = [
    { value: '1', label: 'Open' },
    { value: '2', label: 'In progress' },
    { value: '3', label: 'Not applicable' },
    { value: '4', label: 'Closed' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private icmService: IcmControlService,
    private notificationService: NotificationService,
  ) {
    this.form = this.fb.group({
      controlName: [''],
      ruleName: [''],
      scriptName: [''],
      sapSystem: [null],
      businessProcess: [null],
      businessSubProcess: [null],
      createdFrom: [null],
      createdTo: [null],
      executedFrom: [null],
      executedTo: [null],
      status: [null],
    });
  }

  ngOnInit(): void {
    this.loadDropdownData();
    this.loadData();

    this.form.get('businessProcess')?.valueChanges.subscribe(bpId => {
      this.form.get('businessSubProcess')?.setValue(null);
      if (bpId) {
        this.loadSubProcesses(bpId);
      } else {
        this.dropdownData['sbpList'] = [];
      }
    });
  }

  loadDropdownData(): void {
    this.icmService.getSAPSystemList().subscribe({
      next: res => this.dropdownData['sapSystemList'] = res.data || [],
      error: () => this.dropdownData['sapSystemList'] = [],
    });
    this.icmService.getBPList().subscribe({
      next: res => this.dropdownData['bpList'] = res.data?.rows || [],
      error: () => this.dropdownData['bpList'] = [],
    });
  }

  loadSubProcesses(bpId: number): void {
    this.icmService.getBusinessSubProcesses(bpId).subscribe({
      next: res => this.dropdownData['sbpList'] = res.data?.rows || [],
      error: () => this.dropdownData['sbpList'] = [],
    });
  }

  search(): void {
    this.pageIndex = 1;
    this.loadData();
  }

  resetFilters(): void {
    this.form.reset();
    this.pageIndex = 1;
    this.loadData();
  }

  onQueryParamsChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.loadData();
  }

  onRowClick(row: any): void {
    if (row?.dfcId) {
      this.router.navigate([`/icm/control-deficiency/${row.dfcId}`]);
    }
  }

  loadData(): void {
    this.loading = true;
    const f = this.form.value;
    const first = (this.pageIndex - 1) * this.pageSize;

    this.icmService.getDeficiencyData({
      first,
      rows: this.pageSize,
      sapSystem: f.sapSystem || '',
      controlName: f.controlName || '',
      scriptName: f.scriptName || '',
      status: f.status || '',
      businessProcess: f.businessProcess || '',
      businessSubProcess: f.businessSubProcess || '',
      lastExecutedDate: this.formatDateRange(f.executedFrom, f.executedTo),
      ruleName: f.ruleName || '',
      created: this.formatDateRange(f.createdFrom, f.createdTo),
    }).subscribe({
      next: res => {
        this.data = (res.data?.rows || []).map((row: any) => ({
          ...row,
          statusLabel: this.getStatusLabel(row.status),
        }));
        this.totalRecords = res.data?.totalRecords || 0;
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.totalRecords = 0;
        this.loading = false;
      },
    });
  }

  private formatDateRange(from: Date | null, to: Date | null): string {
    const fmt = (d: Date | null): string => {
      if (!d) return '';
      const dt = new Date(d);
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${m}/${day}/${dt.getFullYear()}`;
    };
    return `${fmt(from)}~${fmt(to)}`;
  }

  private getStatusLabel(status: number): string {
    switch (status) {
      case 1: return 'Open';
      case 2: return 'In progress';
      case 3: return 'Not applicable';
      case 4: return 'Closed';
      default: return 'Unknown';
    }
  }
}
