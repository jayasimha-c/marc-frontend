import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SapAbapScannerComponent } from './sap-abap-scanner.component';
import { PatternDetectionComponent } from './pattern-detection/pattern-detection.component';
import { AddPatternComponent } from './pattern-detection/add-pattern/add-pattern.component';
import { EditPatternPageComponent } from './pattern-detection/edit-pattern-page/edit-pattern-page.component';
import { RulesManagementComponent } from './rules-management/rules-management.component';
import { AddAbapRuleComponent } from './rules-management/add-abap-rule/add-abap-rule.component';
import { ViewPatternListComponent } from './rules-management/add-abap-rule/view-pattern-list/view-pattern-list.component';
import { AddAbapPatternModalComponent } from './rules-management/add-abap-rule/view-pattern-list/add-abap-pattern-modal/add-abap-pattern-modal.component';
import { RuleImportWizardComponent } from './rules-management/rule-import-wizard/rule-import-wizard.component';
import { CodeScanListComponent } from './code-scan/code-scan-list/code-scan-list.component';
import { CodeScanComponent } from './code-scan/code-scan.component';
import { BrowseProgramsModalComponent } from './code-scan/browse-programs-modal/browse-programs-modal.component';
import { ViewRulesListComponent } from './code-scan/view-rules-list/view-rules-list.component';
import { AddAbapRuleModalComponent } from './code-scan/view-rules-list/add-abap-rule-modal/add-abap-rule-modal.component';
import { ScheduledScansComponent } from './scheduled-scans/scheduled-scans.component';
import { AddAbapScheduledScanComponent } from './scheduled-scans/add-abap-scheduled-scan/add-abap-scheduled-scan.component';
import { ScanResultsListComponent } from './scan-results/scan-results-list/scan-results-list.component';
import { ScanResultEnhancedComponent } from './scan-results/scan-result-enhanced/scan-result-enhanced.component';
import { ScanHistoryComponent } from './scan-history/scan-history.component';
import { JobHistoryComponent } from './job-history/job-history.component';
import { ProgramViolationDetailsComponent } from './program-violations/program-violation-details.component';
import { ProgramHistoryComponent } from './program-history/program-history.component';
import { AbapDashboardComponent } from './dashboard/dashboard.component';
import { AbapImporterComponent } from './import/abap-importer.component';
import { AbapImporterDialogComponent } from './import/abap-importer-dialog.component';
import { AbapSourceModalComponent } from './import/abap-source-modal.component';
import { WhitelistManagementComponent } from './whitelist-management/whitelist-management.component';
import { WhitelistDetailsComponent } from './whitelist-details/whitelist-details.component';
import { PrismBlockComponent } from './prism-block/prism-block.component';

const routes: Routes = [
  {
    path: '',
    component: SapAbapScannerComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AbapDashboardComponent },
      { path: 'detection-patterns', component: PatternDetectionComponent },
      { path: 'detection-patterns/create', component: EditPatternPageComponent },
      { path: 'detection-patterns/edit/:id', component: EditPatternPageComponent },
      { path: 'rules-management', component: RulesManagementComponent },
      { path: 'rules-management/add-abap-rule', component: AddAbapRuleComponent },
      { path: 'rules-management/import-rules', component: RuleImportWizardComponent },
      { path: 'code-scan', component: CodeScanListComponent },
      { path: 'code-scan/add', component: CodeScanComponent },
      { path: 'scheduled-scans', component: ScheduledScansComponent },
      { path: 'scheduled-scans/add', component: AddAbapScheduledScanComponent },
      { path: 'scan-results', component: ScanResultsListComponent },
      { path: 'scan-results/detail', component: ScanResultEnhancedComponent },
      { path: 'scan-history', component: ScanHistoryComponent },
      { path: 'job-history', component: JobHistoryComponent },
      { path: 'program-violations/:executionId/:systemId/:programId', component: ProgramViolationDetailsComponent },
      { path: 'program-history/:executionId/:systemId/:programId', component: ProgramHistoryComponent },
      { path: 'import', component: AbapImporterComponent },
      { path: 'whitelist-management', component: WhitelistManagementComponent },
      { path: 'whitelist-details/:type', component: WhitelistDetailsComponent },
    ],
  },
];

@NgModule({
  declarations: [
    SapAbapScannerComponent,
    PatternDetectionComponent,
    AddPatternComponent,
    EditPatternPageComponent,
    RulesManagementComponent,
    AddAbapRuleComponent,
    ViewPatternListComponent,
    AddAbapPatternModalComponent,
    RuleImportWizardComponent,
    CodeScanListComponent,
    CodeScanComponent,
    BrowseProgramsModalComponent,
    ViewRulesListComponent,
    AddAbapRuleModalComponent,
    ScheduledScansComponent,
    AddAbapScheduledScanComponent,
    ScanResultsListComponent,
    ScanResultEnhancedComponent,
    ScanHistoryComponent,
    JobHistoryComponent,
    ProgramViolationDetailsComponent,
    ProgramHistoryComponent,
    AbapDashboardComponent,
    AbapImporterComponent,
    AbapImporterDialogComponent,
    AbapSourceModalComponent,
    WhitelistManagementComponent,
    WhitelistDetailsComponent,
    PrismBlockComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SapAbapScannerModule {}
