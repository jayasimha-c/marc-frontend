import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { Router } from '@angular/router';
import { WorkflowService } from '../services/workflow.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class RolesListComponent implements OnInit {
  roles: any[] = [];
  loading = true;
  analysisLoading = false;
  simulationComplete = false;
  simulationJobId: number | null = null;

  jobDetailId: number;
  jobId: number;
  roleOwnerInProgress = false;
  roleOwnerApprovalId: number | null = null;
  sapDestination = '';

  constructor(
    @Inject(NZ_MODAL_DATA) private modalData: any,
    private modalRef: NzModalRef,
    private modalService: NzModalService,
    private workflowService: WorkflowService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    this.jobDetailId = this.modalData.jobDetailId;
    this.jobId = this.modalData.jobId;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.workflowService.getRolesDetails(this.jobDetailId).subscribe({
      next: (resp) => {
        const d = resp.data || {};
        this.roles = d.selectedRoles || [];
        this.roleOwnerInProgress = d.roleOwnerInProgress || false;
        this.roleOwnerApprovalId = d.roleOwnerApprovalId || null;
        this.sapDestination = d.sap || '';
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  approveRoles(): void {
    const modified = this.roles.filter(r => r._modified);
    if (modified.length === 0) {
      this.notificationService.show({ success: false, message: 'No roles have been modified' } as any);
      return;
    }

    const payload = {
      sapDestination: this.sapDestination,
      approvalId: this.roleOwnerApprovalId!,
      roleStatusList: modified.map(r => ({ rolename: r.rolename || r.roleName, status: r.status })),
    };

    this.loading = true;
    this.workflowService.approveRole(payload).subscribe({
      next: (resp) => {
        this.notificationService.show(resp);
        this.loading = false;
        this.modalRef.close('saved');
      },
      error: (err) => { this.loading = false; this.notificationService.handleHttpError(err); },
    });
  }

  runSimulation(): void {
    const roleNames = this.roles.map(r => r.rolename || r.roleName);
    if (roleNames.length === 0) return;

    this.analysisLoading = true;
    this.simulationComplete = false;

    const params = { jobDetailId: this.jobDetailId };
    const payload = { jobDetailId: this.jobDetailId, rolename: roleNames };

    this.workflowService.startMultiUserSimulation(params, payload).subscribe({
      next: (resp) => {
        this.analysisLoading = false;
        if (resp.success) {
          this.simulationComplete = true;
          this.simulationJobId = resp.data?.jobId || null;
        } else {
          this.notificationService.show(resp);
        }
      },
      error: (err) => { this.analysisLoading = false; this.notificationService.handleHttpError(err); },
    });
  }

  viewResults(): void {
    if (this.simulationJobId) {
      this.modalRef.close();
      this.router.navigate(['/acm/risk-analysis'], { queryParams: { jobId: this.simulationJobId } });
    }
  }

  viewRoleOwners(role: any): void {
    this.workflowService.getRoleOwners(role.rolename || role.roleName, this.sapDestination).subscribe({
      next: (resp) => {
        const owners = resp.data || [];
        this.modalService.info({
          nzTitle: `Role Owners — ${role.rolename || role.roleName}`,
          nzContent: owners.length > 0
            ? owners.map((o: any) => `<div>${o.name || o.userId}</div>`).join('')
            : '<p>No owners found</p>',
          nzWidth: 400,
        });
      },
    });
  }

  onStatusChange(role: any): void {
    role._modified = true;
  }

  close(): void {
    this.modalRef.close();
  }
}
