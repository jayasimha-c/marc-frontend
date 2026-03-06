import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { HanaComponent } from './hana.component';
import { GlobalIniParameterComponent } from './global-ini-parameter/global-ini-parameter.component';
import { GlobalIniParameterRuleComponent } from './global-ini-parameter-rule/global-ini-parameter-rule.component';

const routes: Routes = [
  {
    path: '',
    component: HanaComponent,
    children: [
      { path: 'global-ini-parameter', component: GlobalIniParameterComponent },
      { path: 'global-ini-parameter-rule', component: GlobalIniParameterRuleComponent },
      { path: '', redirectTo: 'global-ini-parameter', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  declarations: [HanaComponent, GlobalIniParameterComponent, GlobalIniParameterRuleComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class HanaModule {}
