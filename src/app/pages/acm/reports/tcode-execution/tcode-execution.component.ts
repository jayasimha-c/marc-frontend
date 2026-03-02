import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { Observable, of, startWith, debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TableColumn, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { ReportService } from '../report.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';

@Component({
  standalone: false,
  selector: 'app-tcode-execution',
  templateUrl: './tcode-execution.component.html',
  styleUrls: ['./tcode-execution.component.scss'],
})
export class TcodeExecutionComponent implements OnInit {
  @ViewChild('detailModalTpl', { static: true }) detailModalTpl: TemplateRef<any>;

  form: FormGroup;
  filteredSystems: Observable<string[]>;
  loading = false;

  gridColumns: TableColumn[] = [
    { field: 'sapDestinationName', header: 'SAP System', type: 'link', sortable: true, onClick: (row) => this.openDetail(row, 'system') },
    { field: 'userId', header: 'User Id', type: 'link', sortable: true, onClick: (row) => this.openDetail(row, 'userId') },
    { field: 'userName', header: 'User Name', type: 'text', sortable: true },
    { field: 'txnId', header: 'Transaction Code', type: 'text', sortable: true },
    { field: 'txnDesc', header: 'Transaction Description', type: 'text', sortable: true },
    { field: 'txnDate', header: 'Transaction Date', type: 'date', sortable: true },
  ];
  gridData: any[] = [];
  gridTotal = 0;

  detailTitle = '';
  detailLoading = false;
  detailData: any[] = [];
  detailColumns: TableColumn[] = [
    { field: 'sapDestinationName', header: 'SAP System', type: 'text' },
    { field: 'userId', header: 'User Id', type: 'text' },
    { field: 'userName', header: 'User Name', type: 'text' },
    { field: 'txnId', header: 'Transaction Code', type: 'text' },
    { field: 'txnDesc', header: 'Transaction Description', type: 'text' },
    { field: 'txnDate', header: 'Transaction Date', type: 'date' },
  ];

  private lastGridParams: TableQueryParams | null = null;
  private formFilters: any[] = [];

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private notify: NotificationService,
    private fileSaver: FileSaverService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      system: [''],
      tcode: [''],
      userId: [''],
      userName: [''],
      startDate: [null],
      endDate: [null],
    });

    this.filteredSystems = this.form.get('system').valueChanges.pipe(
      startWith(''),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(val => val ? this.reportService.autoCompleteSapSystem(val).pipe(map(r => r.data || [])) : of([]))
    );
  }

  onGridQueryChange(params: TableQueryParams): void {
    this.lastGridParams = params;
    this.loadData();
  }

  search(): void {
    this.buildFormFilters();
    this.loadData();
  }

  private buildFormFilters(): void {
    this.formFilters = [];
    const v = this.form.value;
    if (v.system) this.formFilters.push({ field: 'sapDestinationName', filterType: 'text', type: 'contains', value: v.system });
    if (v.tcode) this.formFilters.push({ field: 'txnId', filterType: 'text', type: 'contains', value: v.tcode });
    if (v.userId) this.formFilters.push({ field: 'userId', filterType: 'text', type: 'contains', value: v.userId });
    if (v.userName) this.formFilters.push({ field: 'userName', filterType: 'text', type: 'contains', value: v.userName });
    if (v.startDate) this.formFilters.push({ field: 'startTransactionDate', filterType: 'text', type: 'equals', value: formatDate(v.startDate, 'MM/dd/yyyy', 'en-US') });
    if (v.endDate) this.formFilters.push({ field: 'stopTransactionDate', filterType: 'text', type: 'equals', value: formatDate(v.endDate, 'MM/dd/yyyy', 'en-US') });
  }

  private loadData(): void {
    this.loading = true;
    const p = this.lastGridParams;
    const sortOrder = p?.sort?.direction === 'ascend' ? 1 : p?.sort?.direction === 'descend' ? -1 : 0;

    const event = {
      first: p ? (p.pageIndex - 1) * p.pageSize : 0,
      rows: p?.pageSize || 20,
      sortOrder,
      sortField: p?.sort?.field || '',
      filters: this.formFilters,
    };

    this.reportService.getTransactionExecution(event).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.gridData = resp.data.rows || [];
          this.gridTotal = resp.data.records || 0;
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.handleHttpError(err);
      },
    });
  }

  exportData(): void {
    this.buildFormFilters();
    const p = this.lastGridParams;
    const sortOrder = p?.sort?.direction === 'ascend' ? 1 : p?.sort?.direction === 'descend' ? -1 : 0;

    const event = {
      first: p ? (p.pageIndex - 1) * p.pageSize : 0,
      rows: p?.pageSize || 20,
      sortOrder,
      sortField: p?.sort?.field || '',
      filters: this.formFilters,
    };

    this.reportService.getTCodeExeToExport(event).subscribe({
      next: (resp) => {
        if (this.fileSaver.saveExcel('User_Transaction_Analysis_Report', resp)) {
          this.notify.success('Report exported successfully');
        }
      },
      error: (err) => this.notify.handleHttpError(err),
    });
  }

  openDetail(row: any, action: string): void {
    this.detailData = [];
    this.detailLoading = true;
    this.detailTitle = action === 'userId'
      ? `Transactions for User: ${row.userId}`
      : `Transactions for System: ${row.sapDestinationName}`;

    this.modal.create({
      nzTitle: this.detailTitle,
      nzContent: this.detailModalTpl,
      nzWidth: '80%',
      nzFooter: null,
    });

    const obs = action === 'userId'
      ? this.reportService.transactionExecutionFindByUser(row.userId)
      : this.reportService.transactionExecutionFindBySystemName(row.sapDestinationName);

    obs.subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.detailData = resp.data;
        }
        this.detailLoading = false;
      },
      error: (err) => {
        this.detailLoading = false;
        this.notify.handleHttpError(err);
      },
    });
  }
}
