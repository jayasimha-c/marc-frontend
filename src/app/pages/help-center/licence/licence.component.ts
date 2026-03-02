import { Component, OnInit } from "@angular/core";
import { HelpCenterService, LicenseInfo } from "../help-center.service";

@Component({
    standalone: false,
    selector: "app-licence",
    templateUrl: "./licence.component.html"
})
export class LicenceComponent implements OnInit {
    licenseInfo: LicenseInfo | null = null;
    isLoading: boolean = true;

    constructor(private helpCenterService: HelpCenterService) { }

    ngOnInit(): void {
        this.loadLicenseInfo();
    }

    private loadLicenseInfo(): void {
        this.isLoading = true;
        this.helpCenterService.getLicenseInfo().subscribe({
            next: (response) => {
                if (response.success) {
                    this.licenseInfo = response.data;
                }
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    getLimitDisplay(value: string | undefined): string {
        return value ? value : "Unlimited";
    }

    isLicenseValid(): boolean {
        return this.licenseInfo?.status === "LICENSE_VALID";
    }
}
