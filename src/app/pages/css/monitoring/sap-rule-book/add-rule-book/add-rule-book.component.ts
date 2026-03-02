import { Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { distinctUntilChanged, forkJoin, map, Observable } from 'rxjs';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ApiResponse } from '../../../../../core/models/api-response';
import { SidePanelComponent } from '../../../../../shared/components/side-panel/side-panel.component';
import { SapRuleBook, RuleBookAssignment } from '../../css-monitoring.model';
import { CssMonitoringService } from '../../css-monitoring.service';
import { SapParameterRule, SapParameterType, getParameterType } from '../../../sap-parameters/sap-parameter.model';
import { SapAuditRule } from '../../../sap-audit-log/sap-audit-log.model';
import { BtpRule, RuleType, RuleTypeNames } from '../../../btp/btp.model';
import { BtpService } from '../../../btp/btp.service';
import { SapParameterService } from '../../../sap-parameters/sap-parameters.service';
import { SapAuditLogService } from '../../../sap-audit-log/sap-audit-log.service';
import { AddAssignmentDialogComponent } from '../add-assignment-dialog/add-assignment-dialog.component';

interface CatalogueRule {
  uid: string;
  id: number;
  name: string;
  description: string;
  category: string;
  criticality: string;
  control: string;
  _source: 'parameter' | 'audit' | 'btp';
  _original: SapParameterRule | SapAuditRule | BtpRule;
}

@Component({
  standalone: false,
  selector: 'app-add-rule-book',
  templateUrl: './add-rule-book.component.html',
  styleUrls: ['./add-rule-book.component.scss'],
})
export class AddRuleBookComponent implements OnInit {
  @ViewChild('detailsPanel') detailsPanel!: SidePanelComponent;

  book: SapRuleBook | null = null;
  formType: 'add' | 'edit' | 'view' = 'add';
  ruleTypeOptions = Object.entries(RuleTypeNames);

  // Catalogue
  allCatalogueRules: CatalogueRule[] = [];
  catalogueRules: CatalogueRule[] = [];
  catalogueChecked = new Set<string>();
  searchTerm = '';
  loading = false;

  // Selected
  selectedRules: CatalogueRule[] = [];
  selectedRowUid: string | null = null;

  // Detail side panel
  drawerRule: any = null;
  drawerLoading = false;

  // Assignments
  assignments: RuleBookAssignment[] = [];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private cssMonitoringService: CssMonitoringService,
    private sapParameterService: SapParameterService,
    private sapAuditLogService: SapAuditLogService,
    private btpService: BtpService,
    private notificationService: NotificationService,
    private location: Location,
    private router: Router,
    private nzModal: NzModalService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      securityLevel: ['LOW', [Validators.required]],
      ruleType: [RuleType.AUDIT_LOG, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.book = history.state.book || null;
    this.formType = history.state.formType || 'add';

    if (this.book) {
      this.form.patchValue({
        name: this.book.name,
        description: this.book.description,
        securityLevel: this.book.securityLevel,
        ruleType: this.book.ruleType,
      });
      if (this.formType === 'edit' || this.formType === 'view') {
        this.form.get('ruleType')!.disable();
      }
    }

    this.form.get('ruleType')!.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => {
        this.selectedRules = [];
        this.loadRulesForCurrentType();
      });

    this.loadRulesForCurrentType();
  }

  // ═══════ Rule Loading ═══════

  private loadRulesForCurrentType(): void {
    const ruleType = this.form.get('ruleType')!.value;
    this.loading = true;
    this.allCatalogueRules = [];
    this.catalogueRules = [];
    this.catalogueChecked.clear();

    switch (ruleType) {
      case RuleType.AUDIT_LOG:
        this.loadAuditLogRules();
        break;
      case RuleType.BTP:
        this.loadBtpRules();
        break;
      default:
        this.loadParameterRules(RuleTypeNames[ruleType as RuleType]);
        break;
    }
  }

  private loadAuditLogRules(): void {
    forkJoin({
      parameter: this.cssMonitoringService.getParameterRules('SAP_PARAMETER'),
      audit: this.cssMonitoringService.getAuditRules(),
    }).subscribe({
      next: (resp) => {
        const paramRules = (resp.parameter.data?.rows || []).map((r: any) => this.toParameterCatalogue(r));
        const auditRules = (resp.audit.data?.rows || []).map((r: any) => this.toAuditCatalogue(r));
        this.allCatalogueRules = [...paramRules, ...auditRules];
        this.restoreSelectedFromBook();
        this.refreshCatalogueTable();
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  private loadBtpRules(): void {
    this.btpService.getRuleDefinitions().subscribe({
      next: (resp: any) => {
        this.allCatalogueRules = (resp.data?.rows || resp.data || []).map((r: any) => this.toBtpCatalogue(r));
        this.restoreSelectedFromBook();
        this.refreshCatalogueTable();
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  private loadParameterRules(parameterType: string): void {
    this.sapParameterService.getParameterRules(parameterType).subscribe({
      next: (resp: any) => {
        this.allCatalogueRules = (resp.data?.rows || []).map((r: any) => this.toParameterCatalogue(r));
        this.restoreSelectedFromBook();
        this.refreshCatalogueTable();
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  // ═══════ Model Conversion ═══════

  private toParameterCatalogue(rule: any): CatalogueRule {
    return {
      uid: `parameter_${rule.id}`,
      id: rule.id,
      name: rule.name,
      description: rule.parameter?.parameterName || rule.description || '',
      category: rule.tag || '',
      criticality: rule.severity || rule.errorStatus || '',
      control: (rule.requirementNodes || []).map((n: any) => n.code || n.name).join(', ') || '-',
      _source: 'parameter',
      _original: rule,
    };
  }

  private toAuditCatalogue(rule: any): CatalogueRule {
    return {
      uid: `audit_${rule.id}`,
      id: rule.id,
      name: rule.name,
      description: rule.description || '',
      category: (rule.tags || []).map((t: any) => t.name || t).join(', ') || '',
      criticality: rule.severity || '',
      control: (rule.requirementNodes || []).map((n: any) => n.code || n.name).join(', ') || '-',
      _source: 'audit',
      _original: rule,
    };
  }

  private toBtpCatalogue(rule: any): CatalogueRule {
    return {
      uid: `btp_${rule.id}`,
      id: rule.id,
      name: rule.name,
      description: rule.description || '',
      category: '',
      criticality: rule.severity || '',
      control: '-',
      _source: 'btp',
      _original: rule,
    };
  }

  // ═══════ Restore selected on edit ═══════

  private restoreSelectedFromBook(): void {
    if (!this.book) return;
    const ruleType = this.form.get('ruleType')!.value;

    if (ruleType === RuleType.AUDIT_LOG) {
      const paramIds = new Set((this.book.parameterRules || []).map((r) => r.id));
      const auditIds = new Set((this.book.auditRules || []).map((r) => r.id));
      this.selectedRules = this.allCatalogueRules.filter(
        (r) =>
          (r._source === 'parameter' && paramIds.has(r.id)) ||
          (r._source === 'audit' && auditIds.has(r.id)),
      );
    } else if (ruleType === RuleType.BTP) {
      if (this.book.id) {
        this.cssMonitoringService.getBtpRulesByRuleBookId(this.book.id).subscribe((resp: ApiResponse) => {
          const btpIds = new Set((resp.data?.rows || []).map((r: any) => r.id));
          this.selectedRules = this.allCatalogueRules.filter((r) => btpIds.has(r.id));
          this.refreshCatalogueTable();
        });
        return;
      }
    } else {
      const paramIds = new Set((this.book.parameterRules || []).map((r) => r.id));
      this.selectedRules = this.allCatalogueRules.filter((r) => paramIds.has(r.id));
    }
  }

  // ═══════ Catalogue Filtering ═══════

  onSearchInput(): void {
    this.refreshCatalogueTable();
  }

  private refreshCatalogueTable(): void {
    const selectedIds = new Set(this.selectedRules.map((r) => r.uid));
    let filtered = this.allCatalogueRules.filter((r) => !selectedIds.has(r.uid));

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) => r.name.toLowerCase().includes(term) || r.description.toLowerCase().includes(term),
      );
    }
    this.catalogueRules = filtered;
    this.catalogueChecked = new Set<string>();
  }

  // ═══════ Checkbox logic ═══════

  onCatalogueCheckChange(uid: string, checked: boolean): void {
    if (checked) {
      this.catalogueChecked.add(uid);
    } else {
      this.catalogueChecked.delete(uid);
    }
  }

  get allCatalogueChecked(): boolean {
    return this.catalogueRules.length > 0 && this.catalogueChecked.size === this.catalogueRules.length;
  }

  get someCatalogueChecked(): boolean {
    return this.catalogueChecked.size > 0 && this.catalogueChecked.size < this.catalogueRules.length;
  }

  onCatalogueCheckAll(checked: boolean): void {
    if (checked) {
      this.catalogueRules.forEach((r) => this.catalogueChecked.add(r.uid));
    } else {
      this.catalogueChecked.clear();
    }
  }

  // ═══════ Actions ═══════

  onAddSelected(): void {
    if (this.catalogueChecked.size === 0) {
      this.notificationService.error('Please select at least one rule to add.');
      return;
    }
    const toAdd = this.catalogueRules.filter((r) => this.catalogueChecked.has(r.uid));
    this.selectedRules = [...this.selectedRules, ...toAdd];
    this.refreshCatalogueTable();
  }

  onRemoveSelected(): void {
    if (!this.selectedRowUid) {
      this.notificationService.error('Please select a rule to remove.');
      return;
    }
    this.selectedRules = this.selectedRules.filter((r) => r.uid !== this.selectedRowUid);
    this.selectedRowUid = null;
    this.refreshCatalogueTable();
  }

  onSelectedRowClick(rule: CatalogueRule): void {
    this.selectedRowUid = rule.uid;
    this.openRuleDetailPanel(rule);
  }

  // ═══════ Rule Detail Side Panel ═══════

  private openRuleDetailPanel(row: CatalogueRule): void {
    this.drawerLoading = true;
    this.drawerRule = row._original;
    this.detailsPanel.open();

    this.getRuleDataById(row.id, row._source).subscribe({
      next: (data) => {
        this.drawerRule = data;
        this.drawerLoading = false;
      },
      error: () => {
        this.drawerLoading = false;
        this.notificationService.error('Failed to load rule details');
      },
    });
  }

  private getRuleDataById(id: number, source: 'parameter' | 'audit' | 'btp'): Observable<any> {
    if (source === 'btp') {
      return this.btpService.getRule(id).pipe(
        map((resp: ApiResponse) => ({ ...resp.data, parameterType: SapParameterType.BTP })),
      );
    } else if (source === 'audit') {
      return this.sapAuditLogService.getById(id).pipe(
        map((resp: ApiResponse) => ({ ...resp.data, parameterType: SapParameterType.AUDIT_LOG })),
      );
    } else {
      return this.sapParameterService.getById(id).pipe(map((resp: ApiResponse) => resp.data));
    }
  }

  getSeverityColor(severity: string): string {
    if (!severity) return 'default';
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'gold';
      case 'LOW': return 'blue';
      default: return 'default';
    }
  }

  getParameterTypeLabel(parameterType: string): string {
    return getParameterType(parameterType) || parameterType;
  }

  // ═══════ Save ═══════

  onSave(): void {
    if (this.formType === 'view') return;
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    const book = this.createBookFromState();
    this.cssMonitoringService.saveRuleBook(book).subscribe({
      next: (response) => {
        this.notificationService.show(response);
        if (response.success) {
          this.location.back();
        }
      },
      error: ({ error }) => {
        this.notificationService.error(error?.message || 'Failed to save rule book');
      },
    });
  }

  private createBookFromState(): SapRuleBook {
    const ruleType = this.form.get('ruleType')!.value;
    const book: SapRuleBook = {
      id: this.formType === 'edit' && this.book ? this.book.id : null,
      name: this.form.get('name')!.value,
      description: this.form.get('description')!.value,
      securityLevel: this.form.get('securityLevel')!.value,
      ruleType,
      tags: [],
    };

    if (ruleType === RuleType.AUDIT_LOG) {
      book.parameterRules = this.selectedRules
        .filter((r) => r._source === 'parameter')
        .map((r) => r._original as SapParameterRule);
      book.auditRules = this.selectedRules
        .filter((r) => r._source === 'audit')
        .map((r) => r._original as SapAuditRule);
    } else if (ruleType === RuleType.BTP) {
      book.btpRules = this.selectedRules.map((r) => r._original as BtpRule);
    } else {
      book.parameterRules = this.selectedRules.map((r) => r._original as SapParameterRule);
    }
    return book;
  }

  // ═══════ Navigation ═══════

  navigateBack(): void {
    this.router.navigate(['/css/monitoring/sap-rule-book']);
  }

  onBack(): void {
    this.location.back();
  }

  // ═══════ Assignments Tab ═══════

  loadAssignments(): void {
    if (!this.book?.id) return;
    this.cssMonitoringService.getAssignmentsByBook(this.book.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.assignments = res.data || [];
        }
      },
    });
  }

  assignmentSelected: RuleBookAssignment | null = null;

  onAddAssignment(): void {
    this.nzModal.create({
      nzTitle: 'Add System Assignment',
      nzContent: AddAssignmentDialogComponent,
      nzWidth: '500px',
      nzData: { ruleBook: this.book },
      nzFooter: null,
    }).afterClose.subscribe((result) => {
      if (result) this.loadAssignments();
    });
  }

  onEditAssignment(): void {
    if (!this.assignmentSelected) {
      this.notificationService.error('Please select an assignment to edit.');
      return;
    }
    this.nzModal.create({
      nzTitle: 'Edit System Assignment',
      nzContent: AddAssignmentDialogComponent,
      nzWidth: '500px',
      nzData: { ruleBook: this.book, assignment: this.assignmentSelected },
      nzFooter: null,
    }).afterClose.subscribe((result) => {
      if (result) this.loadAssignments();
    });
  }

  onDeleteAssignment(): void {
    if (!this.assignmentSelected) {
      this.notificationService.error('Please select an assignment to delete.');
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Confirm Delete',
      nzContent: 'Are you sure you want to delete this assignment?',
      nzOkDanger: true,
      nzOnOk: () => {
        this.cssMonitoringService.deleteAssignment(this.assignmentSelected!.id!).subscribe({
          next: (res) => {
            this.notificationService.show(res);
            this.loadAssignments();
          },
        });
      },
    });
  }

  onRunAssignmentNow(): void {
    if (!this.assignmentSelected) {
      this.notificationService.error('Please select an assignment to run.');
      return;
    }
    this.cssMonitoringService.runAssignmentNow(this.assignmentSelected.id!).subscribe({
      next: (res) => {
        if (res.success) {
          this.notificationService.success(res.message || 'Execution started.');
        } else {
          this.notificationService.error(res.message || 'Failed to start execution.');
        }
      },
      error: () => this.notificationService.error('Failed to start execution.'),
    });
  }

  formatInterval(row: RuleBookAssignment): string {
    if (!row.repeatPeriodically) return '-';
    const parts: string[] = [];
    if (row.repeatAfterDays > 0) parts.push(row.repeatAfterDays + 'd');
    if (row.repeatAfterHours > 0) parts.push(row.repeatAfterHours + 'h');
    if (row.repeatAfterMinutes > 0) parts.push(row.repeatAfterMinutes + 'm');
    return parts.join(' ') || '-';
  }
}
