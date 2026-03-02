import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NZ_MODAL_DATA, NzModalRef } from "ng-zorro-antd/modal";
import { NotificationService } from "../../../../core/services/notification.service";
import { ISSUE_TYPE_ICONS, JiraIssueType, RequestIssue } from "../../general.model";
import { GeneralService } from "../../general.service";

export interface AiPromptResponse {
    response: string;
    responseTimeMs: number;
}

@Component({
    standalone: false,
    selector: "app-add-issue",
    templateUrl: "./add-issue.component.html",
})
export class AddIssueComponent implements OnInit {

    // JIRA issue types (loaded dynamically from JIRA API)
    public issueTypes: JiraIssueType[] = [];
    public isLoadingIssueTypes = true;
    public issueTypesError: string | null = null;

    // AI enhancement state
    public aiEnhancedDescription: string = "";
    public aiResponseTime: number = 0;
    public aiSystemPrompt: string = `You are a security analyst writing a Jira issue description for ABAP code security violations.
Given the violation data below, write a clear, structured Jira issue description that includes:
1. **Summary** - Brief overview of what was found
2. **Violations Found** - List each rule violation with affected line numbers
3. **Risk Assessment** - Severity and potential impact
4. **Remediation Steps** - Specific actions to fix each violation type

Keep the tone professional and actionable. Format with Jira-compatible markdown.`;

    public form!: FormGroup;

    constructor(@Inject(NZ_MODAL_DATA) public dialogData: RequestIssue,
        private formBuilder: FormBuilder,
        private generalService: GeneralService,
        private notificationService: NotificationService,
        public modal: NzModalRef) {

        this.form = this.formBuilder.group({
            issueTypeId: ["", [Validators.required]],
            title: [dialogData.title || "", [Validators.required]],
            description: [dialogData.description || "", []],
        });
    }

    ngOnInit(): void {
        this.loadIssueTypes();
    }

    /**
     * Load issue types from JIRA API
     */
    private loadIssueTypes(): void {
        this.isLoadingIssueTypes = true;
        this.issueTypesError = null;

        this.generalService.getIssueTypes().subscribe({
            next: (resp) => {
                if (resp.success && resp.data) {
                    this.issueTypes = resp.data;
                    // Set default to first issue type (usually Task)
                    if (this.issueTypes.length > 0) {
                        this.form.patchValue({ issueTypeId: this.issueTypes[0].id });
                    }
                } else {
                    this.issueTypesError = resp.message || 'Failed to load issue types';
                }
                this.isLoadingIssueTypes = false;
            },
            error: (error) => {
                this.issueTypesError = 'Failed to load issue types from JIRA';
                this.isLoadingIssueTypes = false;
            }
        });
    }

    /**
     * Get Ant Design icon for issue type
     */
    public getIssueTypeIcon(typeName: string): string {
        const iconMap: { [key: string]: string } = {
            'Task': 'check-square',
            'Bug': 'bug',
            'Story': 'read'
        };
        return iconMap[typeName] || 'file-text';
    }

    public save() {
        if (this.form.valid == false) {
            Object.values(this.form.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        } else {
            this.submit();
        }
    }


    buildAiPrompt(): string {
        const description = this.form.get('description')?.value || '';
        return `Program: ${this.dialogData?.title || ''}\n\nViolation Data:\n${description}`;
    }

    onAiResponse(resp: AiPromptResponse): void {
        this.aiEnhancedDescription = resp.response;
        this.aiResponseTime = resp.responseTimeMs;
    }

    applyAiDescription(): void {
        if (this.aiEnhancedDescription) {
            this.form.patchValue({ description: this.aiEnhancedDescription });
            this.aiEnhancedDescription = "";
        }
    }

    private submit() {

        let requestIssue = this.dialogData;
        requestIssue.issueTypeId = this.form.get("issueTypeId")?.value;
        requestIssue.title = this.form.get("title")?.value;
        requestIssue.description = this.form.get("description")?.value;

        this.generalService.createIssue(requestIssue).subscribe((resp) => {
            this.notificationService.success("Issue submitted successfully");
            this.modal.close(true);
        });
    }
}
