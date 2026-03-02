import { Component, Inject, OnInit, Optional } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RiskAnalysisOnlineService } from '../../risk-analysis-online.service';

@Component({
  standalone: false,
  selector: 'app-role-detail-modal',
  templateUrl: './role-detail-modal.component.html',
})
export class RoleDetailModalComponent implements OnInit {
  loading = false;
  roleName = '';
  roleDescription = '';
  users: any[] = [];
  authorizations: any[] = [];

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public dialogData: any,
    @Optional() public modal: NzModalRef,
    private apiService: RiskAnalysisOnlineService,
  ) {}

  ngOnInit(): void {
    this.loadDetail();
  }

  loadDetail(): void {
    this.loading = true;
    this.apiService.roleDetail({ roleId: this.dialogData.roleId, sapId: this.dialogData.sapId }).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success && resp.data) {
          this.roleName = resp.data.role?.name || '';
          this.roleDescription = resp.data.role?.description || '';
          this.users = resp.data.users || [];
          this.authorizations = resp.data.authorizations || [];
        }
      },
      error: () => { this.loading = false; },
    });
  }
}
