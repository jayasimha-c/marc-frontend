import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { RuleBookComponent } from './rule-book.component';
import { RulesComponent } from './rules/rules.component';
import { AddRuleComponent } from './rules/add-rule/add-rule.component';
import { RuleDetailComponent as RuleDetailModalComponent } from './rules/rule-detail/rule-detail.component';
import { ObjectFilterComponent } from './rules/object-filter/object-filter.component';
import { MapBpmnTaskComponent } from './rules/map-bpmn-task/map-bpmn-task.component';
import { RisksComponent } from './risks/risks.component';
import { AddRiskComponent } from './risks/add-risk/add-risk.component';
import { AddRulesToRiskComponent } from './risks/add-rules-to-risk/add-rules-to-risk.component';
import { RiskDetailComponent } from './risks/risk-detail/risk-detail.component';
import { ConsistencyCheckComponent } from './risks/consistency-check/consistency-check.component';
import { VariantRulesComponent } from './variant/variant-rules/variant-rules.component';
import { VariantRisksComponent } from './variant/variant-risks/variant-risks.component';

const routes: Routes = [
  {
    path: '',
    component: RuleBookComponent,
    children: [
      { path: '', redirectTo: 'rules', pathMatch: 'full' },
      { path: 'rules', component: RulesComponent },
      { path: 'risks', component: RisksComponent },
      { path: 'variant/rules', component: VariantRulesComponent },
      { path: 'variant/risk', component: VariantRisksComponent },
    ],
  },
];

@NgModule({
  declarations: [
    RuleBookComponent,
    RulesComponent,
    AddRuleComponent,
    RuleDetailModalComponent,
    ObjectFilterComponent,
    MapBpmnTaskComponent,
    RisksComponent,
    AddRiskComponent,
    AddRulesToRiskComponent,
    RiskDetailComponent,
    ConsistencyCheckComponent,
    VariantRulesComponent,
    VariantRisksComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class RuleBookModule {}
