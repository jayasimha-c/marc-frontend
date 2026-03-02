import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, startWith, tap } from 'rxjs/operators';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ActivatedRoute, Router } from '@angular/router';
import { AddFilterDialogComponent } from './add-filter-dialog/add-filter-dialog.component';
import { SaveQueryDialogComponent } from './save-query-dialog/save-query-dialog.component';
import {
  convertVisualQBQueryToICM, convertICMRuleSetToJSON, generateSQLFromICMRuleSet,
  ICMExtendedRuleSet, convertVisualQBJoinsToICM, convertICMRuleSetToVisualQB,
} from './visual-qb-to-icm-utils';
import { VisualQueryBuilderService } from './visual-query-builder.service';
import { NotificationService } from '../../../core/services/notification.service';

declare var jsPlumb: any;

interface SAPTable {
  id: string | number; name?: string; tableName?: string;
  description: string; module?: string; fields: SAPField[];
}
interface SAPField {
  fieldName: string; formattedFieldName?: string; fieldType: string;
  description: string; isKey?: boolean; id?: number;
}
interface TableNode {
  id: string; table: any; position: { x: number; y: number };
  selectedFields: string[]; filters?: any[];
  extractionFilters?: FilterQuery; ruleFilters?: FilterQuery;
  elementId?: string; fieldSearchTerm?: string; filteredFields?: any[];
}
interface FilterQuery { condition: 'AND' | 'OR'; rules: FilterRule[]; }
interface FilterRule {
  field: string; operator: string; value: any; value2?: any; type?: string;
  function?: string; param1?: any; param2?: any;
  condition?: 'AND' | 'OR'; rules?: FilterRule[];
}
interface TableJoin {
  sourceTable: string; sourceField: string; targetTable: string; targetField: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  selectedFields?: string[]; connection?: any;
}

@Component({
  standalone: false,
  selector: 'app-visual-query-builder',
  templateUrl: './visual-query-builder.component.html',
  styleUrls: ['./visual-query-builder.component.scss'],
})
export class VisualQueryBuilderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef;

  private jsPlumbInstance: any;
  private destroy$ = new Subject<void>();

  leftPanelWidth = 360;
  private isResizing = false;
  private startX = 0;
  private startWidth = 0;

  isLeftPanelCollapsed = false;
  isRightPanelCollapsed = false;

  public availableTables: Array<any> = [];
  modules = ['ALL', 'FI', 'MM', 'SD'];
  selectedModule = 'ALL';
  searchTerm = '';
  filteredTables: Array<any> = [];
  searchControl = new FormControl('');
  isFiltering = false;

  canvasTables: TableNode[] = [];
  connections: TableJoin[] = [];
  selectedTable: TableNode | null = null;
  selectedConnection: any = null;

  generatedSQL = '';
  generatedExtractionJSON = '';
  generatedRuleJSON = '';
  generatedExtractionSQL = '';
  generatedRuleSQL = '';
  generatedJoinsJSON = '';
  finalICMJSON = '';
  finalICMData: any = null;

  operators = {
    string: ['=', '!=', 'LIKE', 'NOT LIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'],
    number: ['=', '!=', '>', '<', '>=', '<=', 'BETWEEN', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'],
    date: ['=', '!=', '>', '<', '>=', '<=', 'BETWEEN', 'IS NULL', 'IS NOT NULL'],
  };

  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuNode: TableNode | null = null;
  contextMenuField: SAPField | null = null;
  refreshingTableId: any = null;

  isEditMode = false;
  ruleId: number | null = null;
  existingRuleData: any = null;
  public selectedSapSystem: any;
  public sapSystemList: Array<any> = [];

  constructor(
    private nzModal: NzModalService,
    private vqbService: VisualQueryBuilderService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
  ) {}

  @HostListener('document:click') onDocumentClick(): void { this.contextMenuVisible = false; }
  @HostListener('document:keydown.escape') onEscapeKey(): void { this.contextMenuVisible = false; }

  ngOnInit(): void {
    this.setupTableSearchFiltering();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.ruleId = +params['id'];
        this.isEditMode = true;
        this.getSapSystemList(() => { this.loadExistingRule(this.ruleId!); });
      } else {
        this.getSapSystemList();
      }
    });
  }

  onSapSystemSelect(system: any): void {
    this.selectedSapSystem = system;
    this.getAvailableTableListData();
  }

  ngAfterViewInit(): void {
    this.setupCanvasEvents();
    setTimeout(() => { this.initializeJsPlumb(); }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.jsPlumbInstance) this.jsPlumbInstance.reset();
    this.onMouseUp();
  }

  initializeJsPlumb(): void {
    if (typeof jsPlumb === 'undefined') { setTimeout(() => this.initializeJsPlumb(), 500); return; }
    jsPlumb.ready(() => {
      this.jsPlumbInstance = jsPlumb.getInstance({
        Container: 'canvas-container',
        DragOptions: { cursor: 'pointer', zIndex: 2000 },
        ConnectionOverlays: [
          ['Arrow', { location: 1, visible: true, width: 11, length: 11, id: 'ARROW' }],
          ['Label', { label: 'Join', id: 'label', cssClass: 'connection-label' }],
        ],
        Endpoint: ['Dot', { radius: 4 }],
        Connector: ['Bezier', { curviness: 50 }],
        PaintStyle: { strokeWidth: 2, stroke: '#1890ff' },
        HoverPaintStyle: { strokeWidth: 3, stroke: '#096dd9' },
      });
      this.jsPlumbInstance.bind('connection', (info: any) => { this.onConnectionCreated(info); });
      this.jsPlumbInstance.bind('connectionDetached', (info: any) => { this.onConnectionRemoved(info); });
      this.jsPlumbInstance.bind('click', (connection: any) => { this.onConnectionClick(connection); });
    });
  }

  setupCanvasEvents(): void {
    const canvas = document.getElementById('canvas-container');
    if (!canvas) { setTimeout(() => this.setupCanvasEvents(), 100); }
  }

  applyFilters(): void {
    let filtered = this.availableTables;
    if (this.selectedModule !== 'ALL') filtered = filtered.filter(t => t.module === this.selectedModule);
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => t.name?.toLowerCase().includes(term) || t.description?.toLowerCase().includes(term));
    }
    this.filteredTables = filtered;
  }

  onDragStart(event: DragEvent, table: SAPTable): void {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      const json = JSON.stringify(table);
      event.dataTransfer.setData('text/plain', json);
      event.dataTransfer.setData('application/json', json);
      (event.target as HTMLElement).style.opacity = '0.5';
    }
  }

  onDragEnd(event: DragEvent): void { (event.target as HTMLElement).style.opacity = '1'; }

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault(); event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }

  onCanvasDragLeave(event: DragEvent): void {
    event.preventDefault(); event.stopPropagation();
    const canvas = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as HTMLElement;
    if (!related || !canvas.contains(related)) canvas.classList.remove('drag-over');
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault(); event.stopPropagation();
    const canvas = event.currentTarget as HTMLElement;
    canvas.classList.remove('drag-over');
    if (event.dataTransfer) {
      const data = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
      if (data) {
        try {
          const table = JSON.parse(data);
          const rect = canvas.getBoundingClientRect();
          this.addTableToCanvas(table, event.clientX - rect.left, event.clientY - rect.top);
        } catch {}
      }
    }
  }

  addTableToCanvas(table: SAPTable, x: number, y: number): void {
    if (this.canvasTables.length >= 5) {
      this.notificationService.warn('Maximum of 5 tables allowed.');
      return;
    }
    const nameCheck = table.tableName || table.name;
    if (this.canvasTables.some(n => (n.table.tableName || n.table.name) === nameCheck || n.table.id === table.id)) {
      this.notificationService.warn(`Table "${nameCheck}" is already on the canvas.`);
      return;
    }
    const nodeId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const elementId = `node-${nodeId}`;
    this.canvasTables.push({ id: nodeId, table, position: { x, y }, selectedFields: [], elementId });
    setTimeout(() => {
      if (document.getElementById(elementId)) {
        this.makeTableDraggable(elementId);
        this.setupTableEndpoints(elementId, table);
      }
    }, 200);
    this.generateQuery();
  }

  makeTableDraggable(elementId: string): void {
    if (!this.jsPlumbInstance) { setTimeout(() => this.makeTableDraggable(elementId), 500); return; }
    const el = document.getElementById(elementId);
    if (el) {
      this.jsPlumbInstance.draggable(el, {
        containment: 'parent', grid: [10, 10],
        stop: (p: any) => {
          const node = this.canvasTables.find(t => t.elementId === elementId);
          if (node) node.position = { x: p.pos[0], y: p.pos[1] };
        },
      });
    }
  }

  setupTableEndpoints(elementId: string, _table: SAPTable): void {
    if (!this.jsPlumbInstance) { setTimeout(() => this.setupTableEndpoints(elementId, _table), 500); return; }
    const el = document.getElementById(elementId);
    if (!el) return;
    this.jsPlumbInstance.addEndpoint(el, {
      anchor: 'Right', isSource: true, maxConnections: -1,
      endpoint: ['Dot', { radius: 4 }],
      paintStyle: { fill: '#1890ff', stroke: '#096dd9', strokeWidth: 2 },
    });
    this.jsPlumbInstance.addEndpoint(el, {
      anchor: 'Left', isTarget: true, maxConnections: -1,
      endpoint: ['Dot', { radius: 4 }],
      paintStyle: { fill: '#1890ff', stroke: '#096dd9', strokeWidth: 2 },
    });
  }

  onTableClick(node: TableNode): void { this.selectedTable = node; this.selectedConnection = null; }

  toggleFieldSelection(node: TableNode, fieldName: string): void {
    const idx = node.selectedFields.indexOf(fieldName);
    if (idx > -1) node.selectedFields.splice(idx, 1);
    else node.selectedFields.push(fieldName);
    this.connections.forEach(join => {
      if (join.targetTable === node.table.tableName) join.selectedFields = [...node.selectedFields];
    });
    this.generateQuery();
  }

  removeTable(node: TableNode): void {
    if (node.elementId) this.jsPlumbInstance.remove(node.elementId);
    const idx = this.canvasTables.indexOf(node);
    if (idx > -1) this.canvasTables.splice(idx, 1);
    const name = node.table.tableName || node.table.name;
    this.connections = this.connections.filter(c => c.sourceTable !== name && c.targetTable !== name);
    if (this.selectedTable === node) this.selectedTable = null;
    this.generateQuery();
  }

  onConnectionCreated(info: any): void {
    const srcNode = this.canvasTables.find(t => t.elementId === info.source.id);
    const tgtNode = this.canvasTables.find(t => t.elementId === info.target.id);
    if (srcNode && tgtNode) {
      const common = this.findCommonFields(srcNode.table, tgtNode.table);
      const join: TableJoin = {
        sourceTable: srcNode.table.tableName, sourceField: common.source || '',
        targetTable: tgtNode.table.tableName, targetField: common.target || '',
        joinType: 'INNER', selectedFields: [...tgtNode.selectedFields], connection: info.connection,
      };
      this.connections.push(join);
      if (common.source && common.target) {
        info.connection.getOverlay('label').setLabel(`${common.source} = ${common.target}`);
      } else {
        info.connection.getOverlay('label').setLabel('Click to configure');
      }
      this.generateQuery();
    }
  }

  onConnectionRemoved(info: any): void {
    const srcNode = this.canvasTables.find(t => t.elementId === info.source.id);
    const tgtNode = this.canvasTables.find(t => t.elementId === info.target.id);
    if (srcNode && tgtNode) {
      const srcName = srcNode.table.tableName || srcNode.table.name;
      const tgtName = tgtNode.table.tableName || tgtNode.table.name;
      const removed = this.connections.find(c => c.sourceTable === srcName && c.targetTable === tgtName);
      this.connections = this.connections.filter(c => !(c.sourceTable === srcName && c.targetTable === tgtName));
      if (removed && tgtNode) this.cleanupRuleFiltersForRemovedTable(tgtNode);
      this.generateQuery();
    }
  }

  private cleanupRuleFiltersForRemovedTable(removedNode: TableNode): void {
    const removedFields = removedNode.table.fields.map((f: any) => f.fieldName);
    this.canvasTables.forEach(node => {
      if (node.ruleFilters?.rules) {
        node.ruleFilters.rules = node.ruleFilters.rules.filter(r => !removedFields.includes(r.field));
      }
    });
  }

  onConnectionClick(connection: any): void {
    const join = this.connections.find(j => j.connection === connection);
    if (join) { this.selectedConnection = join; this.selectedTable = null; }
  }

  findCommonFields(t1: SAPTable, t2: SAPTable): { source: string | null; target: string | null } {
    for (const f1 of t1.fields) {
      for (const f2 of t2.fields) {
        if (f1.fieldName === f2.fieldName && f1.isKey) return { source: f1.fieldName, target: f2.fieldName };
      }
    }
    const known: any = {
      'BKPF-BSEG': { source: 'BELNR', target: 'BELNR' },
      'VBAK-VBAP': { source: 'VBELN', target: 'VBELN' },
      'EKKO-EKPO': { source: 'EBELN', target: 'EBELN' },
      'MARA-MAKT': { source: 'MATNR', target: 'MATNR' },
    };
    const key = `${t1.name}-${t2.name}`;
    const rev = `${t2.name}-${t1.name}`;
    if (known[key]) return known[key];
    if (known[rev]) return { source: known[rev].target, target: known[rev].source };
    return { source: null, target: null };
  }

  updateJoinFields(join: TableJoin, src: string, tgt: string): void {
    join.sourceField = src; join.targetField = tgt;
    if (join.connection) join.connection.getOverlay('label').setLabel(`${src} = ${tgt}`);
    this.generateQuery();
  }

  updateJoinType(join: TableJoin, type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'): void {
    join.joinType = type; this.generateQuery();
  }

  getSourceTableNode(join: TableJoin): TableNode | undefined {
    return this.canvasTables.find(t => t.table.tableName === join.sourceTable);
  }

  getTargetTableNode(join: TableJoin): TableNode | undefined {
    return this.canvasTables.find(t => t.table.tableName === join.targetTable);
  }

  toggleLeftPanel(): void { this.isLeftPanelCollapsed = !this.isLeftPanelCollapsed; }
  toggleRightPanel(): void { this.isRightPanelCollapsed = !this.isRightPanelCollapsed; }

  addExtractionFilter(rule: FilterRule): void {
    if (this.selectedTable?.extractionFilters) { this.selectedTable.extractionFilters.rules.push(rule); this.generateQuery(); }
  }

  addRuleFilter(rule: FilterRule): void {
    if (this.selectedTable?.ruleFilters) { this.selectedTable.ruleFilters.rules.push(rule); this.generateQuery(); }
  }

  removeExtractionFilter(i: number): void {
    if (this.selectedTable?.extractionFilters) { this.selectedTable.extractionFilters.rules.splice(i, 1); this.generateQuery(); }
  }

  removeRuleFilter(i: number): void {
    if (this.selectedTable?.ruleFilters) { this.selectedTable.ruleFilters.rules.splice(i, 1); this.generateQuery(); }
  }

  removeExtractionFilterFromNode(node: TableNode, i: number): void {
    if (node.extractionFilters?.rules) { node.extractionFilters.rules.splice(i, 1); this.generateQuery(); }
  }

  removeRuleFilterFromNode(node: TableNode, i: number): void {
    if (node.ruleFilters?.rules) { node.ruleFilters.rules.splice(i, 1); this.generateQuery(); }
  }

  // Context menu
  onFieldRightClick(event: MouseEvent, node: TableNode, field: SAPField): void {
    event.preventDefault(); event.stopPropagation();
    this.contextMenuNode = node; this.contextMenuField = field;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.contextMenuVisible = true;
  }

  hasFilterForField(node: TableNode | null, fieldName: string | undefined): boolean {
    if (!node || !fieldName) return false;
    if (node.extractionFilters?.rules?.some(r => r.field === fieldName)) return true;
    if (node.ruleFilters?.rules?.some(r => r.field === fieldName)) return true;
    if (node.filters?.some((f: any) => f.field === fieldName)) return true;
    return false;
  }

  getFilterTooltip(node: TableNode, fieldName: string): string {
    const tips: string[] = [];
    node.extractionFilters?.rules?.filter(r => r.field === fieldName)
      .forEach(r => tips.push(`Extraction: ${r.field} ${r.operator} ${this.safeValue(r.value)}`));
    node.ruleFilters?.rules?.filter(r => r.field === fieldName)
      .forEach(r => tips.push(`Rule: ${r.field} ${r.operator} ${this.safeValue(r.value)}`));
    return tips.join('\n');
  }

  private safeValue(v: any): string {
    if (!v) return '';
    const s = String(v);
    if (s.includes('GMT') || s.match(/\w{3}\s+\w{3}\s+\d{2}\s+\d{4}/)) {
      try { const d = new Date(v); if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; } catch {}
    }
    return s;
  }

  addExtractionFilterFromContext(): void { this.openFilterDialog('extraction'); }
  addRuleFilterFromContext(): void { this.openFilterDialog('rule'); }

  openFilterDialog(filterType: 'extraction' | 'rule'): void {
    if (!this.contextMenuNode || !this.contextMenuField) return;
    const fields = filterType === 'extraction'
      ? this.getAvailableFieldsForExtractionFilter(this.contextMenuNode)
      : this.getAvailableFieldsForRuleFilter(this.contextMenuNode);

    this.nzModal.create({
      nzTitle: filterType === 'extraction' ? 'Add Extraction Filter' : 'Add Rule Filter',
      nzContent: AddFilterDialogComponent,
      nzWidth: '750px', nzClassName: 'updated-modal',
      nzData: {
        fieldName: this.contextMenuField.fieldName, fieldType: this.contextMenuField.fieldType,
        tableName: this.contextMenuNode.table.name, filterType,
        availableFields: fields, formattedFieldName: this.contextMenuField.formattedFieldName,
      },
      nzFooter: null, nzBodyStyle: { maxHeight: '90vh', overflow: 'auto' },
    }).afterClose.subscribe(result => {
      if (result?.rule && this.contextMenuNode) {
        if (filterType === 'extraction') {
          if (!this.contextMenuNode.extractionFilters) this.contextMenuNode.extractionFilters = { condition: 'AND', rules: [] };
          this.contextMenuNode.extractionFilters.rules.push(result.rule);
        } else {
          if (!this.contextMenuNode.ruleFilters) this.contextMenuNode.ruleFilters = { condition: 'AND', rules: [] };
          this.contextMenuNode.ruleFilters.rules.push(result.rule);
        }
        this.generateQuery();
      }
      this.contextMenuVisible = false;
    });
  }

  viewFieldDetails(): void {
    if (this.contextMenuField) {
      this.notificationService.success(`${this.contextMenuField.fieldName} (${this.contextMenuField.fieldType}): ${this.contextMenuField.description || 'No description'}`);
    }
    this.contextMenuVisible = false;
  }

  clearFieldFilters(): void {
    if (!this.contextMenuNode || !this.contextMenuField) return;
    const fn = this.contextMenuField.fieldName;
    if (this.contextMenuNode.extractionFilters?.rules) this.contextMenuNode.extractionFilters.rules = this.contextMenuNode.extractionFilters.rules.filter(r => r.field !== fn);
    if (this.contextMenuNode.ruleFilters?.rules) this.contextMenuNode.ruleFilters.rules = this.contextMenuNode.ruleFilters.rules.filter(r => r.field !== fn);
    this.generateQuery(); this.contextMenuVisible = false;
  }

  isSourceTable(node: TableNode | null): boolean {
    if (!node) return false;
    if (this.connections.length === 0) return true;
    return !this.connections.some(c => c.targetTable === node.table.tableName);
  }

  getAvailableFieldsForExtractionFilter(node: TableNode): any[] {
    return node.table.fields.map((f: any) => ({
      name: f.fieldName, displayName: `${node.table.tableName}.${f.fieldName}`,
      type: f.fieldType, tableName: node.table.tableName,
      isKey: f.isKey, description: f.description, formattedFieldName: f.formattedFieldName,
    }));
  }

  getAvailableFieldsForRuleFilter(node: TableNode): any[] {
    const fields: any[] = [];
    node.selectedFields.forEach(fn => {
      const f = node.table.fields.find((ff: any) => ff.fieldName === fn);
      if (f) fields.push({ name: fn, type: f.fieldType, tableName: node.table.tableName, displayName: `${node.table.tableName}.${fn}`, description: f.description, formattedFieldName: f.formattedFieldName });
    });
    this.connections.forEach(join => {
      if (join.sourceTable === node.table.tableName) {
        const joined = this.canvasTables.find(t => t.table.tableName === join.targetTable);
        (join.selectedFields || []).forEach(fn => {
          const f = joined?.table.fields.find((ff: any) => ff.fieldName === fn);
          if (f && !fields.some(x => x.displayName === `${joined!.table.tableName}.${fn}`)) {
            fields.push({ name: fn, type: f.fieldType, tableName: joined!.table.tableName, displayName: `${joined!.table.tableName}.${fn}`, description: f.description, formattedFieldName: f.formattedFieldName });
          }
        });
      }
    });
    return fields;
  }

  // Query generation
  generateQuery(): void { this.generateSQL(); this.generateICMJSON(); }

  generateSQL(): void {
    if (this.canvasTables.length === 0) { this.generatedSQL = '-- Add tables to generate query'; return; }
    let sql = 'SELECT\n';
    const selects: string[] = [];
    this.canvasTables.forEach(n => n.selectedFields.forEach(f => selects.push(`  ${n.table.name || n.table.tableName}.${f}`)));
    sql += selects.join(',\n');
    sql += '\nFROM\n';
    if (this.canvasTables.length > 0) sql += `  ${this.canvasTables[0].table.name || this.canvasTables[0].table.tableName}`;
    this.connections.forEach(j => {
      sql += `\n${j.joinType} JOIN ${j.targetTable}`;
      if (j.sourceField && j.targetField) sql += ` ON ${j.sourceTable}.${j.sourceField} = ${j.targetTable}.${j.targetField}`;
    });
    const where: string[] = [];
    this.canvasTables.forEach(n => {
      if (n.extractionFilters?.rules.length) {
        const c = this.buildFilterConditions(n.extractionFilters, n.table.name || n.table.tableName);
        if (c) where.push(`(${c})`);
      }
      if (n.ruleFilters?.rules.length) {
        const c = this.buildFilterConditions(n.ruleFilters, n.table.name || n.table.tableName);
        if (c) where.push(`(${c})`);
      }
    });
    if (where.length > 0) sql += '\nWHERE\n' + where.join('\n  AND ');
    sql += ';';
    this.generatedSQL = sql;
  }

  private buildFilterConditions(fq: FilterQuery, tableName: string): string {
    if (!fq || fq.rules.length === 0) return '';
    const conds = fq.rules.map(rule => {
      if (rule.rules?.length) {
        const nested = rule.rules.map(r => this.buildSingleCondition(r, tableName)).join(` ${rule.condition || 'AND'} `);
        return `(${nested})`;
      }
      return this.buildSingleCondition(rule, tableName);
    });
    return conds.join(` ${fq.condition} `);
  }

  private buildSingleCondition(rule: FilterRule, tableName: string): string {
    let field = `${tableName}.${rule.field}`;
    if (rule.function) {
      if (['upper', 'lower', 'trim'].includes(rule.function)) field = `${rule.function.toUpperCase()}(${field})`;
      else if (rule.function === 'substr' && rule.param1 && rule.param2) field = `SUBSTRING(${field}, ${rule.param1}, ${rule.param2})`;
    }
    let value: any = rule.value;
    if (rule.function === 'current_date') value = 'CURRENT_DATE';
    else if (rule.function === 'current_date-1') value = 'CURRENT_DATE - INTERVAL 1 DAY';
    else if (rule.function === 'current_date-n' && rule.param1) value = `CURRENT_DATE - INTERVAL ${rule.param1} DAY`;
    else if (typeof value === 'string' && !['IS NULL', 'IS NOT NULL'].includes(rule.operator)) value = `'${value}'`;
    if (['IS NULL', 'IS NOT NULL'].includes(rule.operator)) return `${field} ${rule.operator}`;
    if (rule.operator === 'BETWEEN' && rule.value && rule.value2) return `${field} BETWEEN '${rule.value}' AND '${rule.value2}'`;
    return `${field} ${rule.operator} ${value}`;
  }

  clearCanvas(): void {
    this.canvasTables.forEach(n => { if (n.elementId) this.jsPlumbInstance.remove(n.elementId); });
    this.canvasTables = []; this.connections = []; this.selectedTable = null;
    this.generateQuery();
  }

  saveQuery(): void {
    this.generateQuery();
    if (this.canvasTables.length === 0) { this.notificationService.warn('Please add at least one table.'); return; }
    if (!this.selectedSapSystem?.id) { this.notificationService.warn('Please select a SAP system.'); return; }
    const src = this.canvasTables[0];
    if (!src?.table?.id) { this.notificationService.error('Table ID is missing. Please re-add the table.'); return; }

    const defaultName = this.isEditMode && this.existingRuleData ? this.existingRuleData.name : '';
    const defaultDesc = this.isEditMode && this.existingRuleData ? this.existingRuleData.description : '';

    this.nzModal.create({
      nzTitle: this.isEditMode ? 'Update Query' : 'Save Query',
      nzContent: SaveQueryDialogComponent,
      nzWidth: '600px', nzClassName: 'updated-modal',
      nzData: {
        finalJSON: this.finalICMJSON, extractionSQL: this.generatedExtractionSQL,
        ruleSQL: this.generatedRuleSQL,
        tableName: src.table.tableName || src.table.name || 'N/A',
        isEditMode: this.isEditMode, defaultName, defaultDescription: defaultDesc,
      },
      nzFooter: null, nzBodyStyle: { maxHeight: '90vh', overflow: 'auto' },
    }).afterClose.subscribe(result => {
      if (result?.confirmed && result?.queryDetails) {
        this.generateFinalICMJSON(result.queryDetails.name, result.queryDetails.description);
        const data = this.finalICMData;
        if (!data?.icmTable?.id) { this.notificationService.error('Cannot save: Table ID missing.'); return; }
        this.vqbService.saveRuleTemplate(data).subscribe({
          next: () => { this.notificationService.success('Query saved successfully.'); this.router.navigate(['/general/query-management']); },
          error: (err) => { this.notificationService.error(err?.error?.message || 'Failed to save query.'); },
        });
      }
    });
  }

  // Resize
  startResize(event: MouseEvent | TouchEvent): void {
    event.preventDefault(); this.isResizing = true;
    this.startX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.startWidth = this.leftPanelWidth;
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }
  private onMouseMove = (e: MouseEvent): void => { if (!this.isResizing) return; const w = this.startWidth + (e.clientX - this.startX); if (w >= 250 && w <= 600) this.leftPanelWidth = w; };
  private onMouseUp = (): void => { if (!this.isResizing) return; this.isResizing = false; document.removeEventListener('mousemove', this.onMouseMove); document.removeEventListener('mouseup', this.onMouseUp); };

  // ICM JSON generation
  generateICMJSON(): void {
    if (this.canvasTables.length === 0) { this.generatedExtractionJSON = ''; this.generatedRuleJSON = ''; this.generatedExtractionSQL = ''; this.generatedRuleSQL = ''; return; }
    const ext: ICMExtendedRuleSet[] = [];
    const rules: ICMExtendedRuleSet[] = [];
    this.canvasTables.forEach(node => {
      const fm = new Map<string, string>();
      node.table.fields.forEach((f: any) => fm.set(f.fieldName, f.fieldType));
      if (node.extractionFilters?.rules.length) ext.push(convertVisualQBQueryToICM(node.extractionFilters, node.table.tableName, fm));
      if (node.ruleFilters?.rules.length) rules.push(convertVisualQBQueryToICM(node.ruleFilters, node.table.tableName, fm));
    });
    if (ext.length > 0) {
      const combined: ICMExtendedRuleSet = { condition: 'AND', rules: ext.flatMap(f => f.rules) };
      this.generatedExtractionJSON = convertICMRuleSetToJSON(combined);
      this.generatedExtractionSQL = generateSQLFromICMRuleSet(combined, this.canvasTables[0]?.table.name || 'TABLE');
    } else { this.generatedExtractionJSON = '{"condition":"AND","rules":[]}'; this.generatedExtractionSQL = ''; }
    if (rules.length > 0) {
      const combined: ICMExtendedRuleSet = { condition: 'AND', rules: rules.flatMap(f => f.rules) };
      this.generatedRuleJSON = convertICMRuleSetToJSON(combined);
      this.generatedRuleSQL = generateSQLFromICMRuleSet(combined, this.canvasTables[0]?.table.name || 'TABLE');
    } else { this.generatedRuleJSON = '{"condition":"AND","rules":[]}'; this.generatedRuleSQL = ''; }
    if (this.connections.length > 0) {
      const map = new Map<string, { tableId: number; fields: Map<string, number>; selectedFields: string[] }>();
      this.canvasTables.forEach(n => {
        const fm = new Map<string, number>();
        n.table.fields.forEach((f: any) => fm.set(f.fieldName, f.id));
        map.set(n.table.tableName, { tableId: n.table.id, fields: fm, selectedFields: n.selectedFields || [] });
      });
      this.generatedJoinsJSON = JSON.stringify(convertVisualQBJoinsToICM(this.connections, map), null, 2);
    } else { this.generatedJoinsJSON = '[]'; }
    this.generateFinalICMJSON();
  }

  generateFinalICMJSON(ruleName?: string, ruleDesc?: string): void {
    if (this.canvasTables.length === 0) { this.finalICMJSON = '{}'; return; }
    const src = this.canvasTables[0];
    const map = new Map<string, { tableId: number; fields: Map<string, number>; selectedFields: string[] }>();
    this.canvasTables.forEach(n => {
      const fm = new Map<string, number>();
      n.table.fields.forEach((f: any) => fm.set(f.fieldName, f.id));
      map.set(n.table.tableName, { tableId: n.table.id, fields: fm, selectedFields: n.selectedFields || [] });
    });
    const icmJoins = this.connections.length > 0 ? convertVisualQBJoinsToICM(this.connections, map) : [];
    const fieldIds = (src.selectedFields || []).map(fn => { const f = src.table.fields.find((ff: any) => ff.fieldName === fn); return f ? { id: f.id } : null; }).filter(Boolean);
    let extObj: any = { condition: 'AND', rules: [] };
    let ruleObj: any = { condition: 'AND', rules: [] };
    try { if (this.generatedExtractionJSON) extObj = JSON.parse(this.generatedExtractionJSON); } catch {}
    try { if (this.generatedRuleJSON) ruleObj = JSON.parse(this.generatedRuleJSON); } catch {}
    const tableId = src.table.id;
    if (!tableId) { this.finalICMData = null; this.finalICMJSON = '{}'; return; }
    const final: any = {
      id: this.isEditMode && this.ruleId ? this.ruleId : null,
      name: ruleName || 'Visual Query Builder Rule',
      description: ruleDesc || 'Visual Query Builder Rule Desc',
      sqlFilter: this.generatedExtractionSQL || '',
      jsonFilter: JSON.stringify(extObj),
      sqlRule: this.generatedRuleSQL || '',
      jsonRule: JSON.stringify(ruleObj),
      icmTable: { id: tableId },
      fields: fieldIds,
      joins: icmJoins,
      sapSystemId: this.selectedSapSystem?.id || null,
    };
    if (this.existingRuleData) {
      if (this.existingRuleData.createdOn) final.createdOn = this.existingRuleData.createdOn;
      if (this.existingRuleData.createdBy) final.createdBy = this.existingRuleData.createdBy;
    }
    this.finalICMData = final;
    this.finalICMJSON = JSON.stringify(final, null, 2);
  }

  formatFilterDisplay(rule: FilterRule): string {
    const max = 50;
    let text = `${rule.field} ${rule.operator}`;
    if (!['IS NULL', 'IS NOT NULL'].includes(rule.operator)) {
      let val = this.safeValue(rule.value);
      if (val.length > max) {
        const parts = val.split(',').map(v => v.trim()).filter(v => v);
        val = parts.length > 3 ? `${parts.slice(0, 3).join(', ')}... (+${parts.length - 3} more)` : val.substring(0, max) + '...';
      }
      text += ` ${val}`;
    }
    return text;
  }

  // SAP API methods
  getAvailableTableListData(): void {
    if (this.selectedSapSystem) {
      this.vqbService.getTableListBySAPId(this.selectedSapSystem.id).subscribe({
        next: (res) => { this.availableTables = res.data.rows; this.filteredTables = this.availableTables; },
        error: () => { this.availableTables = []; },
      });
    }
  }

  refreshTable(table: any): void {
    if (!this.selectedSapSystem || !table?.id) { this.notificationService.warn('Please select a SAP system first.'); return; }
    this.refreshingTableId = table.id;
    const oldCount = table.fields?.length || 0;
    this.vqbService.refreshTableFromSAP(this.selectedSapSystem.id, table.id).subscribe({
      next: (res) => {
        const refreshed = res.data;
        const newCount = (refreshed.fields?.length || 0) - oldCount;
        const idx = this.availableTables.findIndex((t: any) => t.id === table.id);
        if (idx !== -1) this.availableTables[idx] = refreshed;
        const fIdx = this.filteredTables.findIndex((t: any) => t.id === table.id);
        if (fIdx !== -1) this.filteredTables[fIdx] = refreshed;
        this.canvasTables.forEach(n => { if (n.table.id === table.id) { const sel = [...n.selectedFields]; n.table = refreshed; n.selectedFields = sel; } });
        this.refreshingTableId = null;
        this.notificationService.success(newCount > 0 ? `Refreshed "${refreshed.tableName}": ${newCount} new field(s).` : `"${refreshed.tableName}" is up to date.`);
      },
      error: (err) => { this.refreshingTableId = null; this.notificationService.error(err?.error?.message || 'Failed to refresh table.'); },
    });
  }

  getSapSystemList(callback?: () => void): void {
    this.vqbService.getSAPSystemList().subscribe({
      next: (res) => { this.sapSystemList = res.data; if (callback) callback(); },
      error: () => { this.sapSystemList = []; },
    });
  }

  // Table search
  setupTableSearchFiltering(): void {
    this.searchControl.valueChanges.pipe(
      startWith(''), debounceTime(300),
      tap(value => {
        if (!value || (typeof value === 'string' && value.trim() === '')) this.filteredTables = this.availableTables;
        else this.filteredTables = this._filterLocally(value);
      }),
      takeUntil(this.destroy$),
    ).subscribe();
  }

  private _filterLocally(value: any): any[] {
    if (typeof value === 'object') return this.availableTables;
    if (!value?.trim()) return this.availableTables;
    const fv = value.toLowerCase();
    return this.availableTables.filter((o: any) =>
      o?.tableName?.toLowerCase().includes(fv) || o?.formattedTableName?.toLowerCase().includes(fv) || o?.description?.toLowerCase().includes(fv)
    );
  }

  onTableSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const val = this.searchControl.value;
      if (val?.trim()) { this.handleTableSearchEnterPress(val); event.preventDefault(); }
    }
  }

  handleTableSearchEnterPress(value: string): void {
    const match = this.availableTables.find((o: any) => o?.tableName?.toLowerCase() === value.toLowerCase());
    if (match) this.searchControl.setValue(match.tableName);
    else this.searchTable();
  }

  searchTable(): void {
    this.isFiltering = true;
    this.vqbService.getTableFullFromSAP(this.selectedSapSystem.id, null, this.searchControl.value).subscribe({
      next: (res) => {
        const existing = this.availableTables.findIndex((t: any) => t.id === res.id || t.tableName === res.tableName);
        if (existing === -1) this.availableTables.unshift(res);
        else this.availableTables[existing] = res;
        this.filteredTables = [res, ...this.availableTables.filter((t: any) => t.id !== res.id)];
        this.searchControl.setValue(res.tableName);
        this.isFiltering = false;
      },
      error: () => { this.isFiltering = false; this.notificationService.error('Failed to fetch table from SAP.'); },
    });
  }

  // Edit mode
  loadExistingRule(ruleId: number): void {
    this.vqbService.getRuleById(ruleId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.existingRuleData = res.data;
          if (this.existingRuleData.sapSystemId) {
            const sys = this.sapSystemList.find((s: any) => s.id === this.existingRuleData.sapSystemId);
            if (sys) {
              this.selectedSapSystem = sys;
              this.vqbService.getTableListBySAPId(sys.id).subscribe({
                next: (r) => {
                  this.availableTables = r.data.rows; this.filteredTables = this.availableTables;
                  setTimeout(() => this.populateBuilderFromRuleData(this.existingRuleData), 1000);
                },
                error: () => this.notificationService.error('Failed to load tables.'),
              });
            }
          }
        }
      },
      error: () => this.notificationService.error('Failed to load rule data.'),
    });
  }

  populateBuilderFromRuleData(ruleData: any): void {
    if (!ruleData.icmTable?.id) { this.notificationService.error('No associated table found.'); return; }
    const mainTable = this.availableTables.find((t: any) => t.id === ruleData.icmTable.id);
    if (!mainTable) { this.notificationService.error(`Table with ID ${ruleData.icmTable.id} not found.`); return; }
    this.addTableToCanvas(mainTable, 100, 100);
    setTimeout(() => {
      const node = this.canvasTables.find(n => n.table.id === ruleData.icmTable.id);
      if (node) {
        if (ruleData.jsonFilter) { try { node.extractionFilters = convertICMRuleSetToVisualQB(JSON.parse(ruleData.jsonFilter)); } catch {} }
        if (ruleData.jsonRule) { try { node.ruleFilters = convertICMRuleSetToVisualQB(JSON.parse(ruleData.jsonRule)); } catch {} }
        if (ruleData.fields?.length) {
          const ids = ruleData.fields.map((f: any) => f.id);
          node.selectedFields = mainTable.fields.filter((f: any) => ids.includes(f.id)).map((f: any) => f.fieldName);
        }
        if (ruleData.joins?.length) this.loadJoinsFromRuleData(ruleData.joins);
        this.generateQuery();
      }
    }, 500);
  }

  loadJoinsFromRuleData(joins: any[]): void {
    joins.forEach((join, i) => {
      const tgtData = join.targetTable || join.icmJoinedTable;
      if (!tgtData?.id) return;
      let tgt = this.availableTables.find((t: any) => t.id === tgtData.id);
      if (!tgt && tgtData) { tgt = tgtData; this.availableTables.push(tgt); }
      if (tgt) {
        setTimeout(() => {
          this.addTableToCanvas(tgt, 500 + i * 50, 100 + i * 50);
          setTimeout(() => this.createConnectionFromJoinData(join), 500);
        }, 500 * (i + 1));
      }
    });
  }

  createConnectionFromJoinData(joinData: any): void {
    const srcData = joinData.srcTable || joinData.icmTable;
    const tgtData = joinData.targetTable || joinData.icmJoinedTable;
    const srcFieldData = joinData.srcField || joinData.icmField;
    const tgtFieldData = joinData.targetField || joinData.icmJoinedField;
    const selFieldsData = joinData.fields || joinData.icmJoinedRuleFields;
    const srcNode = this.canvasTables.find(n => n.table.id === srcData?.id);
    const tgtNode = this.canvasTables.find(n => n.table.id === tgtData?.id);
    if (!srcNode || !tgtNode || !this.jsPlumbInstance) return;
    const srcField = srcNode.table.fields.find((f: any) => f.id === srcFieldData?.id);
    const tgtField = tgtNode.table.fields.find((f: any) => f.id === tgtFieldData?.id);
    if (!srcField || !tgtField) return;
    const conn = this.jsPlumbInstance.connect({ source: srcNode.elementId, target: tgtNode.elementId, anchors: ['Right', 'Left'] });
    const join: TableJoin = {
      sourceTable: srcNode.table.tableName, sourceField: srcField.fieldName,
      targetTable: tgtNode.table.tableName, targetField: tgtField.fieldName,
      joinType: joinData.joinType || 'INNER', selectedFields: [], connection: conn,
    };
    if (selFieldsData?.length) {
      const ids = selFieldsData.map((f: any) => f.id);
      join.selectedFields = tgtNode.table.fields.filter((f: any) => ids.includes(f.id)).map((f: any) => f.fieldName);
      tgtNode.selectedFields = [...join.selectedFields];
    }
    this.connections.push(join);
    if (conn) conn.getOverlay('label').setLabel(`${srcField.fieldName} = ${tgtField.fieldName}`);
    this.generateQuery();
  }

  // Field search / display helpers
  getFilteredFields(node: TableNode): any[] {
    if (!node.fieldSearchTerm?.trim()) return node.table.fields;
    const s = node.fieldSearchTerm.toLowerCase();
    return node.table.fields.filter((f: any) =>
      (f.fieldName || '').toLowerCase().includes(s) || (f.formattedFieldName || '').toLowerCase().includes(s) || (f.description || '').toLowerCase().includes(s)
    );
  }

  shouldUseTwoColumns(node: TableNode): boolean { return this.getFilteredFields(node).length > 6; }
  onFieldSearch(_node: TableNode): void { /* Reactive via getFilteredFields */ }
  clearFieldSearch(node: TableNode): void { node.fieldSearchTerm = ''; }
}
