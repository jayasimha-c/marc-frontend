import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { SharedModule } from "../../shared/shared.module";

// Target Components to be Migrated
import { SecurityReportsDashboardComponent } from "./dashboard/dashboard.component";
import { RoleAnalysisComponent } from "./role-analysis/role-analysis.component";

const routes: Routes = [
    {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full"
    },
    {
        path: "dashboard",
        component: SecurityReportsDashboardComponent
    },
    {
        path: "role-analysis",
        component: RoleAnalysisComponent
    }
];

@NgModule({
    declarations: [
        SecurityReportsDashboardComponent,
        RoleAnalysisComponent
    ],
    imports: [
        SharedModule,
        RouterModule.forChild(routes)
    ]
})
export class SecurityReportsModule { }
