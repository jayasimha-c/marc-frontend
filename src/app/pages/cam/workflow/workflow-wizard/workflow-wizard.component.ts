import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { WorkflowService } from '../services/workflow.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';

@Component({
  standalone: false,
  selector: 'app-workflow-wizard',
  templateUrl: './workflow-wizard.component.html',
  styleUrls: ['./workflow-wizard.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class WorkflowWizardComponent implements OnInit {
  basicInfoForm!: FormGroup;
  settingsForm!: FormGroup;

  availableNodes: any[] = [];
  selectedNodes: any[] = [];
  workflowTypes = [
    { value: 'ADD_USER', label: 'Add Users' },
    { value: 'CHANGE_USER', label: 'Change Users' },
    { value: 'LOCK_UNLOCK_USER', label: 'Lock Users' },
    { value: 'RESET_PWD', label: 'Reset Password' },
    { value: 'DELETE_USER', label: 'Delete Users' },
  ];

  loading = false;
  isEditMode = false;
  workflowId?: number;
  workflowData: any;
  currentStep = 0;
  isActive = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private workflowService: WorkflowService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.workflowId = +params['id'];
        this.loadExistingWorkflow();
      } else {
        this.loadAvailableNodes();
      }
    });
  }

  private initializeForms(): void {
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      type: ['', [Validators.required]],
    });
    this.settingsForm = this.fb.group({
      changeRoles: [false],
      selfApprove: [false],
    });
  }

  private loadExistingWorkflow(): void {
    this.loading = true;
    this.workflowService.getWorkflowList().subscribe({
      next: (resp) => {
        const workflow = (resp.data?.workflows || []).find((w: any) => w.id === this.workflowId);
        if (workflow) {
          this.workflowData = workflow;
          this.basicInfoForm.patchValue({ name: workflow.name, type: workflow.type });
          this.settingsForm.patchValue({ changeRoles: workflow.changeRoles || false, selfApprove: workflow.selfApprove || false });
          this.isActive = workflow.active || false;
          if (this.isEditMode) this.basicInfoForm.get('type')?.disable();
          this.loadWorkflowNodes();
        } else {
          this.notificationService.show({ success: false, message: 'Workflow not found' } as any);
          this.navigateBack();
        }
        this.loading = false;
      },
      error: () => { this.loading = false; this.navigateBack(); },
    });
  }

  private loadWorkflowNodes(): void {
    if (!this.workflowId) return;
    this.workflowService.getWorkflowNodeList(this.workflowId).subscribe({
      next: (resp) => {
        this.selectedNodes = resp.data?.wfNodes || [];
        this.availableNodes = resp.data?.nodes || [];
        if (this.workflowData) this.workflowData.wfNodes = [...this.selectedNodes];
      },
    });
  }

  private loadAvailableNodes(): void {
    this.workflowService.getNodeList().subscribe({
      next: (resp) => { this.availableNodes = resp.data?.nodes || []; },
    });
  }

  // Navigation
  navigateBack(): void {
    this.router.navigate(['/cam/workflow/workflows']);
  }

  onPrevious(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  onNext(): void {
    if (this.currentStep === 0 && !this.basicInfoForm.valid) {
      this.basicInfoForm.markAllAsTouched();
      return;
    }
    if (this.currentStep === 2 && this.selectedNodes.length === 0) {
      this.notificationService.show({ success: false, message: 'Please add at least one node' } as any);
      return;
    }
    this.currentStep++;
  }

  // Node management
  addNode(node: any): void {
    if (!this.isNodeSelected(node.id)) {
      this.selectedNodes.push({ node, order: this.selectedNodes.length });
    }
  }

  removeNode(index: number): void {
    this.confirmDialogService.confirm({
      title: 'Remove Node',
      message: 'Remove this node from the workflow?',
      confirmBtnText: 'Remove',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.selectedNodes.splice(index, 1);
        this.reorderNodes();
      }
    });
  }

  moveNodeUp(index: number): void {
    if (index > 0) {
      [this.selectedNodes[index], this.selectedNodes[index - 1]] = [this.selectedNodes[index - 1], this.selectedNodes[index]];
      this.reorderNodes();
    }
  }

  moveNodeDown(index: number): void {
    if (index < this.selectedNodes.length - 1) {
      [this.selectedNodes[index], this.selectedNodes[index + 1]] = [this.selectedNodes[index + 1], this.selectedNodes[index]];
      this.reorderNodes();
    }
  }

  dropNode(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.selectedNodes, event.previousIndex, event.currentIndex);
      this.reorderNodes();
    }
  }

  private reorderNodes(): void {
    this.selectedNodes.forEach((n, i) => n.order = i);
  }

  isNodeSelected(nodeId: number): boolean {
    return this.selectedNodes.some(n => n.node?.id === nodeId);
  }

  getAvailableNodesFiltered(): any[] {
    return this.availableNodes.filter(n => !this.isNodeSelected(n.id));
  }

  // Save
  onSave(): void {
    const data = {
      id: this.workflowId,
      name: this.basicInfoForm.get('name')?.value,
      type: this.basicInfoForm.get('type')?.getRawValue(),
      changeRoles: this.settingsForm.get('changeRoles')?.value,
      selfApprove: this.settingsForm.get('selfApprove')?.value,
      active: this.isActive,
      nodes: this.selectedNodes.map((n, i) => ({ nodeId: n.node?.id, order: i })),
    };

    this.loading = true;
    const id = this.isEditMode ? data.id! : 0;

    this.workflowService.addWorkflow(data.name, data.type, data.changeRoles, data.selfApprove, id).subscribe({
      next: (resp) => {
        if (resp.success) {
          const wfId = resp.data?.id || this.workflowId;
          if (this.isEditMode) {
            this.updateNodes(wfId!, data.nodes, data.active);
          } else if (wfId && data.nodes.length > 0) {
            this.saveNewNodes(wfId, data.nodes, data.active);
          } else {
            this.handleSuccess(wfId!, data.active);
          }
        } else {
          this.loading = false;
          this.notificationService.show(resp);
        }
      },
      error: (err) => { this.loading = false; this.notificationService.handleHttpError(err); },
    });
  }

  private updateNodes(wfId: number, newNodes: any[], activate: boolean): void {
    const existingIds = (this.workflowData?.wfNodes || []).map((n: any) => n.id);
    const currentIds = this.selectedNodes.filter(n => n.id).map(n => n.id);
    const toDelete = existingIds.filter((id: number) => !currentIds.includes(id));
    const toAdd = newNodes.filter(n => {
      const sn = this.selectedNodes.find(s => s.node?.id === n.nodeId);
      return sn && !sn.id;
    });

    let pending = toDelete.length;
    if (pending === 0) {
      if (toAdd.length > 0) this.saveNewNodes(wfId, toAdd, activate);
      else this.handleSuccess(wfId, activate);
      return;
    }

    toDelete.forEach((id: number) => {
      this.workflowService.deleteWorkflowNode(id).subscribe({
        next: () => { if (--pending === 0) { toAdd.length > 0 ? this.saveNewNodes(wfId, toAdd, activate) : this.handleSuccess(wfId, activate); } },
        error: () => { if (--pending === 0) { toAdd.length > 0 ? this.saveNewNodes(wfId, toAdd, activate) : this.handleSuccess(wfId, activate); } },
      });
    });
  }

  private saveNewNodes(wfId: number, nodes: any[], activate: boolean): void {
    let pending = nodes.length;
    nodes.forEach(n => {
      this.workflowService.addWorkflowNode(wfId, n.nodeId).subscribe({
        next: () => { if (--pending === 0) this.handleSuccess(wfId, activate); },
        error: () => { if (--pending === 0) this.handleSuccess(wfId, activate); },
      });
    });
  }

  private handleSuccess(wfId: number, activate: boolean): void {
    const needsToggle = (activate && !this.workflowData?.active) || (!activate && this.workflowData?.active);
    if (needsToggle) {
      this.workflowService.statusWorkflow(wfId, activate).subscribe({
        next: () => { this.loading = false; this.notificationService.show({ success: true, message: 'Workflow saved successfully' } as any); this.navigateBack(); },
        error: () => { this.loading = false; this.notificationService.show({ success: true, message: 'Workflow saved successfully' } as any); this.navigateBack(); },
      });
    } else {
      this.loading = false;
      this.notificationService.show({ success: true, message: 'Workflow saved successfully' } as any);
      this.navigateBack();
    }
  }

  getTypeName(): string {
    const type = this.basicInfoForm.get('type')?.getRawValue();
    return this.workflowTypes.find(t => t.value === type)?.label || type || 'N/A';
  }
}
