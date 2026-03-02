import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { WorkflowService } from '../services/workflow.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';

const PROTECTED_NODES = ['ARC', 'ROLEAPPROVER', 'ADMANAGER'];

@Component({
  standalone: false,
  selector: 'app-node-wizard',
  templateUrl: './node-wizard.component.html',
  styleUrls: ['./node-wizard.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NodeWizardComponent implements OnInit {
  basicInfoForm!: FormGroup;

  approverGroups: any[] = [];
  availableUsers: any[] = [];
  detourNodes: any[] = [];

  loading = false;
  isEditMode = false;
  nodeTypeId?: number;
  nodeData: any;
  currentStep = 0;
  isProtected = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private workflowService: WorkflowService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.nodeTypeId = +params['id'];
        this.loadExistingNode();
      } else {
        this.loadDetourNodes();
      }
    });
  }

  private initializeForm(): void {
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      commentsRequired: [false],
      mustCheckRisk: [false],
      approveIfRiskPresent: [false],
      enableRiskDetour: [false],
      riskDetourNode: [false],
      detourNodeId: [null],
    });
  }

  private loadExistingNode(): void {
    this.loading = true;
    this.workflowService.getNodeList().subscribe({
      next: (resp) => {
        const nodes = resp.data?.nodes || [];
        this.detourNodes = resp.data?.detourNodes || nodes;
        const node = nodes.find((n: any) => n.id === this.nodeTypeId);
        if (node) {
          this.nodeData = node;
          this.isProtected = PROTECTED_NODES.includes(node.name);
          this.basicInfoForm.patchValue({
            name: node.name,
            commentsRequired: node.commentsRequired || false,
            mustCheckRisk: node.mustCheckRisk || false,
            approveIfRiskPresent: node.approveIfRiskPresent || false,
            enableRiskDetour: node.enableRiskDetour || false,
            riskDetourNode: node.riskDetourNode || false,
            detourNodeId: node.detourNodeId || null,
          });
          if (this.isProtected) this.basicInfoForm.get('name')?.disable();
          this.loadNodeData();
        } else {
          this.notificationService.show({ success: false, message: 'Node type not found' } as any);
          this.navigateBack();
        }
        this.loading = false;
      },
      error: () => { this.loading = false; this.navigateBack(); },
    });
  }

  private loadNodeData(): void {
    if (!this.nodeTypeId) return;
    this.workflowService.getNodeListData(this.nodeTypeId).subscribe({
      next: (resp) => {
        this.availableUsers = resp.data?.users || [];
        this.approverGroups = (resp.data?.nodeData || []).map((g: any) => ({
          ...g,
          selectedUserIds: (g.userIds || '').split(',').filter((id: string) => id),
        }));
      },
    });
  }

  private loadDetourNodes(): void {
    this.workflowService.getNodeList().subscribe({
      next: (resp) => {
        this.detourNodes = resp.data?.detourNodes || resp.data?.nodes || [];
      },
    });
  }

  navigateBack(): void {
    this.router.navigate(['/cam/workflow/nodes']);
  }

  onPrevious(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  onNext(): void {
    if (this.currentStep === 0 && !this.basicInfoForm.valid) {
      this.basicInfoForm.markAllAsTouched();
      return;
    }
    this.currentStep++;
  }

  // Approver Group Management
  addGroup(): void {
    this.approverGroups.push({ id: 0, name: '', description: '', selectedUserIds: [] });
  }

  removeGroup(index: number): void {
    this.confirmDialogService.confirm({
      title: 'Remove Group',
      message: 'Remove this approver group?',
      confirmBtnText: 'Remove',
    }).subscribe((confirmed) => {
      if (confirmed) this.approverGroups.splice(index, 1);
    });
  }

  getUserName(userId: string): string {
    const user = this.availableUsers.find((u: any) => String(u.id) === userId);
    return user?.username || user?.firstName || userId;
  }

  // Save
  onSave(): void {
    this.loading = true;

    const formData = this.basicInfoForm.getRawValue();
    const nodeType = {
      id: this.nodeTypeId || 0,
      name: formData.name,
      commentsRequired: formData.commentsRequired,
      mustCheckRisk: formData.mustCheckRisk,
      approveIfRiskPresent: formData.approveIfRiskPresent,
      enableRiskDetour: formData.enableRiskDetour,
      riskDetourNode: formData.riskDetourNode,
      detourNodeId: formData.enableRiskDetour ? formData.detourNodeId : undefined,
    };

    this.workflowService.addNodeType(nodeType).subscribe({
      next: (resp) => {
        if (resp.success) {
          const ntId = resp.data?.id || this.nodeTypeId;
          if (ntId && this.approverGroups.length > 0) {
            this.saveApproverGroups(ntId);
          } else {
            this.loading = false;
            this.notificationService.show({ success: true, message: 'Node type saved successfully' } as any);
            this.navigateBack();
          }
        } else {
          this.loading = false;
          this.notificationService.show(resp);
        }
      },
      error: (err) => { this.loading = false; this.notificationService.handleHttpError(err); },
    });
  }

  private saveApproverGroups(ntId: number): void {
    let pending = this.approverGroups.length;
    this.approverGroups.forEach(group => {
      const userIds = (group.selectedUserIds || []).join(',');
      this.workflowService.addNodeTypeData(ntId, group.name || '', group.description || '', userIds, group.id || 0).subscribe({
        next: () => {
          if (--pending === 0) {
            this.loading = false;
            this.notificationService.show({ success: true, message: 'Node type saved successfully' } as any);
            this.navigateBack();
          }
        },
        error: () => {
          if (--pending === 0) {
            this.loading = false;
            this.notificationService.show({ success: true, message: 'Node type saved (some groups may have failed)' } as any);
            this.navigateBack();
          }
        },
      });
    });
  }
}
