import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { NoAuthGuard } from './core/auth/no-auth.guard';
import { LayoutComponent } from './layout/layout.component';

const routes: Routes = [
  // Redirect empty path to landing
  { path: '', pathMatch: 'full', redirectTo: 'landing' },
  { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'landing' },

  // Guest auth routes (no auth required)
  {
    path: 'sign-in',
    canActivate: [NoAuthGuard],
    loadChildren: () => import('./pages/auth/sign-in/sign-in.module').then(m => m.SignInModule),
  },
  {
    path: 'sign-up',
    canActivate: [NoAuthGuard],
    loadChildren: () => import('./pages/auth/sign-up/sign-up.module').then(m => m.SignUpModule),
  },
  {
    path: 'forgot-password',
    canActivate: [NoAuthGuard],
    loadChildren: () => import('./pages/auth/forgot-password/forgot-password.module').then(m => m.ForgotPasswordModule),
  },
  {
    path: 'reset-password',
    canActivate: [NoAuthGuard],
    loadChildren: () => import('./pages/auth/reset-password/reset-password.module').then(m => m.ResetPasswordModule),
  },
  {
    path: 'confirmation-required',
    canActivate: [NoAuthGuard],
    loadChildren: () => import('./pages/auth/confirmation-required/confirmation-required.module').then(m => m.ConfirmationRequiredModule),
  },
  {
    path: 'unlock-session',
    canActivate: [NoAuthGuard],
    loadChildren: () => import('./pages/auth/unlock-session/unlock-session.module').then(m => m.UnlockSessionModule),
  },

  // Public routes (no auth)
  {
    path: 'public',
    loadChildren: () => import('./pages/public/public.module').then(m => m.PublicModule),
  },

  // Auth routes (sign-out)
  {
    path: 'sign-out',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/auth/sign-out/sign-out.module').then(m => m.SignOutModule),
  },

  // Authenticated routes with layout
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      // Landing / Dashboard
      {
        path: 'landing',
        loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule),
      },

      // ─── ACM ─────────────────────────────────────────
      {
        path: 'acm/rule-book',
        loadChildren: () => import('./pages/acm/rule-book/rule-book.module').then(m => m.RuleBookModule),
      },
      {
        path: 'acm/master-data',
        loadChildren: () => import('./pages/acm/master-data/master-data.module').then(m => m.MasterDataModule),
      },
      {
        path: 'acm/rem',
        loadChildren: () => import('./pages/acm/rem/rem.module').then(m => m.RemModule),
      },
      {
        path: 'acm/risk-analysis',
        loadChildren: () => import('./pages/acm/risk-analysis/risk-analysis.module').then(m => m.RiskAnalysisModule),
      },
      {
        path: 'acm/reports',
        loadChildren: () => import('./pages/acm/reports/reports.module').then(m => m.ReportsModule),
      },
      {
        path: 'acm/risk-analysis-dashboard',
        loadChildren: () => import('./pages/acm/risk-analysis-dashboard/risk-analysis-dashboard.module').then(m => m.RiskAnalysisDashboardModule),
      },
      {
        path: 'acm/risk-view-bpmn',
        loadChildren: () => import('./pages/acm/risk-view-bpmn/risk-view-bpmn.module').then(m => m.RiskViewBpmnModule),
      },

      // ─── PAM ─────────────────────────────────────────
      {
        path: 'pam/requests',
        loadChildren: () => import('./pages/pam/requests/requests.module').then(m => m.RequestsModule),
      },
      {
        path: 'pam/reports',
        loadChildren: () => import('./pages/pam/reports/reports.module').then(m => m.PamReportsModule),
      },
      {
        path: 'pam/setup',
        loadChildren: () => import('./pages/pam/setup/setup.module').then(m => m.SetupModule),
      },
      {
        path: 'pam/overview-dashboard',
        loadChildren: () => import('./pages/pam/dashboards/overview/overview-dashboard.module').then(m => m.OverviewDashboardModule),
      },
      {
        path: 'pam/usage-dashboard',
        loadChildren: () => import('./pages/pam/dashboards/usage/usage-dashboard.module').then(m => m.UsageDashboardModule),
      },
      {
        path: 'pam/workflow-dashboard',
        loadChildren: () => import('./pages/pam/dashboards/workflow/workflow-dashboard.module').then(m => m.WorkflowDashboardModule),
      },
      {
        path: 'pam/audit-dashboard',
        loadChildren: () => import('./pages/pam/dashboards/audit/audit-dashboard.module').then(m => m.AuditDashboardModule),
      },
      {
        path: 'pam/ff-log-review',
        loadChildren: () => import('./pages/pam/ff-log-review/ff-log-review.module').then(m => m.FfLogReviewModule),
      },

      // ─── CAM ─────────────────────────────────────────
      {
        path: 'cam/operations',
        loadChildren: () => import('./pages/cam/operations/operations.module').then(m => m.OperationsModule),
      },
      {
        path: 'cam/self-service',
        loadChildren: () => import('./pages/cam/self-service/self-service.module').then(m => m.SelfServiceModule),
      },
      {
        path: 'cam/workflow',
        loadChildren: () => import('./pages/cam/workflow/workflow.module').then(m => m.WorkflowModule),
      },
      {
        path: 'cam/settings/user-restrictions',
        loadChildren: () => import('./pages/cam/settings/user-restrictions/user-restrictions.module').then(m => m.UserRestrictionsModule),
      },
      {
        path: 'cam/settings/role-catalogue',
        loadChildren: () => import('./pages/cam/settings/role-catalogue/role-catalogue.module').then(m => m.RoleCatalogueModule),
      },
      {
        path: 'cam/settings/approval-delegation',
        loadChildren: () => import('./pages/cam/settings/approval-delegation/approval-delegation.module').then(m => m.ApprovalDelegationModule),
      },
      {
        path: 'cam/settings/request-params',
        loadChildren: () => import('./pages/cam/settings/request-params/request-params.module').then(m => m.RequestParamsModule),
      },
      {
        path: 'cam/settings/user-provision-field',
        loadChildren: () => import('./pages/cam/settings/user-provision-field/user-provision-field.module').then(m => m.UserProvisionFieldModule),
      },
      {
        path: 'cam/settings/sap-system',
        loadChildren: () => import('./pages/cam/settings/sap-system/sap-system.module').then(m => m.SapSystemModule),
      },
      {
        path: 'cam/user-access-review/jobs',
        loadChildren: () => import('./pages/cam/user-access-review/review-jobs/review-jobs.module').then(m => m.ReviewJobsModule),
      },
      {
        path: 'cam/user-access-review/uar-jobs',
        loadChildren: () => import('./pages/cam/user-access-review/uar-jobs/uar-jobs.module').then(m => m.UarJobsModule),
      },
      {
        path: 'cam/user-access-review/review-user-batch',
        loadChildren: () => import('./pages/cam/user-access-review/review-user-batch/review-user-batch.module').then(m => m.ReviewUserBatchModule),
      },
      {
        path: 'cam/user-access-review/dashboards',
        loadChildren: () => import('./pages/cam/uar-dashboards/dashboards.module').then(m => m.UarDashboardsModule),
      },
      {
        path: 'cam',
        loadChildren: () => import('./pages/cam/cam.module').then(m => m.CamModule),
      },

      // ─── ICM ─────────────────────────────────────────
      {
        path: 'icm',
        loadChildren: () => import('./pages/icm/icm.module').then(m => m.IcmModule),
      },

      // ─── CSS (Cyber Security) ─────────────────────────
      {
        path: 'css/sap-parameters',
        loadChildren: () => import('./pages/css/sap-parameters/sap-parameters.module').then(m => m.SapParametersModule),
      },
      {
        path: 'css/sap-audit-log',
        loadChildren: () => import('./pages/css/sap-audit-log/sap-audit-log.module').then(m => m.SapAuditLogModule),
      },
      {
        path: 'css/monitoring',
        loadChildren: () => import('./pages/css/monitoring/css-monitoring.module').then(m => m.CssMonitoringModule),
      },
      {
        path: 'css/shared',
        loadChildren: () => import('./pages/css/css-shared/css-shared.module').then(m => m.CssSharedModule),
      },

      // ─── Security Reports ────────────────────────────
      {
        path: 'security-reports',
        loadChildren: () => import('./pages/security-reports/security-reports.module').then(m => m.SecurityReportsModule),
      },

      {
        path: 'css/btp',
        loadChildren: () => import('./pages/css/btp/btp.module').then(m => m.BtpModule),
      },
      {
        path: 'css/hanadb',
        loadChildren: () => import('./pages/css/hanadb/hana.module').then(m => m.HanaModule),
      },
      {
        path: 'css/compliance-dashboard',
        loadChildren: () => import('./pages/css/compliance-dashboard/compliance-dashboard.module').then(m => m.ComplianceDashboardModule),
      },
      {
        path: 'css/nist-dashboard',
        loadChildren: () => import('./pages/css/nist-dashboard/nist-dashboard.module').then(m => m.NistDashboardModule),
      },
      {
        path: 'css/cyber-security-dashboard',
        loadChildren: () => import('./pages/css/cyber-security-dashboard/cyber-security-dashboard.module').then(m => m.CyberSecurityDashboardModule),
      },

      // ─── Central Users ─────────────────────────────────
      {
        path: 'central-users/system-license-management',
        loadChildren: () => import('./pages/central-users/system-license-management/system-license-management.module').then(m => m.SystemLicenseManagementModule),
      },
      {
        path: 'central-users/central-users-db',
        loadChildren: () => import('./pages/central-users/central-users-db/central-users-db.module').then(m => m.CentralUsersDbModule),
      },
      {
        path: 'central-users/user-admin',
        loadChildren: () => import('./pages/central-users/central-user-admin/central-user-admin.module').then(m => m.CentralUserAdminModule),
      },

      // ─── SAP ABAP Scanner ─────────────────────────────
      {
        path: 'sap-abap-scanner',
        loadChildren: () => import('./pages/sap-abap-scanner/sap-abap-scanner.module').then(m => m.SapAbapScannerModule),
      },

      // ─── Administration ─────────────────────────────────
      {
        path: 'admin/roles',
        loadChildren: () => import('./pages/admin/roles/role.module').then(m => m.RoleModule),
      },
      {
        path: 'admin/authentication',
        loadChildren: () => import('./pages/admin/authentication/authentication.module').then(m => m.AuthenticationModule),
      },
      {
        path: 'admin/authentication/oauth2',
        loadChildren: () => import('./pages/admin/authentication/oauth2/oauth2.module').then(m => m.OAuth2Module),
      },
      {
        path: 'admin/reporting-units',
        loadChildren: () => import('./pages/admin/reporting-units/reporting-units.module').then(m => m.ReportingUnitsModule),
      },
      {
        path: 'admin/communication',
        loadChildren: () => import('./pages/admin/communication/communication.module').then(m => m.CommunicationModule),
      },
      {
        path: 'admin/event-viewer',
        loadChildren: () => import('./pages/admin/event-viewer/event-viewer.module').then(m => m.EventViewerModule),
      },
      {
        path: 'admin/settings',
        loadChildren: () => import('./pages/admin/settings/settings.module').then(m => m.SettingsModule),
      },
      {
        path: 'admin/audit-logs',
        loadChildren: () => import('./pages/admin/audit-logs/audit-logs.module').then(m => m.AuditLogsModule),
      },
      {
        path: 'admin/data-synchronization',
        loadChildren: () => import('./pages/admin/data-synchronization/data-sync.module').then(m => m.DataSyncModule),
      },
      {
        path: 'admin/content-import',
        loadChildren: () => import('./pages/admin/content-import/content-import.module').then(m => m.ContentImportModule),
      },
      {
        path: 'admin/identity-repository',
        loadChildren: () => import('./pages/admin/identity-repository/identity-repository.module').then(m => m.IdentityRepositoryModule),
      },
      {
        path: 'admin/identity-cleanup',
        loadChildren: () => import('./pages/admin/identity-cleanup/identity-cleanup.module').then(m => m.IdentityCleanupModule),
      },
      {
        path: 'admin/readiness-check',
        loadChildren: () => import('./pages/admin/readiness-check/readiness-check.module').then(m => m.ReadinessCheckModule),
      },
      {
        path: 'admin/ai-integration',
        loadChildren: () => import('./pages/admin/ai-integration/ai-integration.module').then(m => m.AiIntegrationModule),
      },
      {
        path: 'admin/role-concept',
        loadChildren: () => import('./pages/admin/role-concept/role-concept.module').then(m => m.RoleConceptModule),
      },
      {
        path: 'admin/teams-activity',
        loadChildren: () => import('./pages/admin/teams-activity/teams-activity.module').then(m => m.TeamsActivityModule),
      },
      {
        path: 'admin/servicenow',
        loadChildren: () => import('./pages/admin/servicenow/servicenow.module').then(m => m.ServiceNowModule),
      },
      {
        path: 'admin/cis',
        loadChildren: () => import('./pages/admin/cis/cis.module').then(m => m.CISModule),
      },
      {
        path: 'admin/role-management',
        loadChildren: () => import('./pages/admin/role-management/role-management.module').then(m => m.RoleManagementModule),
      },

      // ─── Help & User ─────────────────────────────────
      {
        path: 'help-center',
        loadChildren: () => import('./pages/help-center/help-center.module').then(m => m.HelpCenterModule),
      },
      {
        path: 'user',
        loadChildren: () => import('./pages/user/user.module').then(m => m.UserModule),
      },
      {
        path: 'general',
        loadChildren: () => import('./pages/general/general.module').then(m => m.GeneralModule),
      },

      // ─── HELP CENTER ─────────────────────────────────────────
      {
        path: 'help-center',
        loadChildren: () => import('./pages/help-center/help-center.module').then(m => m.HelpCenterModule),
      }
    ],
  },

  // Catch-all redirect
  { path: '**', redirectTo: 'landing' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
