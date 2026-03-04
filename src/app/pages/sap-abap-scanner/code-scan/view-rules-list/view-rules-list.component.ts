import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { AbapService } from '../../abap.service';
import { AddAbapRuleModalComponent } from './add-abap-rule-modal/add-abap-rule-modal.component';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-view-rules-list',
  templateUrl: './view-rules-list.component.html',
  styleUrls: ['./view-rules-list.component.scss'],
})
export class ViewRulesListComponent implements OnInit, OnChanges {
  @Input() selectedRules: any[] = [];
  @Output() abapRuleChanged = new EventEmitter<any[]>();

  data: any[] = [];
  selectedRow: any = null;
  allRules: any[] = [];

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', sortable: false },
    { field: 'category', header: 'Category', width: '140px', sortable: false },
    { field: 'severity', header: 'Severity', width: '100px', sortable: false, type: 'tag',
      tagColors: { HIGH: 'red', MEDIUM: 'orange', LOW: 'blue', CRITICAL: 'magenta' } },
    { field: 'status', header: 'Status', width: '100px', sortable: false, type: 'tag',
      tagColors: { ACTIVE: 'green', INACTIVE: 'default' } },
  ];

  actions: TableAction[] = [
    { label: 'Add Rule', icon: 'plus', type: 'primary', command: () => this.onAction('add') },
    { label: 'Remove Rule', icon: 'delete', danger: true, command: () => this.onAction('remove') },
  ];

  constructor(
    private modal: NzModalService,
    private abapService: AbapService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAllRules();
    this.data = this.selectedRules || [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedRules'] && changes['selectedRules'].currentValue) {
      const rules = changes['selectedRules'].currentValue;
      this.data = Array.isArray(rules) ? rules : [];
    }
  }

  private loadAllRules(): void {
    this.abapService.getAllRulesNoPagination().subscribe({
      next: (res) => {
        if (res.success) {
          const d = res.data;
          this.allRules = Array.isArray(d) ? d : (d?.rows || []);
        }
      },
    });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onAction(action: string): void {
    switch (action) {
      case 'add':
        const selectedIds = this.selectedRules.map((r) => r.id);
        const filteredRules = this.allRules.filter((r) => !selectedIds.includes(r.id));

        this.modal.create({
          nzTitle: 'Add Rules',
          nzContent: AddAbapRuleModalComponent,
          nzWidth: '60vw',
          nzData: { rules: filteredRules },
          nzFooter: null,
        }).afterClose.subscribe((result) => {
          if (result) {
            const flattened = (Array.isArray(result) ? result : [result]).flat();
            const copy = [...this.selectedRules, ...flattened];
            this.selectedRules = copy;
            this.data = copy;
            this.abapRuleChanged.emit(copy);
          }
        });
        break;

      case 'remove':
        if (!this.selectedRow) {
          this.notification.warn('Please select a rule to remove');
          return;
        }
        this.selectedRules = this.selectedRules.filter((r) => r.id !== this.selectedRow.id);
        this.data = this.selectedRules;
        this.selectedRow = null;
        this.abapRuleChanged.emit(this.selectedRules);
        break;
    }
  }
}
