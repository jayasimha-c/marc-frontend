import { Component, OnInit, Inject } from '@angular/core';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { RiskAnalysisOnlineService } from '../risk-analysis-online.service';
import { TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-add-roles-to-profile',
  template: `
    <nz-spin [nzSpinning]="loadingRoles">
      <!-- Available Roles (create mode) -->
      <ng-container *ngIf="!editMode">
        <h4 nz-typography style="margin: 0 0 8px">Available Roles</h4>
        <nz-table #rolesTable
                  [nzData]="availableRoles"
                  nzSize="small"
                  [nzShowPagination]="true"
                  [nzPageSize]="10"
                  [nzFrontPagination]="false"
                  [nzTotal]="rolesTotalRecords"
                  (nzQueryParams)="onRolesQueryChange($event)"
                  nzShowSizeChanger>
          <thead>
            <tr>
              <th nzWidth="50px"></th>
              <th>Role Name</th>
              <th>Role Description</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let role of rolesTable.data" (click)="selectRole(role)" style="cursor: pointer">
              <td><label nz-radio [ngModel]="selectedRole?.name === role.name" (ngModelChange)="selectRole(role)"></label></td>
              <td>{{ role.name }}</td>
              <td>{{ role.description }}</td>
            </tr>
          </tbody>
        </nz-table>
      </ng-container>

      <!-- Role Authorizations -->
      <div [style.margin-top]="editMode ? '0' : '16px'">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
          <h4 nz-typography style="margin: 0">
            {{ editMode ? 'Role ID: ' + roleId : 'Role Authorizations' }}
          </h4>
          <button nz-button nzSize="small" nzType="dashed" (click)="addAuthRow()">
            <span nz-icon nzType="plus"></span> Add Row
          </button>
        </div>
        <nz-table #authTable [nzData]="authData" nzSize="small" [nzShowPagination]="false" [nzScroll]="{ y: '300px' }">
          <thead>
            <tr>
              <th>Profile</th>
              <th>Auth</th>
              <th>Object</th>
              <th>Field</th>
              <th>Von</th>
              <th>Bis</th>
              <th nzWidth="50px"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of authTable.data; let i = index">
              <td><input nz-input nzSize="small" [(ngModel)]="row.profile" /></td>
              <td><input nz-input nzSize="small" [(ngModel)]="row.auth" /></td>
              <td><input nz-input nzSize="small" [(ngModel)]="row.object" /></td>
              <td><input nz-input nzSize="small" [(ngModel)]="row.field" /></td>
              <td><input nz-input nzSize="small" [(ngModel)]="row.von" /></td>
              <td><input nz-input nzSize="small" [(ngModel)]="row.bis" /></td>
              <td>
                <button nz-button nzType="text" nzSize="small" nzDanger (click)="removeAuthRow(i)">
                  <span nz-icon nzType="delete"></span>
                </button>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </nz-spin>

    <div style="text-align: right; margin-top: 16px; border-top: 1px solid #f0f0f0; padding-top: 12px">
      <button nz-button nzType="default" (click)="modalRef.close()" style="margin-right: 8px">
        {{ editMode ? 'Close' : 'Back' }}
      </button>
      <button nz-button nzType="primary" [nzLoading]="saving" (click)="save()">
        {{ editMode ? 'Save' : 'Next' }}
      </button>
    </div>
  `,
})
export class AddRolesToProfileComponent implements OnInit {
  editMode = false;
  profileId: number;
  profileName = '';
  roleId = '';
  selectedRole: any = null;

  availableRoles: any[] = [];
  rolesTotalRecords = 0;
  authData: any[] = [];

  loadingRoles = false;
  saving = false;

  constructor(
    public modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) private modalData: any,
    private notificationService: NotificationService,
    private riskAnalysisService: RiskAnalysisOnlineService,
  ) {
    this.editMode = modalData.editMode || false;
    this.profileId = modalData.profile?.id;
    this.profileName = modalData.profile?.name || '';
  }

  ngOnInit(): void {
    if (this.editMode) {
      this.loadEditData();
    }
  }

  private loadEditData(): void {
    this.loadingRoles = true;
    this.riskAnalysisService.impactAnalysisEditRoleData(this.profileId).subscribe({
      next: (resp) => { this.roleId = resp.data?.roleName || ''; },
    });
    this.riskAnalysisService.impactAnalysisGetRoleAuthEdit(this.profileId).subscribe({
      next: (resp) => {
        this.authData = resp.data?.rows || [];
        this.loadingRoles = false;
      },
      error: () => { this.loadingRoles = false; },
    });
  }

  onRolesQueryChange(params: any): void {
    this.loadingRoles = true;
    this.riskAnalysisService.getImpactAnalysisFilteredRoles({
      lazyEvent: {
        first: (params.pageIndex - 1) * params.pageSize,
        rows: params.pageSize,
        sortOrder: 0,
        sortField: '',
        filters: null,
        globalFilter: null,
      },
      profileId: this.profileId,
    }).subscribe({
      next: (resp) => {
        this.availableRoles = resp.data?.rows || [];
        this.rolesTotalRecords = resp.data?.records || 0;
        this.loadingRoles = false;
      },
      error: () => { this.loadingRoles = false; },
    });
  }

  selectRole(role: any): void {
    this.selectedRole = role;
    this.loadingRoles = true;
    this.riskAnalysisService.impactAnalysisGetRoleAuth(role.name, this.profileId).subscribe({
      next: (resp) => {
        this.authData = resp.data?.rows || [];
        this.loadingRoles = false;
      },
      error: () => { this.loadingRoles = false; },
    });
  }

  addAuthRow(): void {
    this.authData = [...this.authData, { profile: '', auth: '', object: '', field: '', von: '', bis: '' }];
  }

  removeAuthRow(index: number): void {
    this.authData = this.authData.filter((_, i) => i !== index);
  }

  save(): void {
    const roleName = this.editMode ? this.roleId : this.selectedRole?.name;
    if (!roleName) {
      this.notificationService.error('Please select a role first');
      return;
    }

    this.saving = true;
    this.riskAnalysisService.saveImpactAnalysisSelectedRoles({
      pid: this.profileId,
      roleName,
      data: this.authData,
    }).subscribe({
      next: (resp) => {
        this.saving = false;
        this.notificationService.show(resp);
        if (resp.success) {
          this.modalRef.close({ saved: true });
        }
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.show(err.error);
      },
    });
  }
}
