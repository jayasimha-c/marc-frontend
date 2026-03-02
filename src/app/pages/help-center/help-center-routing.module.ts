import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApiDocumentationComponent } from './api-documentation/api-documentation.component';
import { HelpCenterComponent } from './help-center.component';
import { AboutComponent } from './about/about.component';
import { HelpCenterSupportComponent } from './support/support.component';
import { ChangelogComponent } from './changelog/changelog.component';
import { LicenceComponent } from './licence/licence.component';

const routes: Routes = [
    {
        path: '',
        component: HelpCenterComponent
    },
    {
        path: 'about',
        component: AboutComponent
    },
    {
        path: 'support',
        component: HelpCenterSupportComponent
    },
    {
        path: 'changelog',
        component: ChangelogComponent
    },
    {
        path: 'licence',
        component: LicenceComponent
    },
    {
        path: 'api-documentation',
        component: ApiDocumentationComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class HelpCenterRoutingModule { }
