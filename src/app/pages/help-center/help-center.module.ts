import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HelpCenterRoutingModule } from "./help-center-routing.module";

// Components
import { HelpCenterComponent } from "./help-center.component";
import { AboutComponent } from "./about/about.component";
import { HelpCenterSupportComponent } from "./support/support.component";
import { ChangelogComponent } from "./changelog/changelog.component";
import { LicenceComponent } from "./licence/licence.component";
import { ApiDocumentationComponent } from "./api-documentation/api-documentation.component";
import { SharedModule } from "../../shared/shared.module";

// NG-ZORRO
import { NzPageHeaderModule } from "ng-zorro-antd/page-header";
import { NzCardModule } from "ng-zorro-antd/card";
import { NzGridModule } from "ng-zorro-antd/grid";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzSpinModule } from "ng-zorro-antd/spin";
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

@NgModule({
  declarations: [
    HelpCenterComponent,
    AboutComponent,
    HelpCenterSupportComponent,
    ChangelogComponent,
    LicenceComponent,
    ApiDocumentationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HelpCenterRoutingModule,
    SharedModule,
    NzPageHeaderModule,
    NzCardModule,
    NzGridModule,
    NzIconModule,
    NzButtonModule,
    NzButtonModule,
    NzSpinModule,
    NzLayoutModule,
    NzMenuModule,
    NzTypographyModule,
    NzTagModule,
    NzDescriptionsModule,
    NzTableModule,
    NzAlertModule,
    NzDividerModule,
    NzInputModule,
    NzFormModule,
    NzCheckboxModule
  ]
})
export class HelpCenterModule { }
