import { Component, OnInit, OnDestroy, HostListener, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { CommunicationService } from '../communication.service';

interface TemplateItem {
  label: string;
  value: string;
}

interface TemplateGroup {
  label: string;
  value: string;
  items: TemplateItem[];
}

@Component({
  standalone: false,
  selector: 'app-template-section',
  templateUrl: './template-section.component.html',
  styleUrls: ['./template-section.component.scss'],
})
export class TemplateSectionComponent implements OnInit, OnDestroy {
  selectedItem: TemplateItem | null = null;
  editorOneData = '';
  editorTwoData = '';
  isLoading = false;
  hasChanges = false;
  showPreview = false;
  showVariables = false;
  originalEditorOneData = '';
  originalEditorTwoData = '';
  isSaving = false;
  validationErrors: string[] = [];

  searchTerm = '';
  filteredGroupedItems: TemplateGroup[] = [];
  expandedCategories: Record<string, boolean> = {};

  templateVariables = [
    {
      category: 'User Information',
      variables: [
        { name: '${username}', description: 'User login name' },
        { name: '${firstname}', description: 'User first name' },
        { name: '${lastname}', description: 'User last name' },
        { name: '${fullname}', description: 'User full name' },
        { name: '${email}', description: 'User email address' },
        { name: '${department}', description: 'User department' },
        { name: '${manager}', description: 'User manager name' },
        { name: '${employeeid}', description: 'Employee ID' },
      ],
    },
    {
      category: 'Request Information',
      variables: [
        { name: '${requestid}', description: 'Request ID number' },
        { name: '${requesttype}', description: 'Type of request' },
        { name: '${requestdate}', description: 'Request submission date' },
        { name: '${requeststatus}', description: 'Current request status' },
        { name: '${requestdescription}', description: 'Request description' },
        { name: '${approver}', description: 'Assigned approver name' },
        { name: '${duedate}', description: 'Request due date' },
      ],
    },
    {
      category: 'System Information',
      variables: [
        { name: '${systemname}', description: 'Target system name' },
        { name: '${systemurl}', description: 'System URL/link' },
        { name: '${companyname}', description: 'Company name' },
        { name: '${supportemail}', description: 'Support email address' },
        { name: '${currentdate}', description: 'Current date' },
        { name: '${currenttime}', description: 'Current time' },
      ],
    },
    {
      category: 'Approval Workflow',
      variables: [
        { name: '${workflowstep}', description: 'Current workflow step' },
        { name: '${approvallink}', description: 'Approval action link' },
        { name: '${rejectlink}', description: 'Rejection action link' },
        { name: '${reviewlink}', description: 'Review details link' },
        { name: '${approvalcomments}', description: 'Approver comments' },
        { name: '${escalationdate}', description: 'Escalation date' },
      ],
    },
  ];

  private destroy$ = new Subject<void>();
  private changeTrackingEnabled = false;

  quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  groupedItems: TemplateGroup[] = [
    { label: 'Add User', value: 'Add User', items: [
      { label: 'Requester', value: 'add-requester.html' },
      { label: 'User', value: 'add-user.html' },
    ]},
    { label: 'Delete User', value: 'Delete User', items: [
      { label: 'Requester', value: 'delete-requester.html' },
    ]},
    { label: 'Edit User', value: 'Edit User', items: [
      { label: 'Requester', value: 'edit-requester.html' },
    ]},
    { label: 'Lock account', value: 'Lock User', items: [
      { label: 'Requester', value: 'lock-requester.html' },
    ]},
    { label: 'Password', value: 'Password', items: [
      { label: 'Requester', value: 'pwd-requester.html' },
      { label: 'User', value: 'pwd-user.html' },
    ]},
    { label: 'Unlock account', value: 'Unlock account', items: [
      { label: 'Requester', value: 'unlock-requester.html' },
    ]},
    { label: 'Approval', value: 'Approval', items: [
      { label: 'Approvals', value: 'wf-approver.html' },
    ]},
    { label: 'Privilege', value: 'Privilege', items: [
      { label: 'Request', value: 'priv-request.html' },
      { label: 'Approve', value: 'priv-approve.html' },
      { label: 'Review', value: 'priv-review.html' },
      { label: 'Review Report', value: 'priv-review_report.html' },
    ]},
    { label: 'Forgot password', value: 'Forgot password', items: [
      { label: 'Password recover', value: 'forgot-forgot.html' },
    ]},
    { label: 'Mitigation', value: 'Mitigation', items: [
      { label: 'Mitigation Assignment Expiry', value: 'mitigation-expiration.html' },
    ]},
  ];

  constructor(
    private communicationService: CommunicationService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.filteredGroupedItems = [...this.groupedItems];
    if (this.groupedItems.length > 0) {
      this.expandedCategories[this.groupedItems[0].value] = true;
    }
    this.loadSelfServiceTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:beforeunload', ['$event'])
  canDeactivate(event: BeforeUnloadEvent): boolean {
    if (this.hasChanges) {
      event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return false;
    }
    return true;
  }

  private loadSelfServiceTemplates(): void {
    this.communicationService.getReqDataForTemplate()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          if (resp.data) {
            this.groupedItems.push({
              label: 'Self service',
              value: 'Self service',
              items: [
                { label: 'Self service Unlock & Reset', value: 'pwd-self_service.html%23' + resp.data.ssOperation1 },
                { label: 'Self service Unlock', value: 'pwd-self_service.html%23' + resp.data.ssOperation2 },
              ],
            });
            this.filteredGroupedItems = [...this.groupedItems];
          }
        },
        error: (err) => this.handleError(err, 'load self-service templates'),
      });
  }

  selectTemplate(item: TemplateItem): void {
    if (this.hasChanges) {
      if (!confirm('You have unsaved changes. Do you want to discard them?')) {
        return;
      }
    }
    this.selectedItem = item;
    this.loadCurrentTemplate(item);
  }

  loadCurrentTemplate(item: TemplateItem): void {
    if (!item?.value) {
      this.notificationService.error('Invalid template selected');
      return;
    }

    this.isLoading = true;
    this.editorOneData = '';
    this.editorTwoData = '';
    this.hasChanges = false;
    this.validationErrors = [];
    this.changeTrackingEnabled = false;

    this.communicationService.getCurrentTemplate(item.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          if (resp?.data) {
            this.editorOneData = this.sanitizeContent(resp.data.text1 || '');
            this.editorTwoData = this.sanitizeContent(resp.data.text2 || '');
            this.originalEditorOneData = this.editorOneData;
            this.originalEditorTwoData = this.editorTwoData;
            setTimeout(() => (this.changeTrackingEnabled = true), 100);
          } else {
            this.notificationService.error('Template data not found');
          }
        },
        error: (err) => this.handleError(err, 'load template'),
        complete: () => (this.isLoading = false),
      });
  }

  saveTemplateChanges(): void {
    if (!this.selectedItem) {
      this.notificationService.error('No template selected');
      return;
    }
    if (!this.validateTemplate()) return;

    this.isSaving = true;
    this.validationErrors = [];

    this.communicationService
      .saveCurrentTemplate(this.selectedItem.value, this.editorOneData, this.editorTwoData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          if (resp?.success !== false) {
            this.notificationService.success('Template changes saved successfully.');
            this.originalEditorOneData = this.editorOneData;
            this.originalEditorTwoData = this.editorTwoData;
            this.hasChanges = false;
          } else {
            this.notificationService.error(resp.message || 'Failed to save template.');
          }
        },
        error: (err) => this.handleError(err, 'save template'),
        complete: () => (this.isSaving = false),
      });
  }

  resetChanges(): void {
    if (!this.hasChanges) return;
    this.editorOneData = this.originalEditorOneData;
    this.editorTwoData = this.originalEditorTwoData;
    this.hasChanges = false;
    this.validationErrors = [];
    this.notificationService.success('Changes have been reset');
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
    if (this.showPreview) this.showVariables = false;
  }

  toggleVariables(): void {
    this.showVariables = !this.showVariables;
    if (this.showVariables) this.showPreview = false;
  }

  insertVariable(variableName: string): void {
    navigator.clipboard.writeText(variableName).then(() => {
      this.notificationService.success(`Variable ${variableName} copied to clipboard`);
    }).catch(() => {
      this.notificationService.error('Failed to copy variable to clipboard');
    });
  }

  filterTemplates(): void {
    if (!this.searchTerm.trim()) {
      this.filteredGroupedItems = [...this.groupedItems];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredGroupedItems = this.groupedItems
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) => i.label.toLowerCase().includes(term) || i.value.toLowerCase().includes(term),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }

  toggleCategory(value: string): void {
    this.expandedCategories[value] = !this.expandedCategories[value];
  }

  onEditorChange(): void {
    if (!this.changeTrackingEnabled) return;
    this.hasChanges =
      this.editorOneData !== this.originalEditorOneData ||
      this.editorTwoData !== this.originalEditorTwoData;
  }

  private validateTemplate(): boolean {
    this.validationErrors = [];
    if (!this.editorOneData?.trim() && !this.editorTwoData?.trim()) {
      this.validationErrors.push('Template cannot be completely empty');
    }
    if (this.editorOneData && this.editorOneData.length > 10000) {
      this.validationErrors.push('Header template is too long (max 10,000 characters)');
    }
    if (this.editorTwoData && this.editorTwoData.length > 10000) {
      this.validationErrors.push('Footer template is too long (max 10,000 characters)');
    }
    if (this.validationErrors.length > 0) {
      this.notificationService.error('Validation failed: ' + this.validationErrors.join(', '));
      return false;
    }
    return true;
  }

  private sanitizeContent(content: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, content) || '';
  }

  private handleError(error: any, operation: string): void {
    const msg =
      error?.status === 404 ? 'Template not found'
      : error?.status === 403 ? `Insufficient permissions to ${operation}`
      : error?.status === 0 ? 'Network error - please check your connection'
      : error?.message || `Failed to ${operation}`;
    this.notificationService.error(msg);
  }
}
