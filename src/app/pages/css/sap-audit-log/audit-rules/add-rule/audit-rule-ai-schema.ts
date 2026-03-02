import { SapRuleConditionType } from '../../../css-shared/css-shared.model';
import { SapAuditLogField, SapAuditMatchMode } from '../../sap-audit-log.model';

export const RULE_TAGS = [
  { id: 1, name: 'Authorizations', description: 'Access control and authorization-related rules' },
  { id: 2, name: 'Data Integrity', description: 'Data validation and integrity monitoring rules' },
  { id: 3, name: 'General', description: 'General security monitoring rules' },
  { id: 4, name: 'Infra', description: 'Infrastructure and system-level rules' },
  { id: 5, name: 'Monitoring & Logging', description: 'Audit and logging monitoring rules' },
  { id: 6, name: 'RFC interface', description: 'RFC/Remote function call related rules' },
];

export const AUDIT_RULE_SCHEMA = {
  fields: Object.values(SapAuditLogField),
  conditionTypes: Object.values(SapRuleConditionType),
  matchModes: Object.values(SapAuditMatchMode),
  severities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
  ruleTags: RULE_TAGS.map((t) => t.name),
};

export const FIELD_DESCRIPTIONS: Record<string, string> = {
  SAP_ID: 'SAP System ID (e.g., PRD, DEV, QAS)',
  EVENT: 'SAP Audit Event Code (e.g., AU1, AU2, AUB)',
  MESSAGE: 'Event message text',
  USER: 'SAP username',
  TERMINAL: 'Terminal/workstation name',
  SEVERITY: 'Event severity level (1, 2, 3)',
  TYPE: 'Event type',
  TIME: 'Event time in HH:mm format (e.g., 08:00, 18:00)',
  CLIENT_NO: 'SAP client number (e.g., 000, 100, 200)',
  PARAM_1: 'Additional parameter 1',
  PARAM_2: 'Additional parameter 2',
  PARAM_3: 'Additional parameter 3',
  IP: 'Source IP address',
  HOST: 'Source hostname',
};

export const SAP_AUDIT_EVENTS = [
  { code: 'AU1', description: 'Logon successful' },
  { code: 'AU2', description: 'Logon failed' },
  { code: 'AU3', description: 'Transaction started' },
  { code: 'AU4', description: 'Transaction failed' },
  { code: 'AU5', description: 'RFC/CPIC logon successful' },
  { code: 'AU6', description: 'RFC/CPIC logon failed' },
  { code: 'AU7', description: 'Logon failed (reason provided by kernel)' },
  { code: 'AUB', description: 'Authorization check failed' },
  { code: 'AUC', description: 'Authorization check successful' },
  { code: 'AUD', description: 'Changes to user master' },
  { code: 'AUE', description: 'User locked due to failed logon attempts' },
  { code: 'AUF', description: 'User unlocked' },
  { code: 'AUK', description: 'Changes to profiles' },
  { code: 'AUM', description: 'Changes to authorizations' },
  { code: 'AUN', description: 'Switch user (SU01)' },
  { code: 'BU1', description: 'RFC function call' },
  { code: 'BU2', description: 'CPIC function call' },
  { code: 'CUZ', description: 'Changes to customizing' },
  { code: 'DU9', description: 'Download of data' },
  { code: 'EU1', description: 'Changes to audit configuration' },
];

export function generateAIPrompt(): string {
  const fieldsTable = Object.entries(FIELD_DESCRIPTIONS)
    .map(([field, desc]) => `| ${field} | ${desc} |`)
    .join('\n');

  const eventsTable = SAP_AUDIT_EVENTS.map((e) => `| ${e.code} | ${e.description} |`).join('\n');

  const descriptions: Record<string, string> = {
    EQUALS: 'Exact match - ["value"]',
    NOT_EQUALS: 'Not equal - ["value"]',
    CONTAINS: 'Contains substring - ["text"]',
    NOT_CONTAINS: 'Does not contain - ["text"]',
    STARTS_WITH: 'Starts with prefix - ["prefix"]',
    ENDS_WITH: 'Ends with suffix - ["suffix"]',
    IN: 'Matches any in list - ["v1", "v2", "v3"]',
    NOT_IN: 'Not in list - ["v1", "v2"]',
    BETWEEN: 'Within range (inclusive) - ["start", "end"]',
    NOT_BETWEEN: 'Outside range - ["start", "end"]',
    GREATER: 'Greater than - ["value"]',
    GREATER_EQUALS: 'Greater than or equal - ["value"]',
    LESSER: 'Less than - ["value"]',
    LESSER_EQUALS: 'Less than or equal - ["value"]',
    EMPTY: 'Is null or empty - []',
    IS_SET: 'Has a value - []',
  };

  const conditionTypes = AUDIT_RULE_SCHEMA.conditionTypes
    .map((ct) => `| ${ct} | ${descriptions[ct] || ct} |`)
    .join('\n');

  return `# MARC Audit Log Rule Generator

You are helping generate audit log monitoring rules for MARC (GRC compliance application).
Generate a JSON configuration based on the user's requirement.

## Available Fields (SapAuditLogField)
| Field | Description |
|-------|-------------|
${fieldsTable}

## Available Operators (conditionType)
| Operator | Description & Value Format |
|----------|---------------------------|
${conditionTypes}

## Match Modes (matchMode)
| Mode | Description |
|------|-------------|
| NORMAL | Standard condition - triggers violation when matched |
| WHITELIST | Only these values are ALLOWED (others trigger violation) |
| BLACKLIST | These values are EXCLUDED from triggering violations |
| RESET | Resets/clears existing violations when matched |

## Severity Levels
- CRITICAL - Immediate attention required
- HIGH - Serious security concern
- MEDIUM - Should be investigated
- LOW - Informational

## Rule Tags (REQUIRED - at least one must be selected)
| Tag | Description |
|-----|-------------|
| Authorizations | Access control and authorization-related rules |
| Data Integrity | Data validation and integrity monitoring rules |
| General | General security monitoring rules |
| Infra | Infrastructure and system-level rules |
| Monitoring & Logging | Audit and logging monitoring rules |
| RFC interface | RFC/Remote function call related rules |

## Common SAP Audit Events Reference
| Event | Description |
|-------|-------------|
${eventsTable}

## JSON Output Format
\`\`\`json
{
  "name": "Rule Name (required, must be unique)",
  "description": "Detailed description of what this rule monitors",
  "severity": "HIGH",
  "tag": "Authorizations",
  "groupedBy": ["USER", "IP"],
  "threshhold": 5,
  "interval": 3600000,
  "conditions": [
    {
      "field": "FIELD_NAME",
      "conditionType": "OPERATOR",
      "values": ["value1", "value2"],
      "matchMode": "NORMAL"
    }
  ]
}
\`\`\`

## Important Notes
- \`tag\` is REQUIRED - must be one of the Rule Tags listed above
- \`interval\` is in milliseconds (60000 = 1 min, 3600000 = 1 hour, 86400000 = 24 hours)
- \`threshhold\` is the count of events before triggering a violation
- \`groupedBy\` determines how violations are aggregated (e.g., per USER, per IP)
- Multiple conditions are combined with AND logic
- Multiple values within a condition use OR logic

## User Requirement:
[DESCRIBE YOUR AUDIT RULE REQUIREMENT HERE]

---

Generate the JSON configuration for this audit log rule. Only output the JSON, no additional explanation.`;
}

export const EXAMPLE_PROMPTS = [
  'Detect 5 failed logins from same IP within 15 minutes',
  'Alert when admin users login outside business hours (before 8 AM or after 6 PM)',
  'Monitor when users execute sensitive transactions SU01, PFCG, or SM21 in production',
  'Detect mass data downloads (more than 10 export events per hour per user)',
  'Alert when RFC calls are made from unauthorized IP addresses',
  'Monitor user master changes (AUD events) by non-admin users',
  'Detect login attempts during maintenance window (2 AM - 4 AM)',
  'Alert when the same user logs in from multiple IP addresses within 1 hour',
];
