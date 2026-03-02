import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CssSharedModule } from '../css-shared/css-shared.module';

// Main components
import { AuditRulesComponent } from './audit-rules/audit-rules.component';
import { AddAuditRuleComponent } from './audit-rules/add-rule/add-audit-rule.component';

// Filter / Grouping / Condition components
import { AuditRuleFilterComponent } from './audit-rules/add-rule/audit-rule-filter.component';
import { AuditRuleFilterAdvancedComponent } from './audit-rules/add-rule/audit-rule-filter-advanced.component';
import { AuditRuleGroupingComponent } from './audit-rules/add-rule/audit-rule-grouping.component';
import { AuditRuleConditionComponent } from './audit-rules/add-rule/audit-rule-condition.component';
import { WhitelistValuesModalComponent } from './audit-rules/add-rule/whitelist-values-modal.component';

// Audit Rule Builder sub-components
import {
  AuditRuleBuilderComponent,
  AuditConditionRowComponent,
  AuditPurposeGroupComponent,
  AuditGroupSelectorComponent,
  AuditRulePreviewComponent,
  AuditRuleScopeComponent,
  AuditValueInputComponent,
  AuditValuesDialogComponent,
} from './audit-rules/add-rule/audit-rule-builder';

const routes: Routes = [
  { path: '', redirectTo: 'audit-rules', pathMatch: 'full' },
  { path: 'audit-rules', component: AuditRulesComponent },
  { path: 'add-audit-rule', component: AddAuditRuleComponent },
];

@NgModule({
  declarations: [
    AuditRulesComponent,
    AddAuditRuleComponent,
    AuditRuleFilterComponent,
    AuditRuleFilterAdvancedComponent,
    AuditRuleGroupingComponent,
    AuditRuleConditionComponent,
    WhitelistValuesModalComponent,
    // Builder components
    AuditRuleBuilderComponent,
    AuditConditionRowComponent,
    AuditPurposeGroupComponent,
    AuditGroupSelectorComponent,
    AuditRulePreviewComponent,
    AuditRuleScopeComponent,
    AuditValueInputComponent,
    AuditValuesDialogComponent,
  ],
  imports: [SharedModule, CssSharedModule, RouterModule.forChild(routes)],
  exports: [
    // Export shared components for use by sap-parameters module
    AuditRuleFilterComponent,
    AuditRuleFilterAdvancedComponent,
    AuditRuleGroupingComponent,
    AuditRuleConditionComponent,
    WhitelistValuesModalComponent,
    AuditRuleBuilderComponent,
    AuditConditionRowComponent,
    AuditPurposeGroupComponent,
    AuditGroupSelectorComponent,
    AuditRulePreviewComponent,
    AuditRuleScopeComponent,
    AuditValueInputComponent,
    AuditValuesDialogComponent,
  ],
})
export class SapAuditLogModule {}
