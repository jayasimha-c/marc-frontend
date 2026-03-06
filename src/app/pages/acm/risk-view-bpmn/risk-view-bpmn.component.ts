import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import Viewer from 'bpmn-js/lib/Viewer';
import { from } from 'rxjs';
import { ReportService } from '../reports/report.service';
import { TableColumn } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-risk-view-bpmn',
  templateUrl: './risk-view-bpmn.component.html',
  styleUrls: ['./risk-view-bpmn.component.scss'],
})
export class RiskViewBpmnComponent implements OnInit, OnDestroy {
  @ViewChild('bpmnViewerRef', { static: true })
  private bpmnViewerRef!: ElementRef;

  private viewer!: Viewer;

  // Process selection
  bpmnList: any[] = [];
  selectedProcessId: number | null = null;
  selectedProcess = '';

  // Drawer
  drawerVisible = false;

  // Process metrics
  processMetrics = {
    totalSteps: '-' as string | number,
    sodRiskPoints: '-' as string | number,
    sensitiveAccess: '-' as string | number,
    activeConflicts: '-' as string | number,
    description: '',
  };

  // Step details
  selectedStep: { title: string; description: string[] } | null = null;

  // Risk indicators
  riskIndicators = {
    activeSODConflicts: '-' as string | number,
    sensitiveAccessRecords: '-' as string | number,
    highRiskUsers: '-' as string | number,
  };

  // Participants table
  participantsData: any[] = [];
  participantsColumns: TableColumn[] = [
    { field: 'userName', header: 'User ID', sortable: true },
    { field: 'risk', header: 'Risk' },
    { field: 'riskType', header: 'Risk Type', type: 'tag', tagColors: { High: 'red', Medium: 'orange', Low: 'green' } },
    { field: 'riskDescription', header: 'Risk Description' },
  ];

  // Zoom
  zoomLevel = 100;

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.viewer = new Viewer({ container: this.bpmnViewerRef.nativeElement });
    this.viewer.attachTo(this.bpmnViewerRef.nativeElement);
    this.setupClickListeners();

    this.reportService.getPreviewBpmnList().subscribe((resp) => {
      this.bpmnList = resp.data || [];
      if (this.bpmnList.length > 0) {
        this.selectedProcessId = this.bpmnList[0].id;
        this.loadBpmnDiagram(this.selectedProcessId!);
      }
    });
  }

  ngOnDestroy(): void {
    this.viewer?.destroy();
  }

  // --- Process selection ---

  loadBpmnDiagram(processId: number): void {
    const bpmn = this.bpmnList.find((b) => b.id === processId);
    if (!bpmn) return;

    this.selectedProcess = bpmn.name;
    this.selectedStep = null;
    this.drawerVisible = false;
    this.participantsData = [];
    this.riskIndicators = { activeSODConflicts: '-', sensitiveAccessRecords: '-', highRiskUsers: '-' };

    this.reportService.getBpmnXml(bpmn.xmlPath.substring(1)).subscribe((xml) => {
      this.viewer.clear();
      from(this.viewer.importXML(xml) as Promise<any>).subscribe(() => {
        this.fitToView();
      });
    });

    this.reportService.getProcessMetrics(bpmn.id).subscribe((resp) => {
      if (resp?.data) {
        this.processMetrics = resp.data;
      }
    });
  }

  // --- BPMN interaction ---

  private setupClickListeners(): void {
    this.viewer.on('element.click', (e: any) => {
      if (e.element.type !== 'bpmn:Task') return;

      const canvas: any = this.viewer.get('canvas');
      const elementRegistry: any = this.viewer.get('elementRegistry');
      elementRegistry.getAll().forEach((el: any) => canvas.removeMarker(el.id, 'highlight'));
      canvas.addMarker(e.element.id, 'highlight');

      this.loadStepDetails(e.element.id);
    });
  }

  private loadStepDetails(elementId: string): void {
    if (!this.selectedProcessId) return;

    this.reportService
      .getProcessRiskIndicators(this.selectedProcessId, elementId)
      .subscribe((resp) => {
        if (resp?.data) {
          this.riskIndicators = resp.data;
          this.selectedStep = {
            title: resp.data.stepName || 'Step Details',
            description: resp.data.stepDescriptions || ['No description available'],
          };
          this.participantsData = resp.data.participants || [];
          this.drawerVisible = true;
          this.cdr.detectChanges();
        }
      });
  }

  // --- Zoom ---

  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel + 10, 200);
    this.applyZoom();
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel - 10, 30);
    this.applyZoom();
  }

  resetZoom(): void {
    this.zoomLevel = 100;
    this.fitToView();
  }

  private applyZoom(): void {
    try {
      const canvas: any = this.viewer.get('canvas');
      canvas.zoom(this.zoomLevel / 100);
    } catch (_) {}
  }

  private fitToView(): void {
    try {
      const canvas: any = this.viewer.get('canvas');
      canvas.zoom('fit-viewport');
      this.zoomLevel = Math.round((canvas.zoom() || 1) * 100);
    } catch (_) {}
  }

}
