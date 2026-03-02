import { Component, OnInit } from "@angular/core";

interface ChangeItem {
    type: "Features" | "Bugs" | string;
    list: string[];
}

interface ChangelogRelease {
    version: string;
    releaseDate: string;
    changes: ChangeItem[];
}

@Component({
    standalone: false,
    selector: "app-changelog",
    templateUrl: "./changelog.component.html"
})
export class ChangelogComponent implements OnInit {
    changelog: ChangelogRelease[] = [
        {
            version: "v2.1.1",
            releaseDate: "NA",
            changes: [
                {
                    type: "Features",
                    list: [
                        "Added setting for one user can not be requester and approver in PAM",
                        "Added export option in PAM all requests page",
                        "Added 'Exclude Unassigned Roles' option to Online SOD analysis and Dashboard jobs",
                        "Added 'Upload Mitigation Owners' feature",
                        "Added option to show only changed records in Simulation Report",
                        "Added filters in Simulation selection",
                        "ARC module improvements",
                        "Added option to select secondary system for Users source",
                        "Added Scheduler to remove REM old jobs data",
                        "Added pivot report option in Tcode Execution report",
                        "Segregated application settings into Global and Reporting Unit",
                        "Added Overwrite, Delete, and Save options for variants in pivot pages",
                        "Software Update",
                    ],
                },
                {
                    type: "Bugs",
                    list: ["Not able to approve CAM request if workflow contains only ROLEAPPROVER node", "Not showing transactions in PAM dashboard"],
                },
            ],
        },
        {
            version: "v2.1.0",
            releaseDate: "NA",
            changes: [
                {
                    type: "Features",
                    list: [
                        "Show date and time values as per client Timezone",
                        "Added table for Transactions in new Privilege Request page",
                        "Moved 'Excel Export Results' to under 'General' menu with appropriate permissions",
                        "Security Updates",
                        "CAM Request Rejection Mail Notification",
                        "SOD Analysis Statistics",
                        "Position ID SOD Analysis",
                        "Logs of Role Assignment to Postion Id",
                        "Send Mail Notification if CAM Request is rejected",
                        "Improved Simulation results page (Showing risks increase and decrease)",
                        "Added Run SOD analysis feature for single user in Offlline User Browser",
                        "Added 'exclude expired user' option in Scheduling dashboard jobs",
                        "SMTP Mail Logs",
                        "Added Role Sync feature for CAM module",
                        "Software Update",
                        "Added Role SOD Matrix Report and Pivot in ACM module",
                    ],
                },
                {
                    type: "Bugs",
                    list: [
                        "Fixed Transaction filter not working in PAM screens",
                        "Fixed Updating modified time for all settings if any setting gets updated",
                        "Offline User Browser DB connection issue",
                    ],
                },
            ],
        },
        {
            version: "v2.0.9",
            releaseDate: "NA",
            changes: [
                {
                    type: "Features",
                    list: [
                        "Improvements in CAM new User Provisioning and Existing User Editing",
                        "Added option to exclude Unassigned roles for Offline SOD analysis",
                        "Added Approval Delegation for CAM and PAM",
                        "Improved REM Process",
                        "Changed AGR_TEXTS table to AGR_DEFINE for offline Role Analysis",
                        "Security Updates",
                        "Implemented refence user feature in Simulation",
                        "Added Risk/Rule Variants option in creating offline SOD analysis profile",
                        "Added User Report with export option",
                        "Show Txn count in PAM review page",
                        "CAM module improvements",
                        "Migrated D3 charts to Amcharts(REM,CAM,PAM dashboards)",
                        "Added one minute buffer time to 'Valid From' while creating PAM request",
                    ],
                },
                {
                    type: "Bugs",
                    list: [
                        "Updated handson table software to avoid error with Chrome (Unable to preventDefault inside passive event listener due to target being treated as passive)",
                        "Pagination records information showing incorrectly in PAM module",
                        "Showing records count incorrectly in offline Role analysis selection screen",
                        "Add All button working incorrectly in in offline Role analysis selection screen",
                        "Added Detail Desc column for Risks in Rule Transport feature in Rule Book",
                        "Ignore case while serching SAP Key fields(like BNAME, AGR_NAME)",
                        "Fixed showing same risks for before simulation and after simulation",
                    ],
                },
            ],
        },
        {
            version: "v2.0.8",
            releaseDate: "NA",
            changes: [
                {
                    type: "Features",
                    list: [
                        "Allow PAM administrator to end and reset the request",
                        "Maintain PAM Privilege ID profiles in database table",
                        "Added PAM request minimum duration in settings",
                        "Allow to create PAM request if either Roles or Profiles assigned to Privilege ID",
                        "CAM request role selection improvements",
                        "Added detail description field to Risk",
                        "Allow to update Risk Description and Detail Description through upload option",
                        "CAM module improvements",
                        "Added link to Risk name in SOD results summary tab to see the Risk details",
                        "Added Privilege Request and Privilege ID audit logs",
                        "Added option to export Privilege Requests to Excel Sheet in Privilege Dashboard",
                    ],
                },
                {
                    type: "Bugs",
                    list: [
                        "Storing duplicate roles whild ending PAM session",
                        "Tomcat restart required if any updates to SAP system configuration",
                        "PAM request 'From' Date selection in past",
                        "Improved Risk Consistency Check",
                        "Not showing Role and Role description in offline analysis results",
                        "Fixed DB connection close issue",
                    ],
                },
            ],
        },
        {
            version: "v2.0.7",
            releaseDate: "NA",
            changes: [
                {
                    type: "Features",
                    list: ["Upgraded amchart software", "Improved PAM DBTABLOG Service", "Allowed '<>' characters in risk desctiption"],
                },
                {
                    type: "Bugs",
                    list: ["Throwing error when no result data in Cross System SOD Analysis", "Central User Job status is not changing when exception occured"],
                },
            ],
        },
        {
            version: "v2.0.6",
            releaseDate: "NA",
            changes: [
                {
                    type: "Features",
                    list: [
                        "Added Role Catalogue in CAM module",
                        "Upgraded jqgrid software version from 5.2.1 to 5.3.2",
                        "Export Excel feature for Rule Book Audit Logs",
                    ],
                },
                {
                    type: "Bugs",
                    list: [],
                },
            ],
        },
        {
            version: "v2.0.5",
            releaseDate: "NA",
            changes: [
                {
                    type: "Features",
                    list: ["Added Central User feature to offline SAP System", "Added License Check feature to offline SAP system"],
                },
                {
                    type: "Bugs",
                    list: [
                        "fixed pivot drill down screen alignment issue in SOD compare page",
                        "fixed showing correct status in 'create reporting unit' wizard",
                    ],
                },
            ],
        },
    ];

    constructor() { }
    ngOnInit(): void { }
}
