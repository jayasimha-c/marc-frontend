import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ApiResponse } from '../../../../core/models/api-response';

@Injectable({
    providedIn: 'root'
})
export class DashboardDataService {

    constructor(private httpClient: HttpClient) { }

    /**
     * Get overview dashboard data fallback
     */
    getOverviewData(): Observable<any> {
        const data = {
            totalRequests: 1245,
            activePrivilegedIds: 87,
            pendingApprovals: 32,
            sodRisks: {
                critical: 15,
                nonCritical: 42
            },
            monthlyTrend: [
                { month: 'Jan', requests: 78 },
                { month: 'Feb', requests: 92 },
                { month: 'Mar', requests: 85 },
                { month: 'Apr', requests: 110 },
                { month: 'May', requests: 98 },
                { month: 'Jun', requests: 120 },
                { month: 'Jul', requests: 135 },
                { month: 'Aug', requests: 142 },
                { month: 'Sep', requests: 128 },
                { month: 'Oct', requests: 115 },
                { month: 'Nov', requests: 132 },
                { month: 'Dec', requests: 110 }
            ],
            topUsers: [
                { name: 'John Smith', accessCount: 87 },
                { name: 'Jane Doe', accessCount: 64 },
                { name: 'Robert Johnson', accessCount: 59 },
                { name: 'Emily Davis', accessCount: 52 },
                { name: 'Michael Wilson', accessCount: 48 }
            ],
            topRoles: [
                { role: 'System Administrator', usageCount: 145 },
                { role: 'Database Administrator', usageCount: 112 },
                { role: 'Network Administrator', usageCount: 98 },
                { role: 'Security Analyst', usageCount: 76 },
                { role: 'Application Support', usageCount: 65 }
            ]
        };

        return of(data).pipe(delay(500));
    }

    //PAM Access Dashboards overview
    public getOverviewDashboardData(): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privAccessStats/overviewDashboard`);
    }

    //usage
    public getUsageDashboardData(): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privAccessStats/usageDashboard`);
    }

    public getUsageData(): Observable<any> {
        const data = {
            transactionsByUser: [
                { user: 'John Smith', count: 87 },
                { user: 'Jane Doe', count: 64 },
                { user: 'Robert Johnson', count: 59 },
                { user: 'Emily Davis', count: 52 },
                { user: 'Michael Wilson', count: 48 },
                { user: 'Sarah Brown', count: 45 },
                { user: 'David Miller', count: 42 }
            ],
            transactionsByRole: [
                { role: 'System Administrator', count: 145 },
                { role: 'Database Administrator', count: 112 },
                { role: 'Network Administrator', count: 98 },
                { role: 'Security Analyst', count: 76 },
                { role: 'Application Support', count: 65 }
            ],
            executionTimeline: [
                { hour: '00:00', count: 12 }, { hour: '01:00', count: 8 }, { hour: '02:00', count: 5 },
                { hour: '03:00', count: 3 }, { hour: '04:00', count: 2 }, { hour: '05:00', count: 4 },
                { hour: '06:00', count: 7 }, { hour: '07:00', count: 15 }, { hour: '08:00', count: 32 },
                { hour: '09:00', count: 45 }, { hour: '10:00', count: 52 }, { hour: '11:00', count: 48 },
                { hour: '12:00', count: 42 }, { hour: '13:00', count: 38 }, { hour: '14:00', count: 35 },
                { hour: '15:00', count: 42 }, { hour: '16:00', count: 48 }, { hour: '17:00', count: 36 },
                { hour: '18:00', count: 28 }, { hour: '19:00', count: 22 }, { hour: '20:00', count: 18 },
                { hour: '21:00', count: 15 }, { hour: '22:00', count: 12 }, { hour: '23:00', count: 10 }
            ],
            topTransactions: [
                { name: 'Update User Permissions', count: 87 },
                { name: 'Database Schema Change', count: 64 },
                { name: 'System Configuration', count: 59 },
                { name: 'Network Settings', count: 52 },
                { name: 'User Account Creation', count: 48 }
            ]
        };
        return of(data).pipe(delay(500));
    }

    public getUsageTableData(event: any): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privAccessStats/changesByUser?first=${event.first}&rows=${event.rows}&sortOrder=${event.sortOrder}&sortField=${event.sortField}&filters=${encodeURI(JSON.stringify(event.filters))}&timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    }

    //workflow
    public getWorkflowDashboardData(): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privAccessStats/approvalDashboard`);
    }

    public getWorkflowData(): Observable<any> {
        const data = {
            statistics: {
                totalWorkflows: 145,
                pendingApprovals: 32,
                averageApprovalTime: 2.8,
                rejectionRate: 13.2
            },
            approvalTimeTrend: [
                { date: 'Jan', hours: 3.2 }, { date: 'Feb', hours: 3.0 }, { date: 'Mar', hours: 2.8 },
                { date: 'Apr', hours: 2.5 }, { date: 'May', hours: 2.3 }, { date: 'Jun', hours: 2.1 }
            ],
            approvalStatus: [
                { status: 'Pending', count: 32 }, { status: 'Approved', count: 98 }, { status: 'Rejected', count: 15 }
            ],
            approvalsByApprover: [
                { approver: 'John Smith', approved: 42, rejected: 5 },
                { approver: 'Jane Doe', approved: 38, rejected: 7 },
                { approver: 'Robert Johnson', approved: 35, rejected: 3 },
                { approver: 'Emily Davis', approved: 28, rejected: 8 },
                { approver: 'Michael Wilson', approved: 32, rejected: 4 }
            ],
            workflowStatus: [
                { status: 'Initiated', count: 18 }, { status: 'In Review', count: 32 },
                { status: 'Approved', count: 98 }, { status: 'Rejected', count: 15 }, { status: 'Completed', count: 85 }
            ]
        };
        return of(data).pipe(delay(500));
    }

    public getWorkflowTableData(): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privAccessStats/pendingApprovals`);
    }

    //risk
    public getRiskDashboardData(): any {
        return {
            statistics: { totalRisks: 150, criticalRisks: 15, highRisks: 28, complianceScore: 78 },
            riskTrend: [
                { month: 'Jan', critical: 10, high: 15, medium: 20, low: 25 },
                { month: 'Feb', critical: 12, high: 18, medium: 22, low: 28 },
                { month: 'Mar', critical: 15, high: 20, medium: 25, low: 30 },
                { month: 'Apr', critical: 13, high: 22, medium: 28, low: 32 },
                { month: 'May', critical: 14, high: 24, medium: 30, low: 35 },
                { month: 'Jun', critical: 15, high: 28, medium: 32, low: 38 }
            ],
            riskDistribution: [
                { severity: 'Critical', count: 15 }, { severity: 'High', count: 28 },
                { severity: 'Medium', count: 42 }, { severity: 'Low', count: 65 }
            ],
            riskBySystem: [
                { system: 'Active Directory', count: 35 }, { system: 'SAP', count: 28 },
                { system: 'Oracle ERP', count: 22 }, { system: 'AWS', count: 18 }, { system: 'Azure', count: 15 }
            ],
            riskByRole: [
                { role: 'System Administrator', count: 42 }, { role: 'Database Administrator', count: 35 },
                { role: 'Network Administrator', count: 28 }, { role: 'Security Analyst', count: 22 },
                { role: 'Application Support', count: 15 }
            ],
            topRisks: [
                { id: 'RISK001', description: 'Excessive admin privileges', system: 'Active Directory', severity: 'Critical', status: 'Open', discoveredDate: '2025-03-15' },
                { id: 'RISK002', description: 'Shared admin accounts', system: 'SAP', severity: 'Critical', status: 'Open', discoveredDate: '2025-03-14' },
                { id: 'RISK003', description: 'Unpatched vulnerabilities', system: 'Oracle ERP', severity: 'High', status: 'In Progress', discoveredDate: '2025-03-12' },
                { id: 'RISK004', description: 'Weak password policy', system: 'AWS', severity: 'High', status: 'Open', discoveredDate: '2025-03-10' },
                { id: 'RISK005', description: 'Inactive accounts not disabled', system: 'Azure', severity: 'Medium', status: 'In Progress', discoveredDate: '2025-03-08' }
            ]
        };
    }

    //audit
    public getAuditDashboardData(): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privdashboard/getChartData`);
    }

    public getAuditDashboardTableData(startDate: string, endDate: string): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privdashboard/getReqChartData?startDate=${startDate}&endDate=${endDate}&timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    }

    public getRequestTableData(startDate: string, endDate: string): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privdashboard/getTableData?startDate=${startDate}&endDate=${endDate}`);
    }

    public getRequestTableDataByDate(requestDate: string): Observable<ApiResponse> {
        return this.httpClient.get<ApiResponse>(`privdashboard/getDataByDate?requestDate=${requestDate}&timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    }
}
