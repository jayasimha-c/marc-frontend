import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { RiskAnalysisOnlineService } from '../risk-analysis-online.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { CreateImpactAnalysisComponent } from './create-impact-analysis.component';
import { AddRolesToProfileComponent } from './add-roles-to-profile.component';
import { ReviewProfileDetailsComponent } from './review-profile-details.component';
import { forkJoin } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-impact-analysis',
  templateUrl: './impact-analysis.component.html',
})
export class ImpactAnalysisComponent implements OnInit {
  loading = false;
  data: any[] = [];
  selectedRow: any = null;

  columns: TableColumn[] = [
    { field: 'name', header: 'Profile', sortable: true },
    { field: 'description', header: 'Description' },
    { field: 'sapSystemName', header: 'Roles Source' },
    { field: 'secondarySystem', header: 'Users Source' },
    { field: 'analysisType', header: 'Analysis Type', width: '120px' },
    {
      field: 'mitigationIncluded',
      header: 'Mitigations',
      type: 'tag',
      width: '110px',
      tagColors: { Yes: 'green', No: 'default' },
    },
    { field: 'createdOnStr', header: 'Created On', type: 'date', width: '150px' },
    { field: 'createdBy', header: 'Created By', width: '120px' },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', type: 'primary', command: () => this.onAction('add') },
    { label: 'Edit Risks', icon: 'edit', command: () => this.onAction('editRisks') },
    { label: 'Edit Roles', icon: 'edit', command: () => this.onAction('editRoles') },
    { label: 'View Summary', icon: 'search', command: () => this.onAction('viewSummary') },
    { label: 'Delete', icon: 'delete', danger: true, command: () => this.onAction('delete') },
    { label: 'Start Analysis', icon: 'play-circle', command: () => this.onAction('startAnalysis') },
  ];

  constructor(
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private riskAnalysisService: RiskAnalysisOnlineService,
  ) {}

  ngOnInit(): void {
    this.loadProfiles();
  }

  loadProfiles(): void {
    this.loading = true;
    this.riskAnalysisService.impactAnalysisGetProfiles().subscribe({
      next: (resp) => {
        this.data = (resp.data?.rows || [])
          .sort((a: any, b: any) => (b.createdOn || 0) - (a.createdOn || 0))
          .map((row: any) => ({
            ...row,
            mitigationIncluded: row.mitigationIncluded ? 'Yes' : 'No',
          }));
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load profiles');
        this.loading = false;
      },
    });
  }

  onAction(action: string): void {
    switch (action) {
      case 'add':
        this.openCreateModal();
        break;
      case 'editRisks':
        if (!this.checkRow()) break;
        this.openEditRisksModal();
        break;
      case 'editRoles':
        if (!this.checkRow()) break;
        this.openEditRolesModal();
        break;
      case 'viewSummary':
        if (!this.checkRow()) break;
        this.openReviewModal(this.selectedRow.id);
        break;
      case 'delete':
        if (!this.checkRow()) break;
        this.deleteProfile();
        break;
      case 'startAnalysis':
        if (!this.checkRow()) break;
        this.startAnalysis();
        break;
    }
  }

  onRowClicked(row: any): void {
    this.selectedRow = row;
  }

  private checkRow(): boolean {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a row first');
      return false;
    }
    return true;
  }

  private openCreateModal(): void {
    const modal = this.nzModal.create({
      nzTitle: 'Create Impact Analysis Profile',
      nzContent: CreateImpactAnalysisComponent,
      nzWidth: '600px',
      nzFooter: null,
    });
    modal.afterClose.subscribe((result) => {
      if (result?.created) {
        this.loadProfiles();
      }
    });
  }

  private openEditRisksModal(): void {
    // Placeholder: risk editing would use a transfer-table pattern
    // For now, navigate to view summary which shows risks
    this.openReviewModal(this.selectedRow.id);
  }

  private openEditRolesModal(): void {
    const modal = this.nzModal.create({
      nzTitle: 'Edit Roles - ' + this.selectedRow.name,
      nzContent: AddRolesToProfileComponent,
      nzWidth: '90vw',
      nzFooter: null,
      nzData: { profile: this.selectedRow, editMode: true },
    });
    modal.afterClose.subscribe(() => this.loadProfiles());
  }

  private openReviewModal(profileId: number): void {
    forkJoin([
      this.riskAnalysisService.impactAnalysisEditRoleData(profileId),
      this.riskAnalysisService.impactAnalysisGetRoleAuthEdit(profileId),
    ]).subscribe({
      next: ([roleDataResp, roleAuthResp]) => {
        this.nzModal.create({
          nzTitle: 'Review Profile - ' + (roleDataResp.data?.profile?.name || ''),
          nzContent: ReviewProfileDetailsComponent,
          nzWidth: '90vw',
          nzFooter: null,
          nzData: {
            profile: roleDataResp.data?.profile,
            roleName: roleDataResp.data?.roleName,
            roleAuthData: roleAuthResp.data?.rows || [],
            profileId,
          },
        });
      },
      error: () => this.notificationService.error('Failed to load profile details'),
    });
  }

  private deleteProfile(): void {
    this.nzModal.confirm({
      nzTitle: 'Confirm Delete',
      nzContent: `Are you sure you want to delete profile "${this.selectedRow.name}"?`,
      nzOkDanger: true,
      nzOnOk: () => {
        this.riskAnalysisService.impactAnalysisDeleteProfile(this.selectedRow.id).subscribe({
          next: () => {
            this.notificationService.success('Profile deleted successfully');
            this.selectedRow = null;
            this.loadProfiles();
          },
          error: () => this.notificationService.error('Failed to delete profile'),
        });
      },
    });
  }

  private startAnalysis(): void {
    this.riskAnalysisService.impactAnalysisStartAnalysis(this.selectedRow.id).subscribe({
      next: (resp) => {
        if (resp?.success) {
          this.riskAnalysisService.openRunBackgroundAlert();
        }
      },
      error: () => this.notificationService.error('Failed to start analysis'),
    });
  }
}
