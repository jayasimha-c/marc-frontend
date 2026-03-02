import { Component, OnInit, OnDestroy } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { BusinessProcessService } from '../business-process.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { AddNodeDialogComponent } from './add-node-dialog/add-node-dialog.component';

export interface BusinessProcessNode {
  id: number;
  name: string;
  type: 'process' | 'subprocess';
  parentId: number | null;
  children: BusinessProcessNode[];
}

@Component({
  standalone: false,
  selector: 'app-business-process-tree',
  templateUrl: './business-process-tree.component.html',
  styleUrls: ['./business-process-tree.component.scss'],
})
export class BusinessProcessTreeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  treeData: BusinessProcessNode[] = [];
  originalData: BusinessProcessNode[] = [];
  expandedNodes = new Set<number>();
  selectedNode: BusinessProcessNode | null = null;
  searchTerm = '';
  loading = false;

  constructor(
    private bpService: BusinessProcessService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.loadTree();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data Loading ───────────────────────────────────────

  loadTree(): void {
    this.loading = true;
    this.bpService.getBusinessProcessTree()
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.originalData = res.data || [];
          this.treeData = [...this.originalData];
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load business processes');
          this.loading = false;
        },
      });
  }

  // ── Search ─────────────────────────────────────────────

  filterTree(): void {
    if (!this.searchTerm?.trim()) {
      this.treeData = [...this.originalData];
      return;
    }
    const term = this.searchTerm.toLowerCase().trim();
    this.treeData = this.originalData
      .map(process => {
        const processMatches = process.name.toLowerCase().includes(term);
        const matchingChildren = (process.children || []).filter(child =>
          child.name.toLowerCase().includes(term)
        );
        if (processMatches || matchingChildren.length > 0) {
          return { ...process, children: processMatches ? process.children : matchingChildren };
        }
        return null;
      })
      .filter((p): p is BusinessProcessNode => p !== null);

    this.treeData.forEach(node => this.expandedNodes.add(node.id));
  }

  // ── Expand / Collapse ─────────────────────────────────

  isExpanded(node: BusinessProcessNode): boolean {
    return this.expandedNodes.has(node.id);
  }

  toggleNode(node: BusinessProcessNode): void {
    this.expandedNodes.has(node.id) ? this.expandedNodes.delete(node.id) : this.expandedNodes.add(node.id);
  }

  expandAll(): void {
    this.treeData.forEach(n => this.expandedNodes.add(n.id));
  }

  collapseAll(): void {
    this.expandedNodes.clear();
  }

  // ── Selection ──────────────────────────────────────────

  isSelected(node: BusinessProcessNode): boolean {
    return this.selectedNode === node;
  }

  selectNode(node: BusinessProcessNode): void {
    this.selectedNode = node;
  }

  getChildCount(node: BusinessProcessNode): number {
    return node.children?.length || 0;
  }

  // ── CRUD Actions ───────────────────────────────────────

  addProcess(): void {
    const ref = this.nzModal.create({
      nzTitle: 'Add Business Process',
      nzContent: AddNodeDialogComponent,
      nzWidth: '400px',
      nzFooter: null,
      nzData: { mode: 'add', nodeType: 'process' },
    });
    ref.afterClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.loadTree();
    });
  }

  addSubProcess(parentNode: BusinessProcessNode, event: Event): void {
    event.stopPropagation();
    const ref = this.nzModal.create({
      nzTitle: 'Add Sub-Process',
      nzContent: AddNodeDialogComponent,
      nzWidth: '400px',
      nzFooter: null,
      nzData: { mode: 'add', nodeType: 'subprocess', parentProcess: parentNode },
    });
    ref.afterClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.loadTree();
        setTimeout(() => this.expandedNodes.add(parentNode.id), 100);
      }
    });
  }

  editNode(node: BusinessProcessNode, event: Event): void {
    event.stopPropagation();
    const ref = this.nzModal.create({
      nzTitle: node.type === 'process' ? 'Edit Business Process' : 'Edit Sub-Process',
      nzContent: AddNodeDialogComponent,
      nzWidth: '400px',
      nzFooter: null,
      nzData: {
        mode: 'edit',
        nodeType: node.type,
        node,
        parentProcess: node.type === 'subprocess'
          ? this.originalData.find(p => p.id === node.parentId)
          : null,
      },
    });
    ref.afterClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.loadTree();
    });
  }

  deleteNode(node: BusinessProcessNode, event: Event): void {
    event.stopPropagation();
    const hasChildren = node.type === 'process' && node.children?.length > 0;
    let message = node.type === 'process'
      ? `Delete Business Process "${node.name}"?`
      : `Delete Sub-Process "${node.name}"?`;
    if (hasChildren) {
      message += ` This will also delete ${node.children.length} sub-process(es).`;
    }

    this.confirmDialog.confirm({ title: 'Confirm Delete', message })
      .pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.bpService.deleteProcessNode(node.id, node.type)
          .pipe(takeUntil(this.destroy$)).subscribe({
            next: (res) => {
              this.notificationService.success(res.message || 'Deleted successfully');
              this.selectedNode = null;
              this.loadTree();
            },
            error: (err) => this.notificationService.error(err.error?.message || 'Failed to delete'),
          });
      });
  }
}
