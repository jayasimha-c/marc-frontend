import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface FieldDef {
    name: string;
    type: string;
    required?: boolean;
    description: string;
}

interface ApiEndpoint {
    id: string;
    method: string;
    path: string;
    title: string;
    description: string;
    authentication: string;
    contentType?: string;
    scope?: string;
    requestFields?: FieldDef[];
    responseFields?: FieldDef[];
    curlExample: string;
}

interface ApiCategory {
    name: string;
    endpoints: ApiEndpoint[];
}

@Component({
    standalone: false,
    selector: 'app-api-documentation',
    templateUrl: './api-documentation.component.html',
    styleUrls: ['./api-documentation.component.scss'],
})
export class ApiDocumentationComponent implements OnInit {

    baseUrl: string = '';
    selectedEndpoint: ApiEndpoint | null = null;
    copied: boolean = false;


    constructor(private http: HttpClient) { }

    categories: ApiCategory[] = [
        {
            name: 'Authentication',
            endpoints: [
                {
                    id: 'token',
                    method: 'POST',
                    path: '/api/oauth2/token',
                    title: 'Get Access Token',
                    description: 'Obtain an access token using OAuth 2.0 Client Credentials flow. Client credentials must be sent via Basic Authentication header (RFC 6749 compliant).',
                    authentication: 'Basic Auth (client_id:client_secret)',
                    contentType: 'application/x-www-form-urlencoded',
                    requestFields: [
                        { name: 'Authorization', type: 'header', required: true, description: 'Basic base64(client_id:client_secret)' },
                        { name: 'grant_type', type: 'string', required: true, description: '"client_credentials"' },
                        { name: 'scope', type: 'string', required: false, description: 'Space-separated scopes (e.g. "acm:risk-analysis")' }
                    ],
                    responseFields: [
                        { name: 'access_token', type: 'string', description: 'JWT access token' },
                        { name: 'token_type', type: 'string', description: '"Bearer"' },
                        { name: 'expires_in', type: 'number', description: 'Token validity in seconds' },
                        { name: 'scope', type: 'string', description: 'Granted scopes' }
                    ],
                    curlExample: `curl -X POST '{baseUrl}/api/oauth2/token' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -H 'Authorization: Basic $(echo -n YOUR_CLIENT_ID:YOUR_CLIENT_SECRET | base64)' \\
  -d 'grant_type=client_credentials&scope=acm:risk-analysis'`
                }
            ]
        },
        {
            name: 'Risk Analysis',
            endpoints: [
                {
                    id: 'risk-analysis',
                    method: 'POST',
                    path: '/api/integration/risk-analysis',
                    title: 'Analyze SoD Risks',
                    description: 'Analyze Segregation of Duties risks for a user with specified roles. Returns violations and risk summary.',
                    authentication: 'Bearer Token',
                    contentType: 'application/json',
                    scope: 'acm:risk-analysis',
                    requestFields: [
                        { name: 'requestId', type: 'string', required: false, description: 'External tracking ID (e.g. ServiceNow ticket)' },
                        { name: 'sapUserId', type: 'string', required: true, description: 'SAP User ID (BNAME) to analyze' },
                        { name: 'systemName', type: 'string', required: true, description: 'SAP System connection name as shown in MARC' },
                        { name: 'roleNames', type: 'string[]', required: true, description: 'List of roles to simulate adding' },
                        { name: 'includeExistingRoles', type: 'boolean', required: false, description: 'Include user\'s existing roles (default: true)' },
                        { name: 'riskNamePatterns', type: 'string[]', required: false, description: 'Filter risks by name patterns (e.g. ["FI*"])' }
                    ],
                    responseFields: [
                        { name: 'status', type: 'string', description: '"success" or "error"' },
                        { name: 'jobId', type: 'string', description: 'MARC analysis job ID' },
                        { name: 'requestId', type: 'string', description: 'Echo of request ID' },
                        { name: 'overallRiskLevel', type: 'string', description: '"critical", "high", "medium", "low", or "none"' },
                        { name: 'summary.totalViolations', type: 'number', description: 'Total violations found' },
                        { name: 'summary.criticalCount', type: 'number', description: 'Critical risk count' },
                        { name: 'summary.highCount', type: 'number', description: 'High risk count' },
                        { name: 'summary.mediumCount', type: 'number', description: 'Medium risk count' },
                        { name: 'summary.lowCount', type: 'number', description: 'Low risk count' },
                        { name: 'summary.hasUnmitigatedHighRisks', type: 'boolean', description: 'True if unmitigated critical/high risks exist' },
                        { name: 'violations[]', type: 'array', description: 'List of risk violations' },
                        { name: 'violations[].riskName', type: 'string', description: 'Risk identifier' },
                        { name: 'violations[].riskLevel', type: 'string', description: 'Risk severity level' },
                        { name: 'violations[].mitigated', type: 'boolean', description: 'Whether violation is mitigated' }
                    ],
                    curlExample: `curl -X POST '{baseUrl}/api/integration/risk-analysis' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "requestId": "SNOW-12345",
    "sapUserId": "JSMITH",
    "systemName": "SAP ECC Production",
    "roleNames": ["Z_FI_AP_MANAGER", "Z_FI_AR_CLERK"],
    "includeExistingRoles": true
  }'`
                },
                {
                    id: 'auth-test',
                    method: 'GET',
                    path: '/api/integration/auth-test',
                    title: 'Test Authentication',
                    description: 'Verify OAuth2 authentication is working. Returns authentication details if successful.',
                    authentication: 'Bearer Token',
                    scope: 'acm:risk-analysis',
                    responseFields: [
                        { name: 'status', type: 'string', description: '"authenticated" if token is valid' },
                        { name: 'timestamp', type: 'string', description: 'Current server time (ISO 8601)' },
                        { name: 'message', type: 'string', description: 'Success message' },
                        { name: 'principal', type: 'string', description: 'Client ID from token' },
                        { name: 'authorities', type: 'string', description: 'Granted authorities/scopes' },
                        { name: 'authenticated', type: 'boolean', description: 'Authentication status' }
                    ],
                    curlExample: `curl -X GET '{baseUrl}/api/integration/auth-test' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'`
                },
                {
                    id: 'health',
                    method: 'GET',
                    path: '/api/integration/health',
                    title: 'Health Check',
                    description: 'Check if the Integration API is available. No authentication required.',
                    authentication: 'None',
                    responseFields: [
                        { name: 'status', type: 'string', description: '"UP" if service is running' },
                        { name: 'timestamp', type: 'string', description: 'Current server time (ISO 8601)' },
                        { name: 'service', type: 'string', description: 'Service name' }
                    ],
                    curlExample: `curl -X GET '{baseUrl}/api/integration/health'`
                }
            ]
        }
    ];

    ngOnInit(): void {
        this.baseUrl = `${window.location.protocol}//${window.location.host}`;
        // Select first endpoint by default
        if (this.categories.length > 0 && this.categories[0].endpoints.length > 0) {
            this.selectedEndpoint = this.categories[0].endpoints[0];
        }
    }

    selectEndpoint(endpoint: ApiEndpoint): void {
        this.selectedEndpoint = endpoint;
    }

    isSelected(endpoint: ApiEndpoint): boolean {
        return this.selectedEndpoint?.id === endpoint.id;
    }

    getCurlExample(): string {
        if (!this.selectedEndpoint) return '';
        return this.selectedEndpoint.curlExample.replace(/{baseUrl}/g, this.baseUrl);
    }

    copyToClipboard(text: string): void {
        navigator.clipboard.writeText(text).then(() => {
            this.copied = true;
            setTimeout(() => this.copied = false, 2000);
        });
    }


}
