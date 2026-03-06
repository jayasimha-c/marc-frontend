import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

// Online analysis components
import { OnlineAnalysisComponent, OrgChecksModalContent } from './online/online-analysis.component';
import { PreSelectionModalComponent } from './online/pre-selection-modal.component';
import { AlertBackgroundModalComponent } from './online/alert-background-modal.component';
import { AnalysisResultComponent } from './online/analysis-result.component';

// User list
import { OnlineUserListComponent } from './online/user-list/user-list.component';
import { UserSelectModalComponent } from './online/user-list/user-select-modal.component';

// Role list
import { OnlineRoleListComponent } from './online/role-list/role-list.component';
import { RoleSelectModalComponent } from './online/role-list/role-select-modal.component';
import { RoleDetailModalComponent } from './online/role-list/role-detail-modal.component';

// Rule list
import { RuleListComponent, RuleDetailModalContent } from './online/rule-list/rule-list.component';
import { RuleSelectModalComponent } from './online/rule-list/rule-select-modal.component';

// Risk list
import { RiskListComponent, RiskDetailModalContent } from './online/risk-list/risk-list.component';
import { RiskSelectModalComponent } from './online/risk-list/risk-select-modal.component';

// Simulation
import { SimulationAnalysisComponent } from './simulation/simulation-analysis.component';
import { SimulationPreSelectionComponent } from './simulation/simulation-preselection-modal.component';

// Impact Analysis
import { ImpactAnalysisComponent } from './impact-analysis/impact-analysis.component';
import { CreateImpactAnalysisComponent } from './impact-analysis/create-impact-analysis.component';
import { AddRolesToProfileComponent } from './impact-analysis/add-roles-to-profile.component';
import { ReviewProfileDetailsComponent } from './impact-analysis/review-profile-details.component';

const routes: Routes = [
  { path: '', redirectTo: 'online', pathMatch: 'full' },
  { path: 'online', component: OnlineAnalysisComponent },
  { path: 'simulation', component: SimulationAnalysisComponent },
  { path: 'impact-analysis', component: ImpactAnalysisComponent },
];

@NgModule({
  declarations: [
    OnlineAnalysisComponent,
    OrgChecksModalContent,
    PreSelectionModalComponent,
    AlertBackgroundModalComponent,
    AnalysisResultComponent,
    OnlineUserListComponent,
    UserSelectModalComponent,
    OnlineRoleListComponent,
    RoleSelectModalComponent,
    RoleDetailModalComponent,
    RuleListComponent,
    RuleDetailModalContent,
    RuleSelectModalComponent,
    RiskListComponent,
    RiskDetailModalContent,
    RiskSelectModalComponent,
    SimulationAnalysisComponent,
    SimulationPreSelectionComponent,
    ImpactAnalysisComponent,
    CreateImpactAnalysisComponent,
    AddRolesToProfileComponent,
    ReviewProfileDetailsComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class RiskAnalysisModule {}
