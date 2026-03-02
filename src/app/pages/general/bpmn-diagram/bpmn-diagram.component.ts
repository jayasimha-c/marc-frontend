import { Component, ElementRef, ViewChild, AfterContentInit, OnDestroy } from '@angular/core';
import Modeler from 'bpmn-js/lib/Modeler';
import { from, Observable } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { saveAs } from 'file-saver';
import { GeneralService } from '../general.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SavedBpmnDiagramComponent } from './saved-bpmn-diagram.component';
import { SaveDiagramDialogComponent } from './save-diagram-dialog.component';
import { TableColumn } from '../../../shared/components/advanced-table/advanced-table.models';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-bpmn-diagram',
  templateUrl: './bpmn-diagram.component.html',
  styleUrls: ['./bpmn-diagram.component.scss'],
})
export class BpmnDiagramComponent implements AfterContentInit, OnDestroy {
  @ViewChild('bpmnModelerRef', { static: true }) private bpmnModelerRef!: ElementRef;

  private bpmnJS!: Modeler;

  diagramTitle = '';
  description = '';
  diagramId = -1;
  previewBpmnList: any[] = [];

  // Task click / rule mapping
  clickedElements: any[] = [];
  identifierList = new Set<string>();
  enableMultiSelect = true;
  rulesData: any[] = [];
  rulesTotal = 0;

  columns: TableColumn[] = [
    { field: 'ruleName', header: 'Rule Name', sortable: true },
    { field: 'ruleDescription', header: 'Description', sortable: true },
  ];

  private readonly newBpmnXml = `<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn"><bpmn2:process id="Process_1" isExecutable="false"><bpmn2:startEvent id="StartEvent_1"/></bpmn2:process><bpmndi:BPMNDiagram id="BPMNDiagram_1"><bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1"><bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1"><dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/></bpmndi:BPMNShape></bpmndi:BPMNPlane></bpmndi:BPMNDiagram></bpmn2:definitions>`;

  constructor(
    private generalService: GeneralService,
    private nzModal: NzModalService,
    private notificationService: NotificationService,
  ) {}

  ngAfterContentInit(): void {
    this.bpmnJS = new Modeler({
      container: this.bpmnModelerRef.nativeElement,
      palette: { twoColumn: true },
    });
    this.bpmnJS.attachTo(this.bpmnModelerRef.nativeElement);
    this.importDiagram(this.newBpmnXml);
    this.setupClickListeners();
    this.setupKeyboardListeners();
    this.loadBpmnList();
  }

  ngOnDestroy(): void {
    this.bpmnJS?.destroy();
  }

  // --- API ---

  loadBpmnList(): void {
    this.generalService.getPreviewBpmnList().subscribe({
      next: (resp) => {
        this.previewBpmnList = (resp.data || []).map((item: any) => ({
          ...item,
          imageUrl: `${environment.apiUrl}${item.svgPath}`,
        }));
      },
      error: (err) => this.notificationService.handleHttpError(err),
    });
  }

  // --- Diagram operations ---

  createNewDiagram(): void {
    this.diagramId = -1;
    this.diagramTitle = '';
    this.description = '';
    this.clearSelection();
    this.rulesData = [];
    this.loadDiagram(this.newBpmnXml);
  }

  openSavedBpmnDialog(): void {
    const modalRef = this.nzModal.create({
      nzTitle: 'Select Diagram',
      nzContent: SavedBpmnDiagramComponent,
      nzWidth: '50vw',
      nzClassName: 'updated-modal',
      nzBodyStyle: { height: '75vh', overflow: 'auto' },
      nzData: { bpmnList: this.previewBpmnList },
      nzFooter: null,
    });

    modalRef.afterClose.subscribe((bpmn: any) => {
      if (bpmn) {
        this.generalService.getBpmnXml(bpmn.xmlPath.substring(1)).subscribe({
          next: (xml) => {
            this.loadDiagram(xml);
            this.diagramTitle = bpmn.name;
            this.description = bpmn.description;
            this.diagramId = bpmn.id;
          },
          error: (err) => this.notificationService.handleHttpError(err),
        });
      }
    });
  }

  private loadDiagram(xml: string): void {
    this.bpmnJS.clear();
    this.importDiagram(xml).subscribe({
      next: () => this.fitDiagramToView(),
    });
  }

  private importDiagram(xml: string): Observable<{ warnings: any[] }> {
    return from(this.bpmnJS.importXML(xml) as Promise<{ warnings: any[] }>);
  }

  private fitDiagramToView(): void {
    try {
      const canvas = this.bpmnJS.get('canvas') as any;
      canvas.zoom('fit-viewport');
      const viewbox = canvas.viewbox();
      canvas.viewbox({
        x: viewbox.x - 200,
        y: viewbox.y,
        width: viewbox.width + 200,
        height: viewbox.height,
      });
    } catch (_) {}
  }

  // --- Save ---

  onSaveClick(saveType: string): void {
    if (saveType === 'save' && this.diagramId !== -1) {
      this.saveBpmnDiagram(this.diagramId);
    } else {
      this.saveNew();
    }
  }

  saveNew(): void {
    this.nzModal.create({
      nzTitle: 'Save Diagram',
      nzContent: SaveDiagramDialogComponent,
      nzClassName: 'updated-modal',
      nzData: { name: this.diagramTitle, description: this.description },
      nzFooter: null,
    }).afterClose.subscribe((result: any) => {
      if (result) {
        this.diagramTitle = result.name;
        this.description = result.description;
        this.saveBpmnDiagram(-1);
      }
    });
  }

  async saveBpmnDiagram(id: number): Promise<void> {
    const [xmlResult, svgResult] = await Promise.all([
      this.bpmnJS.saveXML({ format: false }),
      this.bpmnJS.saveSVG(),
    ]);
    const payload = {
      id,
      name: this.diagramTitle,
      description: this.description,
      xml: xmlResult.xml,
      svg: svgResult.svg,
    };
    this.generalService.saveBpmnDiagram(payload).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.notificationService.success(resp.message);
          this.loadBpmnList();
        }
      },
      error: (err) => this.notificationService.handleHttpError(err),
    });
  }

  async downloadSVG(): Promise<void> {
    try {
      const { svg } = await this.bpmnJS.saveSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      saveAs(blob, `${this.diagramTitle || 'diagram'}.svg`);
    } catch (_) {
      this.notificationService.error('Failed to export SVG');
    }
  }

  // --- Task click listeners ---

  private setupClickListeners(): void {
    this.bpmnJS.on('element.click', (e: any) => {
      if (e.element.type !== 'bpmn:Task') return;

      const isMulti = e.originalEvent?.shiftKey || e.originalEvent?.ctrlKey || e.originalEvent?.metaKey;
      const canvas: any = this.bpmnJS.get('canvas');

      if (this.enableMultiSelect && isMulti) {
        if (this.identifierList.has(e.element.id)) {
          this.clickedElements = this.clickedElements.filter((el) => el.id !== e.element.id);
          this.identifierList.delete(e.element.id);
          canvas.removeMarker(e.element.id, 'highlight');
        } else {
          this.clickedElements.push(e.element);
          this.identifierList.add(e.element.id);
          canvas.addMarker(e.element.id, 'highlight');
        }
      } else {
        this.clearSelection();
        this.clickedElements.push(e.element);
        this.identifierList.add(e.element.id);
        canvas.addMarker(e.element.id, 'highlight');
      }

      if (this.diagramId !== -1 && this.identifierList.size > 0) {
        this.generalService.getBpmnTaskRules(this.diagramId, Array.from(this.identifierList)).subscribe({
          next: (resp) => {
            this.rulesData = resp.data?.rows || [];
            this.rulesTotal = resp.data?.records || 0;
          },
        });
      }
    });
  }

  private setupKeyboardListeners(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.clearSelection();
    });
  }

  clearSelection(): void {
    const canvas: any = this.bpmnJS.get('canvas');
    const elementRegistry: any = this.bpmnJS.get('elementRegistry');
    elementRegistry.getAll().forEach((el: any) => canvas.removeMarker(el.id, 'highlight'));
    this.clickedElements = [];
    this.identifierList.clear();
  }
}
