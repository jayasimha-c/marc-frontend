import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { DashboardDataService } from "../services/dashboard-data.service";
import { ChartOptions } from "../../../../shared/models/chart.model";
import { CommonApxChartComponent } from "../../../../shared/components/common-apx-chart/common-apx-chart.component";
import { DashboardChartFormatterService } from "../../../../core/services/dashboard-chart-formatter.service";
import { TableColumn, TableQueryParams } from "../../../../shared/components/advanced-table/advanced-table.models";

@Component({
    standalone: false,
    selector: "app-risk-dashboard",
    templateUrl: "./risk-dashboard.component.html",
    styleUrls: ["./risk-dashboard.component.css"],
    encapsulation: ViewEncapsulation.None,
})
export class RiskDashboardComponent implements OnInit {
    @ViewChild("riskTrendChart") riskTrendChart: CommonApxChartComponent;
    @ViewChild("riskDistributionChart") riskDistributionChart: CommonApxChartComponent;
    @ViewChild("riskBySystemChart") riskBySystemChart: CommonApxChartComponent;
    @ViewChild("riskByRoleChart") riskByRoleChart: CommonApxChartComponent;
    @ViewChild("complianceScoreChart") complianceScoreChart: CommonApxChartComponent;

    riskTrendChartOptions: Partial<ChartOptions>;
    riskDistributionChartOptions: Partial<ChartOptions>;
    riskBySystemChartOptions: Partial<ChartOptions>;
    riskByRoleChartOptions: Partial<ChartOptions>;
    complianceScoreChartOptions: Partial<ChartOptions>;

    // Risk statistics
    riskStats: any = {
        totalRisks: 0,
        criticalRisks: 0,
        highRisks: 0,
        complianceScore: 0,
    };

    // Generic AdvancedTable Bindings
    public tableData: any[] = [];
    public totalRecord: number = 0;
    public loading: boolean = true;

    public tableColumns: TableColumn[] = [
        { header: "ID", field: "id", type: "text" },
        {
            header: "Description",
            field: "description",
            type: "text"
        },
        { header: "System", field: "system", type: "text" },
        {
            header: "Severity",
            field: "severity",
            type: "tag",
            tagColors: {
                "Critical": "red",
                "High": "orange",
                "Medium": "gold",
                "Low": "blue"
            }
        },
        {
            header: "Status",
            field: "status",
            type: "status"
        },
        {
            header: "Discovered Date",
            field: "discoveredDate",
            type: "date",
            dateFormat: 'yyyy-MM-dd'
        },
    ];

    constructor(
        private dashboardDataService: DashboardDataService,
        private formatterService: DashboardChartFormatterService
    ) {
        this.initRiskTrendChart([]);
        this.initRiskDistributionChart([]);
        this.initRiskBySystemChart([]);
        this.initRiskByRoleChart([]);
        this.initComplianceScoreChart([]);
    }

    ngOnInit(): void {
        this.loadDashboardData();
    }

    // Load dashboard data
    loadDashboardData(): void {
        this.loading = true;
        setTimeout(() => {
            // Risk data resolves synchronously in current service definition
            const data = this.dashboardDataService.getRiskDashboardData();

            this.riskStats = data.statistics;

            this.tableData = data.topRisks;
            this.totalRecord = this.tableData.length;

            this.updateRiskTrendChart(data.riskTrend);
            this.updateRiskDistributionChart(data.riskDistribution);
            this.updateRiskBySystemChart(data.riskBySystem);
            this.updateRiskByRoleChart(data.riskByRole);
            this.updateComplianceScoreChart([data.statistics.complianceScore]);

            this.loading = false;
        }, 1000);
    }

    private initRiskTrendChart(data: any[]): void {
        this.riskTrendChartOptions = {
            series: [
                { name: "Critical", data: [] },
                { name: "High", data: [] },
                { name: "Medium", data: [] },
                { name: "Low", data: [] }
            ],
            chart: { height: 350, type: "line", toolbar: { show: false } },
            dataLabels: { enabled: false },
            stroke: { curve: "smooth", width: 3 },
            xaxis: { categories: [] },
            title: { text: "Risk Trend Over Time", align: "left" },
            legend: { position: "top", horizontalAlign: "right" },
            colors: ["#EF4444", "#F59E0B", "#FCD34D", "#3B82F6"]
        };
    }

    private updateRiskTrendChart(data: any[]): void {
        if (!data || data.length === 0) return;

        this.riskTrendChartOptions.xaxis = { categories: data.map(i => i.month) };
        this.riskTrendChartOptions.series = [
            { name: "Critical", data: data.map(item => item.critical) },
            { name: "High", data: data.map(item => item.high) },
            { name: "Medium", data: data.map(item => item.medium) },
            { name: "Low", data: data.map(item => item.low) }
        ];

        if (this.riskTrendChart) this.riskTrendChart.updateChart();
    }

    private initRiskDistributionChart(data: any[]): void {
        this.riskDistributionChartOptions = {
            title: { text: "Risk Severity Distribution", align: "left" },
            series: [],
            chart: { width: "100%", height: 350, type: "donut" },
            labels: [],
            dataLabels: { enabled: true },
            plotOptions: { pie: { donut: { size: "65%" } } },
            legend: { position: "bottom" },
            colors: ["#EF4444", "#F59E0B", "#FCD34D", "#3B82F6"]
        };
    }

    private updateRiskDistributionChart(data: any[]): void {
        if (!data || data.length === 0) return;

        this.riskDistributionChartOptions.labels = data.map(item => item.severity);
        this.riskDistributionChartOptions.series = data.map(item => item.count);

        if (this.riskDistributionChart) this.riskDistributionChart.updateChart();
    }

    private initRiskBySystemChart(data: any[]): void {
        this.riskBySystemChartOptions = {
            title: { text: "Risks by System", align: "left" },
            series: [{ name: "Risks", data: [] }],
            chart: { height: 350, type: "bar", toolbar: { show: false } },
            plotOptions: { bar: { horizontal: false, borderRadius: 2 } },
            dataLabels: { enabled: false },
            xaxis: { categories: [] },
            legend: { show: false },
            colors: ["#4F46E5"]
        };
    }

    private updateRiskBySystemChart(data: any[]): void {
        if (!data || data.length === 0) return;

        this.riskBySystemChartOptions.xaxis = { categories: data.map(item => item.system) };
        this.riskBySystemChartOptions.series = [{ name: "Risks", data: data.map(item => item.count) }];

        if (this.riskBySystemChart) this.riskBySystemChart.updateChart();
    }

    private initRiskByRoleChart(data: any[]): void {
        this.riskByRoleChartOptions = {
            title: { text: "Risks by Role", align: "left" },
            series: [{ name: "Risks", data: [] }],
            chart: { height: 350, type: "bar", toolbar: { show: false } },
            plotOptions: { bar: { horizontal: false, borderRadius: 2 } },
            dataLabels: { enabled: false },
            xaxis: { categories: [] },
            legend: { show: false },
            colors: ["#8B5CF6"]
        };
    }

    private updateRiskByRoleChart(data: any[]): void {
        if (!data || data.length === 0) return;

        this.riskByRoleChartOptions.xaxis = { categories: data.map(item => item.role) };
        this.riskByRoleChartOptions.series = [{ name: "Risks", data: data.map(item => item.count) }];

        if (this.riskByRoleChart) this.riskByRoleChart.updateChart();
    }

    private initComplianceScoreChart(data: any[]): void {
        this.complianceScoreChartOptions = {
            series: [0], // Initial value
            title: { text: "Compliance Score", align: "left" },
            chart: { height: 350, type: "radialBar" },
            plotOptions: {
                radialBar: {
                    startAngle: -135,
                    endAngle: 135,
                    hollow: {
                        size: "70%",
                    },
                    track: {
                        background: "#e7e7e7",
                        strokeWidth: "97%",
                        margin: 5, // margin is in pixels
                    },
                    dataLabels: {
                        show: true,
                        name: {
                            offsetY: 20,
                            show: true,
                            color: "#888",
                            fontSize: "17px",
                        },
                        value: {
                            offsetY: -10,
                            color: "#111",
                            fontSize: "36px",
                            show: true,
                        },
                    },
                },
            },
            labels: ["Score"],
            colors: ["#10B981"],
        };
    }

    private updateComplianceScoreChart(data: any[]): void {
        if (!data || data.length === 0) return;

        this.complianceScoreChartOptions.series = data;
        this.complianceScoreChartOptions.colors = data[0] > 75 ? ["#10B981"] : data[0] > 50 ? ["#F59E0B"] : ["#EF4444"];

        if (this.complianceScoreChart) this.complianceScoreChart.updateChart();
    }

    public getTableData(event: TableQueryParams | any) {
        this.loadDashboardData();
    }
}
