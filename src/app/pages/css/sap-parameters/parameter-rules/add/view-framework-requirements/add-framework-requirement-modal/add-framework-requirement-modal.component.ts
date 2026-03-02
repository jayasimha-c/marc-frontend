import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { SapParameterService } from '../../../../sap-parameters.service';
import { TableColumn } from '../../../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-add-framework-requirement-modal',
  templateUrl: './add-framework-requirement-modal.component.html',
})
export class AddFrameworkRequirementModalComponent implements OnInit {
  data: any[] = [];
  totalRecords = 0;
  selection: any[] = [];

  columns: TableColumn[] = [
    { field: 'name', header: 'Name', type: 'text' },
    { field: 'description', header: 'Description', type: 'text' },
    { field: 'framework.name', header: 'Framework', type: 'text' },
    { field: 'refId', header: 'Reference ID', type: 'text' },
  ];

  constructor(
    @Inject(NZ_MODAL_DATA) private dialogData: any,
    public modal: NzModalRef,
    private sapParameterService: SapParameterService
  ) {}

  ngOnInit(): void {
    this.selection = [...(this.dialogData.selectedRequirements || [])];
    this.loadRequirements({ first: 0, rows: 10, page: 0, sortOrder: 0, sortField: '', filters: {} });
  }

  loadRequirements(event: any): void {
    this.sapParameterService.getFrameworksRequirements(event).subscribe((res) => {
      if (res?.data) {
        this.data = res.data.rows || [];
        this.totalRecords = res.data.records || 0;
      }
    });
  }

  onConnect(): void {
    this.modal.close(this.selection);
  }

  onClose(): void {
    this.modal.close(this.dialogData.selectedRequirements);
  }

  onSelectionChanged(event: any[]): void {
    this.selection = event;
  }
}
