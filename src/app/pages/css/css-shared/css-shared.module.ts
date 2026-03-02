import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { ParameterRuleTagComponent } from './parameter-rule-tag/parameter-rule-tag.component';

@NgModule({
  declarations: [ParameterRuleTagComponent],
  imports: [SharedModule],
  exports: [ParameterRuleTagComponent],
})
export class CssSharedModule {}
