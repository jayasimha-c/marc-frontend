import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

interface FlowNode {
  id: string;
  type: 'system' | 'table' | 'join' | 'extraction-filter' | 'rule-filter' | 'result';
  label: string;
  subLabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data?: any;
  inputs?: string[];
  outputs?: string[];
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'data' | 'filter' | 'join';
}

@Component({
  standalone: false,
  selector: 'app-query-flow-visualizer',
  templateUrl: './query-flow-visualizer.component.html',
  styleUrls: ['./query-flow-visualizer.component.scss'],
})
export class QueryFlowVisualizerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('svgContainer', { static: false }) svgContainer!: ElementRef<SVGElement>;

  @Input() queryData: any;
  @Input() editable = false;

  nodes: FlowNode[] = [];
  edges: FlowEdge[] = [];

  selectedNode: FlowNode | null = null;
  hoveredNode: FlowNode | null = null;

  isDragging = false;
  draggedNode: FlowNode | null = null;
  dragOffset = { x: 0, y: 0 };

  canvasWidth = 1400;
  canvasHeight = 700;

  zoom = 1;
  panX = 0;
  panY = 0;

  private destroy$ = new Subject<void>();

  nodeStyles: Record<string, { color: string; icon: string; width: number; height: number }> = {
    system: { color: '#1890ff', icon: 'cloud-server', width: 180, height: 60 },
    table: { color: '#52c41a', icon: 'table', width: 200, height: 80 },
    join: { color: '#722ed1', icon: 'link', width: 160, height: 60 },
    'extraction-filter': { color: '#ff4d4f', icon: 'filter', width: 180, height: 70 },
    'rule-filter': { color: '#fa8c16', icon: 'audit', width: 180, height: 70 },
    result: { color: '#13c2c2', icon: 'bar-chart', width: 160, height: 60 },
  };

  ngOnInit(): void {
    if (this.queryData) {
      this.buildFlowFromQuery();
    }
  }

  ngAfterViewInit(): void {
    this.setupEventListeners();
    setTimeout(() => {
      if (this.nodes.length > 0) {
        this.fitToView();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildFlowFromQuery(): void {
    this.nodes = [];
    this.edges = [];

    let yPosition = 100;
    const xCenter = this.canvasWidth / 2;
    const nodeSpacing = 140;

    if (this.queryData?.system) {
      this.nodes.push({
        id: 'system-1',
        type: 'system',
        label: 'SAP System',
        subLabel: this.queryData.system.name,
        x: xCenter - 90,
        y: yPosition,
        width: this.nodeStyles['system'].width,
        height: this.nodeStyles['system'].height,
        outputs: ['table-1'],
      });
      yPosition += nodeSpacing;
    }

    if (this.queryData?.table) {
      this.nodes.push({
        id: 'table-1',
        type: 'table',
        label: this.queryData.table.tableName,
        subLabel: `${this.queryData.selectedFields?.length || 0} fields selected`,
        x: xCenter - 100,
        y: yPosition,
        width: this.nodeStyles['table'].width,
        height: this.nodeStyles['table'].height,
        inputs: ['system-1'],
        outputs: ['extraction-filter-1', 'join-1'],
        data: { fields: this.queryData.selectedFields },
      });
      this.edges.push({ id: 'edge-1', source: 'system-1', target: 'table-1', type: 'data' });
      yPosition += nodeSpacing;
    }

    if (this.queryData?.joinConfig?.targetTable) {
      this.nodes.push({
        id: 'join-1',
        type: 'join',
        label: 'Table Join',
        subLabel: this.queryData.joinConfig.targetTable.tableName,
        x: xCenter + 250,
        y: yPosition - nodeSpacing,
        width: this.nodeStyles['join'].width,
        height: this.nodeStyles['join'].height,
        inputs: ['table-1'],
        outputs: ['extraction-filter-1'],
        data: this.queryData.joinConfig,
      });
      this.nodes.push({
        id: 'table-2',
        type: 'table',
        label: this.queryData.joinConfig.targetTable.tableName,
        subLabel: `${this.queryData.joinConfig.selectedFields?.length || 0} fields`,
        x: xCenter + 450,
        y: yPosition - nodeSpacing,
        width: this.nodeStyles['table'].width,
        height: this.nodeStyles['table'].height,
        outputs: ['join-1'],
      });
      this.edges.push({
        id: 'edge-join-1',
        source: 'table-1',
        target: 'join-1',
        type: 'join',
        label: this.queryData.joinConfig.sourceField,
      });
      this.edges.push({
        id: 'edge-join-2',
        source: 'table-2',
        target: 'join-1',
        type: 'join',
        label: this.queryData.joinConfig.targetField,
      });
    }

    if (this.queryData?.extractionFilter && this.hasFilterRules(this.queryData.extractionFilter)) {
      this.nodes.push({
        id: 'extraction-filter-1',
        type: 'extraction-filter',
        label: 'Extraction Filter',
        subLabel: this.getFilterSummary(this.queryData.extractionFilter),
        x: xCenter - 90,
        y: yPosition,
        width: this.nodeStyles['extraction-filter'].width,
        height: this.nodeStyles['extraction-filter'].height,
        inputs: ['table-1', 'join-1'],
        outputs: ['rule-filter-1'],
        data: this.queryData.extractionFilter,
      });
      if (this.queryData?.joinConfig?.targetTable) {
        this.edges.push({ id: 'edge-extraction-1', source: 'join-1', target: 'extraction-filter-1', type: 'filter' });
      } else {
        this.edges.push({ id: 'edge-extraction-2', source: 'table-1', target: 'extraction-filter-1', type: 'filter' });
      }
      yPosition += nodeSpacing;
    }

    if (this.queryData?.ruleFilter && this.hasFilterRules(this.queryData.ruleFilter)) {
      this.nodes.push({
        id: 'rule-filter-1',
        type: 'rule-filter',
        label: 'Rule Filter',
        subLabel: this.getFilterSummary(this.queryData.ruleFilter),
        x: xCenter - 90,
        y: yPosition,
        width: this.nodeStyles['rule-filter'].width,
        height: this.nodeStyles['rule-filter'].height,
        inputs: ['extraction-filter-1'],
        outputs: ['result-1'],
        data: this.queryData.ruleFilter,
      });
      const prevNode = this.nodes.find((n) => n.type === 'extraction-filter') || this.nodes.find((n) => n.type === 'table');
      if (prevNode) {
        this.edges.push({ id: 'edge-rule-1', source: prevNode.id, target: 'rule-filter-1', type: 'filter' });
      }
      yPosition += nodeSpacing;
    }

    const resultNode: FlowNode = {
      id: 'result-1',
      type: 'result',
      label: 'Query Result',
      subLabel: 'Execute to see results',
      x: xCenter - 80,
      y: yPosition,
      width: this.nodeStyles['result'].width,
      height: this.nodeStyles['result'].height,
      inputs: ['rule-filter-1', 'extraction-filter-1', 'table-1'],
    };
    this.nodes.push(resultNode);

    const lastFilterNode =
      this.nodes.find((n) => n.type === 'rule-filter') ||
      this.nodes.find((n) => n.type === 'extraction-filter') ||
      this.nodes.find((n) => n.type === 'table');
    if (lastFilterNode) {
      this.edges.push({ id: 'edge-result-1', source: lastFilterNode.id, target: 'result-1', type: 'data' });
    }
  }

  hasFilterRules(filter: any): boolean {
    return filter?.rules?.length > 0 || filter?.condition;
  }

  getFilterSummary(filter: any): string {
    if (!filter || !filter.rules) return 'No rules';
    const ruleCount = this.countRules(filter);
    return `${ruleCount} rule${ruleCount !== 1 ? 's' : ''}`;
  }

  countRules(filter: any): number {
    if (!filter) return 0;
    let count = 0;
    if (filter.rules) {
      filter.rules.forEach((rule: any) => {
        count += rule.rules ? this.countRules(rule) : 1;
      });
    }
    return count;
  }

  setupEventListeners(): void {
    const svg = this.svgContainer?.nativeElement;
    if (!svg) return;
    svg.addEventListener('mousedown', this.onMouseDown.bind(this));
    svg.addEventListener('mousemove', this.onMouseMove.bind(this));
    svg.addEventListener('mouseup', this.onMouseUp.bind(this));
    svg.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    svg.addEventListener('wheel', this.onWheel.bind(this));
  }

  onMouseDown(event: MouseEvent): void {
    const point = this.getMousePosition(event);
    const node = this.getNodeAtPosition(point.x, point.y);
    if (node) {
      if (this.editable) {
        this.isDragging = true;
        this.draggedNode = node;
        this.dragOffset = { x: point.x - node.x, y: point.y - node.y };
      }
      this.selectedNode = node;
      event.preventDefault();
    }
  }

  onMouseMove(event: MouseEvent): void {
    const point = this.getMousePosition(event);
    if (this.isDragging && this.draggedNode) {
      this.draggedNode.x = point.x - this.dragOffset.x;
      this.draggedNode.y = point.y - this.dragOffset.y;
    } else {
      this.hoveredNode = this.getNodeAtPosition(point.x, point.y);
    }
  }

  onMouseUp(): void {
    this.isDragging = false;
    this.draggedNode = null;
  }

  onMouseLeave(): void {
    this.isDragging = false;
    this.draggedNode = null;
    this.hoveredNode = null;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    this.zoom = Math.max(0.5, Math.min(2, this.zoom * delta));
  }

  getMousePosition(event: MouseEvent): { x: number; y: number } {
    const svg = this.svgContainer.nativeElement;
    const rect = svg.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / this.zoom - this.panX,
      y: (event.clientY - rect.top) / this.zoom - this.panY,
    };
  }

  getNodeAtPosition(x: number, y: number): FlowNode | null {
    for (const node of this.nodes) {
      if (x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height) {
        return node;
      }
    }
    return null;
  }

  getNodeStyle(node: FlowNode): { fill: string; stroke: string; strokeWidth: number } {
    const style = this.nodeStyles[node.type];
    return {
      fill: style.color,
      stroke: this.selectedNode?.id === node.id ? '#096dd9' : this.hoveredNode?.id === node.id ? '#40a9ff' : style.color,
      strokeWidth: this.selectedNode?.id === node.id ? 3 : this.hoveredNode?.id === node.id ? 2 : 1,
    };
  }

  getEdgePath(edge: FlowEdge): string {
    const source = this.nodes.find((n) => n.id === edge.source);
    const target = this.nodes.find((n) => n.id === edge.target);
    if (!source || !target) return '';
    const startX = source.x + source.width / 2;
    const startY = source.y + source.height;
    const endX = target.x + target.width / 2;
    const endY = target.y;
    const controlY = (startY + endY) / 2;
    return `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`;
  }

  getEdgeLabelX(edge: FlowEdge): number {
    const source = this.nodes.find((n) => n.id === edge.source);
    const target = this.nodes.find((n) => n.id === edge.target);
    if (!source || !target) return 0;
    return (source.x + target.x) / 2 + source.width / 4;
  }

  getEdgeLabelY(edge: FlowEdge): number {
    const source = this.nodes.find((n) => n.id === edge.source);
    const target = this.nodes.find((n) => n.id === edge.target);
    if (!source || !target) return 0;
    return (source.y + target.y) / 2 + source.height / 2;
  }

  getFieldsPreview(fields: any[]): string {
    if (!fields || fields.length === 0) return '';
    const preview = fields.slice(0, 3).map((f: any) => f.fieldName).join(', ');
    return fields.length > 3 ? `${preview}...` : preview;
  }

  exportAsImage(): void {
    const svg = this.svgContainer.nativeElement;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = 'query-flow.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }

  resetView(): void {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
  }

  fitToView(): void {
    if (this.nodes.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });
    const padding = 50;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    const zoomX = this.canvasWidth / contentWidth;
    const zoomY = this.canvasHeight / contentHeight;
    this.zoom = Math.min(zoomX, zoomY, 1.5);
    this.panX = (this.canvasWidth - contentWidth * this.zoom) / (2 * this.zoom);
    this.panY = (this.canvasHeight - contentHeight * this.zoom) / (2 * this.zoom);
  }

  zoomIn(): void {
    this.zoom = Math.min(2, this.zoom * 1.2);
  }

  zoomOut(): void {
    this.zoom = Math.max(0.5, this.zoom * 0.8);
  }
}
