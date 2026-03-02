import { Component, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { TableColumn } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-select-parameter-dialog',
  templateUrl: './select-parameter-dialog.component.html',
})
export class SelectParameterDialog {
  data: any[] = [];
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'parameterName', header: 'Parameter Name', type: 'text' },
    { field: 'description', header: 'Description', type: 'text' },
    { field: 'minSapVersion', header: 'Min Sap Version', type: 'text' },
  ];

  constructor(
    @Inject(NZ_MODAL_DATA) private dialogData: any,
    public modal: NzModalRef
  ) {
    this.data = this.dialogData.parameters || [];
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onConnect(): void {
    this.modal.close(this.selectedRow);
  }
}
