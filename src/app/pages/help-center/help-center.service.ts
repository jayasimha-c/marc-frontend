import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface LicenseInfo {
    company: string;
    email: string;
    hardwareID: string;
    registeredTo: string;
    status: string;
    validity: string;
    limits: {
        camRequests: string;
        icmControls: string;
        pamRequests: string;
        risks: string;
        rules: string;
        systems: string;
    };
}

export interface GenericApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
}

@Injectable({
    providedIn: "root"
})
export class HelpCenterService {
    constructor(private httpClient: HttpClient) { }

    getLicenseInfo(): Observable<GenericApiResponse<LicenseInfo>> {
        return this.httpClient.get<GenericApiResponse<LicenseInfo>>(`rulesetConversion/licenceInfo`);
    }
}
