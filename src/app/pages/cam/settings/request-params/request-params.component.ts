import { Component, OnInit, ViewChild, AfterViewInit, TemplateRef } from '@angular/core';
import { CamService } from '../../cam.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiResponse } from '../../../../core/models/api-response';
import { InlineColumn, TableAction } from '../../../../shared/components/inline-table/inline-table.models';
import { InlineTableComponent } from '../../../../shared/components/inline-table/inline-table.component';

const BOOLEAN_PARAMS = new Set([
  'Can not Approve If Risks Present',
  'Comments Mandatory',
  'Include comments in mail notification',
  'Fetch User Details From Active Directory',
  'Show Roles From System',
]);

@Component({
  standalone: false,
  selector: 'app-request-params',
  templateUrl: './request-params.component.html',
})
export class RequestParamsComponent implements OnInit, AfterViewInit {
  @ViewChild('paramsTable') paramsTable!: InlineTableComponent;
  @ViewChild('valueTpl', { static: true }) valueTpl!: TemplateRef<any>;

  data: any[] = [];
  loading = false;
  nodeNames: string[] = [];
  paramDescriptions: string[] = [];

  columns: InlineColumn[] = [
    {
      field: 'description',
      header: 'Select Param',
      type: 'select',
      width: '300px',
      options: [],
      showSearch: true,
    },
    {
      field: 'value',
      header: 'Value',
      type: 'template',
    },
    {
      field: 'helpText',
      header: 'Help Text',
      type: 'text',
    },
  ];

  actions: TableAction[] = [
    { label: 'Save', icon: 'save', type: 'primary', pinned: true, command: () => this.onSave() },
    { label: 'Add Row', icon: 'plus-circle', command: () => this.paramsTable.addRow() },
    { label: 'Set Default', icon: 'reload', command: () => this.onSetDefault() },
    { label: 'Discard Changes', icon: 'undo', danger: true, command: () => this.loadData() },
  ];

  constructor(
    private camService: CamService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadInfo();
  }

  ngAfterViewInit(): void {
    // Assign the value template ref to the column
    const valueCol = this.columns.find(c => c.field === 'value');
    if (valueCol && this.valueTpl) {
      valueCol.templateRef = this.valueTpl;
    }
  }

  isBooleanParam(description: string): boolean {
    return BOOLEAN_PARAMS.has(description);
  }

  isNodeParam(description: string): boolean {
    return description === 'Default Support Node';
  }

  onValueChange(row: any): void {
    this.paramsTable.onCellChange(row, 'value');
  }

  onSave(): void {
    const payload = this.data.map(row => ({
      description: row.description,
      value: row.value,
      helpText: row.helpText,
    }));

    this.camService.saveCamParams(payload).subscribe({
      next: () => {
        this.notificationService.success('Saved successfully');
        this.paramsTable?.markClean();
        this.loadData();
      },
      error: ({ error }) => {
        this.notificationService.error(error?.message || 'Save failed');
      },
    });
  }

  onSetDefault(): void {
    this.camService.getCamParamsDefault().subscribe({
      next: (resp: ApiResponse) => {
        this.data = resp.data || [];
        this.data.forEach(r => (r._modified = true));
        this.notificationService.success('Default settings loaded. Click Save to apply changes.');
      },
      error: ({ error }) => {
        this.notificationService.error(error?.message || 'Failed to load defaults');
      },
    });
  }

  onDirtyChange(dirty: boolean): void {
    this.actions[3].disabled = !dirty;
  }

  private loadData(): void {
    this.loading = true;
    this.camService.getCamParams().subscribe({
      next: (resp: ApiResponse) => {
        this.data = resp.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private loadInfo(): void {
    this.camService.getCamParamsInfo().subscribe((resp: ApiResponse) => {
      this.nodeNames = resp.data?.nodeNames || [];
      this.paramDescriptions = resp.data?.paramDescriptions || [];

      const descCol = this.columns.find(c => c.field === 'description');
      if (descCol) {
        descCol.options = this.paramDescriptions;
      }
    });
  }
}
