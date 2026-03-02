import { Component, OnInit } from "@angular/core";
import { NzModalService } from "ng-zorro-antd/modal";
import { NotificationService } from "../../../core/services/notification.service";
import { ConfirmDialogService } from "../../../shared/components/confirm-dialog/confirm-dialog.service";

import { GeneralService } from "../general.service";
import { Issue } from "../general.model";

import { TableColumn } from "../../../shared/components/advanced-table/advanced-table.models";

@Component({
    standalone: false,
    selector: "app-issues",
    templateUrl: "./issues.component.html",
})
export class IssuesComponent implements OnInit {

    loading = false;
    data: any[] = [];
    totalRecords = 0;

    tableColumns: TableColumn[] = [
        { field: "key", type: "link", header: "JIRA Key" },
        { field: "title", type: "text", header: "Title" },
        { field: "status", type: "tag", header: "Status", tagColors: { default: 'blue', 'To Do': 'default', 'Done': 'green', 'In Progress': 'orange' } },
        { field: "violationDetails", type: "text", header: "Violation" },
        { field: "violationSystem", type: "text", header: "Source System" },
        { field: "createdBy", type: "text", header: "Created By" },
        { field: "createdDateFormatted", type: "text", header: "Created Date" },
        { field: "assignee", type: "text", header: "Assignee" },
    ];

    constructor(
        private nzModal: NzModalService,
        private generalService: GeneralService,
        private notificationService: NotificationService,
        private confirmDialogService: ConfirmDialogService
    ) { }

    ngOnInit(): void {
        this.getTableData();
    }

    getTableData(): void {
        this.loading = true;
        this.generalService.getIssues().subscribe({
            next: (resp) => {
                this.data = resp.data.rows.map((issue: Issue) => ({
                    ...issue,
                    violationDetails: this.getViolationDetails(issue),
                    violationSystem: this.getViolationSystem(issue),
                    createdDateFormatted: this.formatDate(issue.createdDate),
                    issue: issue
                }));
                this.totalRecords = resp.data.records;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.notificationService.error("Failed to load issues");
            }
        });
    }

    onCellClick(args: { row: any, field: string }): void {
        if (args.field === 'key') {
            this.openIssueLink(args.row.issue);
        }
    }

    /**
     * Get detailed violation information including rule name
     */
    private getViolationDetails(issue: Issue): string {
        if (issue.parameterRuleViolation != null) {
            const violation = issue.parameterRuleViolation;
            const ruleName = violation.rule?.name || 'Unknown Rule';
            return `Parameter: ${ruleName}`;
        } else if (issue.auditRuleViolation != null) {
            const violation = issue.auditRuleViolation;
            const ruleName = violation.rule?.name || 'Unknown Rule';
            return `Audit Log: ${ruleName}`;
        } else if (issue.abapRuleViolation != null) {
            const violation = issue.abapRuleViolation;
            return `ABAP: ${violation.ruleName || 'Unknown Rule'}`;
        }
        return "N/A";
    }

    /**
     * Get the source system where the violation occurred.
     * Uses top-level sapSystem (populated by IssueRef.transform()),
     * falling back to violation-level fields.
     */
    private getViolationSystem(issue: Issue): string {
        if (issue.sapSystem?.destinationName) {
            return issue.sapSystem.destinationName;
        }
        if (issue.parameterRuleViolation?.sapSystem) {
            return issue.parameterRuleViolation.sapSystem;
        }
        if (issue.auditRuleViolation?.sapSystem) {
            return issue.auditRuleViolation.sapSystem;
        }
        if (issue.abapRuleViolation?.systemName) {
            return issue.abapRuleViolation.systemName;
        }
        return "N/A";
    }

    /**
     * Format date value (epoch ms, ISO string, or Date) to readable string
     */
    private formatDate(value: any): string {
        if (value == null) return "N/A";
        const date = new Date(value);
        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    openIssueLink(issue: Issue | null, issueUrl?: string | null) {
        if (issue == null && issueUrl == null)
            return;

        if (issue != null)
            issueUrl = issue.url;

        this.confirmDialogService
            .confirm({
                title: "Open Jira Link",
                message: "Do you want to open the link to the issue in a new tab?",
                confirmLabel: "Open",
                okDanger: false
            } as any)
            .subscribe((result) => {
                if (result) {
                    window.open(issueUrl, '_blank').focus();
                }
            });
    }
}
