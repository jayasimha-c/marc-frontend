import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AbapService } from '../abap.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AbapSourceModalComponent } from '../import/abap-source-modal.component';

// Backend API interfaces
interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface ViolationHistoryVO {
  summaryId: number;
  executionId: number;
  scanDate: string;
  totalFindings: number;
  lowViolations: number;
  mediumViolations: number;
  highViolations: number;
  criticalViolations: number;
  violationCount: number;
  rulesViolatedCount: number;
  executionType: string;
  schedulerName: string;
  schedulerId: number;
  status: string;
}

interface ProgramSummaryVO {
  programName: string;
  programId: string;
  systemName: string;
  sapSystemId: string;
  executionId: number;
  programType: string;
  progPackage: string;
  changedBy: string;
  changedOn: string;
  totalViolations: number;
  rulesViolated: number;
  totalFindings: number;
  lastScanned: string;
  highestSeverity: string;
}

@Component({
  standalone: false,
  selector: 'app-program-history',
  templateUrl: './program-history.component.html',
  styleUrls: ['./program-history.component.scss'],
})
export class ProgramHistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  programDetails: ProgramSummaryVO | null = null;
  violationHistory: ViolationHistoryVO[] = [];
  historyPagedResponse: PagedResponse<ViolationHistoryVO> | null = null;

  // Route parameters
  executionId: number | null = null;
  systemId: number | null = null;
  programId: number | null = null;

  // Filters
  historyTimeframe = 30;

  // Pagination
  historyPage = 1;
  historyPageSize = 10;

  loading = false;
  loadingHistory = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private abapService: AbapService,
    private nzModal: NzModalService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.extractRouteParameters();
    if (this.executionId && this.systemId && this.programId) {
      this.loadData();
    } else {
      this.error = 'Invalid route parameters';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  extractRouteParameters(): void {
    const params = this.route.snapshot.paramMap;
    this.executionId = params.get('executionId') ? parseInt(params.get('executionId')!, 10) : null;
    this.systemId = params.get('systemId') ? parseInt(params.get('systemId')!, 10) : null;
    this.programId = params.get('programId') ? parseInt(params.get('programId')!, 10) : null;
  }

  loadData(): void {
    if (!this.executionId || !this.systemId || !this.programId) {
      this.error = 'Missing required parameters';
      return;
    }
    this.loading = true;
    this.error = null;
    this.loadProgramSummary();
    this.loadHistoryPaginated();
  }

  loadProgramSummary(): void {
    if (!this.executionId || !this.systemId || !this.programId) return;

    this.abapService.getProgramViolationSummaryDetails(
      this.executionId, this.systemId, this.programId
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.programDetails = res.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadHistoryPaginated(): void {
    if (!this.executionId || !this.systemId || !this.programId) return;

    this.loadingHistory = true;

    this.abapService.getProgramViolationHistoryPaginated(
      this.executionId, this.systemId, this.programId,
      this.historyPage - 1, this.historyPageSize, this.historyTimeframe
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // Handle both paged response structures
          const data = res.data;
          if (data.content) {
            this.historyPagedResponse = data;
            this.violationHistory = data.content;
          } else if (data.rows) {
            this.violationHistory = data.rows;
            this.historyPagedResponse = {
              content: data.rows,
              totalElements: data.records || data.rows.length,
              totalPages: Math.ceil((data.records || data.rows.length) / this.historyPageSize),
              pageNumber: this.historyPage - 1,
              pageSize: this.historyPageSize,
              first: this.historyPage === 1,
              last: false,
            };
          }
        }
        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
        this.violationHistory = [];
      },
    });
  }

  // ==================== Pagination ====================

  onHistoryPageChange(page: number): void {
    this.historyPage = page;
    this.loadHistoryPaginated();
  }

  onHistoryPageSizeChange(size: number): void {
    this.historyPageSize = size;
    this.historyPage = 1;
    this.loadHistoryPaginated();
  }

  applyHistoryFilters(): void {
    this.historyPage = 1;
    this.loadHistoryPaginated();
  }

  getTotalHistoryEntries(): number {
    return this.historyPagedResponse?.totalElements || 0;
  }

  // ==================== View Source ====================

  onViewProgram(programId: any, sapSystemId: any): void {
    if (!programId || !sapSystemId) {
      this.notification.warn('Program ID or System ID is missing');
      return;
    }

    this.abapService.getAbapProgram(programId, sapSystemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.nzModal.create({
              nzContent: AbapSourceModalComponent,
              nzData: result,
              nzWidth: '95vw',
              nzFooter: null,
              nzClassName: 'abap-source-modal-panel',
              nzBodyStyle: { maxHeight: '90vh', overflow: 'auto' },
            });
          } else {
            this.notification.error('Failed to load ABAP program: ' + (result.message || 'Unknown error'));
          }
        },
        error: () => {
          this.notification.error('Error fetching ABAP program. Please try again.');
        },
      });
  }

  // ==================== Navigation ====================

  viewProgramDetails(): void {
    if (!this.executionId || !this.systemId || !this.programId) return;
    this.router.navigate(['/sap-abap-scanner/program-violations', this.executionId, this.systemId, this.programId]);
  }

  viewDetails(history: ViolationHistoryVO): void {
    if (!this.systemId || !this.programId) return;
    this.router.navigate(['/sap-abap-scanner/program-violations', history.executionId, this.systemId, this.programId]);
  }

  goBack(): void {
    history.back();
  }

  refreshData(): void {
    this.loadData();
  }

  // ==================== Formatting Helpers ====================

  getTotalViolations(h: ViolationHistoryVO): number {
    return (h.lowViolations || 0) + (h.mediumViolations || 0) +
           (h.highViolations || 0) + (h.criticalViolations || 0);
  }

  getProgramSeverity(): string {
    return this.programDetails?.highestSeverity || 'Low';
  }

  getSeverityColor(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return '#cf1322';
      case 'HIGH': return '#fa541c';
      case 'MEDIUM': return '#fa8c16';
      case 'LOW': return '#52c41a';
      default: return '#888';
    }
  }

  getExecutionTypeTag(type: string): { color: string; label: string } {
    switch (type?.toUpperCase()) {
      case 'SCHEDULED': return { color: 'blue', label: 'Scheduled' };
      case 'ON_DEMAND': return { color: 'purple', label: 'On Demand' };
      case 'MANUAL': return { color: 'green', label: 'Manual' };
      default: return { color: 'default', label: type || 'Unknown' };
    }
  }

  getStatusTag(status: string): { color: string; label: string } {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS': return { color: 'success', label: 'Completed' };
      case 'RUNNING':
      case 'IN_PROGRESS': return { color: 'processing', label: 'Running' };
      case 'FAILED':
      case 'ERROR': return { color: 'error', label: 'Failed' };
      case 'CANCELLED': return { color: 'warning', label: 'Cancelled' };
      default: return { color: 'default', label: status || 'Unknown' };
    }
  }

  formatProgramType(type: string): string {
    const typeMap: Record<string, string> = {
      'R': 'Report', '1': 'Executable Program', 'I': 'Include',
      'M': 'Module Pool', 'F': 'Function Group', 'S': 'Subroutine Pool',
      'T': 'Type Pool', 'J': 'Interface', 'K': 'Class',
      'X': 'Transformation', 'Q': 'DB Procedure Proxy', 'B': 'Behavior Definition',
      'DDLS': 'CDS View', 'DCLS': 'Access Control', 'DDLX': 'Metadata Extension',
    };
    return typeMap[type?.toUpperCase()] || type || 'N/A';
  }

  isCdsType(type: string): boolean {
    return ['DDLS', 'DCLS', 'DDLX'].includes(type?.toUpperCase());
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
