import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTreeComponent, NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';
import { Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ControlFrameworkService, Framework, RequirementNode } from './control-framework.service';
import { ControlFrameworkImportComponent } from './control-framework-import.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-control-framework-dashboard',
  templateUrl: './control-framework-dashboard.component.html',
})
export class ControlFrameworkDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private frameworkCache = new Map<string, RequirementNode[]>();
  private searchSubject$ = new Subject<string>();

  @ViewChild('nzTree') nzTreeComponent!: NzTreeComponent;

  frameworks: Framework[] = [];
  requirements: RequirementNode[] = [];
  filteredRequirements: RequirementNode[] = [];
  selectedFramework: Framework | null = null;
  selectedRequirement: RequirementNode | null = null;
  relatedControls: RequirementNode[] = [];

  frameworksLoading = false;
  requirementsLoading = false;
  errorState = false;
  searchTerm = '';
  isExpandAll = false;
  treeNodes: NzTreeNodeOptions[] = [];

  private selectedFrameworkId: string | null = null;

  compareFramework = (a: Framework, b: Framework) => a && b && a.id === b.id;

  constructor(
    private cfService: ControlFrameworkService,
    private modal: NzModalService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    const navState = history.state;
    if (navState?.selectedFrameworkId) {
      this.selectedFrameworkId = navState.selectedFrameworkId;
    }

    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(term => this.performSearch(term));

    this.loadFrameworks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFrameworks(): void {
    this.frameworksLoading = true;
    this.errorState = false;

    this.cfService.getFrameworks().subscribe({
      next: (res) => {
        if (res.success) {
          this.frameworks = res.data.rows;
          if (this.selectedFrameworkId) {
            const found = this.frameworks.find(f => f.id === this.selectedFrameworkId);
            if (found) {
              this.selectedFramework = found;
              this.loadRequirements(found.id);
              this.selectedFrameworkId = null;
            } else if (this.frameworks.length > 0) {
              this.onFrameworkChange(this.frameworks[0]);
            }
          } else if (this.frameworks.length > 0 && !this.selectedFramework) {
            this.onFrameworkChange(this.frameworks[0]);
          }
        }
        this.frameworksLoading = false;
      },
      error: () => {
        this.frameworksLoading = false;
        this.errorState = true;
        this.notify.error('Failed to load frameworks');
      },
    });
  }

  loadRequirements(frameworkId: string): void {
    const cached = this.frameworkCache.get(frameworkId);
    if (cached) {
      this.requirements = cached;
      this.updateTreeData();
      return;
    }

    this.requirementsLoading = true;
    this.errorState = false;

    this.cfService.getFrameworksRequirementsById(frameworkId).pipe(
      catchError(error => {
        this.errorState = true;
        this.requirementsLoading = false;
        this.notify.error('Failed to load requirements');
        throw error;
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.requirements = (res.data.rows || []).map((req: RequirementNode) => ({
            ...req,
            status: req.status || 'not-assessed',
            priority: req.priority || 'medium',
            criticality: req.criticality || 'Medium',
          }));
          this.calculateLevels();
          this.frameworkCache.set(frameworkId, this.requirements);
          this.updateTreeData();
        }
        this.requirementsLoading = false;
      },
    });
  }

  onFrameworkChange(framework: Framework): void {
    this.selectedFramework = framework;
    this.selectedRequirement = null;
    this.searchTerm = '';
    this.isExpandAll = false;
    this.loadRequirements(framework.id);
  }

  onTreeNodeClick(event: NzFormatEmitEvent): void {
    if (event.node) {
      const origin = event.node.origin;
      const req = this.requirements.find(r => r.id === origin['id']);
      if (req) this.selectRequirement(req);
    }
  }

  selectRequirement(node: RequirementNode): void {
    this.selectedRequirement = node;
    this.relatedControls = this.computeRelatedControls(node);
  }

  selectRequirementById(id: string): void {
    const req = this.requirements.find(r => r.id === id);
    if (req) this.selectRequirement(req);
  }

  onSearchInput(): void {
    this.searchSubject$.next(this.searchTerm);
  }

  expandAll(): void { this.isExpandAll = true; }

  collapseAll(): void {
    this.isExpandAll = false;
    const nodes = [...this.treeNodes];
    this.treeNodes = [];
    setTimeout(() => { this.treeNodes = nodes; });
  }

  openImportDialog(): void {
    const ref = this.modal.create({
      nzTitle: 'Import Control Framework',
      nzContent: ControlFrameworkImportComponent,
      nzWidth: '600px',
      nzFooter: null,
    });
    ref.afterClose.subscribe(result => {
      if (result?.success) this.loadFrameworks();
    });
  }

  exportFramework(): void {
    if (!this.selectedFramework) return;
    const exportData = {
      framework: this.selectedFramework,
      requirements: this.requirements,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.selectedFramework.refId}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.notify.success(`Framework ${this.selectedFramework.name} exported successfully`);
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'compliant': return 'check-circle';
      case 'non-compliant': return 'close-circle';
      case 'partial': return 'clock-circle';
      default: return 'audit';
    }
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'compliant': return '#52c41a';
      case 'non-compliant': return '#f5222d';
      case 'partial': return '#faad14';
      default: return '#8c8c8c';
    }
  }

  getStatusTag(status?: string): string {
    switch (status) {
      case 'compliant': return 'success';
      case 'non-compliant': return 'error';
      case 'partial': return 'warning';
      default: return 'default';
    }
  }

  getPriorityTag(priority?: string): string {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'default';
    }
  }

  hasStatusData(req: RequirementNode): boolean {
    if (!req) return false;
    return (req.status !== undefined && req.status !== 'not-assessed') ||
           (req.priority !== undefined && req.priority !== 'medium') ||
           (req.criticality !== undefined && req.criticality !== 'Medium');
  }

  formatStatus(status?: string): string {
    if (!status) return 'Not Assessed';
    return status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  formatPriority(priority?: string): string {
    if (!priority) return 'Low';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  getCriticalityLevel(criticality?: string): number {
    switch (criticality?.toLowerCase()) {
      case 'critical': return 5;
      case 'high': return 4;
      case 'medium': return 3;
      case 'low': return 2;
      case 'informational': return 1;
      default: return 0;
    }
  }

  critDots = [1, 2, 3, 4, 5];

  // --- Private helpers ---

  private calculateLevels(): void {
    const reqMap = new Map(this.requirements.map(r => [r.id, r]));
    this.requirements.forEach(req => {
      let level = 0;
      let currentId = req.parentId;
      const visited = new Set<string>();
      while (currentId && level < 10) {
        if (visited.has(currentId)) break;
        visited.add(currentId);
        const parent = reqMap.get(currentId);
        if (!parent) break;
        level++;
        currentId = parent.parentId;
      }
      req.level = level;
    });
  }

  private updateTreeData(): void {
    const treeData = this.buildTree(this.requirements);
    this.filteredRequirements = this.flattenTree(treeData);
    this.treeNodes = this.convertToTreeNodes(treeData);
  }

  private convertToTreeNodes(nodes: RequirementNode[]): NzTreeNodeOptions[] {
    return nodes.map(node => ({
      title: node.name,
      key: node.id,
      isLeaf: !node.children || node.children.length === 0,
      expanded: false,
      children: node.children ? this.convertToTreeNodes(node.children) : [],
      id: node.id,
      status: node.status,
      refId: node.refId,
      description: node.description,
      parentId: node.parentId,
      frameworkId: node.frameworkId,
      level: node.level,
      priority: node.priority,
      criticality: node.criticality,
      significance: node.significance,
      implementationGuidance: node.implementationGuidance,
      testingProcedures: node.testingProcedures,
      mappings: node.mappings,
    }));
  }

  private buildTree(items: RequirementNode[]): RequirementNode[] {
    const itemMap = new Map<string, RequirementNode>();
    const roots: RequirementNode[] = [];
    items.forEach(item => itemMap.set(item.id, { ...item, children: [] }));
    itemMap.forEach(item => {
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(item);
      } else {
        roots.push(item);
      }
    });
    return roots;
  }

  private flattenTree(nodes: RequirementNode[]): RequirementNode[] {
    const result: RequirementNode[] = [];
    const flatten = (items: RequirementNode[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.children?.length) flatten(item.children);
      });
    };
    flatten(nodes);
    return result;
  }

  private performSearch(term: string): void {
    if (!term.trim()) {
      this.updateTreeData();
      return;
    }
    const search = term.toLowerCase();
    const filtered = this.requirements.filter(req =>
      req.name.toLowerCase().includes(search) ||
      (req.description?.toLowerCase().includes(search)) ||
      (req.refId?.toLowerCase().includes(search))
    );
    this.filteredRequirements = filtered;
    this.treeNodes = this.convertToTreeNodes(this.buildTree(filtered));
    if (term.trim()) this.isExpandAll = true;
  }

  private computeRelatedControls(node: RequirementNode): RequirementNode[] {
    if (!node) return [];
    const related: RequirementNode[] = [];
    if (node.parentId) {
      const parent = this.requirements.find(r => r.id === node.parentId);
      if (parent) related.push(parent);
      const siblings = this.requirements.filter(r => r.parentId === node.parentId && r.id !== node.id);
      related.push(...siblings.slice(0, 3));
    }
    return related.slice(0, 4);
  }
}
