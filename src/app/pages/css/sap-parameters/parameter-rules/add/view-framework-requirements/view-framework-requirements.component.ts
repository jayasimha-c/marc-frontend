import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../../../core/services/notification.service';
import { SapParameterService } from '../../../sap-parameters.service';
import { AddFrameworkRequirementModalComponent } from './add-framework-requirement-modal/add-framework-requirement-modal.component';
import { TableColumn, TableAction } from '../../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-view-framework-requirements',
  templateUrl: './view-framework-requirements.component.html',
})
export class ViewFrameworkRequirementsComponent implements OnInit, OnChanges {
  @Input() selectedRequirements: any[] = [];
  @Input() ruleContext: any = null;
  @Output() frameworkRequirementChanged = new EventEmitter<any>();

  data: any[] = [];
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', type: 'text' },
    { field: 'description', header: 'Description', type: 'text' },
    { field: 'framework.name', header: 'Framework', type: 'text' },
    { field: 'refId', header: 'Reference ID', type: 'text' },
  ];

  actions: TableAction[] = [
    { label: 'Add Requirement', icon: 'plus-circle', command: () => this.onAction('add') },
    { label: 'Remove Requirement', icon: 'delete', command: () => this.onAction('remove') },
  ];

  constructor(
    private nzModal: NzModalService,
    private sapParameterService: SapParameterService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.data = this.selectedRequirements || [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedRequirements']?.currentValue) {
      const reqs = changes['selectedRequirements'].currentValue;
      this.data = Array.isArray(reqs[0]) ? reqs[0] : reqs;
    }
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onAction(action: 'add' | 'remove'): void {
    if (action === 'add') {
      this.nzModal.create({
        nzTitle: 'Select Framework Requirements',
        nzContent: AddFrameworkRequirementModalComponent,
        nzWidth: '80vw',
        nzClassName: 'updated-modal',
        nzData: { selectedRequirements: this.selectedRequirements },
        nzFooter: null,
      }).afterClose.subscribe((updated) => {
        if (updated !== undefined) {
          const flattened = (Array.isArray(updated) ? updated : [updated]).flat();
          this.frameworkRequirementChanged.emit(flattened);
        }
      });
      return;
    }

    if (action === 'remove') {
      if (!this.selectedRow) {
        this.notificationService.error('Please select a row first');
        return;
      }
      this.selectedRequirements = this.selectedRequirements.filter((r) => r.id !== this.selectedRow.id);
      this.frameworkRequirementChanged.emit(this.selectedRequirements);
    }
  }
}
