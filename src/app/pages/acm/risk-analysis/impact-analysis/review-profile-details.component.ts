import { Component, OnInit, Inject } from '@angular/core';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { RiskAnalysisOnlineService } from '../risk-analysis-online.service';
import { TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-review-profile-details',
  template: `
    <!-- Profile Summary -->
    <nz-descriptions nzBordered nzSize="small" [nzColumn]="4" style="margin-bottom: 16px">
      <nz-descriptions-item nzTitle="Name">{{ profile?.name || '-' }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="Description">{{ profile?.description || '-' }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="Analysis Type">{{ profile?.analysisType || '-' }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="Role ID">{{ roleName || '-' }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="Include Mitigations">
        <nz-tag [nzColor]="profile?.mitigationIncluded ? 'green' : 'default'">
          {{ profile?.mitigationIncluded ? 'Yes' : 'No' }}
        </nz-tag>
      </nz-descriptions-item>
    </nz-descriptions>

    <!-- Selected Risks -->
    <h4 nz-typography style="margin: 0 0 8px">Selected Risks</h4>
    <nz-spin [nzSpinning]="loadingRisks">
      <app-advanced-table
        [data]="risksData"
        [columns]="risksColumns"
        [showPagination]="true"
        [defaultPageSize]="10"
        emptyText="No risks selected"
        size="small">
      </app-advanced-table>
    </nz-spin>

    <!-- Selected Roles -->
    <h4 nz-typography style="margin: 16px 0 8px">Selected Role Authorizations</h4>
    <app-advanced-table
      [data]="roleAuthData"
      [columns]="roleAuthColumns"
      [showPagination]="true"
      [defaultPageSize]="10"
      emptyText="No role authorizations"
      size="small">
    </app-advanced-table>

    <div style="text-align: right; margin-top: 16px; border-top: 1px solid #f0f0f0; padding-top: 12px">
      <button nz-button nzType="default" (click)="modalRef.close()">Close</button>
    </div>
  `,
})
export class ReviewProfileDetailsComponent implements OnInit {
  profile: any = null;
  roleName = '';
  profileId: number;

  risksData: any[] = [];
  loadingRisks = false;
  risksColumns: TableColumn[] = [
    { field: 'name', header: 'Risk ID' },
    { field: 'riskDescription', header: 'Risk Description' },
    { field: 'businessProcessName', header: 'Business Process' },
    { field: 'subProcessName', header: 'Sub Process' },
    { field: 'riskTypeName', header: 'Risk Type' },
  ];

  roleAuthData: any[] = [];
  roleAuthColumns: TableColumn[] = [
    { field: 'profile', header: 'Profile' },
    { field: 'auth', header: 'Auth' },
    { field: 'object', header: 'Object' },
    { field: 'field', header: 'Field' },
    { field: 'von', header: 'Von' },
    { field: 'bis', header: 'Bis' },
  ];

  constructor(
    public modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) private modalData: any,
    private riskAnalysisService: RiskAnalysisOnlineService,
  ) {
    this.profile = modalData.profile;
    this.roleName = modalData.roleName || '';
    this.roleAuthData = modalData.roleAuthData || [];
    this.profileId = modalData.profileId;
  }

  ngOnInit(): void {
    this.loadRisks();
  }

  private loadRisks(): void {
    this.loadingRisks = true;
    this.riskAnalysisService.getImpactAnalysisSelectedRisks(this.profileId).subscribe({
      next: (resp) => {
        const rows = resp.data?.risks?.rows || [];
        this.risksData = rows.map((r: any) => ({
          ...r,
          businessProcessName: r.businessProcess?.name || '',
          subProcessName: r.businessProcess?.subProc?.name || '',
          riskTypeName: r.riskType?.name || '',
        }));
        this.loadingRisks = false;
      },
      error: () => { this.loadingRisks = false; },
    });
  }
}
