import { Injectable } from '@angular/core';
import { UserService } from './user.service';

export interface NavItem {
  id: string;
  title: string;
  icon?: string;
  link?: string;
  type: 'group' | 'item' | 'submenu';
  authorities?: string[];
  children?: NavItem[];
  open?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NavigationService {

  constructor(private userService: UserService) { }

  getFilteredNavigation(): NavItem[] {
    return this.filterByAuth(this.getNavigation());
  }

  private filterByAuth(items: NavItem[]): NavItem[] {
    return items.filter(item => {
      if (!item.authorities || item.authorities.length === 0) {
        if (item.children) {
          item.children = this.filterByAuth(item.children);
          return item.children.length > 0;
        }
        return true;
      }

      const hasAccess = this.userService.hasAnyAuthority(item.authorities);
      if (hasAccess && item.children) {
        item.children = this.filterByAuth(item.children);
        return item.children.length > 0;
      }
      return hasAccess;
    });
  }

  private getNavigation(): NavItem[] {
    return [
      {
        id: 'landing',
        title: 'Home',
        icon: 'home',
        link: '/landing',
        type: 'item',
      },
      {
        id: 'acm',
        title: 'ACM',
        icon: 'security-scan',
        type: 'submenu',
        authorities: ['OP_DASHBOARD', 'OP_RULE_BOOK_RULES', 'DIS_OP_RULE_BOOK_RULES', 'OP_RULE_BOOK_RISKS', 'DIS_OP_RULE_BOOK_RISKS', 'OP_RA_ONLINE_RISK_ANALYSIS', 'OP_RA_OFFLINE_RISK_ANALYSIS', 'OP_REPORTS_RISK_ANALYSIS_RESULTS', 'OP_MITIGATION_CONTROLS', 'DIS_OP_MITIGATION_CONTROLS'],
        children: [
          {
            id: 'rule-book',
            title: 'Rule Book',
            icon: 'book',
            type: 'submenu',
            authorities: ['OP_RULE_BOOK_RULES', 'DIS_OP_RULE_BOOK_RULES', 'OP_RULE_BOOK_RISKS', 'DIS_OP_RULE_BOOK_RISKS'],
            children: [
              { id: 'rules', title: 'Rules', icon: 'file-text', link: '/acm/rule-book/rules', type: 'item', authorities: ['OP_RULE_BOOK_RULES', 'DIS_OP_RULE_BOOK_RULES'] },
              { id: 'risks', title: 'Risks', icon: 'warning', link: '/acm/rule-book/risks', type: 'item', authorities: ['DIS_OP_RULE_BOOK_RISKS'] },
              {
                id: 'variant', title: 'Variant', icon: 'read', type: 'submenu',
                authorities: ['DIS_OP_FAV', 'OP_FAV'],
                children: [
                  { id: 'variant-risk', title: 'Risk', icon: 'exclamation-circle', link: '/acm/rule-book/variant/risk', type: 'item' },
                  { id: 'variant-rules', title: 'Rules', icon: 'file-text', link: '/acm/rule-book/variant/rules', type: 'item' },
                ],
              },
              { id: 'import', title: 'Import', icon: 'import', link: '/acm/rule-book/import/rules', type: 'item', authorities: ['OP_RULE_BOOK_IMPORT_RULES', 'OP_RULE_BOOK_IMPORT_RISKS'] },
            ],
          },
          {
            id: 'master-data',
            title: 'Master Data',
            icon: 'database',
            type: 'submenu',
            authorities: ['DIS_OP_MITIGATION_CONTROLS', 'OP_MITIGATION_CONTROLS', 'OP_ACM_OWNER_MGMT', 'DIS_OP_ACM_OWNER_MGMT', 'OP_ADMIN_RULE_TYPE', 'OP_ADMIN_BP'],
            children: [
              {
                id: 'mitigations', title: 'Mitigations', icon: 'safety-certificate', type: 'submenu',
                authorities: ['DIS_OP_MITIGATION_CONTROLS', 'OP_MITIGATION_CONTROLS'],
                children: [
                  { id: 'mc-control', title: 'MC Control', icon: 'control', link: '/acm/master-data/mitigations/mc-control', type: 'item' },
                  { id: 'mc-upload', title: 'Upload', icon: 'upload', link: '/acm/master-data/mitigations/upload', type: 'item' },
                ],
              },
              { id: 'acm-owners', title: 'ACM Owners', icon: 'team', link: '/acm/master-data/acm-owners', type: 'item', authorities: ['OP_ACM_OWNER_MGMT', 'DIS_OP_ACM_OWNER_MGMT'] },
              { id: 'rule-type', title: 'Rule Type', icon: 'file-text', link: '/acm/master-data/rule-type', type: 'item', authorities: ['DIS_OP_ADMIN_RULE_TYPE', 'OP_ADMIN_RULE_TYPE'] },
              { id: 'business-process', title: 'Business Processes', icon: 'apartment', link: '/acm/master-data/business-processes', type: 'item', authorities: ['DIS_OP_ADMIN_BP', 'OP_ADMIN_BP'] },
              {
                id: 'org-field', title: 'ORG Fields', icon: 'global', type: 'submenu',
                authorities: ['DIS_OP_ORG_FIELD_SETUP', 'OP_ORG_FIELD_SETUP'],
                children: [
                  { id: 'org-fields', title: 'ORG Fields', icon: 'global', link: '/acm/master-data/org-field/org-fields', type: 'item' },
                  { id: 'org-upload', title: 'Upload', icon: 'upload', link: '/acm/master-data/org-field/upload', type: 'item' },
                  { id: 'org-names', title: 'ORG Names', icon: 'unordered-list', link: '/acm/master-data/org-field/org-names', type: 'item' },
                  { id: 'org-names-variant', title: 'Variants', icon: 'branches', link: '/acm/master-data/org-field/org-names-variant', type: 'item' },
                ],
              },
            ],
          },
          {
            id: 'rem',
            title: 'REM',
            icon: 'safety',
            type: 'submenu',
            authorities: ['DIS_OP_RA_CONFIGURATION', 'OP_RA_CONFIGURATION'],
            children: [
              { id: 'rem-config', title: 'REM Config', icon: 'setting', link: '/acm/rem/rem-config', type: 'item', authorities: ['DIS_OP_RA_CONFIGURATION', 'OP_RA_CONFIGURATION'] },
            ],
          },
          {
            id: 'risk-analysis',
            title: 'Risk Analysis',
            icon: 'bar-chart',
            type: 'submenu',
            authorities: ['OP_RA_ONLINE_RISK_ANALYSIS', 'OP_RA_OFFLINE_RISK_ANALYSIS', 'OP_RA_SIMULATION', 'OP_RA_CROSS_SYSTEM'],
            children: [
              { id: 'online', title: 'Online', icon: 'global', link: '/acm/risk-analysis/online', type: 'item', authorities: ['OP_RA_ONLINE_RISK_ANALYSIS'] },
              { id: 'offline', title: 'Offline', icon: 'desktop', link: '/acm/risk-analysis/offline/sod-analysis', type: 'item', authorities: ['OP_RA_OFFLINE_RISK_ANALYSIS'] },
              { id: 'simulation', title: 'Simulation', icon: 'experiment', link: '/acm/risk-analysis/simulation', type: 'item', authorities: ['OP_RA_SIMULATION'] },
              { id: 'impact', title: 'Impact Analysis', icon: 'thunderbolt', link: '/acm/risk-analysis/impact-analysis', type: 'item', authorities: ['OP_IMPACT_ANALYSIS'] },
              { id: 'cross-system', title: 'Cross System', icon: 'swap', link: '/acm/risk-analysis/cross-system-analysis-online', type: 'item', authorities: ['OP_RA_CROSS_SYSTEM'] },
              { id: 'dashboard', title: 'Dashboard', icon: 'dashboard', link: '/acm/risk-analysis/dashboard', type: 'item', authorities: ['DIS_OP_RA_DASHBOARD_SYNC', 'OP_RA_DASHBOARD_SYNC'] },
            ],
          },
          {
            id: 'acm-reports',
            title: 'Reports',
            icon: 'file-done',
            type: 'submenu',
            authorities: ['OP_REPORTS_RISK_ANALYSIS_RESULTS', 'OP_REPORTS_RISK_EXECUTION_BY_USER', 'OP_REPORTS_TRANSACTION_EXECUTION', 'OP_REM_DASHBOARD'],
            children: [
              { id: 'sod-results', title: 'SoD Results', icon: 'audit', link: '/acm/reports/sod-results', type: 'item', authorities: ['OP_REPORTS_RISK_ANALYSIS_RESULTS'] },
              { id: 'risk-execution', title: 'Risk Execution', icon: 'line-chart', link: '/acm/reports/risk-execution', type: 'item', authorities: ['OP_REPORTS_RISK_EXECUTION_BY_USER'] },
              { id: 'rule-execution', title: 'Rule Execution', icon: 'pie-chart', link: '/acm/reports/rule-execution', type: 'item', authorities: ['OP_REPORTS_RISK_EXECUTION_BY_USER'] },
              { id: 'tcode-execution', title: 'Tcode Execution', icon: 'code', link: '/acm/reports/tcode-execution', type: 'item', authorities: ['OP_REPORTS_TRANSACTION_EXECUTION'] },
              { id: 'rem-dashboard', title: 'REM Dashboard', icon: 'fund', link: '/acm/reports/rem-dashboard', type: 'item', authorities: ['OP_REM_DASHBOARD'] },
              { id: 'risk-analysis-dashboard', title: 'Risk Analysis Dashboard', icon: 'stock', link: '/acm/risk-analysis-dashboard', type: 'item' },
            ],
          },
        ],
      },
      {
        id: 'pam',
        title: 'PAM',
        icon: 'key',
        type: 'submenu',
        authorities: ['OP_PRIVILEGE_MANAGEMENT', 'DIS_OP_PRIVILEGE_MANAGEMENT', 'OP_PRIVILEGE_REQUEST', 'OP_PRIVILEGE_REPORT', 'OP_PRIVILEGE_DASHBOARD'],
        children: [
          {
            id: 'pam-dashboards',
            title: 'Dashboards',
            icon: 'dashboard',
            type: 'submenu',
            authorities: ['OP_PRIVILEGE_DASHBOARD'],
            children: [
              { id: 'overview', title: 'Overview', icon: 'appstore', link: '/pam/overview-dashboard', type: 'item' },
              { id: 'usage', title: 'Usage', icon: 'bar-chart', link: '/pam/usage-dashboard', type: 'item' },
              { id: 'workflow', title: 'Workflow', icon: 'branches', link: '/pam/workflow-dashboard', type: 'item' },
              { id: 'audit', title: 'Audit', icon: 'audit', link: '/pam/audit-dashboard', type: 'item' },
            ],
          },
          {
            id: 'pam-requests',
            title: 'Requests',
            icon: 'pull-request',
            type: 'submenu',
            authorities: ['OP_PRIVILEGE_REQUEST', 'OP_PRIVILEGE_ASSIGNMENT', 'OP_PRIVILEGE_REVIEW'],
            children: [
              { id: 'my-requests', title: 'My Requests', icon: 'file-text', link: '/pam/requests/my-requests', type: 'item', authorities: ['OP_PRIVILEGE_REQUEST'] },
              { id: 'my-approvals', title: 'My Approvals', icon: 'check-circle', link: '/pam/requests/my-approval', type: 'item', authorities: ['OP_PRIVILEGE_ASSIGNMENT'] },
              { id: 'my-reviews', title: 'My Reviews', icon: 'eye', link: '/pam/requests/my-reviews', type: 'item', authorities: ['OP_PRIVILEGE_REVIEW'] },
            ],
          },
          {
            id: 'pam-reports',
            title: 'Reports',
            icon: 'file-done',
            type: 'submenu',
            authorities: ['OP_PRIVILEGE_MASTER_REPORT', 'OP_PRIVILEGE_REPORT'],
            children: [
              { id: 'master-data', title: 'Master Data', icon: 'database', link: '/pam/reports/master-data', type: 'item', authorities: ['OP_PRIVILEGE_MASTER_REPORT'] },
              { id: 'all-requests', title: 'All Requests', icon: 'container', link: '/pam/reports/all-request', type: 'item', authorities: ['OP_PRIVILEGE_REPORT'] },
            ],
          },
          {
            id: 'pam-setup',
            title: 'Setup',
            icon: 'setting',
            type: 'submenu',
            authorities: ['DIS_OP_PRIVILEGE_MANAGEMENT', 'OP_PRIVILEGE_MANAGEMENT', 'OP_PRIVILEGE_RULES'],
            children: [
              { id: 'privileges', title: 'Privileges', icon: 'key', link: '/pam/setup/privileges', type: 'item', authorities: ['DIS_OP_PRIVILEGE_MANAGEMENT', 'OP_PRIVILEGE_MANAGEMENT'] },
              { id: 'review-rule', title: 'Review Rule', icon: 'audit', link: '/pam/setup/review-rule', type: 'item', authorities: ['OP_PRIVILEGE_RULES', 'DIS_OP_PRIVILEGE_RULES'] },
              { id: 'reasons', title: 'Reasons', icon: 'message', link: '/pam/setup/reason', type: 'item', authorities: ['OP_PRIVILEGE_REASON'] },
              {
                id: 'pam-synchronize',
                title: 'Synchronize',
                icon: 'sync',
                type: 'submenu',
                children: [
                  { id: 'sync-jobs', title: 'Jobs', icon: 'play-circle', link: '/pam/setup/synchronize/jobs', type: 'item' },
                  { id: 'sync-schedulers', title: 'Schedulers', icon: 'clock-circle', link: '/pam/setup/synchronize/schedulers', type: 'item' },
                ],
              },
            ],
          },
          {
            id: 'ff-log-review',
            title: 'FF Log Review',
            icon: 'safety-certificate',
            type: 'submenu',
            authorities: ['OP_FF_LOG_REVIEW'],
            children: [
              { id: 'ff-dashboard', title: 'Dashboard', icon: 'dashboard', link: '/pam/ff-log-review/dashboard', type: 'item' },
              { id: 'ff-sessions', title: 'Sessions', icon: 'unordered-list', link: '/pam/ff-log-review/sessions', type: 'item' },
              { id: 'ff-gaps', title: 'Gaps', icon: 'warning', link: '/pam/ff-log-review/gaps', type: 'item' },
            ],
          },
        ],
      },
      {
        id: 'cam',
        title: 'CAM',
        icon: 'solution',
        type: 'submenu',
        authorities: ['OP_USER_MANAGEMENT_SINGLE_CREATE', 'OP_USER_MANAGEMENT_SINGLE_CHANGE', 'OP_USER_MANAGEMENT_WORKFLOW_REQUESTS', 'OP_USER_MANAGEMENT_WORKFLOW_WORKFLOW', 'OP_ARC_ADMIN', 'OP_ARC_REVIEW'],
        children: [
          {
            id: 'cam-self-service',
            title: 'Self-Service',
            icon: 'user',
            type: 'submenu',
            children: [
              { id: 'ss-request-access', title: 'Request Access', icon: 'plus-circle', link: '/cam/self-service/request-access', type: 'item' },
              { id: 'ss-requests', title: 'My Requests', icon: 'file-text', link: '/cam/self-service/requests', type: 'item' },
              { id: 'ss-user-actions', title: 'Unlock / Reset Password', icon: 'unlock', link: '/cam/self-service/user-actions', type: 'item' },
            ],
          },
          {
            id: 'operations',
            title: 'Operations',
            icon: 'tool',
            type: 'submenu',
            authorities: ['OP_USER_MANAGEMENT_SINGLE_CREATE', 'OP_USER_MANAGEMENT_SINGLE_CHANGE'],
            children: [
              { id: 'single-create', title: 'Single Create', icon: 'user-add', link: '/cam/operations/single/create', type: 'item', authorities: ['OP_USER_MANAGEMENT_SINGLE_CREATE'] },
              { id: 'single-change', title: 'Single Change', icon: 'edit', link: '/cam/operations/single/change', type: 'item', authorities: ['OP_USER_MANAGEMENT_SINGLE_CHANGE'] },
              { id: 'user-actions', title: 'User Actions', icon: 'setting', link: '/cam/operations/user-actions', type: 'item' },
              { id: 'batch', title: 'Batch Operations', icon: 'group', link: '/cam/operations/batch', type: 'item', authorities: ['OP_USER_MANAGEMENT_BATCH'] },
            ],
          },
          {
            id: 'cam-workflow',
            title: 'Workflow',
            icon: 'branches',
            type: 'submenu',
            authorities: ['OP_USER_MANAGEMENT_WORKFLOW_REQUESTS', 'OP_USER_MANAGEMENT_WORKFLOW_WORKFLOW'],
            children: [
              { id: 'my-requests', title: 'My Requests', icon: 'file-text', link: '/cam/workflow/my-requests', type: 'item', authorities: ['OP_USER_MANAGEMENT_WORKFLOW_REQUESTS'] },
              { id: 'to-approve', title: 'To Approve', icon: 'check-circle', link: '/cam/workflow/to-approve', type: 'item', authorities: ['OP_USER_MANAGEMENT_WORKFLOW_TO_APPROVE'] },
              { id: 'all-requests', title: 'All Requests', icon: 'container', link: '/cam/workflow/all-requests', type: 'item', authorities: ['OP_USER_MANAGEMENT_WORKFLOW_ALL_REQUESTS'] },
              { id: 'workflows', title: 'Workflows', icon: 'apartment', link: '/cam/workflow/workflows', type: 'item', authorities: ['OP_USER_MANAGEMENT_WORKFLOW_WORKFLOW'] },
              { id: 'workflow-nodes', title: 'Workflow Nodes', icon: 'partition', link: '/cam/workflow/nodes', type: 'item', authorities: ['OP_USER_MANAGEMENT_WORKFLOW_WORKFLOW'] },
              {
                id: 'workflow-audit-logs', title: 'Audit Logs', icon: 'file-search', type: 'submenu', authorities: ['OP_USER_MANAGEMENT_WORKFLOW_WORKFLOW'], children: [
                  { id: 'wf-audit-workflow', title: 'Workflow Log', icon: 'branches', link: '/cam/workflow/audit-logs/workflow', type: 'item' },
                  { id: 'wf-audit-node', title: 'Node Log', icon: 'partition', link: '/cam/workflow/audit-logs/node', type: 'item' },
                  { id: 'wf-audit-delegation', title: 'Delegation Log', icon: 'team', link: '/cam/workflow/audit-logs/delegation', type: 'item' },
                ]
              },
            ],
          },
          {
            id: 'uar',
            title: 'User Access Review',
            icon: 'file-search',
            type: 'submenu',
            authorities: ['OP_ARC_ADMIN', 'OP_ARC_REVIEW'],
            children: [
              { id: 'uar-job-schedule', title: 'Job Schedule', icon: 'schedule', link: '/cam/user-access-review/uar-jobs', type: 'item', authorities: ['OP_ARC_ADMIN'] },
              { id: 'uar-jobs', title: 'Review Tasks', icon: 'audit', link: '/cam/user-access-review/jobs', type: 'item', authorities: ['OP_ARC_ADMIN'] },
              { id: 'uar-reviews', title: 'My Reviews', icon: 'eye', link: '/cam/user-access-review/reviews', type: 'item', authorities: ['OP_ARC_REVIEW'] },
              {
                id: 'uar-dashboards', title: 'Dashboards', icon: 'dashboard', type: 'submenu', authorities: ['OP_ARC_ADMIN'], children: [
                  { id: 'uar-dash-progress', title: 'Review Progress', icon: 'fund', link: '/cam/user-access-review/dashboards/review-progress', type: 'item', authorities: ['OP_ARC_ADMIN'] },
                  { id: 'uar-dash-trends', title: 'Review Trends', icon: 'line-chart', link: '/cam/user-access-review/dashboards/review-trends', type: 'item', authorities: ['OP_ARC_ADMIN'] },
                  { id: 'uar-dash-performance', title: 'Reviewer Performance', icon: 'user', link: '/cam/user-access-review/dashboards/reviewer-performance', type: 'item', authorities: ['OP_ARC_ADMIN'] },
                  { id: 'uar-dash-system', title: 'System-wise Review', icon: 'cluster', link: '/cam/user-access-review/dashboards/system-wise-review', type: 'item', authorities: ['OP_ARC_ADMIN'] },
                ]
              },
            ],
          },
          {
            id: 'cam-settings',
            title: 'Settings',
            icon: 'setting',
            type: 'submenu',
            children: [
              { id: 'user-restrictions', title: 'User Restrictions', icon: 'lock', link: '/cam/settings/user-restrictions', type: 'item' },
              { id: 'role-catalogue', title: 'Role Catalogue', icon: 'book', link: '/cam/settings/role-catalogue', type: 'item' },
              { id: 'approval-delegation', title: 'Approval Delegation', icon: 'audit', link: '/cam/settings/approval-delegation', type: 'item' },
              { id: 'request-params', title: 'Request Parameters', icon: 'control', link: '/cam/settings/request-params', type: 'item' },
              { id: 'user-provision-field', title: 'User Provision Fields', icon: 'profile', link: '/cam/settings/user-provision-field', type: 'item' },
              { id: 'sap-system', title: 'SAP Systems', icon: 'cloud-server', link: '/cam/settings/sap-system', type: 'item' },
            ],
          },
        ],
      },
      {
        id: 'css',
        title: 'CSS',
        icon: 'safety-certificate',
        type: 'submenu',
        children: [
          {
            id: 'cs-rules', title: 'Cyber Security Rules', icon: 'safety-certificate', type: 'submenu',
            children: [
              { id: 'css-parameters', title: 'Parameters', icon: 'control', link: '/css/sap-parameters/sap-parameter', type: 'item' },
              { id: 'css-btp-commands', title: 'BTP Commands', icon: 'code', link: '/css/btp/command', type: 'item' },
              { id: 'css-rules', title: 'Rules', icon: 'file-text', link: '/css/sap-parameters/parameter-rules', type: 'item' },
            ],
          },
          {
            id: 'css-monitoring', title: 'CSS Monitoring', icon: 'monitor', type: 'submenu',
            children: [
              { id: 'css-rule-books', title: 'Rule Books', icon: 'book', link: '/css/monitoring/sap-rule-book', type: 'item' },
              { id: 'css-job-history', title: 'Job History', icon: 'history', link: '/css/monitoring/job-history', type: 'item' },
              { id: 'css-violations', title: 'Violations', icon: 'warning', link: '/css/monitoring/parameter-violations', type: 'item' },
              { id: 'css-issue-analytics', title: 'Issue Analytics', icon: 'bar-chart', link: '/css/monitoring/issue-analytics', type: 'item' },
              {
                id: 'css-rfc-monitor', title: 'RFC Monitor', icon: 'api', type: 'submenu',
                children: [
                  { id: 'css-rfc-dashboard', title: 'Dashboard', icon: 'dashboard', link: '/css/monitoring/rfc-monitoring', type: 'item' },
                  { id: 'css-rfc-connections', title: 'Connections', icon: 'link', link: '/css/monitoring/rfc-monitoring/connections', type: 'item' },
                  { id: 'css-rfc-scan-rules', title: 'Scan Rules', icon: 'scan', link: '/css/monitoring/rfc-monitoring/rules', type: 'item' },
                  { id: 'css-rfc-schedulers', title: 'Schedulers', icon: 'schedule', link: '/css/monitoring/rfc-schedulers', type: 'item' },
                ],
              },
            ],
          },
          { id: 'css-compliance', title: 'Compliance Dashboard', icon: 'fund-projection-screen', link: '/css/compliance-dashboard', type: 'item' },
          { id: 'css-security-dashboard', title: 'Security Dashboard', icon: 'monitor', link: '/css/cyber-security-dashboard', type: 'item' },
        ],
      },
      {
        id: 'icm',
        title: 'ICM',
        icon: 'reconciliation',
        type: 'submenu',
        // TODO: restore authorities: ['OP_ICM_RULES', 'DIS_OP_ICM_RULES', 'OP_ICM_CONTROLS', 'OP_ICM_EXECUTION', 'OP_ICM_MASTER_DATA'],
        children: [
          { id: 'icm-dashboard', title: 'Dashboard', icon: 'dashboard', link: '/icm/dashboard', type: 'item' },
          { id: 'icm-rules', title: 'Rules', icon: 'file-text', link: '/icm/rules', type: 'item' },
          { id: 'icm-controls', title: 'Controls', icon: 'safety-certificate', link: '/icm/controls', type: 'item' },
          { id: 'icm-control-books', title: 'Control Books', icon: 'book', link: '/icm/control-books', type: 'item' },
          { id: 'icm-deficiency', title: 'Control Deficiency', icon: 'warning', link: '/icm/control-deficiency', type: 'item' },
          { id: 'icm-results', title: 'Control Results', icon: 'bar-chart', link: '/icm/control-results', type: 'item' },
          { id: 'icm-control-tasks', title: 'Control Tasks', icon: 'carry-out', link: '/icm/control-tasks', type: 'item' },
          { id: 'icm-schedulers', title: 'Schedulers', icon: 'clock-circle', link: '/icm/schedulers', type: 'item' },
          { id: 'icm-monitoring', title: 'Control Monitoring', icon: 'monitor', link: '/icm/control-monitoring', type: 'item' },
          { id: 'icm-execution', title: 'Execution', icon: 'rocket', link: '/icm/execution', type: 'item' },
          {
            id: 'icm-master-data', title: 'Master Data', icon: 'database', type: 'submenu',
            children: [
              { id: 'icm-master-data-home', title: 'Overview', icon: 'appstore', link: '/icm/master-data', type: 'item' },
              { id: 'icm-manual-scripts', title: 'Manual Scripts', icon: 'file-text', link: '/icm/master-data/scripts', type: 'item' },
              { id: 'icm-step-library', title: 'Step Library', icon: 'read', link: '/icm/master-data/step-library', type: 'item' },
            ],
          },
        ],
      },
      {
        id: 'central-users',
        title: 'Central Users',
        icon: 'idcard',
        type: 'submenu',
        authorities: ['OP_CENTRAL_USER_ADMIN'],
        children: [
          {
            id: 'user-admin',
            title: 'User Admin',
            icon: 'safety-certificate',
            type: 'submenu',
            authorities: ['OP_CENTRAL_USER_ADMIN'],
            children: [
              { id: 'user-admin-dashboard', title: 'Dashboard', icon: 'appstore', link: '/central-users/user-admin/dashboard', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              { id: 'user-admin-users', title: 'User Search', icon: 'search', link: '/central-users/user-admin/users', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              { id: 'user-admin-systems', title: 'System Landscape', icon: 'cluster', link: '/central-users/user-admin/systems', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              { id: 'user-admin-operations', title: 'Operations', icon: 'thunderbolt', link: '/central-users/user-admin/operations-console', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              { id: 'central-user-pivot-report', title: 'Central User Pivot Report', icon: 'bar-chart', link: '/central-users/central-users-db/pivot-report', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              {
                id: 'inactive-user',
                title: 'Inactive User',
                icon: 'team',
                type: 'submenu',
                authorities: ['OP_CENTRAL_USER_ADMIN'],
                children: [
                  { id: 'central-user-lock-parameters', title: 'Lock Parameters', icon: 'lock', link: '/central-users/central-users-db/lock-parameters', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
                  { id: 'inactive-user-jobs', title: 'Jobs', icon: 'shop', link: '/central-users/central-users-db/jobs', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
                ],
              },
            ],
          },
          {
            id: 'system-license-management',
            title: 'System License Management',
            icon: 'desktop',
            type: 'submenu',
            authorities: ['OP_CENTRAL_USER_ADMIN'],
            children: [
              { id: 'fue-dashboard', title: 'FUE Dashboard', icon: 'bar-chart', link: '/central-users/system-license-management/fue-dashboard', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              { id: 'system-license-info', title: 'System License Info', icon: 'info-circle', link: '/central-users/system-license-management/system-license-info', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              { id: 'license-rules', title: 'License Rules', icon: 'file-text', link: '/central-users/system-license-management/license-rules', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              { id: 'license-indirect-usage', title: 'License Indirect Usage', icon: 'scan', link: '/central-users/system-license-management/license-indirect-usage', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              { id: 'license-management', title: 'License Management', icon: 'key', link: '/central-users/system-license-management/license-management', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              { id: 'license-jobs', title: 'Jobs', icon: 'shop', link: '/central-users/system-license-management/jobs', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              { id: 'license-pivot-report', title: 'Pivot Report', icon: 'bar-chart', link: '/central-users/system-license-management/pivot-report', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
              { id: 'fue-types', title: 'FUE Types', icon: 'control', link: '/central-users/system-license-management/fue-types', type: 'item', authorities: ['OP_CENTRAL_USER_ADMIN'] },
            ],
          },
        ],
      },
      {
        id: 'sap-abap-scanner',
        title: 'ABAP Scanner',
        icon: 'scan',
        type: 'submenu',
        authorities: ['OP_ABAP_SCANNER'],
        children: [
          { id: 'code-scan', title: 'Code Scan', icon: 'code', link: '/sap-abap-scanner/code-scan', type: 'item' },
          { id: 'scan-results', title: 'Scan Results', icon: 'file-done', link: '/sap-abap-scanner/scan-results', type: 'item' },
        ],
      },
      {
        id: 'admin',
        title: 'Administration',
        icon: 'setting',
        type: 'submenu',
        authorities: ['OP_ADMIN_AUTHENTICATION', 'OP_ADMIN_SETTINGS', 'OP_ADMIN_AUDIT_LOGS', 'OP_ADMIN_DATA_SYNC', 'OP_ADMIN_ROLES'],
        children: [
          {
            id: 'auth-mgmt',
            title: 'Authentication',
            icon: 'lock',
            type: 'submenu',
            children: [
              { id: 'auth-users', title: 'Users', icon: 'user', link: '/admin/authentication/users', type: 'item' },
              { id: 'auth-login-history', title: 'Login History', icon: 'schedule', link: '/admin/authentication/loginEvents', type: 'item' },
              { id: 'auth-blocked-ips', title: 'Blocked IPs', icon: 'lock', link: '/admin/authentication/blockedIps', type: 'item' },
              { id: 'auth-operations', title: 'Operations', icon: 'control', link: '/admin/authentication/operation', type: 'item' },
              { id: 'auth-oauth2', title: 'OAuth2', icon: 'key', link: '/admin/authentication/oauth2', type: 'item' },
            ],
          },
          { id: 'roles', title: 'Roles', icon: 'team', link: '/admin/roles', type: 'item', authorities: ['OP_ADMIN_ROLES'] },
          { id: 'role-concept', title: 'Role Concept', icon: 'idcard', link: '/admin/role-concept', type: 'item', authorities: ['OP_ADMIN_ROLES'] },
          { id: 'reporting-units', title: 'Reporting Units', icon: 'bank', link: '/admin/reporting-units', type: 'item' },
          {
            id: 'communication', title: 'Communication', icon: 'mail', type: 'submenu',
            children: [
              { id: 'comm-email-settings', title: 'Email Settings', icon: 'setting', link: '/admin/communication/email/settings', type: 'item' },
              { id: 'comm-email-logs', title: 'Email Logs', icon: 'file-text', link: '/admin/communication/email/logs', type: 'item' },
              { id: 'comm-template', title: 'Email Template', icon: 'snippets', link: '/admin/communication/template', type: 'item' },
              { id: 'comm-logo', title: 'Logo', icon: 'picture', link: '/admin/communication/logo', type: 'item' },
            ],
          },
          { id: 'ai-integration', title: 'AI Integration', icon: 'robot', link: '/admin/ai-integration', type: 'item' },
          { id: 'teams-activity', title: 'Teams Activity', icon: 'team', link: '/admin/teams-activity', type: 'item' },
          {
            id: 'servicenow', title: 'ServiceNow', icon: 'cloud', type: 'submenu',
            children: [
              { id: 'snow-data-explorer', title: 'Data Explorer', icon: 'database', link: '/admin/servicenow', type: 'item' },
              { id: 'snow-agent', title: 'SNOW Agent', icon: 'robot', link: '/admin/servicenow/agent', type: 'item' },
              { id: 'snow-sync-settings', title: 'Sync Settings', icon: 'sync', link: '/admin/servicenow/sync-settings', type: 'item' },
            ]
          },
          { id: 'settings', title: 'Settings', icon: 'setting', link: '/admin/settings', type: 'item' },
          { id: 'event-viewer', title: 'Event Viewer', icon: 'eye', link: '/admin/event-viewer', type: 'item' },
          { id: 'audit-logs', title: 'Audit Logs', icon: 'file-search', link: '/admin/audit-logs', type: 'item' },
          { id: 'data-sync', title: 'Data Synchronization', icon: 'sync', link: '/admin/data-synchronization', type: 'item' },
          { id: 'content-import', title: 'Content Import', icon: 'import', link: '/admin/content-import', type: 'item' },
          {
            id: 'iam-monitor', title: 'IAM Monitor', icon: 'idcard', type: 'submenu',
            children: [
              { id: 'identity-repo', title: 'Identity Repository', icon: 'database', link: '/admin/identity-repository', type: 'item' },
              { id: 'identity-cleanup', title: 'Identity Cleanup', icon: 'delete', link: '/admin/identity-cleanup', type: 'item' },
            ],
          },
          { id: 'readiness-check', title: 'Readiness Check', icon: 'unordered-list', link: '/admin/readiness-check', type: 'item' },
          { id: 'cis', title: 'Cloud Identity', icon: 'cloud', link: '/admin/cis', type: 'item' },
          {
            id: 'role-management', title: 'Role Management', icon: 'control', type: 'submenu',
            children: [
              { id: 'rm-org-compliance', title: 'Org Compliance', icon: 'check-square', link: '/admin/role-management/org-compliance', type: 'item' },
              { id: 'rm-org-templates', title: 'Org Templates', icon: 'reconciliation', link: '/admin/role-management/org-templates', type: 'item' },
              { id: 'rm-role-org-values', title: 'Role Org Values', icon: 'database', link: '/admin/role-management/role-org-values', type: 'item' },
              { id: 'rm-rc-concepts', title: 'RC Concepts', icon: 'branches', link: '/admin/role-management/rc-concepts', type: 'item' },
              { id: 'rm-rc-sync-config', title: 'RC Sync Config', icon: 'sync', link: '/admin/role-management/rc-sync-config', type: 'item' },
              {
                id: 'rm-security-reports', title: 'Security Reports', icon: 'safety', type: 'submenu',
                children: [
                  { id: 'rm-security-dashboard', title: 'Dashboard', icon: 'dashboard', link: '/security-reports/dashboard', type: 'item' },
                  { id: 'rm-role-analysis', title: 'Role Analysis', icon: 'bar-chart', link: '/security-reports/role-analysis', type: 'item' }
                ]
              },
            ],
          },
        ],
      },
      {
        id: 'general',
        title: 'General',
        icon: 'appstore',
        type: 'submenu',
        children: [
          { id: 'general-issues', title: 'Issues', icon: 'exception', link: '/general/issues', type: 'item' },
          { id: 'general-export-results', title: 'Export Results', icon: 'export', link: '/general/export-results', type: 'item' },
          { id: 'general-query-management', title: 'Query Management', icon: 'database', link: '/general/query-management', type: 'item' },
          { id: 'general-visual-query-builder', title: 'Visual Query Builder', icon: 'table', link: '/general/visual-query-builder', type: 'item' },
          { id: 'general-bpmn-diagram', title: 'BPMN Diagram', icon: 'branches', link: '/general/bpmn-diagram', type: 'item' },
          {
            id: 'general-control-framework',
            title: 'Control Framework',
            icon: 'audit',
            type: 'submenu',
            children: [
              { id: 'cf-overview', title: 'Overview', icon: 'appstore', link: '/general/control-framework/overview', type: 'item' },
              { id: 'cf-controls', title: 'Controls Report', icon: 'safety-certificate', link: '/general/control-framework/controls', type: 'item' },
              { id: 'cf-dashboard', title: 'Documentation', icon: 'read', link: '/general/control-framework/dashboard', type: 'item' },
            ],
          },
        ],
      },
      {
        id: 'help-center',
        title: 'Help Center',
        icon: 'question-circle',
        type: 'submenu',
        children: [
          { id: 'hc-dashboard', title: 'Dashboard', icon: 'home', link: '/help-center', type: 'item' },
          { id: 'hc-api-docs', title: 'API Documentation', icon: 'api', link: '/help-center/api-documentation', type: 'item' },
          { id: 'hc-changelog', title: 'Changelog', icon: 'history', link: '/help-center/changelog', type: 'item' },
        ],
      },
    ];
  }
}
