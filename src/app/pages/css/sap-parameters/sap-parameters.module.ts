import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CssSharedModule } from '../css-shared/css-shared.module';
import { SapAuditLogModule } from '../sap-audit-log/sap-audit-log.module';

// Parent
import { SapParametersComponent } from './sap-parameters.component';

// Parameter list + add
import { SapParameterComponent } from './sap-parameter/sap-parameter.component';
import { AddSapParameterComponent } from './sap-parameter/add/add-sap-parameter.component';

// Parameter rules dashboard
import { ParameterRulesComponent } from './parameter-rules/parameter-rules.component';
import { SearchSelectComponent } from './parameter-rules/search-select.component';

// Add/edit parameter rule
import { AddParameterRuleComponent } from './parameter-rules/add/add-parameter-rule.component';
import { ParameterRuleConditionsComponent } from './parameter-rules/add/parameter-rule-conditions.component';
import { SelectParameterDialog } from './parameter-rules/add/select-parameter-dialog.component';
import { AddParameterFieldFilterComponent } from './parameter-rules/add/add-parameter-field-filter/add-parameter-field-filter.component';

// Framework requirements
import { ViewFrameworkRequirementsComponent } from './parameter-rules/add/view-framework-requirements/view-framework-requirements.component';
import { AddFrameworkRequirementModalComponent } from './parameter-rules/add/view-framework-requirements/add-framework-requirement-modal/add-framework-requirement-modal.component';

const routes: Routes = [
  { path: '', redirectTo: 'parameter-rules', pathMatch: 'full' },
  { path: 'sap-parameter', component: SapParameterComponent },
  { path: 'add-sap-parameter', component: AddSapParameterComponent },
  { path: 'parameter-rules', component: ParameterRulesComponent },
  { path: 'add-parameter-rule', component: AddParameterRuleComponent },
];

@NgModule({
  declarations: [
    SapParametersComponent,
    SapParameterComponent,
    AddSapParameterComponent,
    ParameterRulesComponent,
    SearchSelectComponent,
    AddParameterRuleComponent,
    ParameterRuleConditionsComponent,
    SelectParameterDialog,
    AddParameterFieldFilterComponent,
    ViewFrameworkRequirementsComponent,
    AddFrameworkRequirementModalComponent,
  ],
  imports: [
    SharedModule,
    CssSharedModule,
    SapAuditLogModule,
    RouterModule.forChild(routes),
  ],
})
export class SapParametersModule {}
