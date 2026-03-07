import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription, debounceTime } from 'rxjs';
import { NzGraphComponent } from 'ng-zorro-antd/graph';
import { NzGraphData } from 'ng-zorro-antd/graph';
import { RfcNetworkGraphVO, GraphNode, GraphEdge, RfcRiskRule, RfcConnectionVO, RfcMonitoringService } from './rfc-monitoring.service';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'clean';

interface ProcessedNode {
  id: string;
  label: string;
  type: string;
  zone: 'internal' | 'external';
  riskLevel: RiskLevel;
  connectionCount: number;
  sapSystemId?: number;
  violatedRules: RfcRiskRule[];
  riskCounts: { critical: number; high: number; medium: number; low: number };
}

interface ProcessedEdge {
  v: string;
  w: string;
  label: string;
  type: string;
  count: number;
  riskLevel: RiskLevel;
  violatedRules: RfcRiskRule[];
  connections: RfcConnectionVO[];
}

interface RiskStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  clean: number;
}

@Component({
  standalone: false,
  selector: 'app-rfc-network-graph',
  templateUrl: './rfc-network-graph.component.html',
  styleUrls: ['./rfc-network-graph.component.scss'],
})
export class RfcNetworkGraphComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('nzGraph') nzGraphRef!: NzGraphComponent;

  @Input() graphData!: RfcNetworkGraphVO;
  @Input() riskRules: RfcRiskRule[] = [];
  @Input() connections: RfcConnectionVO[] = [];
  @Output() nodeClick = new EventEmitter<any>();
  @Output() edgeClick = new EventEmitter<any>();

  graphDataSource!: NzGraphData;
  rankDirection: 'LR' | 'TB' = 'LR';

  // Processed data maps for template lookups
  nodeMap = new Map<string, ProcessedNode>();
  edgeMap = new Map<string, ProcessedEdge>();

  // Selection
  selectedNode: ProcessedNode | null = null;
  selectedEdge: ProcessedEdge | null = null;

  // Filters
  systemFilter = new FormControl<string[]>([]);
  riskLevelFilter = new FormControl<string[]>([]);
  showOnlyViolations = false;

  availableSystems: { id: string; label: string }[] = [];
  riskLevels = [
    { value: 'critical', label: 'Critical', color: '#dc2626' },
    { value: 'high', label: 'High', color: '#ea580c' },
    { value: 'medium', label: 'Medium', color: '#ca8a04' },
    { value: 'low', label: 'Low', color: '#2563eb' },
    { value: 'clean', label: 'Clean', color: '#6b7280' },
  ];

  riskStats: RiskStats = { total: 0, critical: 0, high: 0, medium: 0, low: 0, clean: 0 };

  riskColors: { [key: string]: string } = {
    critical: '#dc2626', high: '#ea580c', medium: '#ca8a04',
    low: '#2563eb', clean: '#6b7280',
  };

  // Edge colors (softer tones for lines)
  edgeColors: { [key: string]: string } = {
    critical: '#ff7875', high: '#ff9c6e', medium: '#ffd666',
    low: '#91caff', clean: '#bfbfbf',
  };

  typeLabels: { [key: string]: string } = {
    '3': 'RFC', 'H': 'HTTP', 'G': 'HTTP Ext', 'T': 'TCP/IP',
    'L': 'Logical', 'I': 'Internal', 'X': 'ABAP/CPI',
  };

  zoom = 1;

  layoutConfig = {
    layout: { nodeSep: 16, rankSep: 60, edgeSep: 8 },
    defaultNode: { width: 130, height: 28, labelOffset: 0, maxLabelWidth: 110 },
    defaultEdge: { type: 1 }, // 1 = curve (curveBasis)
  };

  private filterSubs: Subscription[] = [];

  constructor(
    private rfcMonitoringService: RfcMonitoringService,
    private elRef: ElementRef,
  ) {}

  ngOnInit(): void {
    if (this.riskRules.length === 0) {
      this.rfcMonitoringService.getEnabledRiskRules().subscribe({
        next: (resp) => {
          if (resp.success) {
            this.riskRules = resp.data || [];
            if (this.graphData) this.processGraphData();
          }
        },
      });
    }

    this.filterSubs.push(
      this.systemFilter.valueChanges.pipe(debounceTime(200)).subscribe(() => this.processGraphData()),
      this.riskLevelFilter.valueChanges.pipe(debounceTime(200)).subscribe(() => this.processGraphData()),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['graphData'] || changes['riskRules'] || changes['connections']) && this.graphData) {
      this.processGraphData();
    }
  }

  ngOnDestroy(): void {
    this.filterSubs.forEach(s => s.unsubscribe());
  }

  processGraphData(): void {
    if (!this.graphData) return;

    const nodes = this.graphData.nodes || [];
    const edges = this.graphData.edges || [];

    this.availableSystems = nodes
      .filter(n => n.type === 'sap_system')
      .map(n => ({ id: n.id, label: n.label }));

    // Process nodes
    this.nodeMap.clear();
    nodes.forEach(n => {
      this.nodeMap.set(n.id, {
        id: n.id,
        label: n.label,
        type: n.type,
        zone: n.type === 'sap_system' ? 'internal' : 'external',
        riskLevel: 'clean',
        connectionCount: n.connectionCount || 0,
        sapSystemId: n.sapSystemId,
        violatedRules: [],
        riskCounts: { critical: 0, high: 0, medium: 0, low: 0 },
      });
    });

    // Ensure connections is an array
    const conns = Array.isArray(this.connections) ? this.connections : [];

    // Process edges and apply risk classification
    this.edgeMap.clear();
    const processedEdges: ProcessedEdge[] = edges.map(e => {
      const pe: ProcessedEdge = {
        v: e.from, w: e.to, label: e.label, type: e.type,
        count: e.count || 1, riskLevel: 'clean',
        violatedRules: [], connections: [],
      };

      // Find matching connections
      const fromNode = this.nodeMap.get(e.from);
      const toNode = this.nodeMap.get(e.to);
      pe.connections = conns.filter(conn => {
        const matchesFrom = conn.sapSystemName === fromNode?.label || conn.sapSystemId?.toString() === e.from;
        const matchesTo = conn.targetHost === toNode?.label;
        return matchesFrom && matchesTo;
      });

      // Evaluate risk rules
      if (this.riskRules.length > 0) {
        this.riskRules.filter(r => r.isEnabled).forEach(rule => {
          if (this.evaluateRule(rule, pe.connections, toNode)) {
            pe.violatedRules.push(rule);
            const riskLevel = this.severityToRiskLevel(rule.severity);
            if (this.compareRisk(riskLevel, pe.riskLevel) > 0) {
              pe.riskLevel = riskLevel;
            }
          }
        });
      }

      // Propagate risk to nodes
      if (pe.riskLevel !== 'clean') {
        if (fromNode && this.compareRisk(pe.riskLevel, fromNode.riskLevel) > 0) {
          fromNode.riskLevel = pe.riskLevel;
          fromNode.violatedRules.push(...pe.violatedRules);
        }
        if (toNode && this.compareRisk(pe.riskLevel, toNode.riskLevel) > 0) {
          toNode.riskLevel = pe.riskLevel;
          toNode.violatedRules.push(...pe.violatedRules);
        }
        if (fromNode?.riskCounts) {
          fromNode.riskCounts[pe.riskLevel as keyof typeof fromNode.riskCounts]++;
        }
      }

      const edgeId = `${e.from}__${e.to}`;
      this.edgeMap.set(edgeId, pe);
      return pe;
    });

    // Calculate stats
    this.riskStats = { total: 0, critical: 0, high: 0, medium: 0, low: 0, clean: 0 };
    processedEdges.forEach(e => {
      this.riskStats.total += e.count;
      this.riskStats[e.riskLevel] += e.count;
    });

    // Apply filters
    const selectedSystems = this.systemFilter.value || [];
    const selectedRisk = this.riskLevelFilter.value || [];

    let filteredNodes = nodes;
    let filteredEdges = edges;

    if (selectedSystems.length > 0) {
      const connectedNodeIds = new Set<string>(selectedSystems);
      filteredEdges = edges.filter(e => {
        if (selectedSystems.includes(e.from) || selectedSystems.includes(e.to)) {
          connectedNodeIds.add(e.from);
          connectedNodeIds.add(e.to);
          return true;
        }
        return false;
      });
      filteredNodes = nodes.filter(n => connectedNodeIds.has(n.id));
    }

    if (selectedRisk.length > 0) {
      filteredEdges = filteredEdges.filter(e => {
        const pe = this.edgeMap.get(`${e.from}__${e.to}`);
        return pe && selectedRisk.includes(pe.riskLevel);
      });
      const edgeNodeIds = new Set<string>();
      filteredEdges.forEach(e => { edgeNodeIds.add(e.from); edgeNodeIds.add(e.to); });
      filteredNodes = filteredNodes.filter(n => edgeNodeIds.has(n.id) || n.type === 'sap_system');
    }

    if (this.showOnlyViolations) {
      filteredEdges = filteredEdges.filter(e => {
        const pe = this.edgeMap.get(`${e.from}__${e.to}`);
        return pe && pe.riskLevel !== 'clean';
      });
      const edgeNodeIds = new Set<string>();
      filteredEdges.forEach(e => { edgeNodeIds.add(e.from); edgeNodeIds.add(e.to); });
      filteredNodes = filteredNodes.filter(n => edgeNodeIds.has(n.id));
    }

    // Build nz-graph data (flat, no compound groups)
    const graphDef = {
      nodes: filteredNodes.map(n => {
        const nd = this.nodeMap.get(n.id);
        const count = nd?.connectionCount || 0;
        return { id: n.id, label: count > 0 ? `${n.label} [${count}]` : n.label };
      }),
      edges: filteredEdges.map(e => {
        const typeLabel = this.typeLabels[e.type] || e.type;
        const countStr = (e.count || 1) > 1 ? ` (${e.count})` : '';
        return { v: e.from, w: e.to, label: `${typeLabel}${countStr}` };
      }),
    };

    this.graphDataSource = new NzGraphData(graphDef);
  }

  onGraphRendered(): void {
    this.applyEdgeStyles();
    this.injectCustomMarkers();
  }

  /** Apply risk-level CSS classes to edge groups after render */
  private applyEdgeStyles(): void {
    const container = this.elRef.nativeElement as HTMLElement;
    const edgeGroups = container.querySelectorAll('.nz-graph-edge');
    edgeGroups.forEach((g: Element) => {
      const path = g.querySelector('path');
      if (!path) return;
      const v = path.getAttribute('data-v') || '';
      const w = path.getAttribute('data-w') || '';
      const edgeKey = `${v}__${w}`;
      const pe = this.edgeMap.get(edgeKey);
      if (pe) {
        g.classList.add(`edge-risk-${pe.riskLevel}`);
      }
    });
  }

  /** Inject custom SVG markers for each risk color into the graph's defs */
  private injectCustomMarkers(): void {
    const container = this.elRef.nativeElement as HTMLElement;
    const defs = container.querySelector('svg defs');
    if (!defs) return;

    // Only inject once
    if (defs.querySelector('#arrow-clean')) return;

    const levels: { name: string; color: string }[] = [
      { name: 'clean', color: '#bfbfbf' },
      { name: 'low', color: '#91caff' },
      { name: 'medium', color: '#ffd666' },
      { name: 'high', color: '#ff9c6e' },
      { name: 'critical', color: '#ff7875' },
    ];

    levels.forEach(({ name, color }) => {
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', `arrow-${name}`);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '6');
      marker.setAttribute('markerHeight', '6');
      marker.setAttribute('orient', 'auto');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
      path.setAttribute('fill', color);
      marker.appendChild(path);
      defs.appendChild(marker);
    });
  }

  // Edge template helpers
  private findEdge(edge: any): ProcessedEdge | undefined {
    // nz-graph edge has v/w as node names; try both key formats
    return this.edgeMap.get(`${edge.v}__${edge.w}`)
        || this.edgeMap.get(`${edge.v}--${edge.w}`);
  }

  getEdgeColor(edge: any): string {
    const pe = this.findEdge(edge);
    return pe ? this.edgeColors[pe.riskLevel] : '#bfbfbf';
  }

  getEdgeWidth(edge: any): string {
    const pe = this.findEdge(edge);
    if (!pe) return '1';
    // Base width by risk, scaled up by connection count
    const countBoost = Math.min(pe.count / 3, 1.5); // max +1.5px for high-count edges
    switch (pe.riskLevel) {
      case 'critical': return String(2.5 + countBoost);
      case 'high': return String(2 + countBoost);
      case 'medium': return String(1.5 + countBoost);
      case 'low': return String(1.2 + countBoost);
      default: return String(0.8 + countBoost * 0.5);
    }
  }

  getEdgeDash(edge: any): string | null {
    const pe = this.findEdge(edge);
    return pe?.riskLevel === 'critical' ? '6,3' : null;
  }

  getEdgeRiskLevel(edge: any): string {
    const pe = this.findEdge(edge);
    return pe?.riskLevel || 'clean';
  }

  getEdgeOpacity(edge: any): string {
    const pe = this.findEdge(edge);
    if (!pe) return '0.5';
    switch (pe.riskLevel) {
      case 'critical': return '1';
      case 'high': return '0.9';
      case 'medium': return '0.8';
      case 'low': return '0.7';
      default: return '0.4';
    }
  }

  onNodeClick(node: any): void {
    const processed = this.nodeMap.get(node.name || node.id);
    if (processed) {
      this.selectedNode = processed;
      this.selectedEdge = null;
      this.nodeClick.emit({ node: processed, sapSystemId: processed.sapSystemId, sapSystemName: processed.label });
    }
  }

  onEdgeClick(edge: any): void {
    const key = `${edge.v}__${edge.w}`;
    const processed = this.edgeMap.get(key);
    if (processed) {
      this.selectedEdge = processed;
      this.selectedNode = null;
      this.edgeClick.emit({ edge: processed });
    }
  }

  clearSelection(): void {
    this.selectedNode = null;
    this.selectedEdge = null;
  }

  fitCenter(): void {
    this.nzGraphRef?.fitCenter();
  }

  toggleViolationsOnly(): void {
    this.showOnlyViolations = !this.showOnlyViolations;
    this.processGraphData();
  }

  clearFilters(): void {
    this.systemFilter.reset([]);
    this.riskLevelFilter.reset([]);
    this.showOnlyViolations = false;
    this.processGraphData();
  }

  // Node template helpers
  getNodeData(node: any): ProcessedNode | undefined {
    return this.nodeMap.get(node.name || node.id);
  }

  getNodeFill(node: any): string {
    const nd = this.getNodeData(node);
    if (!nd) return '#ffffff';
    if (nd.type === 'sap_system') return '#e6f7ff';
    if (nd.riskLevel === 'critical') return '#fff1f0';
    if (nd.riskLevel === 'high') return '#fff7e6';
    if (nd.riskLevel === 'medium') return '#fffbe6';
    return '#ffffff';
  }

  getNodeStroke(node: any): string {
    const nd = this.getNodeData(node);
    if (!nd) return '#d9d9d9';
    if (nd.riskLevel !== 'clean') return this.riskColors[nd.riskLevel];
    if (nd.type === 'sap_system') return '#1890ff';
    return '#d9d9d9';
  }

  // Risk evaluation
  private evaluateRule(rule: RfcRiskRule, connections: RfcConnectionVO[], toNode: ProcessedNode | undefined): boolean {
    if (!rule.ruleConditions) return false;
    try {
      const conditions = JSON.parse(rule.ruleConditions);
      const conditionList = conditions.and || conditions.or || [conditions];
      const isAnd = !!conditions.and;

      for (const conn of connections) {
        const results = conditionList.map((c: any) => this.evalCondition(c, conn, toNode));
        if (isAnd && results.every((r: boolean) => r)) return true;
        if (!isAnd && results.some((r: boolean) => r)) return true;
      }

      if (connections.length === 0) {
        const results = conditionList.map((c: any) => this.evalCondition(c, null, toNode));
        if (isAnd && results.every((r: boolean) => r)) return true;
        if (!isAnd && results.some((r: boolean) => r)) return true;
      }
      return false;
    } catch { return false; }
  }

  private evalCondition(cond: any, conn: RfcConnectionVO | null, toNode: ProcessedNode | undefined): boolean {
    const op = (cond.operator || '').toLowerCase();
    let val: any;
    if (conn) {
      val = (conn as any)[cond.field];
    } else if (cond.field === 'isExternal') {
      val = toNode?.zone === 'external';
    }
    switch (op) {
      case 'equals': case '=': return val === cond.value;
      case 'not_equals': case '!=': return val !== cond.value;
      case 'in': return Array.isArray(cond.value) && cond.value.includes(val);
      case 'not_in': return Array.isArray(cond.value) && !cond.value.includes(val);
      default: return val === cond.value;
    }
  }

  private severityToRiskLevel(severity: string): RiskLevel {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'critical';
      case 'HIGH': return 'high';
      case 'MEDIUM': return 'medium';
      case 'LOW': return 'low';
      default: return 'clean';
    }
  }

  private compareRisk(a: RiskLevel, b: RiskLevel): number {
    const order: { [k: string]: number } = { critical: 4, high: 3, medium: 2, low: 1, clean: 0 };
    return (order[a] || 0) - (order[b] || 0);
  }

  getRiskLabel(level: RiskLevel): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  getTypeLabel(type: string): string {
    return this.typeLabels[type] || type;
  }

  getSeverityTagColor(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'volcano';
      case 'MEDIUM': return 'orange';
      case 'LOW': return 'blue';
      default: return 'default';
    }
  }
}
