// Temporary mocks until CSS Monitoring is migrated.
export interface AbapRuleViolation {
    ruleId: number;
    ruleName: string;
    ruleDescription: string;
    programId: string;
    programName: string;
    systemId: number;
    systemName: string;
    executionId: number;
    severity: string;
    category: string;
    violationCount: number;
    findings: AbapFinding[];
}

export interface AbapFinding {
    findingId: number;
    lineNumber: number;
    fileName: string;
    matchedCodeSnippet: string;
    pattern: {
        patternId: number;
        patternName: string;
        description: string;
        regexPattern: string;
    };
}

// Temporary mocks until CSS Monitoring is migrated.
export interface SapParameterRuleViolation {
    rule: { name: string };
    sapSystem: string;
}

export interface SapAuditRuleViolation {
    rule: { name: string };
    sapSystem: string;
}

export interface Issue {
    id: number;
    key: string;
    projectKey: string;
    url: string;
    title: string;
    description: string;
    assignee: string;
    status: string;
    issueTypeId: string;
    createdDate: any;
    createdBy: string;
    sapSystem: any;
    integrationSystem: any;
    parameterRuleViolation: SapParameterRuleViolation;
    auditRuleViolation: SapAuditRuleViolation;
    abapRuleViolation: AbapRuleViolation;
}

// JIRA issue type interface (fetched dynamically from JIRA API)
export interface JiraIssueType {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
}

// Material icon mapping for issue types
export const ISSUE_TYPE_ICONS: { [key: string]: string } = {
    'Task': 'check_box',
    'Bug': 'bug_report',
    'Story': 'auto_stories'
};

export class RequestIssue implements Issue {
    id: number = -1;
    key: string = null;
    projectKey: string = null;
    url: string = null;
    assignee: string = null;
    status: string = null;
    issueTypeId: string = null;
    createdDate: number | null = null;
    createdBy: string | null = null;
    integrationSystem: any = null;
    sapSystem: any = null;

    title: string;
    description: string;
    parameterRuleViolation: SapParameterRuleViolation = null;
    auditRuleViolation: SapAuditRuleViolation = null;
    abapRuleViolation: AbapRuleViolation = null;
    abapProgramId: number;
    abapExecutionId: number;

    public constructor(title: string, description: string, parameterRuleViolation: SapParameterRuleViolation = null, auditRuleViolation: SapAuditRuleViolation = null, abapExecutionId?: any, abapProgramId?: any,) {
        this.title = title;
        this.description = description;
        this.parameterRuleViolation = parameterRuleViolation;
        this.auditRuleViolation = auditRuleViolation;
        this.abapExecutionId = abapExecutionId;
        this.abapProgramId = abapProgramId;
    }
}
