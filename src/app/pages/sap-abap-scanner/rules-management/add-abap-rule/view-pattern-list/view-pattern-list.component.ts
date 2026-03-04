import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../../core/services/notification.service';
import { AbapService } from '../../../abap.service';
import { AddAbapPatternModalComponent } from './add-abap-pattern-modal/add-abap-pattern-modal.component';
import { TableColumn, TableAction } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-view-pattern-list',
  templateUrl: './view-pattern-list.component.html',
  styleUrls: ['./view-pattern-list.component.scss'],
})
export class ViewPatternListComponent implements OnInit, OnChanges {
  @Input() selectedPatterns: any[] = [];
  @Output() abapPatternChanged = new EventEmitter<any[]>();

  data: any[] = [];
  selectedRow: any = null;
  allPatterns: any[] = [];

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', sortable: false },
    { field: 'regexPatterns', header: 'Patterns', width: '120px', sortable: false },
    { field: 'createdDate', header: 'Created Date', type: 'date', width: '160px', sortable: false },
    { field: 'modifiedDate', header: 'Modified Date', type: 'date', width: '160px', sortable: false },
  ];

  actions: TableAction[] = [
    { label: 'Add Pattern', icon: 'plus', type: 'primary', command: () => this.onAction('add') },
    { label: 'Remove Pattern', icon: 'delete', danger: true, command: () => this.onAction('remove') },
  ];

  constructor(
    private modal: NzModalService,
    private abapService: AbapService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAllPatterns();
    this.data = this.selectedPatterns || [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPatterns'] && changes['selectedPatterns'].currentValue) {
      const patterns = changes['selectedPatterns'].currentValue;
      this.data = Array.isArray(patterns) ? patterns : [];
    }
  }

  private loadAllPatterns(): void {
    this.abapService.getDetectionPatternListAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.allPatterns = res.data?.rows || res.data || [];
        }
      },
    });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  formatPatternCount(patterns: any[]): string {
    if (!patterns || !Array.isArray(patterns)) return '0 patterns';
    return patterns.length === 1 ? '1 pattern' : `${patterns.length} patterns`;
  }

  onAction(action: string): void {
    switch (action) {
      case 'add':
        const selectedIds = this.selectedPatterns.map((p) => p.id);
        const filteredPatterns = this.allPatterns.filter((p) => !selectedIds.includes(p.id));

        this.modal.create({
          nzTitle: 'Add Detection Patterns',
          nzContent: AddAbapPatternModalComponent,
          nzWidth: '60vw',
          nzData: { patterns: filteredPatterns },
          nzFooter: null,
        }).afterClose.subscribe((result) => {
          if (result) {
            const flattened = (Array.isArray(result) ? result : [result]).flat();
            const copy = [...this.selectedPatterns, ...flattened];
            this.selectedPatterns = copy;
            this.data = copy;
            this.abapPatternChanged.emit(copy);
          }
        });
        break;

      case 'remove':
        if (!this.selectedRow) {
          this.notification.warn('Please select a pattern to remove');
          return;
        }
        this.selectedPatterns = this.selectedPatterns.filter((r) => r.id !== this.selectedRow.id);
        this.data = this.selectedPatterns;
        this.selectedRow = null;
        this.abapPatternChanged.emit(this.selectedPatterns);
        break;
    }
  }
}
